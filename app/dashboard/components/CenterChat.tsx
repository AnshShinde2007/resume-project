import React, { useState, useRef, useEffect } from "react";
import { MockSession, Message } from "../types";
import { ParsedJobDescription } from "../../lib/jobDescriptionParser";
import { JDUploadPanel } from "./JDUploadPanel";
import { tagColour } from "../utils";

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

function MessageBubble({ msg }: { msg: Message }) {
  const isAI = msg.role === "ai";
  const formatted = msg.content.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  return (
    <div style={{
      display: "flex", gap: "0.75rem", alignItems: "flex-start",
      flexDirection: isAI ? "row" : "row-reverse",
      animation: "fadeInUp 0.3s ease both", marginBottom: "1rem",
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
        background: isAI ? "linear-gradient(135deg, #7c6ff7, #22d3ee)" : "linear-gradient(135deg, #f472b6, #a78bfa)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "0.9rem", fontWeight: 800, color: "#fff", boxShadow: isAI ? "0 0 12px rgba(124,111,247,0.3)" : "0 0 12px rgba(244,114,182,0.3)",
      }}>
        {isAI ? "Ai" : "U"}
      </div>
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

export function CenterChat({
  session,
  onSendMessage,
  onJDParsed,
  onClearJD,
  aiLoading,
  onSave,
  saving,
  onRename,
}: {
  session: MockSession | null;
  onSendMessage: (text: string) => void;
  onJDParsed: (jd: ParsedJobDescription, raw: string) => void;
  onClearJD: () => void;
  aiLoading: boolean;
  onSave: () => void;
  saving: boolean;
  onRename: (name: string) => void;
}) {

  const [input, setInput] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (session) setEditValue(session.role || "Mock Interview");
  }, [session?.id]);

  function handleSaveRename() {
    setIsEditing(false);
    if (editValue.trim() && editValue !== session?.role) {
      onRename(editValue.trim());
    }
  }

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
      <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border-subtle)", background: "rgba(10,10,16,0.8)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #7c6ff7, #22d3ee)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>🎤</div>
        <div style={{ flex: 1 }}>
          {isEditing ? (
            <input
              autoFocus
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onBlur={handleSaveRename}
              onKeyDown={e => e.key === "Enter" && handleSaveRename()}
              style={{
                background: "rgba(255,255,255,0.05)", border: "1px solid #7c6ff7",
                borderRadius: "4px", color: "#fff", padding: "2px 6px",
                fontSize: "0.95rem", fontWeight: 700, width: "100%", outline: "none"
              }}
            />
          ) : (
            <div 
              onClick={() => setIsEditing(true)}
              style={{ fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}
              title="Click to rename"
            >
              {session.role || "Mock Interview"}
              <span style={{ fontSize: "0.7rem", opacity: 0.4 }}>✎</span>
            </div>
          )}
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{session.company ? `@ ${session.company}` : "General interview"} · {session.messages.length} messages</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            onClick={onSave}
            disabled={saving || session.isSaved || session.messages.length === 0}
            style={{
              padding: "0.4rem 1rem", borderRadius: "100px", border: "1px solid",
              borderColor: session.isSaved ? "rgba(34,211,238,0.3)" : "rgba(124,111,247,0.3)",
              background: session.isSaved ? "rgba(34,211,238,0.08)" : "rgba(124,111,247,0.08)",
              color: session.isSaved ? "#67e8f9" : "#c4b5fd",
              fontSize: "0.75rem", fontWeight: 700, cursor: (saving || session.isSaved || session.messages.length === 0) ? "default" : "pointer",
              transition: "all 0.2s", display: "flex", alignItems: "center", gap: "0.4rem",
            }}
          >
            {saving ? (
              <span style={{ width: 10, height: 10, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "currentColor", animation: "spin-slow 0.6s linear infinite" }} />
            ) : session.isSaved ? "✓ Saved" : "💾 Save session"}
          </button>
          
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem", color: "#86efac", background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", padding: "0.3rem 0.75rem", borderRadius: "100px" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block", animation: "pulse-glow 2s ease-in-out infinite" }} />
            AI Interviewer active
          </div>
        </div>

      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
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

      <div style={{ padding: "1rem 1.25rem", borderTop: "1px solid var(--border-subtle)", background: "rgba(10,10,16,0.9)", backdropFilter: "blur(12px)", flexShrink: 0 }}>
        <div style={{
          display: "flex", alignItems: "flex-end", gap: "0.75rem",
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,111,247,0.25)",
          borderRadius: "1rem", padding: "0.6rem 0.75rem", transition: "border-color 0.2s",
        }}
          onFocusCapture={e => (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(124,111,247,0.5)"}
          onBlurCapture={e => (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(124,111,247,0.25)"}
        >
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
