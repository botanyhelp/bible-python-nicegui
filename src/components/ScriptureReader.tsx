import React, { useState, useEffect, useRef } from 'react';
import {
  VolumeInfo,
  BookInfo,
  VerseRecord,
  Bookmark,
  ReadingLocation,
} from '../types/scripture';
import { ScriptureEngine } from '../services/scriptureEngine';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Bookmark as BookmarkIcon,
  Volume2,
  VolumeX,
  Type,
  Share2,
  Search,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

interface ScriptureReaderProps {
  engine: ScriptureEngine;
  currentLocation: ReadingLocation;
  setCurrentLocation: (loc: ReadingLocation) => void;
  bookmarks: Bookmark[];
  onToggleBookmark: (verse: VerseRecord, note?: string, color?: Bookmark['colorTag']) => void;
  quickBibleMode: boolean;
  onNavigateToSearch: (term: string) => void;
}

export const ScriptureReader: React.FC<ScriptureReaderProps> = ({
  engine,
  currentLocation,
  setCurrentLocation,
  bookmarks,
  onToggleBookmark,
  quickBibleMode,
  onNavigateToSearch,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [bookSearchQuery, setBookSearchQuery] = useState('');
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('lg');
  const [isSerif, setIsSerif] = useState(true);

  // Text to speech state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [speakingVerseNumber, setSpeakingVerseNumber] = useState<number | null>(null);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Note dialog state
  const [noteVerse, setNoteVerse] = useState<VerseRecord | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [colorTag, setColorTag] = useState<Bookmark['colorTag']>('amber');

  const verseElementsRef = useRef<Map<number, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Scroll to targeted verse when verse number changes
  useEffect(() => {
    if (currentLocation.verse) {
      const el = verseElementsRef.current.get(currentLocation.verse);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentLocation.book, currentLocation.chapter, currentLocation.verse]);

  // Derived volumes & books based on quickBibleMode
  const allVolumes: VolumeInfo[] = engine.getVolumeList();
  const filteredVolumes = quickBibleMode
    ? allVolumes.filter((v) => v.volume_title === 'Old Testament' || v.volume_title === 'New Testament')
    : allVolumes;

  const currentVolumeBooks = engine.getBooksForVolume(currentLocation.volume);
  const currentBookChapters = engine.getChaptersForBook(currentLocation.book);
  const currentVerses: VerseRecord[] = engine.getVerses(currentLocation.book, currentLocation.chapter);

  // Filter books in dropdown
  const filteredBooks = currentVolumeBooks.filter((b) =>
    b.book_title.toLowerCase().includes(bookSearchQuery.toLowerCase()) ||
    b.book_short_title.toLowerCase().includes(bookSearchQuery.toLowerCase())
  );

  // Navigation handlers
  const handleVolumeChange = (volTitle: string) => {
    const books = engine.getBooksForVolume(volTitle);
    const newBook = books[0]?.book_title || '';
    const chapters = engine.getChaptersForBook(newBook);
    const newChap = chapters[0] || 1;
    setCurrentLocation({
      volume: volTitle,
      book: newBook,
      chapter: newChap,
      verse: undefined,
    });
    stopAudio();
  };

  const handleBookChange = (bookTitle: string) => {
    const bookInfo = engine.allBooks.find((b) => b.book_title === bookTitle);
    const vol = bookInfo?.volume_title || currentLocation.volume;
    const chapters = engine.getChaptersForBook(bookTitle);
    setCurrentLocation({
      volume: vol,
      book: bookTitle,
      chapter: chapters[0] || 1,
      verse: undefined,
    });
    stopAudio();
  };

  const handleChapterChange = (ch: number) => {
    setCurrentLocation({
      ...currentLocation,
      chapter: ch,
      verse: undefined,
    });
    stopAudio();
  };

  const handlePrevChapter = () => {
    const idx = currentBookChapters.indexOf(currentLocation.chapter);
    if (idx > 0) {
      handleChapterChange(currentBookChapters[idx - 1]);
    } else {
      // Go to previous book if available
      const bookIdx = currentVolumeBooks.findIndex((b) => b.book_title === currentLocation.book);
      if (bookIdx > 0) {
        const prevBook = currentVolumeBooks[bookIdx - 1];
        const prevBookChaps = engine.getChaptersForBook(prevBook.book_title);
        setCurrentLocation({
          ...currentLocation,
          book: prevBook.book_title,
          chapter: prevBookChaps[prevBookChaps.length - 1] || 1,
          verse: undefined,
        });
      }
    }
  };

  const handleNextChapter = () => {
    const idx = currentBookChapters.indexOf(currentLocation.chapter);
    if (idx < currentBookChapters.length - 1) {
      handleChapterChange(currentBookChapters[idx + 1]);
    } else {
      // Go to next book if available
      const bookIdx = currentVolumeBooks.findIndex((b) => b.book_title === currentLocation.book);
      if (bookIdx < currentVolumeBooks.length - 1) {
        const nextBook = currentVolumeBooks[bookIdx + 1];
        setCurrentLocation({
          ...currentLocation,
          book: nextBook.book_title,
          chapter: 1,
          verse: undefined,
        });
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        handlePrevChapter();
      } else if (e.key === 'ArrowRight') {
        handleNextChapter();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const handleCopy = (text: string, ref: string, id: string) => {
    navigator.clipboard.writeText(`${ref}\n"${text}"`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyChapter = () => {
    const fullText = currentVerses
      .map((v) => `${v.verse_number}. ${v.scripture_text}`)
      .join('\n\n');
    navigator.clipboard.writeText(`${currentLocation.book} ${currentLocation.chapter}\n\n${fullText}`);
    setCopiedId('chapter');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Audio Read Aloud
  const stopAudio = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsPlayingAudio(false);
    setSpeakingVerseNumber(null);
  };

  const toggleReadAloud = () => {
    if (isPlayingAudio) {
      stopAudio();
      return;
    }

    if (!synthRef.current) return;
    synthRef.current.cancel();

    let verseIndex = 0;
    if (currentLocation.verse) {
      verseIndex = Math.max(0, currentVerses.findIndex((v) => v.verse_number === currentLocation.verse));
    }

    setIsPlayingAudio(true);

    const speakNext = (idx: number) => {
      if (idx >= currentVerses.length || !synthRef.current) {
        setIsPlayingAudio(false);
        setSpeakingVerseNumber(null);
        return;
      }

      const v = currentVerses[idx];
      setSpeakingVerseNumber(v.verse_number);

      const utterance = new SpeechSynthesisUtterance(`Verse ${v.verse_number}. ${v.scripture_text}`);
      utterance.rate = speechRate;
      utterance.onend = () => {
        speakNext(idx + 1);
      };
      utterance.onerror = () => {
        setIsPlayingAudio(false);
        setSpeakingVerseNumber(null);
      };

      synthRef.current.speak(utterance);
    };

    speakNext(verseIndex);
  };

  const speakSingleVerse = (verse: VerseRecord) => {
    if (!synthRef.current) return;
    stopAudio();
    setIsPlayingAudio(true);
    setSpeakingVerseNumber(verse.verse_number);

    const utterance = new SpeechSynthesisUtterance(`${verse.verse_title}. ${verse.scripture_text}`);
    utterance.rate = speechRate;
    utterance.onend = () => {
      setIsPlayingAudio(false);
      setSpeakingVerseNumber(null);
    };
    synthRef.current.speak(utterance);
  };

  const fontSizeClass = {
    sm: 'text-base leading-relaxed',
    base: 'text-lg leading-relaxed',
    lg: 'text-xl leading-8',
    xl: 'text-2xl leading-9',
  }[fontSize];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6">
      {/* SELECTION BAR / TOOLBAR */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm mb-6 transition-colors">
        {/* Row 1: Volume, Book, Chapter, Verse selectors */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 items-center">
          {/* Volume Selector */}
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Volume
            </label>
            <select
              value={currentLocation.volume}
              onChange={(e) => handleVolumeChange(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {filteredVolumes.map((vol) => (
                <option key={vol.volume_title} value={vol.volume_title}>
                  {vol.volume_title}
                </option>
              ))}
            </select>
          </div>

          {/* Book Selector */}
          <div className="col-span-2 sm:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Book ({currentVolumeBooks.length})
              </label>
              {currentVolumeBooks.length > 10 && (
                <span className="text-[10px] text-slate-400 hidden sm:inline">Type to filter</span>
              )}
            </div>
            <select
              value={currentLocation.book}
              onChange={(e) => handleBookChange(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {currentVolumeBooks.map((b) => (
                <option key={b.book_title} value={b.book_title}>
                  {b.book_title} ({b.chapterCount} ch)
                </option>
              ))}
            </select>
          </div>

          {/* Chapter Selector */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Chapter
            </label>
            <select
              value={currentLocation.chapter}
              onChange={(e) => handleChapterChange(Number(e.target.value))}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {currentBookChapters.map((ch) => (
                <option key={ch} value={ch}>
                  Chapter {ch}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Verse Jump */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Verse Jump
            </label>
            <select
              value={currentLocation.verse || ''}
              onChange={(e) => {
                const v = Number(e.target.value);
                setCurrentLocation({ ...currentLocation, verse: v || undefined });
              }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All Verses</option>
              {currentVerses.map((v) => (
                <option key={v.verse_number} value={v.verse_number}>
                  Verse {v.verse_number}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Secondary Controls (Prev/Next, Audio, Font, Copy) */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          {/* Chapter Navigation Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevChapter}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="Previous Chapter (Keyboard Left Arrow)"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Prev</span>
            </button>
            <span className="text-xs font-medium text-slate-500 px-1">
              {currentLocation.book} {currentLocation.chapter} of {currentBookChapters.length}
            </span>
            <button
              onClick={handleNextChapter}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="Next Chapter (Keyboard Right Arrow)"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Reader Preferences & Tools */}
          <div className="flex items-center gap-2">
            {/* Audio Read-Aloud */}
            <button
              onClick={toggleReadAloud}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                isPlayingAudio
                  ? 'bg-amber-600 text-white border-amber-600 animate-pulse'
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={isPlayingAudio ? 'Stop audio' : 'Listen to chapter (Read aloud)'}
            >
              {isPlayingAudio ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{isPlayingAudio ? 'Playing...' : 'Read Aloud'}</span>
            </button>

            {/* Font Family Toggle */}
            <button
              onClick={() => setIsSerif(!isSerif)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                isSerif
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
              title="Toggle Serif / Modern Sans font"
            >
              <Type className="w-3.5 h-3.5 inline mr-1" />
              {isSerif ? 'Serif' : 'Sans'}
            </button>

            {/* Font Size Selector */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
              {(['sm', 'base', 'lg', 'xl'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => setFontSize(size)}
                  className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                    fontSize === size
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {size.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Copy Whole Chapter */}
            <button
              onClick={handleCopyChapter}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Copy entire chapter text"
            >
              {copiedId === 'chapter' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedId === 'chapter' ? 'Copied!' : 'Copy Chapter'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* SCRIPTURE CHAPTER VIEW */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        {/* Chapter Title Header */}
        <div className="text-center max-w-2xl mx-auto pb-8 mb-8 border-b border-slate-100 dark:border-slate-800">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 mb-2">
            {currentLocation.volume}
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">
            {currentLocation.book}
          </h1>
          <p className="text-lg font-serif italic text-slate-500 dark:text-slate-400 mt-1">
            Chapter {currentLocation.chapter}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-sans">
            {currentVerses.length} verses in this chapter
          </p>
        </div>

        {/* Verses List */}
        <div className={`space-y-4 ${isSerif ? 'font-serif' : 'font-sans'}`}>
          {currentVerses.map((v) => {
            const isSelected = currentLocation.verse === v.verse_number;
            const isSpeaking = speakingVerseNumber === v.verse_number;
            const existingBookmark = bookmarks.find((b) => b.verse.verse_title === v.verse_title);

            return (
              <div
                key={v.verse_number}
                ref={(el) => {
                  if (el) verseElementsRef.current.set(v.verse_number, el);
                }}
                className={`group relative p-3 sm:p-4 rounded-xl transition-all duration-200 ${
                  isSpeaking
                    ? 'bg-amber-100/90 dark:bg-amber-950/80 ring-2 ring-amber-500'
                    : isSelected
                    ? 'bg-amber-50/80 dark:bg-amber-950/50 ring-2 ring-amber-400 dark:ring-amber-600'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                } ${existingBookmark ? 'border-l-4 border-amber-500' : ''}`}
              >
                <div className="flex items-start gap-3">
                  {/* Verse Number Pill */}
                  <span
                    className={`shrink-0 inline-flex items-center justify-center min-w-7 h-7 text-xs font-bold rounded-lg ${
                      isSelected || isSpeaking
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/60 group-hover:text-amber-800 dark:group-hover:text-amber-300'
                    } transition-colors select-none`}
                  >
                    {v.verse_number}
                  </span>

                  {/* Scripture Text */}
                  <div className="flex-1">
                    <p className={`${fontSizeClass} text-slate-800 dark:text-slate-200 font-normal tracking-normal`}>
                      {v.scripture_text}
                    </p>

                    {/* Bookmark note display if present */}
                    {existingBookmark?.note && (
                      <div className="mt-2 text-xs font-sans text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800/60 flex items-center gap-1.5">
                        <MessageSquare className="w-3 h-3 shrink-0" />
                        <span>{existingBookmark.note}</span>
                      </div>
                    )}
                  </div>

                  {/* Hover Quick Actions */}
                  <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    {/* Speak Verse */}
                    <button
                      onClick={() => speakSingleVerse(v)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      title="Read verse aloud"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Bookmark / Note */}
                    <button
                      onClick={() => {
                        setNoteVerse(v);
                        setNoteInput(existingBookmark?.note || '');
                        setColorTag(existingBookmark?.colorTag || 'amber');
                      }}
                      className={`p-1.5 rounded-lg transition-colors ${
                        existingBookmark
                          ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30'
                          : 'text-slate-400 hover:text-amber-600 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                      title={existingBookmark ? 'Edit Bookmark / Note' : 'Add Bookmark'}
                    >
                      <BookmarkIcon className="w-3.5 h-3.5" />
                    </button>

                    {/* Copy Verse */}
                    <button
                      onClick={() => handleCopy(v.scripture_text, v.verse_title, `v-${v.verse_number}`)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      title="Copy verse"
                    >
                      {copiedId === `v-${v.verse_number}` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Navigation */}
        <div className="flex items-center justify-between mt-12 pt-6 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={handlePrevChapter}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous Chapter</span>
          </button>

          <span className="text-xs text-slate-400 font-mono">
            {currentLocation.book} {currentLocation.chapter}
          </span>

          <button
            onClick={handleNextChapter}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <span>Next Chapter</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* NOTE / BOOKMARK MODAL */}
      {noteVerse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Bookmark {noteVerse.verse_title}
            </h3>
            <p className="text-xs text-slate-500 mb-4 font-serif italic line-clamp-2">
              "{noteVerse.scripture_text}"
            </p>

            {/* Color Tag Picker */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Highlight Color Tag
              </label>
              <div className="flex items-center gap-2">
                {(['amber', 'emerald', 'blue', 'purple', 'rose'] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColorTag(c)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${
                      colorTag === c ? 'scale-110 border-slate-900 dark:border-white shadow-xs' : 'border-transparent'
                    } ${
                      c === 'amber'
                        ? 'bg-amber-400'
                        : c === 'emerald'
                        ? 'bg-emerald-400'
                        : c === 'blue'
                        ? 'bg-blue-400'
                        : c === 'purple'
                        ? 'bg-purple-400'
                        : 'bg-rose-400'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Personal Note */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Study Note (Optional)
              </label>
              <textarea
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="Write your personal insight, reflection, or cross-reference..."
                rows={3}
                className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setNoteVerse(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onToggleBookmark(noteVerse, noteInput.trim() || undefined, colorTag);
                  setNoteVerse(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-xs"
              >
                Save Bookmark
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
