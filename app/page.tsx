"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./context/AuthContext";

export default function LandingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) return <div style={{ background: "#05050A", height: "100vh" }} />;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;700;800;900&display=swap');
        
        .glass-bg {
          background-color: #05050A;
          color: #FFFFFF;
          font-family: 'Outfit', sans-serif;
          min-height: 100vh;
          overflow-x: hidden;
          position: relative;
        }

        /* Abstract glowing orbs */
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.5;
          z-index: 0;
          animation: float 20s infinite ease-in-out alternate;
        }

        .orb-1 {
          width: 600px;
          height: 600px;
          background: linear-gradient(135deg, #7C6FF7, #FF2E93);
          top: -10%;
          left: -10%;
        }

        .orb-2 {
          width: 500px;
          height: 500px;
          background: linear-gradient(135deg, #22D3EE, #7C6FF7);
          bottom: 20%;
          right: -5%;
          animation-delay: -5s;
        }

        .orb-3 {
          width: 400px;
          height: 400px;
          background: linear-gradient(135deg, #FF9A9E, #FECFEF);
          top: 40%;
          left: 30%;
          opacity: 0.3;
          animation-delay: -10s;
        }

        @keyframes float {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(50px, 50px) scale(1.1); }
        }

        .glass-container {
          position: relative;
          z-index: 1;
          max-width: 1400px;
          margin: 0 auto;
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-top: 1px solid rgba(255, 255, 255, 0.2);
          border-left: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
          border-radius: 32px;
          padding: 3rem;
          transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
        }

        .glass-card:hover {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 40px 80px rgba(124, 111, 247, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2);
          transform: translateY(-5px);
        }

        .hero-title {
          font-size: clamp(3.5rem, 8vw, 6.5rem);
          font-weight: 800;
          line-height: 1.05;
          letter-spacing: -0.04em;
          margin-bottom: 1.5rem;
          background: linear-gradient(to right, #FFFFFF, #A5A5A5);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-subtitle {
          font-size: clamp(1.1rem, 2vw, 1.3rem);
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.6;
          max-width: 600px;
          margin-bottom: 3rem;
          font-weight: 300;
        }

        .glass-btn {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 100px;
          color: #FFF;
          font-family: 'Outfit', sans-serif;
          font-size: 1.1rem;
          font-weight: 600;
          padding: 1.2rem 2.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.8rem;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }

        .glass-btn-primary {
          background: linear-gradient(135deg, rgba(124, 111, 247, 0.8), rgba(255, 46, 147, 0.8));
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 10px 30px rgba(124, 111, 247, 0.3), inset 0 1px 0 rgba(255,255,255,0.4);
        }

        .glass-btn:hover {
          transform: translateY(-3px) scale(1.02);
          background: rgba(255, 255, 255, 0.15);
        }

        .glass-btn-primary:hover {
          background: linear-gradient(135deg, rgba(124, 111, 247, 1), rgba(255, 46, 147, 1));
          box-shadow: 0 15px 40px rgba(124, 111, 247, 0.5), inset 0 1px 0 rgba(255,255,255,0.5);
        }

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 2rem;
          margin-top: 5rem;
        }

        .icon-box {
          width: 60px;
          height: 60px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justifyContent: center;
          font-size: 1.8rem;
          margin-bottom: 1.5rem;
          box-shadow: inset 0 2px 20px rgba(255,255,255,0.05);
        }

        .text-gradient {
          background: linear-gradient(135deg, #7C6FF7, #22D3EE);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        /* Mockup Window */
        .glass-mockup {
          position: absolute;
          right: -10%;
          top: 15%;
          width: 700px;
          height: 500px;
          background: rgba(20, 20, 25, 0.6);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          box-shadow: 0 40px 100px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05);
          transform: perspective(1000px) rotateY(-15deg) rotateX(5deg);
          overflow: hidden;
          display: none;
        }

        .mockup-header {
          height: 40px;
          background: rgba(255, 255, 255, 0.05);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          padding: 0 1rem;
          gap: 0.5rem;
        }

        .dot { width: 12px; height: 12px; border-radius: 50%; }
        .dot-r { background: #FF5F56; }
        .dot-y { background: #FFBD2E; }
        .dot-g { background: #27C93F; }

        @media (min-width: 1024px) {
          .glass-mockup { display: block; }
          .hero-content { max-width: 60%; }
        }
      `}</style>

      <div className="glass-bg">
        {/* Background Orbs */}
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />

        {/* Navigation */}
        <nav style={{ position: "relative", zIndex: 10, padding: "2rem 4vw", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.03em", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #7C6FF7, #22D3EE)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "1.2rem" }}>📄</span>
            </div>
            Resume<span className="text-gradient">AI</span>
          </div>
          <div style={{ display: "flex", gap: "1rem" }}>
            <button className="glass-btn" style={{ padding: "0.6rem 1.5rem", fontSize: "0.95rem" }} onClick={() => router.push("/auth?mode=login")}>Sign In</button>
            <button className="glass-btn glass-btn-primary" style={{ padding: "0.6rem 1.5rem", fontSize: "0.95rem" }} onClick={() => router.push("/auth?mode=signup")}>Start Free</button>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="glass-container" style={{ padding: "4rem 4vw", position: "relative", minHeight: "80vh", display: "flex", alignItems: "center" }}>
          
          <div className="hero-content" style={{ position: "relative", zIndex: 10 }}>
            <div style={{ 
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "100px", padding: "0.4rem 1.2rem", marginBottom: "2rem",
              fontSize: "0.85rem", fontWeight: 600, backdropFilter: "blur(10px)"
            }}>
              <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#22D3EE", boxShadow: "0 0 10px #22D3EE" }} />
              Premium AI Interview Simulation
            </div>

            <h1 className="hero-title">
              Master the<br/>
              Technical<br/>
              <span className="text-gradient">Interview.</span>
            </h1>

            <p className="hero-subtitle">
              Upload your resume and the target job description. Face a relentless, context-aware AI that parses your experience and interrogates your weaknesses with realistic system design scenarios.
            </p>

            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <button className="glass-btn glass-btn-primary" onClick={() => router.push("/auth?mode=signup")}>
                Begin Simulation
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
              </button>
              <button className="glass-btn" onClick={() => router.push("/auth?mode=login")}>
                View Dashboard
              </button>
            </div>
          </div>

          {/* Abstract Glass Mockup */}
          <div className="glass-mockup">
            <div className="mockup-header">
              <div className="dot dot-r"></div>
              <div className="dot dot-y"></div>
              <div className="dot dot-g"></div>
            </div>
            <div style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
                <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, #7C6FF7, #FF2E93)", padding: 3 }}>
                  <div style={{ width: "100%", height: "100%", background: "#1A1A24", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", fontWeight: 800 }}>AJ</div>
                </div>
                <div>
                  <div style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: "0.25rem" }}>Alex Johnson</div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.9rem" }}>Senior Full Stack Engineer</div>
                </div>
              </div>
              
              <div style={{ display: "flex", gap: "1rem" }}>
                {[ {l: "Skills", v: "24"}, {l: "Projects", v: "8"}, {l: "Simulations", v: "12"} ].map(item => (
                  <div key={item.l} style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, padding: "1.2rem", textAlign: "center" }}>
                    <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#22D3EE", marginBottom: "0.2rem" }}>{item.v}</div>
                    <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{item.l}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: "rgba(124, 111, 247, 0.1)", border: "1px solid rgba(124, 111, 247, 0.2)", borderRadius: 16, padding: "1.5rem", marginTop: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "1rem" }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22D3EE", boxShadow: "0 0 10px #22D3EE" }} />
                  <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "#22D3EE" }}>AI Interrogation Active</span>
                </div>
                <div style={{ fontSize: "0.95rem", color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>
                  "I see you used Next.js and Redis on your E-commerce project. Explain how you handled cache invalidation when product inventory changed rapidly during a flash sale."
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Features Section */}
        <div className="glass-container" style={{ padding: "4rem 4vw 8rem" }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, marginBottom: "1rem" }}>Designed for Excellence</h2>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "1.1rem", maxWidth: 600, margin: "0 auto" }}>Everything you need to prepare for high-stakes technical interviews.</p>
          </div>

          <div className="feature-grid">
            <div className="glass-card">
              <div className="icon-box">📄</div>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "1rem" }}>Intelligent Parsing</h3>
              <p style={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
                Upload any PDF. Our engine extracts your skills, dissects project architecture, and builds your profile instantly.
              </p>
            </div>
            
            <div className="glass-card">
              <div className="icon-box">🎯</div>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "1rem" }}>Context-Aware</h3>
              <p style={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
                We consume the target Job Description to separate mandatory skills from nice-to-haves and adjust the difficulty dynamically.
              </p>
            </div>
            
            <div className="glass-card">
              <div className="icon-box">⚡</div>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "1rem" }}>Dynamic Scaling</h3>
              <p style={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
                A sequential gauntlet. Weak answers invite painful probing. Strong answers immediately escalate the system design complexity.
              </p>
            </div>
          </div>
        </div>

        <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "2rem 4vw", textAlign: "center", position: "relative", zIndex: 10 }}>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>© 2026 ResumeAI. Powered by Gemini & Firebase.</p>
        </footer>

      </div>
    </>
  );
}
