'use client';

import { useRef, useCallback, useEffect } from 'react';
import Editor, { OnMount, loader } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import type { Language, Theme } from '@/types/editor';
import { LANGUAGE_MAP, MONACO_DARK_THEME, MONACO_LIGHT_THEME } from '@/lib/editorConstants';

// ─── Monaco Theme Definitions ─────────────────────────────────────────────────

const DARK_THEME_DATA: Monaco.editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '5a5a7a', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'a78bfa', fontStyle: 'bold' },
    { token: 'string', foreground: '86efac' },
    { token: 'number', foreground: 'fb923c' },
    { token: 'type', foreground: '67e8f9' },
    { token: 'function', foreground: 'c4b5fd' },
    { token: 'variable', foreground: 'f0f0ff' },
    { token: 'operator', foreground: '94a3b8' },
    { token: 'delimiter', foreground: '64748b' },
    { token: 'class', foreground: 'fbbf24' },
    { token: 'interface', foreground: '34d399' },
  ],
  colors: {
    'editor.background':            '#0d0d1a',
    'editor.foreground':            '#e2e8f0',
    'editorLineNumber.foreground':  '#2d2d50',
    'editorLineNumber.activeForeground': '#7c6ff7',
    'editor.selectionBackground':   '#7c6ff730',
    'editor.inactiveSelectionBackground': '#7c6ff715',
    'editorCursor.foreground':      '#a78bfa',
    'editor.lineHighlightBackground': '#ffffff08',
    'editorIndentGuide.background': '#ffffff0a',
    'editorIndentGuide.activeBackground': '#7c6ff740',
    'editorGutter.background':      '#0d0d1a',
    'scrollbarSlider.background':   '#7c6ff720',
    'scrollbarSlider.hoverBackground': '#7c6ff740',
    'scrollbarSlider.activeBackground': '#7c6ff760',
  },
};

const LIGHT_THEME_DATA: Monaco.editor.IStandaloneThemeData = {
  base: 'vs',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '94a3b8', fontStyle: 'italic' },
    { token: 'keyword', foreground: '7c3aed', fontStyle: 'bold' },
    { token: 'string', foreground: '059669' },
    { token: 'number', foreground: 'ea580c' },
    { token: 'type', foreground: '0891b2' },
    { token: 'function', foreground: '6d28d9' },
    { token: 'class', foreground: 'd97706' },
  ],
  colors: {
    'editor.background':            '#f8f9fe',
    'editor.foreground':            '#1e1e3f',
    'editorLineNumber.foreground':  '#c4c4d4',
    'editorLineNumber.activeForeground': '#7c6ff7',
    'editor.selectionBackground':   '#7c6ff730',
    'editorCursor.foreground':      '#7c6ff7',
    'editor.lineHighlightBackground': '#7c6ff708',
    'editorGutter.background':      '#f8f9fe',
  },
};

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function EditorSkeleton() {
  return (
    <div className="w-full h-full p-4 space-y-2.5 overflow-hidden" aria-label="Loading editor…" aria-busy="true">
      {/* Fake line numbers + code lines */}
      {Array.from({ length: 22 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div
            className="editor-skeleton-line flex-shrink-0"
            style={{ width: 20, height: 14, opacity: 0.4 }}
          />
          <div
            className="editor-skeleton-line"
            style={{
              height: 14,
              width: `${skeletonWidths[i % skeletonWidths.length]}%`,
              opacity: i === 0 ? 0 : 0.6,
            }}
          />
        </div>
      ))}
    </div>
  );
}

const skeletonWidths = [0, 60, 45, 80, 35, 70, 55, 30, 65, 75, 40, 50, 85, 45, 60, 30, 70, 55, 80, 35, 65, 50];

// ─── Component ────────────────────────────────────────────────────────────────

interface CodeEditorProps {
  language: Language;
  theme: Theme;
  fontSize: number;
  wordWrap: boolean;
  value: string;
  onChange: (code: string) => void;
}

export default function CodeEditor({
  language,
  theme,
  fontSize,
  wordWrap,
  value,
  onChange,
}: CodeEditorProps) {
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);

  const monacoLang = LANGUAGE_MAP[language]?.monacoLang ?? 'javascript';
  const monacoTheme = theme === 'dark' ? MONACO_DARK_THEME : MONACO_LIGHT_THEME;

  // Register custom themes once
  const handleBeforeMount = useCallback((monaco: typeof Monaco) => {
    monacoRef.current = monaco;
    monaco.editor.defineTheme(MONACO_DARK_THEME, DARK_THEME_DATA);
    monaco.editor.defineTheme(MONACO_LIGHT_THEME, LIGHT_THEME_DATA);
  }, []);

  const handleMount: OnMount = useCallback((editor) => {
    editorRef.current = editor;
    // Focus the editor on mount
    editor.focus();
  }, []);

  // Update editor options when props change (avoids full remount)
  useEffect(() => {
    editorRef.current?.updateOptions({
      fontSize,
      wordWrap: wordWrap ? 'on' : 'off',
    });
  }, [fontSize, wordWrap]);

  return (
    <div className="w-full h-full relative">
      <Editor
        height="100%"
        language={monacoLang}
        theme={monacoTheme}
        value={value}
        onChange={(val) => onChange(val ?? '')}
        beforeMount={handleBeforeMount}
        onMount={handleMount}
        loading={<EditorSkeleton />}
        options={{
          fontSize,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
          fontLigatures: true,
          lineNumbers: 'on',
          lineNumbersMinChars: 3,
          glyphMargin: false,
          minimap: { enabled: false },
          wordWrap: wordWrap ? 'on' : 'off',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          autoClosingBrackets: 'always',
          autoClosingQuotes: 'always',
          autoIndent: 'full',
          formatOnPaste: true,
          formatOnType: false,
          tabSize: 2,
          insertSpaces: true,
          renderWhitespace: 'selection',
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          roundedSelection: true,
          scrollbar: {
            verticalScrollbarSize: 6,
            horizontalScrollbarSize: 6,
            useShadows: false,
          },
          padding: { top: 16, bottom: 16 },
          contextmenu: true,
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: 'on',
          snippetSuggestions: 'top',
          parameterHints: { enabled: true },
          renderLineHighlight: 'gutter',
          bracketPairColorization: { enabled: true },
          guides: {
            bracketPairs: true,
            indentation: true,
          },
          stickyScroll: { enabled: false },
          accessibilitySupport: 'auto',
        }}
      />
    </div>
  );
}
