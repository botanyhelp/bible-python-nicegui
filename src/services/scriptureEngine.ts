import {
  VerseRecord,
  BookInfo,
  VolumeInfo,
  SearchFilter,
  SearchResponse,
  SearchResultItem,
  SearchScope,
} from '../types/scripture';

const CANONICAL_VOLUMES = [
  'Old Testament',
  'New Testament',
  'Book of Mormon',
  'Doctrine and Covenants',
  'Pearl of Great Price',
];

export class ScriptureEngine {
  private static instance: ScriptureEngine | null = null;

  public verses: VerseRecord[] = [];
  public volumes: string[] = [];
  public booksByVolume: Map<string, BookInfo[]> = new Map();
  public allBooks: BookInfo[] = [];
  public chaptersByBook: Map<string, number[]> = new Map();
  public versesByChapter: Map<string, VerseRecord[]> = new Map();
  public verseByRef: Map<string, VerseRecord> = new Map();
  public bookAliases: Map<string, string> = new Map();

  // Inverted index for fast full-text search
  private invertedIndex: Map<string, number[]> = new Map();

  public isLoaded = false;
  public loadProgress = 0;
  public totalVerses = 0;

  private constructor() {}

  public static getInstance(): ScriptureEngine {
    if (!ScriptureEngine.instance) {
      ScriptureEngine.instance = new ScriptureEngine();
    }
    return ScriptureEngine.instance;
  }

  public async initialize(onProgress?: (progress: number) => void): Promise<void> {
    if (this.isLoaded) return;

    let rawData: VerseRecord[] = [];

    // Attempt loading from local cached path first
    try {
      if (onProgress) onProgress(20);
      const res = await fetch('/data/lds-scriptures.json');
      if (!res.ok) {
        throw new Error(`Local fetch status: ${res.status}`);
      }
      rawData = await res.json();
      if (onProgress) onProgress(60);
    } catch {
      // Fallback to GitHub raw URL
      if (onProgress) onProgress(35);
      const remoteUrl =
        'https://github.com/beandog/lds-scriptures/raw/refs/heads/master/json/lds-scriptures-json.txt';
      const fallbackRes = await fetch(remoteUrl);
      if (!fallbackRes.ok) {
        throw new Error('Failed to download scripture data from both local and remote sources.');
      }
      rawData = await fallbackRes.json();
      if (onProgress) onProgress(70);
    }

    this.verses = rawData;
    this.totalVerses = rawData.length;
    this.buildMemoryStructures();
    if (onProgress) onProgress(100);
    this.isLoaded = true;
  }

  private buildMemoryStructures(): void {
    const bookMap = new Map<string, {
      volume: string;
      title: string;
      shortTitle: string;
      chapters: Set<number>;
      verseCount: number;
    }>();

    // Preserve order of volumes
    this.volumes = CANONICAL_VOLUMES;
    this.volumes.forEach((vol) => this.booksByVolume.set(vol, []));

    for (let i = 0; i < this.verses.length; i++) {
      const item = this.verses[i];
      const vol = item.volume_title;
      const book = item.book_title;
      const chap = Number(item.chapter_number) || 1;
      const verseNum = Number(item.verse_number) || 1;

      // Group by book
      let bInfo = bookMap.get(book);
      if (!bInfo) {
        bInfo = {
          volume: vol,
          title: book,
          shortTitle: item.book_short_title || book,
          chapters: new Set<number>(),
          verseCount: 0,
        };
        bookMap.set(book, bInfo);
      }
      bInfo.chapters.add(chap);
      bInfo.verseCount++;

      // Key for chapter lookup
      const chapterKey = `${book}:${chap}`;
      let chList = this.versesByChapter.get(chapterKey);
      if (!chList) {
        chList = [];
        this.versesByChapter.set(chapterKey, chList);
      }
      chList.push(item);

      // Key for exact verse reference
      const refKey = `${book.toLowerCase()}:${chap}:${verseNum}`;
      this.verseByRef.set(refKey, item);

      // Tokenize and populate inverted index
      const words = item.scripture_text.toLowerCase().match(/[a-z0-9]+/g);
      if (words) {
        const uniqueWords = new Set(words);
        for (const word of uniqueWords) {
          if (word.length >= 2) {
            let list = this.invertedIndex.get(word);
            if (!list) {
              list = [];
              this.invertedIndex.set(word, list);
            }
            list.push(i);
          }
        }
      }
    }

    // Build ordered books & aliases
    for (const [bookTitle, info] of bookMap.entries()) {
      const sortedChapters = Array.from(info.chapters).sort((a, b) => a - b);
      this.chaptersByBook.set(bookTitle, sortedChapters);

      const bookInfo: BookInfo = {
        volume_title: info.volume,
        book_title: bookTitle,
        book_short_title: info.shortTitle,
        chapterCount: sortedChapters.length,
        verseCount: info.verseCount,
        chapters: sortedChapters,
      };

      this.allBooks.push(bookInfo);
      const volBooks = this.booksByVolume.get(info.volume);
      if (volBooks) {
        volBooks.push(bookInfo);
      }

      // Add alias lookups
      this.registerAlias(bookTitle.toLowerCase(), bookTitle);
      this.registerAlias(info.shortTitle.toLowerCase().replace(/\./g, ''), bookTitle);
      this.registerAlias(info.shortTitle.toLowerCase(), bookTitle);
    }

    // Extra aliases for common scripture book abbreviations
    this.addCommonAliases();
  }

  private registerAlias(alias: string, targetBook: string) {
    this.bookAliases.set(alias.trim(), targetBook);
  }

  private addCommonAliases() {
    const commonMap: Record<string, string> = {
      gen: 'Genesis',
      ex: 'Exodus',
      exod: 'Exodus',
      lev: 'Leviticus',
      num: 'Numbers',
      deut: 'Deuteronomy',
      dt: 'Deuteronomy',
      josh: 'Joshua',
      judg: 'Judges',
      ruth: 'Ruth',
      '1 sam': '1 Samuel',
      '2 sam': '2 Samuel',
      '1 kgs': '1 Kings',
      '2 kgs': '2 Kings',
      '1 chron': '1 Chronicles',
      '2 chron': '2 Chronicles',
      ezra: 'Ezra',
      neh: 'Nehemiah',
      esth: 'Esther',
      job: 'Job',
      ps: 'Psalms',
      psalm: 'Psalms',
      psalms: 'Psalms',
      prov: 'Proverbs',
      pr: 'Proverbs',
      eccles: 'Ecclesiastes',
      song: 'Song of Solomon',
      isa: 'Isaiah',
      jer: 'Jeremiah',
      lam: 'Lamentations',
      ezek: 'Ezekiel',
      dan: 'Daniel',
      hos: 'Hosea',
      joel: 'Joel',
      amos: 'Amos',
      obad: 'Obadiah',
      jonah: 'Jonah',
      mic: 'Micah',
      nah: 'Nahum',
      hab: 'Habakkuk',
      zeph: 'Zephaniah',
      hag: 'Haggai',
      zech: 'Zechariah',
      mal: 'Malachi',
      matt: 'Matthew',
      mat: 'Matthew',
      mt: 'Matthew',
      mk: 'Mark',
      mrk: 'Mark',
      lk: 'Luke',
      luk: 'Luke',
      jn: 'John',
      joh: 'John',
      john: 'John',
      acts: 'Acts',
      rom: 'Romans',
      '1 cor': '1 Corinthians',
      '2 cor': '2 Corinthians',
      gal: 'Galatians',
      eph: 'Ephesians',
      phil: 'Philippians',
      col: 'Colossians',
      '1 thess': '1 Thessalonians',
      '2 thess': '2 Thessalonians',
      '1 tim': '1 Timothy',
      '2 tim': '2 Timothy',
      tit: 'Titus',
      philem: 'Philemon',
      heb: 'Hebrews',
      jas: 'James',
      jam: 'James',
      '1 pet': '1 Peter',
      '2 pet': '2 Peter',
      '1 jn': '1 John',
      '2 jn': '2 John',
      '3 jn': '3 John',
      jude: 'Jude',
      rev: 'Revelation',
      '1 ne': '1 Nephi',
      '2 ne': '2 Nephi',
      jac: 'Jacob',
      enos: 'Enos',
      jarom: 'Jarom',
      omni: 'Omni',
      wom: 'Words of Mormon',
      mos: 'Mosiah',
      alma: 'Alma',
      hel: 'Helaman',
      '3 ne': '3 Nephi',
      '4 ne': '4 Nephi',
      morm: 'Mormon',
      eth: 'Ether',
      moro: 'Moroni',
      dc: 'Doctrine and Covenants',
      'd&c': 'Doctrine and Covenants',
      moses: 'Moses',
      abr: 'Abraham',
      'js-m': 'Joseph Smith--Matthew',
      'js-h': 'Joseph Smith--History',
      aof: 'Articles of Faith',
    };

    for (const [alias, full] of Object.entries(commonMap)) {
      this.bookAliases.set(alias.toLowerCase(), full);
    }
  }

  public getVolumeList(): VolumeInfo[] {
    return this.volumes.map((vol) => {
      const books = this.booksByVolume.get(vol) || [];
      const chapterCount = books.reduce((acc, b) => acc + b.chapterCount, 0);
      const verseCount = books.reduce((acc, b) => acc + b.verseCount, 0);
      return {
        volume_title: vol,
        bookCount: books.length,
        chapterCount,
        verseCount,
        books,
      };
    });
  }

  public getBooksForVolume(volumeTitle: string): BookInfo[] {
    return this.booksByVolume.get(volumeTitle) || [];
  }

  public getChaptersForBook(bookTitle: string): number[] {
    return this.chaptersByBook.get(bookTitle) || [];
  }

  public getVerses(bookTitle: string, chapterNumber: number): VerseRecord[] {
    return this.versesByChapter.get(`${bookTitle}:${chapterNumber}`) || [];
  }

  public getVerse(bookTitle: string, chapterNumber: number, verseNumber: number): VerseRecord | undefined {
    return this.verseByRef.get(`${bookTitle.toLowerCase()}:${chapterNumber}:${verseNumber}`);
  }

  public getRandomVerse(scope: 'BIBLE' | 'ALL' = 'BIBLE'): VerseRecord {
    if (this.verses.length === 0) {
      throw new Error('Database not initialized');
    }
    if (scope === 'BIBLE') {
      const bibleVerses = this.verses.filter(
        (v) => v.volume_title === 'Old Testament' || v.volume_title === 'New Testament'
      );
      return bibleVerses[Math.floor(Math.random() * bibleVerses.length)];
    }
    return this.verses[Math.floor(Math.random() * this.verses.length)];
  }

  /**
   * Fast in-memory search across canonical verses.
   */
  public search(filter: SearchFilter, limit: number = 100): SearchResponse {
    const startTime = performance.now();
    const query = filter.query.trim();

    if (!query) {
      return { results: [], totalMatches: 0, executionTimeMs: 0 };
    }

    // 1. Check for direct citation / reference match (e.g. "John 3:16", "Romans 8:28", "Gen 1:1")
    const referenceMatch = this.tryParseReference(query);

    // 2. Perform search based on mode
    let candidateIndices: number[] = [];
    const tokens = query
      .toLowerCase()
      .match(/[a-z0-9]+/g)
      ?.filter((w) => w.length >= 2) || [];

    if (filter.matchMode === 'regex') {
      try {
        const re = new RegExp(query, filter.caseSensitive ? '' : 'i');
        const results: SearchResultItem[] = [];
        let totalMatches = 0;

        for (let i = 0; i < this.verses.length; i++) {
          const v = this.verses[i];
          if (!this.matchesScope(v, filter.scope, filter.bookTitle)) continue;

          if (re.test(v.scripture_text)) {
            totalMatches++;
            if (results.length < limit) {
              results.push({
                verse: v,
                verseIndex: i,
                score: 1,
                matchSnippets: [query],
              });
            }
          }
        }

        const endTime = performance.now();
        return {
          results,
          totalMatches,
          executionTimeMs: Math.round((endTime - startTime) * 100) / 100,
          referenceMatch: referenceMatch || undefined,
        };
      } catch {
        // Fallback to phrase if regex is invalid
      }
    }

    if (tokens.length === 0) {
      const endTime = performance.now();
      return {
        results: referenceMatch
          ? [{ verse: referenceMatch, verseIndex: 0, score: 100, matchSnippets: [] }]
          : [],
        totalMatches: referenceMatch ? 1 : 0,
        executionTimeMs: Math.round((endTime - startTime) * 100) / 100,
        referenceMatch: referenceMatch || undefined,
      };
    }

    // Inverted index candidate retrieval
    if (filter.matchMode === 'any') {
      const unionSet = new Set<number>();
      for (const t of tokens) {
        const list = this.invertedIndex.get(t);
        if (list) {
          for (const idx of list) {
            unionSet.add(idx);
          }
        }
      }
      candidateIndices = Array.from(unionSet);
    } else {
      // 'all' or 'exact' requires intersection of all tokens
      const lists: number[][] = [];
      for (const t of tokens) {
        const list = this.invertedIndex.get(t);
        if (!list || list.length === 0) {
          // If any word has 0 matches in the entire corpus, AND query has 0 results!
          const endTime = performance.now();
          return {
            results: referenceMatch
              ? [{ verse: referenceMatch, verseIndex: 0, score: 100, matchSnippets: [] }]
              : [],
            totalMatches: referenceMatch ? 1 : 0,
            executionTimeMs: Math.round((endTime - startTime) * 100) / 100,
            referenceMatch: referenceMatch || undefined,
          };
        }
        lists.push(list);
      }

      // Sort lists by length for fastest intersection
      lists.sort((a, b) => a.length - b.length);

      let currentCandidates = new Set<number>(lists[0]);
      for (let l = 1; l < lists.length; l++) {
        const nextList = lists[l];
        const nextSet = new Set(nextList);
        currentCandidates = new Set([...currentCandidates].filter((idx) => nextSet.has(idx)));
        if (currentCandidates.size === 0) break;
      }
      candidateIndices = Array.from(currentCandidates);
    }

    // Filter candidate indices by exact phrase if required
    let phraseRegex: RegExp | null = null;
    if (filter.matchMode === 'exact') {
      const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      phraseRegex = new RegExp(`\\b${escaped}\\b`, filter.caseSensitive ? '' : 'i');
    }

    // Filter by scope and book, score, and rank
    const results: SearchResultItem[] = [];
    let totalMatches = 0;

    for (const idx of candidateIndices) {
      const verse = this.verses[idx];
      if (!this.matchesScope(verse, filter.scope, filter.bookTitle)) {
        continue;
      }

      if (phraseRegex && !phraseRegex.test(verse.scripture_text)) {
        continue;
      }

      totalMatches++;
      if (results.length < limit) {
        // Calculate relevance score: frequency of query words + title matches
        let score = 1;
        const textLower = verse.scripture_text.toLowerCase();
        for (const t of tokens) {
          if (textLower.includes(t)) score += 2;
        }
        if (verse.verse_title.toLowerCase().includes(query.toLowerCase())) {
          score += 10;
        }

        results.push({
          verse,
          verseIndex: idx,
          score,
          matchSnippets: tokens,
        });
      }
    }

    // Sort results by relevance score descending
    results.sort((a, b) => b.score - a.score);

    // If reference match exists and isn't already the first result, prepend it!
    if (referenceMatch) {
      const existingIdx = results.findIndex((r) => r.verse.verse_title === referenceMatch.verse_title);
      if (existingIdx > 0) {
        const [item] = results.splice(existingIdx, 1);
        results.unshift(item);
      } else if (existingIdx === -1) {
        results.unshift({
          verse: referenceMatch,
          verseIndex: -1,
          score: 1000,
          matchSnippets: tokens,
        });
        totalMatches++;
      }
    }

    const endTime = performance.now();
    return {
      results,
      totalMatches,
      executionTimeMs: Math.round((endTime - startTime) * 100) / 100,
      referenceMatch: referenceMatch || undefined,
    };
  }

  private matchesScope(verse: VerseRecord, scope: SearchScope, bookTitle?: string): boolean {
    if (bookTitle && bookTitle !== 'ALL' && verse.book_title !== bookTitle) {
      return false;
    }

    switch (scope) {
      case 'ALL':
        return true;
      case 'BIBLE':
        return verse.volume_title === 'Old Testament' || verse.volume_title === 'New Testament';
      case 'OLD_TESTAMENT':
        return verse.volume_title === 'Old Testament';
      case 'NEW_TESTAMENT':
        return verse.volume_title === 'New Testament';
      case 'BOOK_OF_MORMON':
        return verse.volume_title === 'Book of Mormon';
      case 'DOCTRINE_AND_COVENANTS':
        return verse.volume_title === 'Doctrine and Covenants';
      case 'PEARL_OF_GREAT_PRICE':
        return verse.volume_title === 'Pearl of Great Price';
      default:
        return true;
    }
  }

  /**
   * Tries to parse human citation like "John 3:16", "Romans 8:28", "1 Ne 3:7", "Gen 1:1"
   */
  public tryParseReference(query: string): VerseRecord | null {
    const clean = query.trim().replace(/\s+/g, ' ');
    // Match patterns like: "John 3:16", "1 John 1:9", "Genesis 1:1", "D&C 4:2", "Ps 23:1"
    const match = clean.match(/^([1-4]?\s*[A-Za-z&'-]+)\s*(\d+)(?:[:,\.\s]+(\d+))?$/);
    if (!match) return null;

    const rawBook = match[1].trim().toLowerCase();
    const chapter = parseInt(match[2], 10);
    const verseNum = match[3] ? parseInt(match[3], 10) : 1;

    // Resolve book alias
    const resolvedBook =
      this.bookAliases.get(rawBook) ||
      this.bookAliases.get(rawBook.replace(/\./g, '')) ||
      this.allBooks.find((b) => b.book_title.toLowerCase() === rawBook)?.book_title;

    if (!resolvedBook) return null;

    return this.getVerse(resolvedBook, chapter, verseNum) || null;
  }
}
