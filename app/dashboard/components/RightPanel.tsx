import React, { useState } from "react";
import { ParsedResume } from "../../lib/resumeParser";
import { categoriseSkills, tagColour, initials } from "../utils";

function InfoRow({ icon, value, href }: { icon: string; value: string; href?: string }) {
  const content = <span style={{ fontSize: "0.78rem", color: href ? "#93c5fd" : "var(--text-secondary)", wordBreak: "break-all" }}>{value}</span>;
  return (
    <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
      <span style={{ fontSize: "0.85rem", flexShrink: 0 }}>{icon}</span>
      {href ? <a href={href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>{content}</a> : content}
    </div>
  );
}

export function RightPanel({
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
