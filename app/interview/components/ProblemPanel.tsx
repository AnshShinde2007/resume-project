'use client';

import { useState } from 'react';
import type { Problem, Difficulty } from '@/types/editor';

interface ProblemPanelProps {
  problem: Problem;
}

const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  Easy:   'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  Medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  Hard:   'bg-red-500/15 text-red-400 border-red-500/30',
};

const DIFFICULTY_DOT: Record<Difficulty, string> = {
  Easy:   'bg-emerald-400',
  Medium: 'bg-amber-400',
  Hard:   'bg-red-400',
};

const TIME_ICON = (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="9" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" />
  </svg>
);

export default function ProblemPanel({ problem }: ProblemPanelProps) {
  const [notes, setNotes] = useState('');
  const [activeSection, setActiveSection] = useState<'description' | 'editorial'>('description');

  return (
    <aside className="problem-panel h-full flex flex-col overflow-hidden border-r border-white/8">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-white/8 flex-shrink-0">
        {/* Tabs */}
        <div className="flex gap-1 mb-4">
          {(['description', 'editorial'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSection(tab)}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all duration-200
                focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 cursor-pointer
                ${activeSection === tab
                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                  : 'text-white/40 hover:text-white/70 border border-transparent'
                }
              `}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Title & meta */}
        <h1 className="text-base font-bold text-white mb-3 leading-snug">{problem.title}</h1>
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${DIFFICULTY_STYLES[problem.difficulty]}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${DIFFICULTY_DOT[problem.difficulty]}`} />
            {problem.difficulty}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-white/50">
            {TIME_ICON}
            {problem.estimatedTime}
          </span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {problem.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 scrollbar-thin">
        {activeSection === 'description' ? (
          <>
            {/* Description */}
            <Section title="Problem Statement">
              <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">
                {problem.description}
              </p>
            </Section>

            {/* Examples */}
            <Section title="Examples">
              <div className="space-y-3">
                {problem.examples.map((ex) => (
                  <div key={ex.id} className="rounded-xl border border-white/8 overflow-hidden bg-white/3">
                    <div className="px-3 py-1.5 border-b border-white/8 bg-white/5">
                      <span className="text-xs font-semibold text-violet-400">Example {ex.id}</span>
                    </div>
                    <div className="p-3 space-y-2 font-mono text-xs">
                      <div>
                        <span className="text-white/40 mr-2">Input:</span>
                        <span className="text-emerald-300">{ex.input}</span>
                      </div>
                      <div>
                        <span className="text-white/40 mr-2">Output:</span>
                        <span className="text-amber-300">{ex.output}</span>
                      </div>
                      {ex.explanation && (
                        <div className="pt-1 border-t border-white/5">
                          <span className="text-white/40 mr-2">Explanation:</span>
                          <span className="text-white/60 font-sans">{ex.explanation}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Constraints */}
            <Section title="Constraints">
              <ul className="space-y-1.5">
                {problem.constraints.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/60">
                    <span className="text-violet-500 mt-0.5 flex-shrink-0">▸</span>
                    <code className="font-mono text-xs text-white/75 leading-relaxed">{c}</code>
                  </li>
                ))}
              </ul>
            </Section>

            {/* Notes */}
            <Section title="My Notes">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Jot down your approach, edge cases, or hints…"
                rows={5}
                className="
                  w-full rounded-xl border border-white/10 bg-white/5 p-3
                  text-sm text-white/80 placeholder-white/25 resize-none
                  focus:outline-none focus:border-violet-500/50 focus:bg-white/8
                  transition-all duration-200 leading-relaxed
                "
                aria-label="Personal notes"
              />
            </Section>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-white/50 mb-1">Editorial locked</p>
            <p className="text-xs text-white/30">Solve the problem to unlock</p>
          </div>
        )}
      </div>
    </aside>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-2.5">
        {title}
      </h2>
      {children}
    </div>
  );
}
