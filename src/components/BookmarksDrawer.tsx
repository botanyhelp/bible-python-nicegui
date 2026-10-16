import React, { useState } from 'react';
import { Bookmark, ReadingLocation } from '../types/scripture';
import {
  Bookmark as BookmarkIcon,
  Trash2,
  BookOpen,
  Download,
  Share2,
  Tag,
  MessageSquare,
} from 'lucide-react';

interface BookmarksDrawerProps {
  bookmarks: Bookmark[];
  onRemoveBookmark: (id: string) => void;
  onClearAll: () => void;
  onSelectVerse: (loc: ReadingLocation) => void;
}

export const BookmarksDrawer: React.FC<BookmarksDrawerProps> = ({
  bookmarks,
  onRemoveBookmark,
  onClearAll,
  onSelectVerse,
}) => {
  const [selectedTag, setSelectedTag] = useState<string>('ALL');

  const filtered = selectedTag === 'ALL'
    ? bookmarks
    : bookmarks.filter((b) => b.colorTag === selectedTag);

  const exportMarkdown = () => {
    const lines = [
      '# Scripture Study Notes & Bookmarks',
      `Exported: ${new Date().toLocaleDateString()}`,
      '',
    ];

    for (const b of bookmarks) {
      lines.push(`### ${b.verse.verse_title} (${b.verse.volume_title})`);
      lines.push(`> "${b.verse.scripture_text}"`);
      if (b.note) {
        lines.push(`\n**Note:** ${b.note}`);
      }
      lines.push('\n---\n');
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scripture-bookmarks-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(bookmarks, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scripture-bookmarks-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-xs tracking-wider uppercase mb-1">
              <BookmarkIcon className="w-4 h-4" />
              <span>Personal Study Library</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 dark:text-white">
              Bookmarks & Study Notes
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {bookmarks.length} saved {bookmarks.length === 1 ? 'passage' : 'passages'}
            </p>
          </div>

          {/* Action buttons */}
          {bookmarks.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={exportMarkdown}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Download as Markdown note file"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export .MD</span>
              </button>
              <button
                onClick={exportJson}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Download as JSON"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>
              <button
                onClick={onClearAll}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="Clear all saved bookmarks"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>
          )}
        </div>

        {/* Color Tag Filters */}
        {bookmarks.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">
              Tag:
            </span>
            <button
              onClick={() => setSelectedTag('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                selectedTag === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              All ({bookmarks.length})
            </button>
            {(['amber', 'emerald', 'blue', 'purple', 'rose'] as const).map((tag) => {
              const count = bookmarks.filter((b) => b.colorTag === tag).length;
              if (count === 0) return null;
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    selectedTag === tag
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      tag === 'amber'
                        ? 'bg-amber-400'
                        : tag === 'emerald'
                        ? 'bg-emerald-400'
                        : tag === 'blue'
                        ? 'bg-blue-400'
                        : tag === 'purple'
                        ? 'bg-purple-400'
                        : 'bg-rose-400'
                    }`}
                  />
                  <span className="capitalize">{tag}</span>
                  <span className="text-[10px] opacity-75">({count})</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Bookmarks List */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <BookmarkIcon className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h3 className="text-base font-serif font-bold text-slate-800 dark:text-slate-200">
              No bookmarks yet
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              While reading scriptures or searching, tap the bookmark icon next to any verse to save it to your personal study library.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((b) => (
              <div
                key={b.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-amber-300 dark:hover:border-slate-700 transition-all"
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        b.colorTag === 'amber'
                          ? 'bg-amber-500'
                          : b.colorTag === 'emerald'
                          ? 'bg-emerald-500'
                          : b.colorTag === 'blue'
                          ? 'bg-blue-500'
                          : b.colorTag === 'purple'
                          ? 'bg-purple-500'
                          : 'bg-rose-500'
                      }`}
                    />
                    <h4 className="font-serif font-bold text-lg text-slate-900 dark:text-white">
                      {b.verse.verse_title}
                    </h4>
                    <span className="text-[11px] font-mono text-slate-400">
                      {b.verse.volume_title}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        onSelectVerse({
                          volume: b.verse.volume_title,
                          book: b.verse.book_title,
                          chapter: b.verse.chapter_number,
                          verse: b.verse.verse_number,
                        })
                      }
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 transition-colors"
                      title="Open in Scripture Reader"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Read</span>
                    </button>
                    <button
                      onClick={() => onRemoveBookmark(b.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Remove bookmark"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="font-serif text-base text-slate-800 dark:text-slate-200 italic leading-relaxed">
                  "{b.verse.scripture_text}"
                </p>

                {b.note && (
                  <div className="mt-3 p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                    <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-700" />
                    <div>
                      <span className="font-semibold block mb-0.5">Study Note:</span>
                      <span>{b.note}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
