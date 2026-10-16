import React from 'react';

export function highlightText(text: string, tokens: string[], isExact = false): React.ReactNode {
  if (!tokens || tokens.length === 0 || !text) {
    return text;
  }

  const validTokens = tokens.filter((t) => t && t.trim().length > 0);
  if (validTokens.length === 0) return text;

  try {
    const escaped = validTokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const pattern = isExact
      ? new RegExp(`(${escaped.join('|')})`, 'gi')
      : new RegExp(`\\b(${escaped.join('|')})`, 'gi');

    const parts = text.split(pattern);

    return parts.map((part, index) => {
      const isMatch = validTokens.some((t) => t.toLowerCase() === part.toLowerCase());
      if (isMatch) {
        return (
          <mark
            key={index}
            className="bg-amber-200 dark:bg-amber-900/60 dark:text-amber-200 text-amber-900 rounded px-1 py-0.5 font-medium transition-colors"
          >
            {part}
          </mark>
        );
      }
      return part;
    });
  } catch {
    return text;
  }
}
