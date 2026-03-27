"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./context/AuthContext";

// ─── Animated particle canvas ──────────────────────────────────────────────────
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const particles: { x: number; y: number; vx: number; vy: number; r: number; alpha: number }[] = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.5 + 0.1,
      });
    }

    let raf: number;
    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(124,111,247,${p.alpha})`;
        ctx.fill();
      }
      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(124,111,247,${0.08 * (1 - dist / 120)})`;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    }
    draw();

    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.7 }}
    />
  );
}

// ─── Feature Card ──────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, delay }: { icon: string; title: string; desc: string; delay: string }) {
  return (
    <div
      className="feature-card"
      style={{
        background: "rgba(22,22,31,0.8)",
        border: "1px solid rgba(124,111,247,0.15)",
        borderRadius: "1.5rem",
        padding: "2rem",
        backdropFilter: "blur(12px)",
        transition: "all 0.3s ease",
        animation: `fadeInUp 0.7s ease ${delay} both`,
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.border = "1px solid rgba(124,111,247,0.4)";
        (e.currentTarget as HTMLDivElement).style.background = "rgba(124,111,247,0.08)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 20px 60px rgba(124,111,247,0.15)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.border = "1px solid rgba(124,111,247,0.15)";
        (e.currentTarget as HTMLDivElement).style.background = "rgba(22,22,31,0.8)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      <div style={{
        width: 56, height: 56, borderRadius: "1rem",
        background: "linear-gradient(135deg, rgba(124,111,247,0.25), rgba(34,211,238,0.12))",
        border: "1px solid rgba(124,111,247,0.3)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "1.6rem", marginBottom: "1.25rem",
      }}>{icon}</div>
      <h3 style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: "0.6rem", color: "var(--text-primary)" }}>{title}</h3>
      <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.7 }}>{desc}</p>
    </div>
  );
}

// ─── Step Card ────────────────────────────────────────────────────────────────
function StepCard({ num, title, desc, delay }: { num: string; title: string; desc: string; delay: string }) {
  return (
    <div style={{
      display: "flex", gap: "1.5rem", alignItems: "flex-start",
      animation: `fadeInUp 0.7s ease ${delay} both`,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
        background: "linear-gradient(135deg, #7c6ff7, #22d3ee)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 800, fontSize: "1.1rem", color: "#fff",
        boxShadow: "0 0 24px rgba(124,111,247,0.4)",
      }}>{num}</div>
      <div>
        <h3 style={{ fontWeight: 700, marginBottom: "0.4rem", fontSize: "1rem" }}>{title}</h3>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.7 }}>{desc}</p>
      </div>
    </div>
  );
}

// ─── Landing Page ─────────────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%",
          border: "3px solid rgba(124,111,247,0.2)",
          borderTopColor: "#7c6ff7",
          animation: "spin-slow 0.8s linear infinite",
        }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", overflowX: "hidden" }}>
      <ParticleCanvas />

      {/* Ambient blobs */}
      <div style={{ position: "fixed", top: "5%", left: "10%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,111,247,0.07), transparent 65%)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: "10%", right: "5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(34,211,238,0.06), transparent 65%)", pointerEvents: "none", zIndex: 0 }} />

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        padding: "1rem 2rem",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        backdropFilter: "blur(24px)",
        background: "rgba(10,10,15,0.75)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontWeight: 800, fontSize: "1.2rem", letterSpacing: "-0.02em" }}>
          <span style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 34, height: 34, borderRadius: "8px",
            background: "linear-gradient(135deg, #7c6ff7, #22d3ee)", fontSize: "1rem",
          }}>📄</span>
          <span style={{ background: "linear-gradient(135deg, #c4b5fd, #67e8f9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>ResumeAI</span>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button
            id="nav-login-btn"
            onClick={() => router.push("/auth?mode=login")}
            style={{
              background: "transparent", border: "1px solid rgba(124,111,247,0.35)",
              color: "var(--text-secondary)", padding: "0.5rem 1.25rem",
              borderRadius: "100px", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#7c6ff7"; (e.currentTarget as HTMLButtonElement).style.color = "#c4b5fd"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(124,111,247,0.35)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)"; }}
          >
            Log in
          </button>
          <button
            id="nav-signup-btn"
            onClick={() => router.push("/auth?mode=signup")}
            style={{
              background: "linear-gradient(135deg, #7c6ff7, #a78bfa)",
              border: "none", color: "#fff", padding: "0.55rem 1.4rem",
              borderRadius: "100px", cursor: "pointer", fontSize: "0.875rem", fontWeight: 700,
              boxShadow: "0 4px 20px rgba(124,111,247,0.35)", transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 30px rgba(124,111,247,0.5)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px rgba(124,111,247,0.35)"; }}
          >
            Get Started Free
          </button>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "7rem 1.5rem 5rem" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "0.5rem",
          background: "rgba(124,111,247,0.12)", border: "1px solid rgba(124,111,247,0.3)",
          borderRadius: "100px", padding: "0.4rem 1.1rem", marginBottom: "2rem",
          fontSize: "0.82rem", color: "#c4b5fd", letterSpacing: "0.08em", fontWeight: 600,
          animation: "fadeInUp 0.6s ease both",
        }}>
          <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "#a78bfa", animation: "pulse-glow 2s ease-in-out infinite" }} />
          AI-Powered Resume Intelligence
        </div>

        <h1 style={{
          fontSize: "clamp(2.5rem, 6vw, 4.5rem)", fontWeight: 900,
          lineHeight: 1.08, letterSpacing: "-0.04em", marginBottom: "1.5rem",
          background: "linear-gradient(135deg, #f0f0ff 0%, #c4b5fd 45%, #67e8f9 100%)",
          backgroundSize: "200% auto",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          animation: "gradient-shift 5s ease infinite, fadeInUp 0.7s ease 0.1s both",
        }}>
          Turn Your Resume<br />Into a Stunning Profile
        </h1>

        <p style={{
          color: "var(--text-secondary)", fontSize: "clamp(1rem, 2vw, 1.25rem)",
          maxWidth: 560, margin: "0 auto 2.5rem",
          lineHeight: 1.7, animation: "fadeInUp 0.7s ease 0.2s both",
        }}>
          Upload any resume and instantly extract your name, skills, projects, and education — saved securely to your personal profile.
        </p>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap", animation: "fadeInUp 0.7s ease 0.3s both" }}>
          <button
            id="hero-signup-btn"
            onClick={() => router.push("/auth?mode=signup")}
            style={{
              background: "linear-gradient(135deg, #7c6ff7, #a78bfa)",
              border: "none", color: "#fff", padding: "0.9rem 2.2rem",
              borderRadius: "100px", cursor: "pointer", fontSize: "1rem", fontWeight: 700,
              boxShadow: "0 8px 32px rgba(124,111,247,0.4)", transition: "all 0.25s",
              letterSpacing: "-0.01em",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 14px 40px rgba(124,111,247,0.55)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 32px rgba(124,111,247,0.4)"; }}
          >
            Start for Free →
          </button>
          <button
            id="hero-demo-btn"
            onClick={() => router.push("/auth?mode=login")}
            style={{
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
              color: "var(--text-primary)", padding: "0.9rem 2.2rem",
              borderRadius: "100px", cursor: "pointer", fontSize: "1rem", fontWeight: 600,
              transition: "all 0.25s", backdropFilter: "blur(8px)",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.09)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; }}
          >
            Sign in
          </button>
        </div>

        {/* Trust badges */}
        <div style={{ display: "flex", gap: "2rem", justifyContent: "center", marginTop: "3.5rem", flexWrap: "wrap", animation: "fadeInUp 0.7s ease 0.4s both" }}>
          {[["🔒", "End-to-end secure"], ["⚡", "Instant parsing"], ["☁️", "Cloud saved"], ["🆓", "Free to use"]].map(([icon, label]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
              <span>{icon}</span><span>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Mock UI Preview ─────────────────────────────────────────────────── */}
      <section style={{ position: "relative", zIndex: 1, padding: "0 1.5rem 6rem", maxWidth: 800, margin: "0 auto" }}>
        <div style={{
          background: "linear-gradient(135deg, rgba(124,111,247,0.1), rgba(34,211,238,0.05))",
          border: "1px solid rgba(124,111,247,0.2)",
          borderRadius: "2rem",
          padding: "2rem",
          backdropFilter: "blur(20px)",
          boxShadow: "0 40px 100px rgba(124,111,247,0.12)",
          animation: "fadeInUp 0.8s ease 0.4s both",
        }}>
          {/* Fake browser chrome */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
            {["#ff5f56", "#ffbd2e", "#27c93f"].map(c => (
              <div key={c} style={{ width: 12, height: 12, borderRadius: "50%", background: c }} />
            ))}
          </div>
          {/* Mock profile */}
          <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{
              width: 70, height: 70, borderRadius: "50%",
              background: "linear-gradient(135deg, #7c6ff7, #22d3ee)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, fontSize: "1.6rem", color: "#fff",
              boxShadow: "0 0 24px rgba(124,111,247,0.5)",
            }}>AJ</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "1.4rem", background: "linear-gradient(135deg, #f0f0ff, #c4b5fd)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Alex Johnson</div>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "0.25rem" }}>✉️ alex@example.com &nbsp; 📍 San Francisco, CA</div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: "0.75rem" }}>
              {[["24", "Skills"], ["8", "Projects"], ["2", "Degrees"]].map(([val, lbl]) => (
                <div key={lbl} style={{ textAlign: "center", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "0.875rem", padding: "0.6rem 1rem" }}>
                  <div style={{ fontWeight: 800, fontSize: "1.4rem", background: "linear-gradient(135deg, #c4b5fd, #67e8f9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{val}</div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{lbl}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "1.5rem" }}>
            {["React", "TypeScript", "Node.js", "Python", "AWS", "Docker", "PostgreSQL", "Next.js"].map((s, i) => {
              const colors = [
                { bg: "rgba(124,111,247,0.18)", border: "rgba(124,111,247,0.4)", text: "#c4b5fd" },
                { bg: "rgba(34,211,238,0.14)", border: "rgba(34,211,238,0.35)", text: "#67e8f9" },
              ];
              const c = colors[i % 2];
              return <span key={s} style={{ padding: "0.3rem 0.8rem", borderRadius: "100px", background: c.bg, border: `1px solid ${c.border}`, color: c.text, fontSize: "0.8rem", fontWeight: 600 }}>{s}</span>;
            })}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <section style={{ position: "relative", zIndex: 1, padding: "4rem 1.5rem", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "3.5rem", animation: "fadeInUp 0.7s ease both" }}>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#a78bfa", marginBottom: "0.75rem" }}>Features</div>
          <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 800, letterSpacing: "-0.03em" }}>Everything you need,<br />nothing you don&apos;t</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
          <FeatureCard icon="🤖" title="Smart AI Parsing" desc="Extract name, email, phone, location, skills, projects, and education automatically from any PDF or text resume." delay="0.05s" />
          <FeatureCard icon="☁️" title="Cloud Storage" desc="Every parsed resume is saved securely to your personal Firebase account. Access your profile from any device." delay="0.15s" />
          <FeatureCard icon="🔐" title="Secure Auth" desc="Sign in with Google or email. Your data belongs to you — protected with Firebase Authentication." delay="0.25s" />
          <FeatureCard icon="⚡" title="Instant Results" desc="Parsing happens in seconds. No server upload for PDF processing — your file never leaves your browser." delay="0.1s" />
          <FeatureCard icon="🎨" title="Beautiful Profile" desc="Automatically categorised skills, project cards with tech stacks, and a sleek profile card — all generated for you." delay="0.2s" />
          <FeatureCard icon="📱" title="Fully Responsive" desc="Looks great on desktop, tablet, and mobile. Your profile is always accessible wherever you are." delay="0.3s" />
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────────── */}
      <section style={{ position: "relative", zIndex: 1, padding: "4rem 1.5rem 6rem", maxWidth: 680, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "3.5rem", animation: "fadeInUp 0.7s ease both" }}>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#a78bfa", marginBottom: "0.75rem" }}>How it works</div>
          <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 800, letterSpacing: "-0.03em" }}>Three steps to your profile</h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
          <StepCard num="1" title="Create your free account" desc="Sign up with Google or email in seconds. No credit card required." delay="0.05s" />
          <StepCard num="2" title="Upload your resume" desc="Drag & drop your PDF or text resume. Our AI instantly parses every section." delay="0.15s" />
          <StepCard num="3" title="View & save your profile" desc="Your parsed profile is displayed beautifully and saved to your Firebase account automatically." delay="0.25s" />
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section style={{ position: "relative", zIndex: 1, padding: "4rem 1.5rem 8rem", textAlign: "center" }}>
        <div style={{
          maxWidth: 600, margin: "0 auto",
          background: "linear-gradient(135deg, rgba(124,111,247,0.12), rgba(34,211,238,0.06))",
          border: "1px solid rgba(124,111,247,0.25)",
          borderRadius: "2rem", padding: "3.5rem 2rem",
          backdropFilter: "blur(16px)",
          boxShadow: "0 30px 80px rgba(124,111,247,0.12)",
          animation: "fadeInUp 0.7s ease both",
        }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🚀</div>
          <h2 style={{ fontSize: "clamp(1.6rem, 4vw, 2.2rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "1rem" }}>
            Ready to build your profile?
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "2rem", lineHeight: 1.7 }}>
            Join thousands of professionals who use ResumeAI to stand out.
          </p>
          <button
            id="cta-signup-btn"
            onClick={() => router.push("/auth?mode=signup")}
            style={{
              background: "linear-gradient(135deg, #7c6ff7, #a78bfa)",
              border: "none", color: "#fff", padding: "1rem 2.5rem",
              borderRadius: "100px", cursor: "pointer", fontSize: "1.05rem", fontWeight: 700,
              boxShadow: "0 8px 32px rgba(124,111,247,0.4)", transition: "all 0.25s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 14px 40px rgba(124,111,247,0.55)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 32px rgba(124,111,247,0.4)"; }}
          >
            Get Started — It&apos;s Free
          </button>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer style={{
        position: "relative", zIndex: 1,
        textAlign: "center", padding: "2rem",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        color: "var(--text-muted)", fontSize: "0.8rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem", fontWeight: 800, fontSize: "1rem", marginBottom: "0.75rem" }}>
          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: "7px", background: "linear-gradient(135deg, #7c6ff7, #22d3ee)", fontSize: "0.85rem" }}>📄</span>
          <span style={{ background: "linear-gradient(135deg, #c4b5fd, #67e8f9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>ResumeAI</span>
        </div>
        <p>Built with ✨ · Your data is private and secured by Firebase</p>
      </footer>
    </div>
  );
}
