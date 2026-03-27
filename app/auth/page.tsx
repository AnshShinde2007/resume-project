"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  AuthError,
} from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { useAuth } from "../context/AuthContext";

// ─── Auth Form (uses useSearchParams — must be wrapped in Suspense) ────────────
function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const [mode, setMode] = useState<"login" | "signup">(
    params.get("mode") === "signup" ? "signup" : "login"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, authLoading, router]);

  function humaniseError(err: AuthError): string {
    switch (err.code) {
      case "auth/email-already-in-use": return "This email is already registered. Try logging in.";
      case "auth/invalid-email": return "Please enter a valid email address.";
      case "auth/weak-password": return "Password must be at least 6 characters.";
      case "auth/user-not-found": return "No account found with this email.";
      case "auth/wrong-password": return "Incorrect password. Please try again.";
      case "auth/invalid-credential": return "Invalid email or password.";
      case "auth/popup-closed-by-user": return "Google sign-in was cancelled.";
      case "auth/network-request-failed": return "Network error. Check your connection.";
      default: return err.message ?? "Something went wrong. Please try again.";
    }
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push("/dashboard");
    } catch (err) {
      setError(humaniseError(err as AuthError));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      router.push("/dashboard");
    } catch (err) {
      setError(humaniseError(err as AuthError));
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", border: "3px solid rgba(124,111,247,0.2)", borderTopColor: "#7c6ff7", animation: "spin-slow 0.8s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg-primary)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "2rem 1rem", position: "relative", overflow: "hidden",
    }}>
      {/* Ambient blobs */}
      <div style={{ position: "fixed", top: "15%", left: "15%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,111,247,0.08), transparent 65%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: "15%", right: "15%", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(34,211,238,0.07), transparent 65%)", pointerEvents: "none" }} />

      {/* Back to home */}
      <button
        onClick={() => router.push("/")}
        style={{
          position: "fixed", top: "1.25rem", left: "1.5rem", zIndex: 10,
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
          color: "var(--text-secondary)", padding: "0.5rem 1rem",
          borderRadius: "100px", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600,
          display: "flex", alignItems: "center", gap: "0.4rem", transition: "all 0.2s",
          backdropFilter: "blur(12px)",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#c4b5fd"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)"; }}
      >
        ← Back
      </button>

      {/* Card */}
      <div style={{
        width: "100%", maxWidth: 440,
        background: "rgba(16,16,24,0.85)",
        border: "1px solid rgba(124,111,247,0.2)",
        borderRadius: "2rem",
        padding: "2.5rem",
        backdropFilter: "blur(24px)",
        boxShadow: "0 40px 100px rgba(124,111,247,0.1)",
        animation: "fadeInUp 0.5s ease both",
        position: "relative", zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 52, height: 52, borderRadius: "14px",
            background: "linear-gradient(135deg, #7c6ff7, #22d3ee)",
            fontSize: "1.5rem", marginBottom: "1rem",
            boxShadow: "0 0 30px rgba(124,111,247,0.4)",
          }}>📄</div>
          <h1 style={{ fontWeight: 800, fontSize: "1.5rem", letterSpacing: "-0.02em" }}>
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "0.4rem" }}>
            {mode === "login" ? "Sign in to access your profile" : "Start building your AI-powered profile"}
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
            color: "#fca5a5", borderRadius: "0.875rem", padding: "0.75rem 1rem",
            marginBottom: "1.25rem", fontSize: "0.875rem",
            display: "flex", alignItems: "center", gap: "0.5rem",
          }}>
            <span>⚠️</span>
            {error}
            <button onClick={() => setError(null)} style={{ marginLeft: "auto", background: "none", border: "none", color: "#fca5a5", cursor: "pointer" }}>✕</button>
          </div>
        )}

        {/* Google SSO */}
        <button
          id="google-sso-btn"
          onClick={handleGoogle}
          disabled={loading}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem",
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
            color: "var(--text-primary)", padding: "0.875rem",
            borderRadius: "0.875rem", cursor: "pointer", fontSize: "0.95rem", fontWeight: 600,
            transition: "all 0.2s", marginBottom: "1.5rem",
          }}
          onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)"; }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
          <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>or with email</span>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
        </div>

        {/* Email form */}
        <form onSubmit={handleEmailAuth} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Email */}
          <div>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
              Email address
            </label>
            <input
              id="email-input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                width: "100%", padding: "0.8rem 1rem",
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "0.875rem", color: "var(--text-primary)", fontSize: "0.95rem",
                outline: "none", transition: "border-color 0.2s",
              }}
              onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "rgba(124,111,247,0.5)"; }}
              onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.1)"; }}
            />
          </div>

          {/* Password */}
          <div>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="password-input"
                type={showPw ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                style={{
                  width: "100%", padding: "0.8rem 2.8rem 0.8rem 1rem",
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "0.875rem", color: "var(--text-primary)", fontSize: "0.95rem",
                  outline: "none", transition: "border-color 0.2s",
                }}
                onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "rgba(124,111,247,0.5)"; }}
                onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.1)"; }}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                style={{ position: "absolute", right: "0.85rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1rem" }}
              >
                {showPw ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Confirm password (signup only) */}
          {mode === "signup" && (
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
                Confirm password
              </label>
              <input
                id="confirm-password-input"
                type={showPw ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                style={{
                  width: "100%", padding: "0.8rem 1rem",
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "0.875rem", color: "var(--text-primary)", fontSize: "0.95rem",
                  outline: "none", transition: "border-color 0.2s",
                }}
                onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "rgba(124,111,247,0.5)"; }}
                onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.1)"; }}
              />
            </div>
          )}

          {/* Submit */}
          <button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "0.9rem",
              background: loading ? "rgba(124,111,247,0.4)" : "linear-gradient(135deg, #7c6ff7, #a78bfa)",
              border: "none", color: "#fff", borderRadius: "0.875rem",
              cursor: loading ? "not-allowed" : "pointer", fontSize: "1rem", fontWeight: 700,
              boxShadow: "0 4px 20px rgba(124,111,247,0.3)", transition: "all 0.25s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
            }}
            onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 32px rgba(124,111,247,0.5)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px rgba(124,111,247,0.3)"; }}
          >
            {loading ? (
              <>
                <span style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin-slow 0.7s linear infinite", display: "inline-block" }} />
                {mode === "login" ? "Signing in…" : "Creating account…"}
              </>
            ) : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        {/* Toggle mode */}
        <p style={{ textAlign: "center", marginTop: "1.5rem", color: "var(--text-muted)", fontSize: "0.875rem" }}>
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button
            id="toggle-auth-mode-btn"
            onClick={() => { setMode(m => m === "login" ? "signup" : "login"); setError(null); }}
            style={{ background: "none", border: "none", color: "#a78bfa", cursor: "pointer", fontWeight: 700, fontSize: "0.875rem" }}
          >
            {mode === "login" ? "Sign up" : "Log in"}
          </button>
        </p>
      </div>
    </div>
  );
}

// ─── Page export with Suspense boundary ───────────────────────────────────────
export default function AuthPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", border: "3px solid rgba(124,111,247,0.2)", borderTopColor: "#7c6ff7", animation: "spin-slow 0.8s linear infinite" }} />
      </div>
    }>
      <AuthForm />
    </Suspense>
  );
}
