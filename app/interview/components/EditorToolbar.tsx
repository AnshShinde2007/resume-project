'use client';

import { useState } from 'react';
import type { Language, Theme, Difficulty } from '@/types/editor';
import LanguageSelector from './LanguageSelector';
import ThemeToggle from './ThemeToggle';
import { MIN_FONT_SIZE, MAX_FONT_SIZE } from '@/lib/editorConstants';

interface EditorToolbarProps {
  problemTitle: string;
  difficulty: Difficulty;
  language: Language;
  theme: Theme;
  fontSize: number;
  wordWrap: boolean;
  isFullscreen: boolean;
  code: string;
  isRunning: boolean;
  onRun: () => void;
  onLanguageChange: (lang: Language) => void;
  onThemeToggle: () => void;
  onFontIncrease: () => void;
  onFontDecrease: () => void;
  onWordWrapToggle: () => void;
  onResetCode: () => void;
  onFullscreenToggle: () => void;
}

const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  Easy:   'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  Medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  Hard:   'bg-red-500/15 text-red-400 border-red-500/30',
};

export default function EditorToolbar({
  problemTitle,
  difficulty,
  language,
  theme,
  fontSize,
  wordWrap,
  isFullscreen,
  code,
  isRunning,
  onRun,
  onLanguageChange,
  onThemeToggle,
  onFontIncrease,
  onFontDecrease,
  onWordWrapToggle,
  onResetCode,
  onFullscreenToggle,
}: EditorToolbarProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea');
      el.value = code;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header className="editor-toolbar flex items-center gap-2 px-4 py-2 border-b border-white/8 flex-shrink-0">
      {/* Problem title + difficulty */}
      <div className="flex items-center gap-2.5 mr-4 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          {/* Terminal icon */}
          <svg className="w-4 h-4 text-violet-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-sm font-semibold text-white/90 truncate">{problemTitle}</span>
        </div>
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border flex-shrink-0 ${DIFFICULTY_STYLES[difficulty]}`}>
          {difficulty}
        </span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Language Selector */}
      <LanguageSelector value={language} onChange={onLanguageChange} variant="toolbar" />

      <button onClick={onRun} disabled={isRunning} className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-50">
        {isRunning ? 'Running…' : '▶ Run'}
      </button>

      {/* Divider */}
      <div className="w-px h-5 bg-white/10 mx-1" />

      {/* Word wrap toggle */}
      <ToolbarButton
        onClick={onWordWrapToggle}
        title={wordWrap ? 'Disable word wrap' : 'Enable word wrap'}
        active={wordWrap}
        label="Wrap"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h12a4 4 0 010 8H8m0 0l3-3m-3 3l3 3" />
        </svg>
      </ToolbarButton>

      {/* Font size */}
      <div className="flex items-center gap-0.5">
        <ToolbarButton
          onClick={onFontDecrease}
          title="Decrease font size"
          disabled={fontSize <= MIN_FONT_SIZE}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
          </svg>
        </ToolbarButton>
        <span className="text-xs text-white/50 w-7 text-center font-mono select-none">{fontSize}</span>
        <ToolbarButton
          onClick={onFontIncrease}
          title="Increase font size"
          disabled={fontSize >= MAX_FONT_SIZE}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </ToolbarButton>
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-white/10 mx-1" />

      {/* Reset */}
      <ToolbarButton onClick={onResetCode} title="Reset code to default">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </ToolbarButton>

      {/* Copy */}
      <ToolbarButton onClick={handleCopy} title={copied ? 'Copied!' : 'Copy code'} active={copied}>
        {copied ? (
          <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </ToolbarButton>

      {/* Theme toggle */}
      <ThemeToggle theme={theme} onToggle={onThemeToggle} />

      {/* Fullscreen */}
      <ToolbarButton onClick={onFullscreenToggle} title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
        {isFullscreen ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        )}
      </ToolbarButton>
    </header>
  );
}

// ─── Reusable Toolbar Button ──────────────────────────────────────────────────

interface ToolbarButtonProps {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  label?: string;
}

function ToolbarButton({ onClick, title, children, active, disabled, label }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      disabled={disabled}
      className={`
        flex items-center gap-1.5 px-2 py-1.5 rounded-lg border transition-all duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50
        disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer
        ${active
          ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
          : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white/90 hover:border-white/20'
        }
      `}
    >
      {children}
      {label && <span className="text-xs font-medium">{label}</span>}
    </button>
  );
}
