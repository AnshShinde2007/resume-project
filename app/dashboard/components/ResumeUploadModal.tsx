import React, { useState, useRef } from "react";

export function ResumeUploadModal({ onFile, loading, onClose }: { onFile: (f: File) => void; loading: boolean; onClose: () => void }) {
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
          <input ref={inputRef} type="file" accept=".pdf,.txt,.doc,.docx" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) onFile(e.target.files[0]); }} id="resume-upload" />
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
