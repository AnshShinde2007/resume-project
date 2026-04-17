import React, { useState, useRef } from "react";
import { parseJobDescription, ParsedJobDescription } from "../../lib/jobDescriptionParser";
import { extractText } from "../utils";

export function JDUploadPanel({ onJD }: { onJD: (jd: ParsedJobDescription, raw: string) => void }) {
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
          <input ref={inputRef} type="file" accept=".pdf,.txt,.doc,.docx" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
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
