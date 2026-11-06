// ─── Language ────────────────────────────────────────────────────────────────

export type Language =
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'java'
  | 'cpp'
  | 'go';

export interface LanguageOption {
  id: Language;
  label: string;
  monacoLang: string; // monaco language identifier
  icon: string; // emoji / text icon
  extension: string; // file extension shown in label
}

// ─── Theme ───────────────────────────────────────────────────────────────────

export type Theme = 'dark' | 'light';

// ─── Console ─────────────────────────────────────────────────────────────────

export type ConsoleTab = 'console' | 'testcases' | 'output';

// ─── Editor Settings (persisted) ─────────────────────────────────────────────

export interface EditorSettings {
  language: Language;
  code: Record<Language, string>; // per-language code buffers
  fontSize: number;
  theme: Theme;
  activeConsoleTab: ConsoleTab;
  wordWrap: boolean;
  consoleHeight: number; // pixels
}

// ─── Problem Domain ──────────────────────────────────────────────────────────

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface Example {
  id: number;
  input: string;
  output: string;
  explanation?: string;
}

export interface TestCase {
  id: number;
  input: string;
  expectedOutput: string;
  passed?: boolean;
  actualOutput?: string;
}

export interface Problem {
  id: string;
  title: string;
  difficulty: Difficulty;
  estimatedTime: string; // e.g. "20 min"
  tags: string[];
  description: string;
  examples: Example[];
  constraints: string[];
  starterCode?: Partial<Record<Language, string>>;
}

// ─── Execution (future) ──────────────────────────────────────────────────────

export type ExecutionStatus = 'idle' | 'running' | 'success' | 'error';

export interface ExecutionResult {
  status: ExecutionStatus;
  stdout?: string;
  stderr?: string;
  testResults?: TestCase[];
  runtime?: string;
  memory?: string;
}
