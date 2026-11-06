'use client';

import { useState, useRef } from 'react';
import type { Language, LanguageOption } from '@/types/editor';
import { LANGUAGE_OPTIONS } from '@/lib/editorConstants';

interface LanguageSelectorProps {
  value: Language;
  onChange: (lang: Language) => void;
  variant?: 'toolbar' | 'sidebar';
}

export default function LanguageSelector({
  value,
  onChange,
  variant = 'toolbar',
}: LanguageSelectorProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = LANGUAGE_OPTIONS.find((l) => l.id === value)!;

  const handleSelect = (lang: Language) => {
    onChange(lang);
    setOpen(false);
  };

  const handleBlur = (e: React.FocusEvent) => {
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setOpen(false);
    }
  };

  const isSidebar = variant === 'sidebar';

  return (
    <div
      ref={containerRef}
      className="relative"
      onBlur={handleBlur}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className={`
          flex items-center gap-2 rounded-lg border transition-all duration-200 focus:outline-none
          focus-visible:ring-2 focus-visible:ring-violet-500/50 cursor-pointer
          ${isSidebar
            ? 'w-full px-3 py-2.5 bg-white/5 border-white/10 hover:bg-white/10 hover:border-violet-500/40'
            : 'px-3 py-1.5 bg-white/5 border-white/10 hover:bg-white/10 hover:border-violet-500/40'
          }
        `}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select programming language"
      >
        <span
          className="inline-flex items-center justify-center w-6 h-6 rounded text-[10px] font-bold tracking-tight"
          style={{ background: getIconBg(value), color: getIconColor(value) }}
        >
          {selected.icon}
        </span>
        <span className="text-sm font-medium text-white/90">{selected.label}</span>
        <svg
          className={`w-3.5 h-3.5 text-white/40 ml-auto transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Programming languages"
          className={`
            absolute z-50 mt-1 rounded-xl border border-white/10 overflow-hidden
            shadow-2xl shadow-black/60 backdrop-blur-xl
            bg-[#1a1a2e]/95 animate-fadeInScale
            ${isSidebar ? 'w-full' : 'min-w-[160px]'}
          `}
        >
          {LANGUAGE_OPTIONS.map((lang) => (
            <LanguageOption
              key={lang.id}
              lang={lang}
              isSelected={lang.id === value}
              onSelect={handleSelect}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function LanguageOption({
  lang,
  isSelected,
  onSelect,
}: {
  lang: LanguageOption;
  isSelected: boolean;
  onSelect: (id: Language) => void;
}) {
  return (
    <li
      role="option"
      aria-selected={isSelected}
      onClick={() => onSelect(lang.id)}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(lang.id)}
      tabIndex={0}
      className={`
        flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors duration-150
        focus:outline-none focus-visible:bg-violet-500/20
        ${isSelected
          ? 'bg-violet-500/20 text-violet-300'
          : 'text-white/80 hover:bg-white/8 hover:text-white'
        }
      `}
    >
      <span
        className="inline-flex items-center justify-center w-6 h-6 rounded text-[10px] font-bold flex-shrink-0"
        style={{ background: getIconBg(lang.id), color: getIconColor(lang.id) }}
      >
        {lang.icon}
      </span>
      <span className="text-sm font-medium">{lang.label}</span>
      <span className="ml-auto text-xs text-white/30">{lang.extension}</span>
      {isSelected && (
        <svg className="w-4 h-4 text-violet-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
    </li>
  );
}

// ─── Icon styling helpers ─────────────────────────────────────────────────────

function getIconBg(lang: Language): string {
  const map: Record<Language, string> = {
    javascript: 'rgba(247, 220, 66, 0.2)',
    typescript: 'rgba(49, 120, 198, 0.25)',
    python:     'rgba(55, 118, 171, 0.25)',
    java:       'rgba(232, 74, 40, 0.2)',
    cpp:        'rgba(100, 160, 255, 0.2)',
    go:         'rgba(0, 173, 216, 0.2)',
  };
  return map[lang];
}

function getIconColor(lang: Language): string {
  const map: Record<Language, string> = {
    javascript: '#f7dc42',
    typescript: '#4b9fe1',
    python:     '#6ea8c9',
    java:       '#e84a28',
    cpp:        '#80b4ff',
    go:         '#00aed8',
  };
  return map[lang];
}
