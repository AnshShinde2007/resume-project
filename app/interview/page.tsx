'use client';

import { useState } from 'react';
import CodeEditor from './components/CodeEditor';
import EditorToolbar from './components/EditorToolbar';
import ProblemPanel from './components/ProblemPanel';
import { useEditorSettings } from '@/hooks/useEditorSettings';
import { SAMPLE_PROBLEM } from '@/lib/editorConstants';

type RunResult = { stdout?: string; stderr?: string; compile_output?: string; time?: string; memory?: number; status?: { description: string } };

export default function InterviewPage() {
  const { settings, setLanguage, setCode, resetCode, increaseFontSize, decreaseFontSize, toggleTheme, toggleWordWrap } = useEditorSettings();
  const [stdin, setStdin] = useState('');
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState('');
  const [running, setRunning] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  async function runCode() {
    setRunning(true);
    setError('');
    setResult(null);
    try {
      const response = await fetch('/api/judge0', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: settings.code[settings.language], language: settings.language, stdin }),
      });
      const { token } = await response.json();
      if (!response.ok || !token) throw new Error('Judge0 could not queue this submission.');
      for (let attempt = 0; attempt < 40; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const polled = await fetch(`/api/judge0?token=${encodeURIComponent(token)}`);
        const data = await polled.json();
        if (!polled.ok) throw new Error(data.error || 'Could not fetch execution result.');
        if (data.status?.id > 2) {
          setResult(data);
          return;
        }
      }
      throw new Error('Execution timed out while waiting for Judge0.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Execution failed.');
    } finally {
      setRunning(false);
    }
  }

  return (
    <main className={`h-screen bg-[#0a0a0f] text-white ${fullscreen ? 'fixed inset-0 z-50' : ''}`}>
      <div className="flex h-full min-h-0">
        {!fullscreen && <div className="hidden w-[35%] min-w-[300px] lg:block"><ProblemPanel problem={SAMPLE_PROBLEM} /></div>}
        <section className="flex min-w-0 flex-1 flex-col">
          <EditorToolbar
            problemTitle={SAMPLE_PROBLEM.title} difficulty={SAMPLE_PROBLEM.difficulty}
            language={settings.language} theme={settings.theme} fontSize={settings.fontSize}
            wordWrap={settings.wordWrap} isFullscreen={fullscreen} code={settings.code[settings.language]}
            isRunning={running} onRun={runCode} onLanguageChange={setLanguage} onThemeToggle={toggleTheme}
            onFontIncrease={increaseFontSize} onFontDecrease={decreaseFontSize} onWordWrapToggle={toggleWordWrap}
            onResetCode={resetCode} onFullscreenToggle={() => setFullscreen(v => !v)}
          />
          <div className="min-h-0 flex-1">
            <CodeEditor language={settings.language} theme={settings.theme} fontSize={settings.fontSize} wordWrap={settings.wordWrap} value={settings.code[settings.language]} onChange={setCode} />
          </div>
          <div className="flex flex-shrink-0 flex-col border-t border-white/10 bg-[#111118]" style={{ height: settings.consoleHeight }}>
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/55">Console · Judge0 CE</span>
              <input aria-label="Standard input" value={stdin} onChange={e => setStdin(e.target.value)} placeholder="stdin (optional)" className="w-1/2 rounded bg-white/5 px-2 py-1 font-mono text-xs outline-none" />
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-4 font-mono text-sm" aria-live="polite">
              {running && <p className="text-violet-300">Compiling and running…</p>}
              {error && <pre className="whitespace-pre-wrap text-red-300">{error}</pre>}
              {result && <>
                <p className={result.status?.description === 'Accepted' ? 'mb-2 text-emerald-300' : 'mb-2 text-amber-300'}>{result.status?.description}</p>
                {result.stdout && <pre className="whitespace-pre-wrap text-white/85">{result.stdout}</pre>}
                {(result.compile_output || result.stderr) && <pre className="mt-2 whitespace-pre-wrap text-red-300">{result.compile_output || result.stderr}</pre>}
                <p className="mt-3 text-xs text-white/35">{result.time ? `${result.time}s` : ''}{result.memory ? ` · ${Math.round(result.memory)} KB` : ''}</p>
              </>}
              {!running && !error && !result && <p className="text-white/35">Run your code to see the output here.</p>}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
