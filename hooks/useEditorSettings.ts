'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { EditorSettings, Language, Theme, ConsoleTab } from '@/types/editor';
import {
  DEFAULT_SETTINGS,
  STORAGE_KEY,
  STARTER_CODE,
  MIN_FONT_SIZE,
  MAX_FONT_SIZE,
} from '@/lib/editorConstants';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadSettings(): EditorSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<EditorSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      // Always merge code buffers so new languages added later get defaults
      code: { ...STARTER_CODE, ...parsed.code },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings: EditorSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Silently ignore storage errors (private browsing, quota exceeded, etc.)
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseEditorSettingsReturn {
  settings: EditorSettings;
  // Language
  setLanguage: (lang: Language) => void;
  // Code
  setCode: (code: string) => void;
  resetCode: () => void;
  // Font size
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  setFontSize: (size: number) => void;
  // Theme
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  // Console
  setActiveConsoleTab: (tab: ConsoleTab) => void;
  setConsoleHeight: (height: number) => void;
  // Word wrap
  toggleWordWrap: () => void;
}

export function useEditorSettings(): UseEditorSettingsReturn {
  const [settings, setSettings] = useState<EditorSettings>(DEFAULT_SETTINGS);
  const initialized = useRef(false);

  // Hydrate from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      setSettings(loadSettings());
    }
  }, []);

  // Persist on every change
  useEffect(() => {
    if (initialized.current) {
      saveSettings(settings);
    }
  }, [settings]);

  // ── Language ──────────────────────────────────────────────────────────────

  const setLanguage = useCallback((lang: Language) => {
    setSettings((prev) => ({ ...prev, language: lang }));
  }, []);

  // ── Code ─────────────────────────────────────────────────────────────────

  const setCode = useCallback((code: string) => {
    setSettings((prev) => ({
      ...prev,
      code: { ...prev.code, [prev.language]: code },
    }));
  }, []);

  const resetCode = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      code: { ...prev.code, [prev.language]: STARTER_CODE[prev.language] },
    }));
  }, []);

  // ── Font Size ─────────────────────────────────────────────────────────────

  const setFontSize = useCallback((size: number) => {
    const clamped = Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, size));
    setSettings((prev) => ({ ...prev, fontSize: clamped }));
  }, []);

  const increaseFontSize = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      fontSize: Math.min(MAX_FONT_SIZE, prev.fontSize + 1),
    }));
  }, []);

  const decreaseFontSize = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      fontSize: Math.max(MIN_FONT_SIZE, prev.fontSize - 1),
    }));
  }, []);

  // ── Theme ─────────────────────────────────────────────────────────────────

  const setTheme = useCallback((theme: Theme) => {
    setSettings((prev) => ({ ...prev, theme }));
  }, []);

  const toggleTheme = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }));
  }, []);

  // ── Console ──────────────────────────────────────────────────────────────

  const setActiveConsoleTab = useCallback((tab: ConsoleTab) => {
    setSettings((prev) => ({ ...prev, activeConsoleTab: tab }));
  }, []);

  const setConsoleHeight = useCallback((height: number) => {
    setSettings((prev) => ({ ...prev, consoleHeight: height }));
  }, []);

  // ── Word Wrap ─────────────────────────────────────────────────────────────

  const toggleWordWrap = useCallback(() => {
    setSettings((prev) => ({ ...prev, wordWrap: !prev.wordWrap }));
  }, []);

  return {
    settings,
    setLanguage,
    setCode,
    resetCode,
    increaseFontSize,
    decreaseFontSize,
    setFontSize,
    toggleTheme,
    setTheme,
    setActiveConsoleTab,
    setConsoleHeight,
    toggleWordWrap,
  };
}
