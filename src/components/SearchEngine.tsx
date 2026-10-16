import React, { useState, useEffect, useMemo, useTransition } from 'react';
import {
  SearchFilter,
  SearchResponse,
  SearchScope,
  MatchMode,
  VerseRecord,
  ReadingLocation,
} from '../types/scripture';
import { ScriptureEngine } from '../services/scriptureEngine';
import { highlightText } from '../utils/textHighlight';
import {
  Search as SearchIcon,
  X,
  Filter,
  BookOpen,
  Copy,
  Check,
  Zap,
  ArrowRight,
  Sparkles,
  ChevronDown,
} from 'lucide-react';

interface SearchEngineProps {
  engine: ScriptureEngine;
  onSelectVerse: (loc: ReadingLocation) => void;
  quickBibleMode: boolean;
}

const POPULAR_PRESETS = [
  'Faith',
  'Love one another',
  'Light and truth',
  'Peace I leave with you',
  'Be of good cheer',
  'Lord is my shepherd',
  'Grace',
  'John 3:16',
  'Romans 8:28',
  '2 Timothy 1:7',
];

export const SearchEngine: React.FC<SearchEngineProps> = ({
  engine,
  onSelectVerse,
  quickBibleMode,
}) => {
  const [query, setQuery] = useState('Faith');
  const [scope, setScope] = useState<SearchScope>(quickBibleMode ? 'BIBLE' : 'ALL');
  const [bookFilter, setBookFilter] = useState<string>('ALL');
  const [matchMode, setMatchMode] = useState<MatchMode>('all');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 30;

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Sync default scope when quickBibleMode changes
  useEffect(() => {
    if (quickBibleMode && scope === 'ALL') {
      setScope('BIBLE');
    }
  }, [quickBibleMode, scope]);

  // Execute in-memory search
  const searchResponse: SearchResponse = useMemo(() => {
    if (!engine.isLoaded || !query.trim()) {
      return { results: [], totalMatches: 0, executionTimeMs: 0 };
    }

    const filter: SearchFilter = {
      query,
      scope,
      bookTitle: bookFilter === 'ALL' ? undefined : bookFilter,
      matchMode,
      caseSensitive,
    };

    return engine.search(filter, 200);
  }, [engine, query, scope, bookFilter, matchMode, caseSensitive]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [query, scope, bookFilter, matchMode]);

  const pagedResults = useMemo(() => {
    return searchResponse.results.slice(0, page * pageSize);
  }, [searchResponse.results, page, pageSize]);

  const handleCopy = (text: string, ref: string, id: string) => {
    navigator.clipboard.writeText(`${ref}\n"${text}"`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleJumpToReader = (verse: VerseRecord) => {
    onSelectVerse({
      volume: verse.volume_title,
      book: verse.book_title,
      chapter: verse.chapter_number,
      verse: verse.verse_number,
    });
  };

  // Extract search tokens for highlighting
  const queryTokens = useMemo(() => {
    if (matchMode === 'exact') return [query.trim()];
    return query
      .toLowerCase()
      .match(/[a-z0-9]+/g)
      ?.filter((w) => w.length >= 2) || [];
  }, [query, matchMode]);

  const booksList = useMemo(() => {
    if (scope === 'BIBLE') {
      return engine.allBooks.filter(
        (b) => b.volume_title === 'Old Testament' || b.volume_title === 'New Testament'
      );
    }
    if (scope === 'OLD_TESTAMENT') {
      return engine.getBooksForVolume('Old Testament');
    }
    if (scope === 'NEW_TESTAMENT') {
      return engine.getBooksForVolume('New Testament');
    }
    if (scope === 'BOOK_OF_MORMON') {
      return engine.getBooksForVolume('Book of Mormon');
    }
    if (scope === 'DOCTRINE_AND_COVENANTS') {
      return engine.getBooksForVolume('Doctrine and Covenants');
    }
    if (scope === 'PEARL_OF_GREAT_PRICE') {
      return engine.getBooksForVolume('Pearl of Great Price');
    }
    return engine.allBooks;
  }, [engine, scope]);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6">
      {/* SEARCH HEADER & INPUT BOX */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm mb-6 transition-colors">
        <div className="max-w-2xl mb-5">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-xs tracking-wider uppercase mb-1">
            <Zap className="w-4 h-4" />
            <span>High-Speed In-Memory Search Engine</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">
            Search Canonical Scriptures
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Instantly query across all 41,995 verses or filter directly to the Holy Bible with sub-millisecond retrieval.
          </p>
        </div>

        {/* Input Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <SearchIcon className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => startTransition(() => setQuery(e.target.value))}
            placeholder="Type words, exact phrases, or citations (e.g. faith, love one another, John 3:16)..."
            className="w-full pl-12 pr-12 py-3.5 text-base sm:text-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all shadow-inner"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              title="Clear search"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Quick Search Suggestions */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
            Try:
          </span>
          {POPULAR_PRESETS.map((preset) => (
            <button
              key={preset}
              onClick={() => setQuery(preset)}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-100 dark:hover:bg-amber-950/60 hover:text-amber-800 dark:hover:text-amber-300 transition-colors"
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Filters & Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          {/* Scope Select */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Canon Scope
            </label>
            <select
              value={scope}
              onChange={(e) => {
                setScope(e.target.value as SearchScope);
                setBookFilter('ALL');
              }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">All Canonical Scriptures (41,995)</option>
              <option value="BIBLE">Holy Bible Only (OT & NT - 31,102)</option>
              <option value="OLD_TESTAMENT">Old Testament (23,145)</option>
              <option value="NEW_TESTAMENT">New Testament (7,957)</option>
              <option value="BOOK_OF_MORMON">Book of Mormon (6,604)</option>
              <option value="DOCTRINE_AND_COVENANTS">Doctrine & Covenants (3,654)</option>
              <option value="PEARL_OF_GREAT_PRICE">Pearl of Great Price (635)</option>
            </select>
          </div>

          {/* Book Filter */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Filter by Book
            </label>
            <select
              value={bookFilter}
              onChange={(e) => setBookFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">All Books in Scope ({booksList.length})</option>
              {booksList.map((b) => (
                <option key={b.book_title} value={b.book_title}>
                  {b.book_title}
                </option>
              ))}
            </select>
          </div>

          {/* Match Mode */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Match Logic
            </label>
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setMatchMode('all')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  matchMode === 'all'
                    ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
                title="All words must be found in verse"
              >
                All Words
              </button>
              <button
                type="button"
                onClick={() => setMatchMode('any')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  matchMode === 'any'
                    ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
                title="Any word found in verse"
              >
                Any Word
              </button>
              <button
                type="button"
                onClick={() => setMatchMode('exact')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  matchMode === 'exact'
                    ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
                title="Exact contiguous phrase match"
              >
                Exact
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* METRICS & SUMMARY STATS */}
      {query.trim() && (
        <div className="flex items-center justify-between px-2 mb-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {searchResponse.totalMatches.toLocaleString()} matches found
            </span>
            <span>•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-mono font-medium">
              {searchResponse.executionTimeMs} ms
            </span>
            <span>in-memory query time</span>
          </div>
          {searchResponse.totalMatches > pagedResults.length && (
            <span>
              Showing {pagedResults.length} of {searchResponse.totalMatches}
            </span>
          )}
        </div>
      )}

      {/* DIRECT CITATION HIT CARD */}
      {searchResponse.referenceMatch && (
        <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border-2 border-amber-300 dark:border-amber-800/80 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                Direct Reference Match
              </span>
            </div>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
              {searchResponse.referenceMatch.volume_title}
            </span>
          </div>

          <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-white mb-2">
            {searchResponse.referenceMatch.verse_title}
          </h3>
          <p className="font-serif text-lg text-slate-800 dark:text-slate-200 leading-relaxed mb-4">
            "{searchResponse.referenceMatch.scripture_text}"
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleJumpToReader(searchResponse.referenceMatch!)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-xs"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Read in Chapter Context</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
            <button
              onClick={() =>
                handleCopy(
                  searchResponse.referenceMatch!.scripture_text,
                  searchResponse.referenceMatch!.verse_title,
                  'ref-match'
                )
              }
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors"
            >
              {copiedId === 'ref-match' ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copiedId === 'ref-match' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
      )}

      {/* SEARCH RESULTS LIST */}
      <div className="space-y-4">
        {pagedResults.map((item, idx) => {
          const v = item.verse;
          const cardId = `sr-${v.verse_title}-${idx}`;

          return (
            <div
              key={cardId}
              className="group bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-amber-300 dark:hover:border-slate-700 transition-all"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-serif font-bold text-lg text-slate-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                    {v.verse_title}
                  </span>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {v.volume_title}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleCopy(v.scripture_text, v.verse_title, cardId)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Copy verse"
                  >
                    {copiedId === cardId ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={() => handleJumpToReader(v)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/80 transition-colors"
                    title="Open in Scripture Reader"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Read</span>
                  </button>
                </div>
              </div>

              {/* Highlighted Scripture Text */}
              <p className="font-serif text-base sm:text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
                {highlightText(v.scripture_text, queryTokens, matchMode === 'exact')}
              </p>
            </div>
          );
        })}

        {/* Empty State */}
        {query.trim() && searchResponse.totalMatches === 0 && (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
            <SearchIcon className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-serif font-bold text-slate-800 dark:text-slate-200">
              No matching verses found
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
              No scriptures matched "{query}" in the selected scope. Try using "Any Word" mode, shortening your search words, or expanding the scope to "All Canonical Scriptures".
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => setMatchMode('any')}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60"
              >
                Switch to 'Any Word' Match
              </button>
              <button
                onClick={() => setScope('ALL')}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Search All Canon
              </button>
            </div>
          </div>
        )}

        {/* Load More Button */}
        {searchResponse.totalMatches > pagedResults.length && (
          <div className="text-center pt-4">
            <button
              onClick={() => setPage((p) => p + 1)}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors shadow-xs"
            >
              Load More Results ({searchResponse.totalMatches - pagedResults.length} remaining)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
