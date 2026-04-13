import React from "react";
import { MockSession } from "../types";

export function LeftSidebar({
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
