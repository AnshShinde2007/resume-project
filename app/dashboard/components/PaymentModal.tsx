import React from "react";

export function PaymentModal({ onClose }: { onClose: () => void }) {
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
      background: "rgba(10,10,16,0.85)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 2000, padding: "1.5rem",
    }}>
      <div 
        style={{
          width: "100%", maxWidth: 440, background: "rgba(18,18,26,0.95)",
          border: "1px solid rgba(124,111,247,0.3)", borderRadius: "1.5rem",
          padding: "2.5rem 2rem", position: "relative", textAlign: "center",
          boxShadow: "0 24px 60px rgba(0,0,0,0.5), 0 0 40px rgba(124,111,247,0.1)",
          animation: "modalEnter 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
        }}
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          style={{ position: "absolute", top: "1.25rem", right: "1.25rem", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.1rem" }}
        >✕</button>

        <div style={{ width: 64, height: 64, borderRadius: "20px", background: "linear-gradient(135deg, #7c6ff7, #22d3ee)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", margin: "0 auto 1.5rem", boxShadow: "0 8px 16px rgba(124,111,247,0.3)" }}>
          💎
        </div>

        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.75rem", background: "linear-gradient(135deg, #fff, #c4b5fd)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Usage Limit Reached
        </h2>
        
        <p style={{ color: "var(--text-muted)", lineHeight: 1.6, fontSize: "0.95rem", marginBottom: "2rem" }}>
          You've successfully saved 5 interview sessions! To keep saving and access unlimited mock interviews, please upgrade to our Pro plan.
        </p>

        <div style={{ background: "rgba(124,111,247,0.1)", borderRadius: "1rem", padding: "1.25rem", border: "1px solid rgba(124,111,247,0.2)", marginBottom: "2rem", textAlign: "left" }}>
          <p style={{ fontSize: "0.75rem", color: "#c4b5fd", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>Pro Plan Includes:</p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {["Unlimited session saves", "Advanced Gemini 3 Flash models", "Detailed performance reports", "Priority support"].map(item => (
              <li key={item} style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ color: "#4ade80" }}>✓</span> {item}
              </li>
            ))}
          </ul>
        </div>

        <button 
          onClick={() => window.alert("Redirecting to payment checkout…")}
          style={{ width: "100%", padding: "1rem", borderRadius: "100px", background: "linear-gradient(135deg, #7c6ff7, #a78bfa)", border: "none", color: "#fff", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s", boxShadow: "0 8px 16px rgba(124,111,247,0.25)" }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"}
        >
          Upgrade to Pro – $9.99/mo
        </button>
        
        <p style={{ marginTop: "1rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
          No commitment, cancel anytime.
        </p>
      </div>
    </div>
  );
}
