import React from 'react';
import {
  BookOpen,
  Search,
  Bookmark as BookmarkIcon,
  Server,
  Sparkles,
  Sun,
  Moon,
  Layers,
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'reader' | 'search' | 'study' | 'cloudrun';
  setActiveTab: (tab: 'reader' | 'search' | 'study' | 'cloudrun') => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  totalVerses: number;
  onRandomVerse: () => void;
  quickBibleMode: boolean;
  setQuickBibleMode: (val: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isDarkMode,
  toggleDarkMode,
  totalVerses,
  onRandomVerse,
  quickBibleMode,
  setQuickBibleMode,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-lg text-slate-900 dark:text-white tracking-tight">
                  ScriptureVault
                </span>
                <span className="text-[11px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-sans">
                  {quickBibleMode ? 'Holy Bible' : 'All Canon'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-sans hidden sm:block">
                {totalVerses > 0 ? `${totalVerses.toLocaleString()} verses in-memory` : 'Initializing database...'}
              </p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('reader')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'reader'
                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden md:inline">Reader</span>
            </button>

            <button
              onClick={() => setActiveTab('search')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'search'
                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Search className="w-4 h-4" />
              <span className="hidden md:inline">Search</span>
            </button>

            <button
              onClick={() => setActiveTab('study')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'study'
                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <BookmarkIcon className="w-4 h-4" />
              <span className="hidden md:inline">Bookmarks & Notes</span>
            </button>

            <button
              onClick={() => setActiveTab('cloudrun')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'cloudrun'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Python NiceGUI & GCP Cloud Run single-container deployment bundle"
            >
              <Server className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="hidden lg:inline">Python & Cloud Run</span>
            </button>
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2">
            {/* Quick Bible Scope Toggle */}
            <button
              onClick={() => setQuickBibleMode(!quickBibleMode)}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                quickBibleMode
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Toggle between Bible Only (OT & NT) and All Canonical Scriptures"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{quickBibleMode ? 'Bible Only' : 'All Canon'}</span>
            </button>

            {/* Random Verse / Daily Inspiration */}
            <button
              onClick={onRandomVerse}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-800 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
              title="Inspire me with a random verse"
              aria-label="Random Verse"
            >
              <Sparkles className="w-4 h-4" />
            </button>

            {/* Dark / Light Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
