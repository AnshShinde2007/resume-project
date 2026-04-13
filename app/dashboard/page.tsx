"use client";
import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp, collection, addDoc, updateDoc, increment } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { parseResumeText, ParsedResume } from "../lib/resumeParser";
import { ParsedJobDescription } from "../lib/jobDescriptionParser";

import { MockSession, Message } from "./types";
import { extractText, callGemini } from "./utils";

import { LeftSidebar } from "./components/LeftSidebar";
import { CenterChat } from "./components/CenterChat";
import { RightPanel } from "./components/RightPanel";
import { ResumeUploadModal } from "./components/ResumeUploadModal";
import { PaymentModal } from "./components/PaymentModal";

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
  const [saveCount, setSaveCount]               = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [savingSession, setSavingSession]       = useState(false);

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
        summary: parsed.summary, experience: parsed.experience, skills: parsed.skills,
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
            setProfile({ name: r.name ?? "", email: r.email ?? "", phone: r.phone ?? "", location: r.location ?? "", linkedin: r.linkedin ?? "", github: r.github ?? "", summary: r.summary ?? "", experience: r.experience ?? "", rawText: "", skills: r.skills ?? [], projects: r.projects ?? [], education: r.education ?? [] });
          }
          setSaveCount(snap.data()?.saveCount ?? 0);
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
  const getDifficulty = (jd: any) => {
    if (!jd) return "General";
    const t = (jd.title || "").toLowerCase();
    if (t.includes("intern")) return "Intern (Focus on basics & potential)";
    if (t.includes("junior")) return "Junior (Entry-level fundamentals)";
    if (t.includes("senior") || t.includes("lead") || t.includes("staff")) return "Senior (In-depth system design & architecture)";
    return "Mid-level";
  };

  async function handleJDParsed(jd: ParsedJobDescription) {
    if (!activeSessionId) return;

    // Use a fallback for role if title is missing
    const finalRole = jd.title || "Job Interview";
    const finalCompany = jd.company || "";

    setSessions(prev => prev.map(s =>
      s.id === activeSessionId ? { ...s, jd, role: finalRole, company: finalCompany } : s
    ));

    try {
      const aiText = await callGemini({
        history: [],
        userMessage: "START_INTERVIEW",
        jd,
        resumeSkills: profile?.skills ?? [],
        resumeProjects: profile?.projects ?? [],
        resumeEducation: profile?.education ?? [],
        resumeExperience: profile?.experience ?? "",
        resumeName: profile?.name ?? "",
        difficulty: getDifficulty(jd),
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

    let currentSession: MockSession | undefined;
    setSessions(prev => prev.map(s => {
      if (s.id !== activeSessionId) return s;
      const userMsg: Message = { id: `msg-${Date.now()}-u`, role: "user", content: text, timestamp: new Date() };
      currentSession = { ...s, messages: [...s.messages, userMsg] };
      return currentSession;
    }));

    const priorMessages = currentSession?.messages ?? [];
    const geminiHistory = priorMessages
      .slice(0, -1)
      .map(m => ({ role: m.role === "ai" ? "model" as const : "user" as const, text: m.content }));

    try {
      const aiText = await callGemini({
        history: geminiHistory,
        userMessage: text,
        jd: currentSession?.jd ?? null,
        resumeSkills: profile?.skills ?? [],
        resumeProjects: profile?.projects ?? [],
        resumeEducation: profile?.education ?? [],
        resumeExperience: profile?.experience ?? "",
        resumeName: profile?.name ?? "",
        difficulty: getDifficulty(currentSession?.jd ?? null),
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

  async function handleSaveSession() {
    if (!user || !activeSession || savingSession) return;
    if (activeSession.isSaved) return;

    if (saveCount >= 5) {
      setShowPaymentModal(true);
      return;
    }

    setSavingSession(true);
    try {
      const sessRef = collection(db, "User", user.uid, "Sessions");
      await addDoc(sessRef, {
        ...activeSession,
        createdAt: serverTimestamp(),
        savedAt: serverTimestamp(),
        messages: activeSession.messages.map(m => ({
          ...m,
          timestamp: m.timestamp instanceof Date ? m.timestamp : new Date(m.timestamp)
        })),
      });

      const userRef = doc(db, "User", user.uid);
      await updateDoc(userRef, {
        saveCount: increment(1)
      });

      setSaveCount(prev => prev + 1);
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, isSaved: true } : s));
    } catch (e) {
      console.error("[Save Session]:", e);
    } finally {
      setSavingSession(false);
    }
  }

  function handleRenameSession(newName: string) {
    if (!activeSessionId) return;
    setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, role: newName } : s));
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
      <div style={{ position: "fixed", top: "20%", left: "50%", transform: "translateX(-50%)", width: "60vw", height: "40vh", background: "radial-gradient(ellipse, rgba(124,111,247,0.05) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
      <LeftSidebar
        sessions={sessions}
        activeId={activeSessionId}
        onSelect={id => setActiveSessionId(id)}
        onNew={handleNewSession}
      />
      <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}>
        <CenterChat
          session={activeSession}
          onSendMessage={handleSendMessage}
          onJDParsed={handleJDParsed}
          onClearJD={handleClearJD}
          aiLoading={aiLoading}
          onSave={handleSaveSession}
          saving={savingSession}
          onRename={handleRenameSession}
        />
      </main>
      {user && (
        <RightPanel
          profile={profile}
          user={{ displayName: user.displayName, email: user.email, uid: user.uid }}
          onSignOut={handleSignOut}
          signingOut={signingOut}
          onUploadResume={() => setShowResumeModal(true)}
        />
      )}
      {showResumeModal && (
        <ResumeUploadModal
          onFile={handleResumeFile}
          loading={uploadLoading}
          onClose={() => setShowResumeModal(false)}
        />
      )}
      {showPaymentModal && (
        <PaymentModal
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
}
