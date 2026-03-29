"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { parseResumeText, ParsedResume } from "../lib/resumeParser";
import { parseJobDescription, ParsedJobDescription } from "../lib/jobDescriptionParser";

// ─── PDF Extraction ────────────────────────────────────────────────────────────
async function extractTextFromPDF(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  const ab = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: ab }).promise;
  const parts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    parts.push(content.items.map((it: unknown) => (it as { str?: string }).str ?? "").join(" "));
  }
  return parts.join("\n");
}

async function extractText(file: File): Promise<string> {
  if (file.type === "application/pdf") return extractTextFromPDF(file);
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsText(file);
  });
}

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: Date;
}

interface MockSession {
  id: string;
  title: string;
  company: string;
  role: string;
  createdAt: Date;
  messages: Message[];
  jd: ParsedJobDescription | null;
}

// ─── Colour helpers ────────────────────────────────────────────────────────────
const TAG_COLOURS = [
  { bg: "rgba(124,111,247,0.18)", border: "rgba(124,111,247,0.4)", text: "#c4b5fd" },
  { bg: "rgba(34,211,238,0.14)",  border: "rgba(34,211,238,0.35)",  text: "#67e8f9" },
  { bg: "rgba(244,114,182,0.14)", border: "rgba(244,114,182,0.35)", text: "#f9a8d4" },
  { bg: "rgba(74,222,128,0.14)",  border: "rgba(74,222,128,0.35)",  text: "#86efac" },
  { bg: "rgba(251,191,36,0.14)",  border: "rgba(251,191,36,0.35)",  text: "#fde68a" },
];
function tagColour(i: number) { return TAG_COLOURS[i % TAG_COLOURS.length]; }
function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("");
}

// ─── Skill categories (for profile panel) ─────────────────────────────────────
function categoriseSkills(skills: string[]) {
  const LANG  = new Set(["JavaScript","TypeScript","Python","Java","C++","C#","C","Go","Rust","Swift","Kotlin","Ruby","PHP","Scala","R","MATLAB","Dart","Lua","Perl","Bash","Shell"]);
  const FE    = new Set(["React","Next.js","Vue","Vue.js","Angular","Svelte","HTML","HTML5","CSS","CSS3","Sass","SCSS","Tailwind","TailwindCSS","Bootstrap","jQuery","Redux","Zustand","Vite","Webpack","Babel"]);
  const BE    = new Set(["Node.js","Express","FastAPI","Django","Flask","Spring","Spring Boot","Laravel","Rails","NestJS","Hono","Bun","Deno"]);
  const DB    = new Set(["MongoDB","PostgreSQL","MySQL","SQLite","Redis","Firebase","Supabase","DynamoDB","Cassandra","Prisma","Mongoose","SQL","NoSQL"]);
  const CLOUD = new Set(["AWS","GCP","Azure","Docker","Kubernetes","CI/CD","GitHub Actions","Vercel","Netlify","Heroku","Linux","Nginx","Apache","Terraform","Ansible"]);
  const AI    = new Set(["TensorFlow","PyTorch","Keras","scikit-learn","Pandas","NumPy","OpenCV","Hugging Face","LangChain","OpenAI","LLM","NLP","Machine Learning","Deep Learning","Computer Vision"]);
  const cats: Record<string,string[]> = { Languages:[], Frontend:[], Backend:[], Databases:[], "Cloud & DevOps":[], "AI / ML":[], Tools:[] };
  for (const s of skills) {
    if      (LANG.has(s))  cats.Languages.push(s);
    else if (FE.has(s))    cats.Frontend.push(s);
    else if (BE.has(s))    cats.Backend.push(s);
    else if (DB.has(s))    cats.Databases.push(s);
    else if (CLOUD.has(s)) cats["Cloud & DevOps"].push(s);
    else if (AI.has(s))    cats["AI / ML"].push(s);
    else                   cats.Tools.push(s);
  }
  return Object.entries(cats).filter(([,v]) => v.length > 0);
}

// ─── Real Gemini API call ─────────────────────────────────────────────────────
async function callGemini({
  history,
  userMessage,
  jd,
  resumeSkills,
  resumeName,
}: {
  history: { role: "user" | "model"; text: string }[];
  userMessage: string;
  jd: ParsedJobDescription | null;
  resumeSkills: string[];
  resumeName: string;
}): Promise<string> {
  const res = await fetch("/api/interview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ history, userMessage, jd, resumeSkills, resumeName }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `API error ${res.status}`);
  }
  const data = await res.json();
  return data.text as string;
}

// ──────────────────────────────────────────────────────────────────────────────
// LEFT SIDEBAR
// ──────────────────────────────────────────────────────────────────────────────
function LeftSidebar({
  sessions,
  activeId,
  onSelect,
  onNew,
}: {
  sessions: MockSession[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}) {
  return (
    <aside style={{
      width: 260, minWidth: 220, maxWidth: 280,
      background: "rgba(10,10,16,0.95)",
      borderRight: "1px solid var(--border-subtle)",
      display: "flex", flexDirection: "column",
      height: "100vh", position: "sticky", top: 0, flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: "1.25rem 1.25rem 0.75rem", borderBottom: "1px solid var(--border-subtle)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 800, fontSize: "1rem", letterSpacing: "-0.02em" }}>
          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: "7px", background: "linear-gradient(135deg, #7c6ff7, #22d3ee)", fontSize: "0.85rem" }}>📄</span>
          <span style={{ background: "linear-gradient(135deg, #c4b5fd, #67e8f9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>ResumeAI</span>
        </div>
      </div>

      {/* New Mock button */}
      <div style={{ padding: "1rem 1rem 0.5rem" }}>
        <button
          id="new-mock-btn"
          onClick={onNew}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: "0.5rem", padding: "0.65rem 1rem", borderRadius: "10px",
            background: "linear-gradient(135deg, rgba(124,111,247,0.25), rgba(34,211,238,0.12))",
            border: "1px solid rgba(124,111,247,0.35)", color: "#c4b5fd",
            cursor: "pointer", fontSize: "0.875rem", fontWeight: 700, transition: "all 0.2s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "linear-gradient(135deg, rgba(124,111,247,0.4), rgba(34,211,238,0.2))"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 20px rgba(124,111,247,0.2)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "linear-gradient(135deg, rgba(124,111,247,0.25), rgba(34,211,238,0.12))"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "none"; }}
        >
          <span>New mock</span>
          <span style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(124,111,247,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", fontWeight: 900 }}>+</span>
        </button>
      </div>

      {/* Session list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0.5rem 0.75rem" }}>
        {sessions.length === 0 ? (
          <div style={{ padding: "2rem 0.5rem", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem", opacity: 0.4 }}>💬</div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", lineHeight: 1.6 }}>No sessions yet.<br />Start a new mock interview!</p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: "var(--text-muted)", padding: "0.5rem 0.5rem 0.25rem" }}>List of chats</p>
            {sessions.map(s => (
              <button
                key={s.id}
                onClick={() => onSelect(s.id)}
                style={{
                  width: "100%", textAlign: "left", padding: "0.75rem 0.85rem",
                  borderRadius: "10px", border: "1px solid",
                  borderColor: activeId === s.id ? "rgba(124,111,247,0.4)" : "transparent",
                  background: activeId === s.id ? "rgba(124,111,247,0.12)" : "transparent",
                  color: activeId === s.id ? "#c4b5fd" : "var(--text-secondary)",
                  cursor: "pointer", marginBottom: "0.25rem",
                  transition: "all 0.15s", display: "block",
                }}
                onMouseEnter={e => { if (activeId !== s.id) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; }}
                onMouseLeave={e => { if (activeId !== s.id) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
              >
                <div style={{ fontSize: "0.82rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: "0.2rem" }}>
                  {s.role || s.title || "Mock Interview"}
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {s.company ? `@ ${s.company}` : "No JD attached"} · {s.messages.length} msgs
                </div>
              </button>
            ))}
          </>
        )}
      </div>
    </aside>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// JD UPLOAD PANEL (shown at top of center when no JD yet)
// ──────────────────────────────────────────────────────────────────────────────
function JDUploadPanel({ onJD }: { onJD: (jd: ParsedJobDescription, raw: string) => void }) {
  const [tab, setTab] = useState<"paste" | "file">("paste");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setLoading(true);
    try {
      const raw = await extractText(file);
      const jd = parseJobDescription(raw);
      onJD(jd, raw);
    } finally { setLoading(false); }
  }

  function handlePaste() {
    if (!text.trim()) return;
    setLoading(true);
    setTimeout(() => {
      const jd = parseJobDescription(text);
      onJD(jd, text);
      setLoading(false);
    }, 400);
  }

  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(124,111,247,0.08), rgba(34,211,238,0.04))",
      border: "1px solid rgba(124,111,247,0.2)", borderRadius: "1.25rem",
      padding: "1.5rem", marginBottom: "1rem", animation: "fadeInUp 0.5s ease both",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem" }}>
        <span style={{ fontSize: "1.1rem" }}>📋</span>
        <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>Add Job Description</span>
        <span style={{ marginLeft: "auto", fontSize: "0.72rem", color: "var(--text-muted)", background: "rgba(124,111,247,0.1)", border: "1px solid rgba(124,111,247,0.2)", padding: "0.2rem 0.6rem", borderRadius: "100px" }}>Optional — starts the interview in context</span>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.35rem", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-subtle)", borderRadius: "100px", padding: "0.25rem", width: "fit-content", marginBottom: "1rem" }}>
        {(["paste","file"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "0.35rem 1rem", borderRadius: "100px", border: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.78rem", textTransform: "capitalize", transition: "all 0.2s", background: tab === t ? "linear-gradient(135deg, #7c6ff7, #a78bfa)" : "transparent", color: tab === t ? "#fff" : "var(--text-secondary)" }}>
            {t === "paste" ? "✏️ Paste text" : "📎 Upload file"}
          </button>
        ))}
      </div>

      {tab === "paste" ? (
        <div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Paste the job description here…"
            style={{
              width: "100%", minHeight: 100, background: "rgba(255,255,255,0.04)",
              border: "1px solid var(--border-subtle)", borderRadius: "0.75rem",
              color: "var(--text-primary)", padding: "0.85rem 1rem", fontSize: "0.85rem",
              fontFamily: "inherit", resize: "vertical", outline: "none", lineHeight: 1.6,
              transition: "border-color 0.2s",
            }}
            onFocus={e => e.target.style.borderColor = "rgba(124,111,247,0.5)"}
            onBlur={e => e.target.style.borderColor = "var(--border-subtle)"}
          />
          <button
            onClick={handlePaste}
            disabled={!text.trim() || loading}
            style={{
              marginTop: "0.75rem", padding: "0.55rem 1.5rem", borderRadius: "100px",
              background: text.trim() ? "linear-gradient(135deg, #7c6ff7, #a78bfa)" : "rgba(255,255,255,0.05)",
              border: "none", color: text.trim() ? "#fff" : "var(--text-muted)",
              cursor: text.trim() ? "pointer" : "not-allowed", fontWeight: 700, fontSize: "0.85rem",
              transition: "all 0.2s", display: "flex", alignItems: "center", gap: "0.5rem",
            }}
          >
            {loading ? <><span style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin-slow 0.7s linear infinite", display: "inline-block" }} />Parsing…</> : "→ Parse & Start"}
          </button>
        </div>
      ) : (
        <div
          onClick={() => !loading && inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          style={{
            border: `2px dashed ${dragging ? "#7c6ff7" : "rgba(124,111,247,0.25)"}`,
            borderRadius: "0.75rem", padding: "1.75rem 1rem", textAlign: "center",
            cursor: loading ? "default" : "pointer", transition: "all 0.25s",
            background: dragging ? "rgba(124,111,247,0.08)" : "transparent",
          }}
        >
          <input ref={inputRef} type="file" accept=".pdf,.txt,.doc,.docx" style={{ display: "none" }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem" }}>
              <span style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid rgba(124,111,247,0.2)", borderTopColor: "#7c6ff7", animation: "spin-slow 0.8s linear infinite", display: "inline-block" }} />
              <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Parsing JD…</span>
            </div>
          ) : (
            <>
              <div style={{ fontSize: "1.5rem", marginBottom: "0.4rem" }}>📄</div>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>Drop your JD file or <span style={{ color: "#c4b5fd", fontWeight: 600 }}>click to browse</span></p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// JD SUMMARY CHIP (compact header once JD is parsed)
// ──────────────────────────────────────────────────────────────────────────────
function JDChip({ jd, onClear }: { jd: ParsedJobDescription; onClear: () => void }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap",
      background: "rgba(34,211,238,0.07)", border: "1px solid rgba(34,211,238,0.2)",
      borderRadius: "0.85rem", padding: "0.65rem 1rem", marginBottom: "1rem",
      animation: "fadeInUp 0.4s ease both",
    }}>
      <span style={{ fontSize: "1rem" }}>📋</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "#67e8f9" }}>{jd.title || "Role"}</span>
        {jd.company && <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}> @ {jd.company}</span>}
        {jd.experienceRequired && <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}> · {jd.experienceRequired}</span>}
      </div>
      <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
        {jd.skills.slice(0, 4).map((sk, i) => {
          const c = tagColour(i);
          return <span key={sk} style={{ padding: "0.15rem 0.55rem", borderRadius: "100px", background: c.bg, border: `1px solid ${c.border}`, color: c.text, fontSize: "0.7rem", fontWeight: 600 }}>{sk}</span>;
        })}
        {jd.skills.length > 4 && <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>+{jd.skills.length - 4} more</span>}
      </div>
      <button onClick={onClear} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.85rem", padding: "0.25rem", borderRadius: "50%", transition: "color 0.2s" }} onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "#fca5a5"} onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)"} title="Remove JD">✕</button>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// MESSAGE BUBBLE
// ──────────────────────────────────────────────────────────────────────────────
function MessageBubble({ msg }: { msg: Message }) {
  const isAI = msg.role === "ai";
  // Simple markdown bold: **text**
  const formatted = msg.content.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  return (
    <div style={{
      display: "flex", gap: "0.75rem", alignItems: "flex-start",
      flexDirection: isAI ? "row" : "row-reverse",
      animation: "fadeInUp 0.3s ease both", marginBottom: "1rem",
    }}>
      {/* Avatar */}
      <div style={{
        width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
        background: isAI ? "linear-gradient(135deg, #7c6ff7, #22d3ee)" : "linear-gradient(135deg, #f472b6, #a78bfa)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "0.9rem", fontWeight: 800, color: "#fff", boxShadow: isAI ? "0 0 12px rgba(124,111,247,0.3)" : "0 0 12px rgba(244,114,182,0.3)",
      }}>
        {isAI ? "Ai" : "U"}
      </div>
      {/* Bubble */}
      <div style={{
        maxWidth: "75%", padding: "0.875rem 1.1rem", borderRadius: isAI ? "4px 1rem 1rem 1rem" : "1rem 4px 1rem 1rem",
        background: isAI ? "rgba(124,111,247,0.12)" : "rgba(34,211,238,0.08)",
        border: `1px solid ${isAI ? "rgba(124,111,247,0.25)" : "rgba(34,211,238,0.18)"}`,
        fontSize: "0.875rem", lineHeight: 1.7, color: "var(--text-primary)",
      }}>
        <span dangerouslySetInnerHTML={{ __html: formatted }} />
        <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "0.4rem", textAlign: isAI ? "left" : "right" }}>
          {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// CENTER CHAT AREA
// ──────────────────────────────────────────────────────────────────────────────
function CenterChat({
  session,
  onSendMessage,
  onJDParsed,
  onClearJD,
  aiLoading,
}: {
  session: MockSession | null;
  onSendMessage: (text: string) => void;
  onJDParsed: (jd: ParsedJobDescription, raw: string) => void;
  onClearJD: () => void;
  aiLoading: boolean;
}) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.messages, aiLoading]);

  function handleSend() {
    const val = input.trim();
    if (!val || !session || aiLoading) return;
    setInput("");
    onSendMessage(val);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  // Auto-resize textarea
  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 140)}px`;
  }

  if (!session) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem", padding: "2rem" }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, rgba(124,111,247,0.2), rgba(34,211,238,0.1))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.2rem", animation: "float 3s ease-in-out infinite" }}>🎤</div>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 800, background: "linear-gradient(135deg, #c4b5fd, #67e8f9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Start a new mock interview</h2>
        <p style={{ color: "var(--text-muted)", maxWidth: 360, textAlign: "center", lineHeight: 1.7, fontSize: "0.9rem" }}>Click <strong style={{ color: "#c4b5fd" }}>New mock +</strong> in the sidebar to begin. You can optionally add a job description for a targeted session.</p>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", minWidth: 0, overflow: "hidden" }}>
      {/* Chat header */}
      <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border-subtle)", background: "rgba(10,10,16,0.8)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #7c6ff7, #22d3ee)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>🎤</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{session.role || "Mock Interview"}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{session.company ? `@ ${session.company}` : "General interview"} · {session.messages.length} messages</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem", color: "#86efac", background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", padding: "0.3rem 0.75rem", borderRadius: "100px" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block", animation: "pulse-glow 2s ease-in-out infinite" }} />
          AI Interviewer active
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
        {/* JD section */}
        {!session.jd && <JDUploadPanel onJD={onJDParsed} />}
        {session.jd && <JDChip jd={session.jd} onClear={onClearJD} />}

        {session.messages.length === 0 && (
          <div style={{ textAlign: "center", padding: "3rem 1rem", opacity: 0.5 }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>💬</div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>The interview will begin once the AI sends the first question…</p>
          </div>
        )}

        {session.messages.map(m => <MessageBubble key={m.id} msg={m} />)}

        {aiLoading && (
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", animation: "fadeIn 0.3s ease both", marginBottom: "1rem" }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, #7c6ff7, #22d3ee)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", fontWeight: 800, color: "#fff" }}>Ai</div>
            <div style={{ padding: "0.75rem 1rem", borderRadius: "4px 1rem 1rem 1rem", background: "rgba(124,111,247,0.1)", border: "1px solid rgba(124,111,247,0.2)", display: "flex", gap: "0.35rem", alignItems: "center" }}>
              {[0,1,2].map(i => <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#7c6ff7", display: "inline-block", animation: `pulse-glow 1.2s ease-in-out ${i * 0.2}s infinite` }} />)}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div style={{ padding: "1rem 1.25rem", borderTop: "1px solid var(--border-subtle)", background: "rgba(10,10,16,0.9)", backdropFilter: "blur(12px)", flexShrink: 0 }}>
        <div style={{
          display: "flex", alignItems: "flex-end", gap: "0.75rem",
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,111,247,0.25)",
          borderRadius: "1rem", padding: "0.6rem 0.75rem", transition: "border-color 0.2s",
        }}
          onFocusCapture={e => (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(124,111,247,0.5)"}
          onBlurCapture={e => (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(124,111,247,0.25)"}
        >
          {/* Mic icon */}
          <button style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(124,111,247,0.15)", border: "1px solid rgba(124,111,247,0.3)", color: "#c4b5fd", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "0.9rem", flexShrink: 0, transition: "all 0.2s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(124,111,247,0.3)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(124,111,247,0.15)"; }}
            title="Voice input (coming soon)">
            🎤
          </button>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Type your answer… (Enter to send, Shift+Enter for newline)"
            rows={1}
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              color: "var(--text-primary)", fontSize: "0.875rem", fontFamily: "inherit",
              lineHeight: 1.6, resize: "none", maxHeight: 140, overflowY: "auto",
              padding: "0.3rem 0",
            }}
          />
          {/* Send button */}
          <button
            id="send-message-btn"
            onClick={handleSend}
            disabled={!input.trim()}
            style={{
              width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
              background: input.trim() ? "linear-gradient(135deg, #7c6ff7, #22d3ee)" : "rgba(255,255,255,0.05)",
              border: "none", color: input.trim() ? "#fff" : "var(--text-muted)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: input.trim() ? "pointer" : "not-allowed", fontSize: "1rem",
              transition: "all 0.2s", boxShadow: input.trim() ? "0 0 16px rgba(124,111,247,0.4)" : "none",
            }}
          >
            →
          </button>
        </div>
        <p style={{ fontSize: "0.68rem", color: "var(--text-muted)", textAlign: "center", marginTop: "0.5rem" }}>Powered by Gemini 2.5 Flash · Shift+Enter for newline</p>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// RIGHT PROFILE PANEL
// ──────────────────────────────────────────────────────────────────────────────
function RightPanel({
  profile,
  user,
  onSignOut,
  signingOut,
  onUploadResume,
}: {
  profile: ParsedResume | null;
  user: { displayName: string | null; email: string | null; uid: string };
  onSignOut: () => void;
  signingOut: boolean;
  onUploadResume: () => void;
}) {
  const [tab, setTab] = useState<"skills" | "info">("skills");
  const skillCats = profile ? categoriseSkills(profile.skills) : [];
  const name = profile?.name || user.displayName || user.email || "User";

  return (
    <aside style={{
      width: 280, minWidth: 240, maxWidth: 300,
      background: "rgba(10,10,16,0.95)", borderLeft: "1px solid var(--border-subtle)",
      display: "flex", flexDirection: "column", height: "100vh",
      position: "sticky", top: 0, flexShrink: 0, overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{ padding: "1.25rem 1.25rem 0.75rem", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: "var(--text-muted)" }}>Profile</span>
        <button
          id="signout-btn"
          onClick={onSignOut}
          disabled={signingOut}
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-muted)", padding: "0.3rem 0.75rem", borderRadius: "100px", cursor: "pointer", fontSize: "0.72rem", fontWeight: 600, transition: "all 0.2s" }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#fca5a5"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(239,68,68,0.3)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.1)"; }}
        >
          {signingOut ? "…" : "Sign out"}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem" }}>
        {/* Avatar */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.6rem", marginBottom: "1.25rem" }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "linear-gradient(135deg, #7c6ff7, #22d3ee)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.6rem", fontWeight: 800, color: "#fff",
            boxShadow: "0 0 28px rgba(124,111,247,0.4)", animation: "pulse-glow 3s ease-in-out infinite",
          }}>
            {profile ? initials(name) : (user.displayName || user.email || "U")[0].toUpperCase()}
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontWeight: 700, fontSize: "0.95rem", background: "linear-gradient(135deg, #f0f0ff, #c4b5fd)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{name}</div>
            {user.email && <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>{user.email}</div>}
          </div>
          {profile && (
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {[{ label: "Skills", val: profile.skills.length }, { label: "Projects", val: profile.projects.length }].map(s => (
                <div key={s.label} style={{ textAlign: "center", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-subtle)", borderRadius: "0.65rem", padding: "0.4rem 0.75rem" }}>
                  <div style={{ fontSize: "1.1rem", fontWeight: 800, background: "linear-gradient(135deg, #c4b5fd, #67e8f9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{s.val}</div>
                  <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "var(--border-subtle)", margin: "0 0 1.1rem" }} />

        {!profile ? (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", lineHeight: 1.7, marginBottom: "1rem" }}>Upload your resume to see your profile here and get personalised interview questions.</p>
            <button
              onClick={onUploadResume}
              style={{ padding: "0.55rem 1.25rem", borderRadius: "100px", background: "linear-gradient(135deg, rgba(124,111,247,0.3), rgba(34,211,238,0.15))", border: "1px solid rgba(124,111,247,0.4)", color: "#c4b5fd", cursor: "pointer", fontSize: "0.82rem", fontWeight: 700, transition: "all 0.2s" }}
            >
              📤 Upload Resume
            </button>
          </div>
        ) : (
          <>
            {/* Inner tabs */}
            <div style={{ display: "flex", gap: "0.25rem", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-subtle)", borderRadius: "100px", padding: "0.2rem", marginBottom: "1rem" }}>
              {(["skills","info"] as const).map(t => (
                <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "0.4rem 0", borderRadius: "100px", border: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.72rem", transition: "all 0.2s", textTransform: "capitalize", background: tab === t ? "linear-gradient(135deg, #7c6ff7, #a78bfa)" : "transparent", color: tab === t ? "#fff" : "var(--text-secondary)" }}>
                  {t === "skills" ? "⚡ Skills" : "ℹ️ Info"}
                </button>
              ))}
            </div>

            {tab === "skills" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {skillCats.length === 0 ? <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", textAlign: "center" }}>No skills detected yet.</p> : skillCats.map(([cat, skills], ci) => (
                  <div key={cat}>
                    <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.4rem" }}>{cat}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                      {skills.map(sk => { const c = tagColour(ci); return <span key={sk} style={{ padding: "0.2rem 0.55rem", borderRadius: "100px", background: c.bg, border: `1px solid ${c.border}`, color: c.text, fontSize: "0.68rem", fontWeight: 600 }}>{sk}</span>; })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === "info" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                {profile.email && <InfoRow icon="✉️" value={profile.email} />}
                {profile.phone && <InfoRow icon="📱" value={profile.phone} />}
                {profile.location && <InfoRow icon="📍" value={profile.location} />}
                {profile.linkedin && <InfoRow icon="🔗" value="LinkedIn" href={profile.linkedin} />}
                {profile.github && <InfoRow icon="⌨️" value="GitHub" href={profile.github} />}
                {profile.summary && (
                  <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-subtle)", borderRadius: "0.65rem", padding: "0.75rem", fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.7, marginTop: "0.25rem" }}>
                    {profile.summary.slice(0, 220)}{profile.summary.length > 220 ? "…" : ""}
                  </div>
                )}
                <button onClick={onUploadResume} style={{ marginTop: "0.5rem", padding: "0.45rem 1rem", borderRadius: "100px", background: "rgba(124,111,247,0.1)", border: "1px solid rgba(124,111,247,0.25)", color: "#c4b5fd", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600, transition: "all 0.2s" }}>✏️ Update Resume</button>
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}

function InfoRow({ icon, value, href }: { icon: string; value: string; href?: string }) {
  const content = <span style={{ fontSize: "0.78rem", color: href ? "#93c5fd" : "var(--text-secondary)", wordBreak: "break-all" }}>{value}</span>;
  return (
    <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
      <span style={{ fontSize: "0.85rem", flexShrink: 0 }}>{icon}</span>
      {href ? <a href={href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>{content}</a> : content}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// RESUME UPLOAD MODAL
// ──────────────────────────────────────────────────────────────────────────────
function ResumeUploadModal({ onFile, loading, onClose }: { onFile: (f: File) => void; loading: boolean; onClose: () => void }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", animation: "fadeIn 0.2s ease both" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "var(--bg-secondary)", border: "1px solid rgba(124,111,247,0.3)", borderRadius: "1.5rem", padding: "2rem", maxWidth: 480, width: "100%", animation: "fadeInUp 0.3s ease both" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h3 style={{ fontWeight: 800, fontSize: "1.2rem", background: "linear-gradient(135deg, #c4b5fd, #67e8f9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Upload Resume</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.2rem" }}>✕</button>
        </div>
        <div
          onClick={() => !loading && inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
          style={{ border: `2px dashed ${dragging ? "#7c6ff7" : "rgba(124,111,247,0.3)"}`, borderRadius: "1rem", padding: "3rem 1.5rem", textAlign: "center", cursor: loading ? "default" : "pointer", transition: "all 0.25s", background: dragging ? "rgba(124,111,247,0.08)" : "transparent" }}
        >
          <input ref={inputRef} type="file" accept=".pdf,.txt,.doc,.docx" style={{ display: "none" }} onChange={e => e.target.files?.[0] && onFile(e.target.files[0])} id="resume-upload" />
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", border: "3px solid rgba(124,111,247,0.2)", borderTopColor: "#7c6ff7", animation: "spin-slow 0.8s linear infinite" }} />
              <p style={{ color: "var(--text-secondary)" }}>Parsing resume…</p>
            </div>
          ) : (
            <>
              <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem", animation: "float 3s ease-in-out infinite" }}>📄</div>
              <p style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.4rem" }}>Drop your resume here</p>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>or click to browse — PDF, TXT supported</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ──────────────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [appLoading, setAppLoading]             = useState(true);
  const [uploadLoading, setUploadLoading]       = useState(false);
  const [profile, setProfile]                   = useState<ParsedResume | null>(null);
  const [sessions, setSessions]                 = useState<MockSession[]>([]);
  const [activeSessionId, setActiveSessionId]   = useState<string | null>(null);
  const [signingOut, setSigningOut]             = useState(false);
  const [aiLoading, setAiLoading]               = useState(false);
  const [showResumeModal, setShowResumeModal]   = useState(false);

  const activeSession = sessions.find(s => s.id === activeSessionId) ?? null;

  // ─── Firestore save ─────────────────────────────────────────────────────────
  const saveToFirestore = useCallback(async (parsed: ParsedResume) => {
    if (!user) return;
    const docRef = doc(db, "User", user.uid);
    await setDoc(docRef, {
      uid: user.uid, email: user.email, displayName: user.displayName,
      resume: {
        name: parsed.name, email: parsed.email, phone: parsed.phone,
        location: parsed.location, linkedin: parsed.linkedin, github: parsed.github,
        summary: parsed.summary, skills: parsed.skills,
        projects: parsed.projects.map(p => ({ name: p.name, description: p.description, technologies: p.technologies })),
        education: parsed.education,
      },
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }, [user]);

  // ─── Load profile ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/auth?mode=login"); return; }
    async function load() {
      setAppLoading(true);
      try {
        const snap = await getDoc(doc(db, "User", user!.uid));
        if (snap.exists()) {
          const r = snap.data()?.resume;
          if (r) {
            setProfile({ name: r.name ?? "", email: r.email ?? "", phone: r.phone ?? "", location: r.location ?? "", linkedin: r.linkedin ?? "", github: r.github ?? "", summary: r.summary ?? "", rawText: "", skills: r.skills ?? [], projects: r.projects ?? [], education: r.education ?? [] });
          }
        }
      } catch (e) { console.error(e); }
      finally { setAppLoading(false); }
    }
    load();
  }, [user, authLoading, router]);

  // ─── New session ─────────────────────────────────────────────────────────────
  function handleNewSession() {
    const id = `session-${Date.now()}`;
    const session: MockSession = {
      id, title: `Mock #${sessions.length + 1}`, company: "", role: "",
      createdAt: new Date(), messages: [], jd: null,
    };
    setSessions(prev => [session, ...prev]);
    setActiveSessionId(id);
  }

  // ─── JD parsed — kick off first AI message ───────────────────────────────────
  async function handleJDParsed(jd: ParsedJobDescription) {
    if (!activeSessionId) return;
    // Optimistically set JD and show typing
    setSessions(prev => prev.map(s =>
      s.id === activeSessionId ? { ...s, jd, role: jd.title, company: jd.company } : s
    ));
    try {
      const aiText = await callGemini({
        history: [],
        userMessage: "START_INTERVIEW",
        jd,
        resumeSkills: profile?.skills ?? [],
        resumeName: profile?.name ?? "",
      });
      const firstMsg: Message = { id: `msg-${Date.now()}`, role: "ai", content: aiText, timestamp: new Date() };
      setSessions(prev => prev.map(s =>
        s.id === activeSessionId ? { ...s, messages: [firstMsg] } : s
      ));
    } catch (e) {
      console.error("[Gemini first message]:", e);
    }
  }

  // ─── Clear JD ────────────────────────────────────────────────────────────────
  function handleClearJD() {
    if (!activeSessionId) return;
    setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, jd: null, role: "", company: "", messages: [] } : s));
  }

  // ─── Send message → Gemini ────────────────────────────────────────────────────
  async function handleSendMessage(text: string) {
    if (!activeSessionId || aiLoading) return;
    setAiLoading(true);

    // 1. Append user message immediately
    let currentSession: MockSession | undefined;
    setSessions(prev => prev.map(s => {
      if (s.id !== activeSessionId) return s;
      const userMsg: Message = { id: `msg-${Date.now()}-u`, role: "user", content: text, timestamp: new Date() };
      currentSession = { ...s, messages: [...s.messages, userMsg] };
      return currentSession;
    }));

    // 2. Build Gemini history from existing messages (before user's new message)
    const priorMessages = currentSession?.messages ?? [];
    const geminiHistory = priorMessages
      .slice(0, -1) // exclude the just-added user message (it becomes userMessage param)
      .map(m => ({ role: m.role === "ai" ? "model" as const : "user" as const, text: m.content }));

    // 3. Call Gemini
    try {
      const aiText = await callGemini({
        history: geminiHistory,
        userMessage: text,
        jd: currentSession?.jd ?? null,
        resumeSkills: profile?.skills ?? [],
        resumeName: profile?.name ?? "",
      });
      const aiMsg: Message = { id: `msg-${Date.now()}-a`, role: "ai", content: aiText, timestamp: new Date() };
      setSessions(prev => prev.map(s =>
        s.id === activeSessionId ? { ...s, messages: [...s.messages, aiMsg] } : s
      ));
    } catch (e) {
      console.error("[Gemini response]:", e);
      const errMsg: Message = { id: `msg-${Date.now()}-err`, role: "ai", content: "⚠️ Failed to get a response. Please check your API key and try again.", timestamp: new Date() };
      setSessions(prev => prev.map(s =>
        s.id === activeSessionId ? { ...s, messages: [...s.messages, errMsg] } : s
      ));
    } finally {
      setAiLoading(false);
    }
  }

  // ─── Resume upload ────────────────────────────────────────────────────────────
  async function handleResumeFile(file: File) {
    setUploadLoading(true);
    try {
      const text = await extractText(file);
      if (!text || text.trim().length < 30) throw new Error("Could not extract text.");
      const parsed = parseResumeText(text);
      setProfile(parsed);
      await saveToFirestore(parsed);
    } catch (e) { console.error(e); }
    finally { setUploadLoading(false); setShowResumeModal(false); }
  }

  async function handleSignOut() {
    setSigningOut(true);
    await signOut(auth);
    router.push("/");
  }

  if (authLoading || appLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", border: "3px solid rgba(124,111,247,0.2)", borderTopColor: "#7c6ff7", animation: "spin-slow 0.8s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg-primary)", position: "relative" }}>

      {/* Ambient background glow */}
      <div style={{ position: "fixed", top: "20%", left: "50%", transform: "translateX(-50%)", width: "60vw", height: "40vh", background: "radial-gradient(ellipse, rgba(124,111,247,0.05) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      {/* LEFT */}
      <LeftSidebar
        sessions={sessions}
        activeId={activeSessionId}
        onSelect={id => setActiveSessionId(id)}
        onNew={handleNewSession}
      />

      {/* CENTER */}
      <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}>
        <CenterChat
          session={activeSession}
          onSendMessage={handleSendMessage}
          onJDParsed={handleJDParsed}
          onClearJD={handleClearJD}
          aiLoading={aiLoading}
        />
      </main>

      {/* RIGHT */}
      {user && (
        <RightPanel
          profile={profile}
          user={{ displayName: user.displayName, email: user.email, uid: user.uid }}
          onSignOut={handleSignOut}
          signingOut={signingOut}
          onUploadResume={() => setShowResumeModal(true)}
        />
      )}

      {/* Resume upload modal */}
      {showResumeModal && (
        <ResumeUploadModal
          onFile={handleResumeFile}
          loading={uploadLoading}
          onClose={() => setShowResumeModal(false)}
        />
      )}
    </div>
  );
}
