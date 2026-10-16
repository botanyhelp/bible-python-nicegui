/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ScriptureEngine } from './services/scriptureEngine';
import {
  VerseRecord,
  ReadingLocation,
  Bookmark,
} from './types/scripture';
import { Header } from './components/Header';
import { ScriptureReader } from './components/ScriptureReader';
import { SearchEngine } from './components/SearchEngine';
import { BookmarksDrawer } from './components/BookmarksDrawer';
import { CloudRunExportModal } from './components/CloudRunExportModal';
import {
  BookOpen,
  Loader2,
  AlertCircle,
  Sparkles,
  Search,
  CheckCircle2,
} from 'lucide-react';

export default function App() {
  const [engine] = useState<ScriptureEngine>(() => ScriptureEngine.getInstance());
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(10);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'reader' | 'search' | 'study' | 'cloudrun'>('reader');
  const [quickBibleMode, setQuickBibleMode] = useState<boolean>(true); // default to Holy Bible

  // Dark mode
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sv_dark_mode');
      if (saved !== null) return saved === 'true';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Current Reading Location
  const [currentLocation, setCurrentLocation] = useState<ReadingLocation>({
    volume: 'Old Testament',
    book: 'Genesis',
    chapter: 1,
    verse: 1,
  });

  // Bookmarks & Notes
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('sv_bookmarks');
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  // Initialize Scripture Database on load
  useEffect(() => {
    let isMounted = true;
    engine
      .initialize((progress) => {
        if (isMounted) setLoadProgress(progress);
      })
      .then(() => {
        if (isMounted) {
          setIsLoading(false);
          // Set initial location
          setCurrentLocation({
            volume: 'Old Testament',
            book: 'Genesis',
            chapter: 1,
            verse: 1,
          });
        }
      })
      .catch((err) => {
        if (isMounted) {
          setLoadError(err.message || 'Failed to initialize database.');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [engine]);

  // Sync dark mode class on html/body
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('sv_dark_mode', String(isDarkMode));
  }, [isDarkMode]);

  // Sync bookmarks to localStorage
  useEffect(() => {
    localStorage.setItem('sv_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  const handleRandomVerse = () => {
    if (!engine.isLoaded) return;
    try {
      const scope = quickBibleMode ? 'BIBLE' : 'ALL';
      const verse = engine.getRandomVerse(scope);
      setCurrentLocation({
        volume: verse.volume_title,
        book: verse.book_title,
        chapter: verse.chapter_number,
        verse: verse.verse_number,
      });
      setActiveTab('reader');
    } catch {
      // Fallback
    }
  };

  const handleToggleBookmark = (
    verse: VerseRecord,
    note?: string,
    colorTag: Bookmark['colorTag'] = 'amber'
  ) => {
    setBookmarks((prev) => {
      const existingIdx = prev.findIndex((b) => b.verse.verse_title === verse.verse_title);
      if (existingIdx >= 0) {
        // Update existing note/tag
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          note: note !== undefined ? note : updated[existingIdx].note,
          colorTag: colorTag || updated[existingIdx].colorTag,
        };
        return updated;
      } else {
        const newBookmark: Bookmark = {
          id: `bm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          verse,
          createdAt: Date.now(),
          note,
          colorTag,
        };
        return [newBookmark, ...prev];
      }
    });
  };

  const handleRemoveBookmark = (id: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  const handleClearAllBookmarks = () => {
    if (window.confirm('Are you sure you want to clear all saved study bookmarks?')) {
      setBookmarks([]);
    }
  };

  const handleSelectVerseFromSearch = (loc: ReadingLocation) => {
    setCurrentLocation(loc);
    setActiveTab('reader');
  };

  // Loading Screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-800 dark:text-slate-100 font-sans">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-5">
            <BookOpen className="w-8 h-8 animate-pulse" />
          </div>

          <h2 className="text-2xl font-serif font-bold tracking-tight mb-2">
            Loading Scriptures
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-serif italic">
            "Thy word is a lamp unto my feet, and a light unto my path." — Psalms 119:105
          </p>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden mb-3">
            <div
              className="bg-amber-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${loadProgress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Building In-Memory Index</span>
            <span>{loadProgress}%</span>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2 text-xs text-slate-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Parsing 41,995 canonical verses into RAM...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error Screen
  if (loadError) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-800 dark:text-slate-100">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 border border-rose-200 dark:border-rose-900/40 shadow-xl text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Failed to Load Scripture Data</h2>
          <p className="text-sm text-slate-500 mb-6">{loadError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-sm"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors flex flex-col">
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        totalVerses={engine.totalVerses}
        onRandomVerse={handleRandomVerse}
        quickBibleMode={quickBibleMode}
        setQuickBibleMode={setQuickBibleMode}
      />

      {/* Main Content Areas */}
      <main className="flex-1">
        {activeTab === 'reader' && (
          <ScriptureReader
            engine={engine}
            currentLocation={currentLocation}
            setCurrentLocation={setCurrentLocation}
            bookmarks={bookmarks}
            onToggleBookmark={handleToggleBookmark}
            quickBibleMode={quickBibleMode}
            onNavigateToSearch={(term) => {
              setActiveTab('search');
            }}
          />
        )}

        {activeTab === 'search' && (
          <SearchEngine
            engine={engine}
            onSelectVerse={handleSelectVerseFromSearch}
            quickBibleMode={quickBibleMode}
          />
        )}

        {activeTab === 'study' && (
          <BookmarksDrawer
            bookmarks={bookmarks}
            onRemoveBookmark={handleRemoveBookmark}
            onClearAll={handleClearAllBookmarks}
            onSelectVerse={handleSelectVerseFromSearch}
          />
        )}

        {activeTab === 'cloudrun' && <CloudRunExportModal />}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-slate-800 dark:text-slate-200">
              ScriptureVault
            </span>
            <span>•</span>
            <span>41,995 canonical verses indexed in-memory</span>
            <span>•</span>
            <span>Holy Bible (66 books) & Canonical Scriptures</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('cloudrun')}
              className="text-blue-600 dark:text-blue-400 hover:underline font-mono"
            >
              GCP Cloud Run Ready
            </button>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <button
              onClick={handleRandomVerse}
              className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
            >
              Random Verse
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
