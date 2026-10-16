export interface VerseRecord {
  volume_title: string;
  book_title: string;
  book_short_title: string;
  chapter_number: number;
  verse_number: number;
  verse_title: string;
  verse_short_title: string;
  scripture_text: string;
}

export interface BookInfo {
  volume_title: string;
  book_title: string;
  book_short_title: string;
  chapterCount: number;
  verseCount: number;
  chapters: number[];
}

export interface VolumeInfo {
  volume_title: string;
  bookCount: number;
  chapterCount: number;
  verseCount: number;
  books: BookInfo[];
}

export type SearchScope =
  | 'ALL'
  | 'BIBLE'
  | 'OLD_TESTAMENT'
  | 'NEW_TESTAMENT'
  | 'BOOK_OF_MORMON'
  | 'DOCTRINE_AND_COVENANTS'
  | 'PEARL_OF_GREAT_PRICE';

export type MatchMode = 'all' | 'any' | 'exact' | 'regex';

export interface SearchFilter {
  query: string;
  scope: SearchScope;
  bookTitle?: string;
  matchMode: MatchMode;
  caseSensitive: boolean;
}

export interface SearchResultItem {
  verse: VerseRecord;
  verseIndex: number;
  score: number;
  matchSnippets: string[];
}

export interface SearchResponse {
  results: SearchResultItem[];
  totalMatches: number;
  executionTimeMs: number;
  referenceMatch?: VerseRecord;
}

export interface Bookmark {
  id: string;
  verse: VerseRecord;
  createdAt: number;
  note?: string;
  colorTag: 'amber' | 'emerald' | 'blue' | 'purple' | 'rose';
}

export interface ReadingLocation {
  volume: string;
  book: string;
  chapter: number;
  verse?: number;
}
