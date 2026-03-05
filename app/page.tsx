"use client";
import { useState, useCallback, useRef } from "react";
import { parseResumeText, ParsedResume } from "./lib/resumeParser";

// ─── PDF.js lazy load helper ──────────────────────────────────────────────────
async function extractTextFromPDF(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  // Worker must be set before use
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const textParts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: unknown) => {
        const i = item as { str?: string };
        return i.str ?? "";
      })
      .join(" ");
    textParts.push(pageText);
  }

  return textParts.join("\n");
}

async function extractText(file: File): Promise<string> {
  if (file.type === "application/pdf") {
    return extractTextFromPDF(file);
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

// ─── Colour helpers ──────────────────────────────────────────────────────────
const TAG_COLOURS = [
  { bg: "rgba(124,111,247,0.18)", border: "rgba(124,111,247,0.4)", text: "#c4b5fd" },
  { bg: "rgba(34,211,238,0.14)", border: "rgba(34,211,238,0.35)", text: "#67e8f9" },
  { bg: "rgba(244,114,182,0.14)", border: "rgba(244,114,182,0.35)", text: "#f9a8d4" },
  { bg: "rgba(74,222,128,0.14)", border: "rgba(74,222,128,0.35)", text: "#86efac" },
  { bg: "rgba(251,191,36,0.14)", border: "rgba(251,191,36,0.35)", text: "#fde68a" },
];

function tagColour(idx: number) {
  return TAG_COLOURS[idx % TAG_COLOURS.length];
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

// ─── Skill Category Detection ─────────────────────────────────────────────────
function categoriseSkills(skills: string[]) {
  const categories: Record<string, string[]> = {
    "Languages": [],
    "Frontend": [],
    "Backend": [],
    "Databases": [],
    "Cloud & DevOps": [],
    "AI / ML": [],
    "Tools": [],
  };
  const LANG = new Set(["JavaScript","TypeScript","Python","Java","C++","C#","C","Go","Rust","Swift","Kotlin","Ruby","PHP","Scala","R","MATLAB","Dart","Lua","Perl","Bash","Shell"]);
  const FE = new Set(["React","Next.js","Vue","Vue.js","Angular","Svelte","HTML","HTML5","CSS","CSS3","Sass","SCSS","Tailwind","TailwindCSS","Bootstrap","jQuery","Redux","Zustand","Vite","Webpack","Babel"]);
  const BE = new Set(["Node.js","Express","FastAPI","Django","Flask","Spring","Spring Boot","Laravel","Rails","NestJS","Hono","Bun","Deno"]);
  const DB = new Set(["MongoDB","PostgreSQL","MySQL","SQLite","Redis","Firebase","Supabase","DynamoDB","Cassandra","Prisma","Mongoose","SQL","NoSQL"]);
  const CLOUD = new Set(["AWS","GCP","Azure","Docker","Kubernetes","CI/CD","GitHub Actions","Vercel","Netlify","Heroku","Linux","Nginx","Apache","Terraform","Ansible"]);
  const AI = new Set(["TensorFlow","PyTorch","Keras","scikit-learn","Pandas","NumPy","OpenCV","Hugging Face","LangChain","OpenAI","LLM","NLP","Machine Learning","Deep Learning","Computer Vision"]);

  for (const skill of skills) {
    if (LANG.has(skill)) categories["Languages"].push(skill);
    else if (FE.has(skill)) categories["Frontend"].push(skill);
    else if (BE.has(skill)) categories["Backend"].push(skill);
    else if (DB.has(skill)) categories["Databases"].push(skill);
    else if (CLOUD.has(skill)) categories["Cloud & DevOps"].push(skill);
    else if (AI.has(skill)) categories["AI / ML"].push(skill);
    else categories["Tools"].push(skill);
  }

  return Object.entries(categories).filter(([, v]) => v.length > 0);
}

// ─── Components ───────────────────────────────────────────────────────────────

function UploadZone({ onFile, loading }: { onFile: (f: File) => void; loading: boolean }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) onFile(file);
    },
    [onFile]
  );

  return (
    <div style={{ animation: "fadeInUp 0.6s ease both" }}>
      {/* Hero text */}
      <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "0.5rem",
          background: "rgba(124,111,247,0.12)", border: "1px solid rgba(124,111,247,0.3)",
          borderRadius: "100px", padding: "0.35rem 1rem", marginBottom: "1.5rem",
          fontSize: "0.8rem", color: "#c4b5fd", letterSpacing: "0.08em", fontWeight: 500,
        }}>
          <span style={{ display:"inline-block", width:6, height:6, borderRadius:"50%", background:"#a78bfa", animation:"pulse-glow 2s ease-in-out infinite" }} />
          AI-Powered Resume Parser
        </div>
        <h1 style={{
          fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 800,
          lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: "1rem",
          background: "linear-gradient(135deg, #f0f0ff 0%, #c4b5fd 50%, #67e8f9 100%)",
          backgroundSize: "200% auto",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          animation: "gradient-shift 4s ease infinite",
        }}>
          Turn Your Resume Into<br/>A Stunning Profile
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", maxWidth: 480, margin: "0 auto" }}>
          Upload your PDF or text resume and we'll instantly extract your name, skills, and projects into a beautiful profile card.
        </p>
      </div>

      {/* Upload zone */}
      <div
        onClick={() => !loading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragging ? "#7c6ff7" : "rgba(124,111,247,0.3)"}`,
          borderRadius: "1.5rem",
          background: dragging ? "rgba(124,111,247,0.1)" : "rgba(16,16,30,0.6)",
          padding: "3.5rem 2rem",
          textAlign: "center",
          cursor: loading ? "default" : "pointer",
          transition: "all 0.3s ease",
          backdropFilter: "blur(12px)",
          boxShadow: dragging ? "0 0 50px rgba(124,111,247,0.2)" : "none",
          maxWidth: 580,
          margin: "0 auto",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt,.doc,.docx"
          style={{ display: "none" }}
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
          id="resume-upload"
        />

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem" }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              border: "3px solid rgba(124,111,247,0.2)",
              borderTopColor: "#7c6ff7",
              animation: "spin-slow 0.8s linear infinite",
            }} />
            <p style={{ color: "var(--text-secondary)", fontWeight: 500 }}>Parsing your resume…</p>
          </div>
        ) : (
          <>
            <div style={{
              width: 80, height: 80, borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(124,111,247,0.2), rgba(34,211,238,0.1))",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 1.5rem",
              animation: "float 3s ease-in-out infinite",
              fontSize: "2rem",
            }}>
              📄
            </div>
            <p style={{ fontWeight: 700, fontSize: "1.15rem", color: "var(--text-primary)", marginBottom: "0.5rem" }}>
              Drop your resume here
            </p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
              or click to browse — PDF, TXT supported
            </p>
            <div style={{
              display: "inline-flex", gap: "0.5rem",
            }}>
              {["PDF", "TXT", "DOC"].map((ext) => (
                <span key={ext} style={{
                  padding: "0.25rem 0.75rem",
                  borderRadius: "100px",
                  background: "rgba(124,111,247,0.12)",
                  border: "1px solid rgba(124,111,247,0.25)",
                  fontSize: "0.75rem", color: "#c4b5fd", fontWeight: 600,
                }}>
                  {ext}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Features */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: "1rem", marginTop: "3rem", maxWidth: 580, margin: "3rem auto 0",
      }}>
        {[
          { icon: "👤", label: "Name & Contact", desc: "Automatically detected" },
          { icon: "⚡", label: "Skills", desc: "100+ technologies" },
          { icon: "🚀", label: "Projects", desc: "With tech stack" },
        ].map((f, i) => (
          <div key={i} style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "1rem", padding: "1.25rem",
            textAlign: "center",
            animation: `fadeInUp 0.6s ease ${0.1 * i}s both`,
          }}>
            <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{f.icon}</div>
            <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.25rem" }}>{f.label}</div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileView({ data, onReset }: { data: ParsedResume; onReset: () => void }) {
  const skillCategories = categoriseSkills(data.skills);
  const [activeTab, setActiveTab] = useState<"skills" | "projects" | "education">("skills");

  return (
    <div style={{ animation: "fadeIn 0.5s ease both" }}>
      {/* Back button */}
      <button
        onClick={onReset}
        style={{
          display: "inline-flex", alignItems: "center", gap: "0.5rem",
          background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-subtle)",
          color: "var(--text-secondary)", padding: "0.5rem 1.1rem",
          borderRadius: "100px", cursor: "pointer", marginBottom: "2rem",
          fontSize: "0.875rem", fontWeight: 500, transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(124,111,247,0.15)";
          (e.currentTarget as HTMLButtonElement).style.color = "#c4b5fd";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)";
          (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
        }}
      >
        ← Parse another resume
      </button>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}>

        {/* ── Hero card ─────────────────────────────────────────────────────── */}
        <div style={{
          background: "linear-gradient(135deg, rgba(124,111,247,0.12) 0%, rgba(34,211,238,0.06) 100%)",
          border: "1px solid rgba(124,111,247,0.25)",
          borderRadius: "1.5rem",
          padding: "2rem",
          position: "relative",
          overflow: "hidden",
          animation: "fadeInUp 0.5s ease both",
        }}>
          {/* Decorative blobs */}
          <div style={{
            position: "absolute", top: -60, right: -60, width: 220, height: 220,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(124,111,247,0.15), transparent 70%)",
            pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", bottom: -40, left: -40, width: 160, height: 160,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(34,211,238,0.12), transparent 70%)",
            pointerEvents: "none",
          }} />

          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap", position: "relative" }}>
            {/* Avatar */}
            <div style={{
              width: 80, height: 80, borderRadius: "50%", flexShrink: 0,
              background: "linear-gradient(135deg, #7c6ff7, #22d3ee)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.8rem", fontWeight: 800, color: "#fff",
              boxShadow: "0 0 30px rgba(124,111,247,0.4)",
              animation: "pulse-glow 3s ease-in-out infinite",
            }}>
              {initials(data.name) || "?"}
            </div>

            <div style={{ flex: 1, minWidth: 200 }}>
              <h2 style={{
                fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 800,
                letterSpacing: "-0.02em", marginBottom: "0.4rem",
                background: "linear-gradient(135deg, #f0f0ff, #c4b5fd)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                {data.name || "Unknown Name"}
              </h2>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                {data.email && (
                  <a href={`mailto:${data.email}`} style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.875rem" }}>
                    <span>✉️</span> {data.email}
                  </a>
                )}
                {data.phone && (
                  <span style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                    <span>📱</span> {data.phone}
                  </span>
                )}
                {data.location && (
                  <span style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                    <span>📍</span> {data.location}
                  </span>
                )}
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.75rem" }}>
                {data.linkedin && (
                  <a href={data.linkedin} target="_blank" rel="noopener noreferrer" style={{
                    display: "inline-flex", alignItems: "center", gap: "0.4rem",
                    background: "rgba(10,102,194,0.2)", border: "1px solid rgba(10,102,194,0.35)",
                    color: "#93c5fd", padding: "0.3rem 0.85rem", borderRadius: "100px",
                    textDecoration: "none", fontSize: "0.8rem", fontWeight: 600,
                    transition: "all 0.2s",
                  }}>
                    in LinkedIn
                  </a>
                )}
                {data.github && (
                  <a href={data.github} target="_blank" rel="noopener noreferrer" style={{
                    display: "inline-flex", alignItems: "center", gap: "0.4rem",
                    background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
                    color: "var(--text-primary)", padding: "0.3rem 0.85rem", borderRadius: "100px",
                    textDecoration: "none", fontSize: "0.8rem", fontWeight: 600,
                    transition: "all 0.2s",
                  }}>
                    ⌨️ GitHub
                  </a>
                )}
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              {[
                { label: "Skills",    value: data.skills.length },
                { label: "Projects",  value: data.projects.length },
                { label: "Education", value: data.education.length },
              ].map((s, i) => (
                <div key={i} style={{
                  textAlign: "center",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "1rem", padding: "0.75rem 1.25rem",
                  minWidth: 80,
                }}>
                  <div style={{
                    fontSize: "1.75rem", fontWeight: 800,
                    background: "linear-gradient(135deg, #c4b5fd, #67e8f9)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}>{s.value}</div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          {data.summary && (
            <div style={{
              marginTop: "1.5rem",
              padding: "1rem 1.25rem",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "1rem",
              color: "var(--text-secondary)",
              fontSize: "0.9rem",
              lineHeight: 1.7,
              position: "relative",
            }}>
              <span style={{ fontSize: "1.4rem", lineHeight: 1, position: "absolute", top: "0.6rem", left: "0.75rem", opacity: 0.3 }}>&ldquo;</span>
              <p style={{ paddingLeft: "1.25rem" }}>{data.summary}</p>
            </div>
          )}
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────────── */}
        <div style={{
          display: "flex", gap: "0.5rem",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "100px",
          padding: "0.35rem",
          width: "fit-content",
          animation: "fadeInUp 0.55s ease 0.1s both",
        }}>
          {(["skills", "projects", "education"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "0.5rem 1.5rem",
                borderRadius: "100px",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.9rem",
                textTransform: "capitalize",
                transition: "all 0.25s",
                background: activeTab === tab ? "linear-gradient(135deg, #7c6ff7, #a78bfa)" : "transparent",
                color: activeTab === tab ? "#fff" : "var(--text-secondary)",
                boxShadow: activeTab === tab ? "0 4px 20px rgba(124,111,247,0.35)" : "none",
              }}
            >
              {tab === "skills"    ? `⚡ Skills (${data.skills.length})`
               : tab === "projects" ? `🚀 Projects (${data.projects.length})`
               : `🎓 Education (${data.education.length})`}
            </button>
          ))}
        </div>

        {/* ── Skills panel ─────────────────────────────────────────────────── */}
        {activeTab === "skills" && (
          <div style={{ animation: "fadeInUp 0.4s ease both" }}>
            {data.skills.length === 0 ? (
              <EmptyState icon="⚡" message="No skills detected. Try uploading a clearer resume." />
            ) : (
              <div style={{ display: "grid", gap: "1rem" }}>
                {skillCategories.map(([category, skills], catIdx) => (
                  <div key={category} style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "1.25rem",
                    padding: "1.25rem 1.5rem",
                    animation: `fadeInUp 0.4s ease ${catIdx * 0.05}s both`,
                  }}>
                    <h3 style={{
                      fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.1em",
                      textTransform: "uppercase", color: "var(--text-muted)",
                      marginBottom: "1rem",
                    }}>
                      {category}
                    </h3>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                      {skills.map((skill, sIdx) => {
                        const col = tagColour(catIdx);
                        return (
                          <span key={skill} style={{
                            padding: "0.35rem 0.85rem",
                            borderRadius: "100px",
                            background: col.bg,
                            border: `1px solid ${col.border}`,
                            color: col.text,
                            fontSize: "0.82rem",
                            fontWeight: 600,
                            animation: `tagPop 0.3s ease ${sIdx * 0.03}s both`,
                          }}>
                            {skill}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Projects panel ───────────────────────────────────────────────── */}
        {activeTab === "projects" && (
          <div style={{ animation: "fadeInUp 0.4s ease both" }}>
            {data.projects.length === 0 ? (
              <EmptyState icon="🚀" message="No projects detected. Make sure your resume has a 'Projects' section." />
            ) : (
              <div style={{ display: "grid", gap: "1rem" }}>
                {data.projects.map((proj, pIdx) => (
                  <div key={pIdx} style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "1.25rem",
                    padding: "1.5rem",
                    animation: `fadeInUp 0.4s ease ${pIdx * 0.06}s both`,
                    transition: "border-color 0.2s, background 0.2s",
                    position: "relative",
                    overflow: "hidden",
                  }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(124,111,247,0.3)";
                      (e.currentTarget as HTMLDivElement).style.background = "var(--bg-card-hover)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-subtle)";
                      (e.currentTarget as HTMLDivElement).style.background = "var(--bg-card)";
                    }}
                  >
                    {/* accent line */}
                    <div style={{
                      position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
                      background: "linear-gradient(180deg, #7c6ff7, #22d3ee)",
                      borderRadius: "3px 0 0 3px",
                    }} />

                    <div style={{ paddingLeft: "0.75rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                        <h3 style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--text-primary)" }}>
                          {proj.name}
                        </h3>
                        <span style={{
                          fontSize: "0.75rem", color: "var(--text-muted)",
                          background: "rgba(255,255,255,0.05)",
                          padding: "0.2rem 0.6rem", borderRadius: "100px",
                          border: "1px solid var(--border-subtle)", whiteSpace: "nowrap",
                        }}>
                          Project #{pIdx + 1}
                        </span>
                      </div>

                      {proj.description && (
                        <p style={{
                          color: "var(--text-secondary)", fontSize: "0.875rem",
                          lineHeight: 1.7, marginTop: "0.5rem",
                        }}>
                          {proj.description}
                        </p>
                      )}

                      {proj.technologies.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "1rem" }}>
                          {proj.technologies.map((tech, tIdx) => {
                            const col = tagColour(tIdx + 1);
                            return (
                              <span key={tech} style={{
                                padding: "0.2rem 0.65rem",
                                borderRadius: "100px",
                                background: col.bg,
                                border: `1px solid ${col.border}`,
                                color: col.text,
                                fontSize: "0.75rem", fontWeight: 600,
                              }}>
                                {tech}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Education panel ──────────────────────────────────────────────── */}
        {activeTab === "education" && (
          <div style={{ animation: "fadeInUp 0.4s ease both" }}>
            {data.education.length === 0 ? (
              <EmptyState icon="🎓" message="No education detected. Make sure your resume has an 'Education' section with a degree name." />
            ) : (
              <div style={{ display: "grid", gap: "1rem" }}>
                {data.education.map((edu, i) => (
                  <div key={i} style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "1.25rem",
                    padding: "1.5rem",
                    animation: `fadeInUp 0.4s ease ${i * 0.06}s both`,
                    position: "relative", overflow: "hidden",
                  }}>
                    {/* accent line */}
                    <div style={{
                      position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
                      background: "linear-gradient(180deg, #f472b6, #a78bfa)",
                      borderRadius: "3px 0 0 3px",
                    }} />
                    <div style={{ paddingLeft: "0.75rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                        <h3 style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--text-primary)", flex: 1 }}>
                          {edu.degree}
                        </h3>
                        {edu.year && (
                          <span style={{
                            fontSize: "0.78rem", color: "#c4b5fd", fontWeight: 700,
                            background: "rgba(124,111,247,0.15)", border: "1px solid rgba(124,111,247,0.3)",
                            padding: "0.2rem 0.7rem", borderRadius: "100px", whiteSpace: "nowrap",
                          }}>
                            🎓 {edu.year}
                          </span>
                        )}
                      </div>
                      {edu.institution && (
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "0.4rem" }}>
                          🏛️ {edu.institution}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <div style={{
      textAlign: "center", padding: "3rem 1rem",
      background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
      borderRadius: "1.25rem",
    }}>
      <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>{icon}</div>
      <p style={{ color: "var(--text-muted)", maxWidth: 360, margin: "0 auto" }}>{message}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<ParsedResume | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setLoading(true);
    setProfile(null);
    try {
      const text = await extractText(file);
      if (!text || text.trim().length < 30) {
        throw new Error("Could not extract enough text from this file. Try a text-based PDF or .txt file.");
      }
      const parsed = parseResumeText(text);
      setProfile(parsed);
    } catch (err) {
      setError((err as Error).message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-primary)",
      position: "relative",
      overflowX: "hidden",
    }}>
      {/* Background decoration */}
      <div style={{
        position: "fixed", top: "10%", left: "50%", transform: "translateX(-50%)",
        width: "70vw", height: "60vh",
        background: "radial-gradient(ellipse, rgba(124,111,247,0.08) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      {/* Navbar */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        padding: "1rem 2rem",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid var(--border-subtle)",
        backdropFilter: "blur(20px)",
        background: "rgba(10,10,15,0.8)",
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "0.6rem",
          fontWeight: 800, fontSize: "1.1rem", letterSpacing: "-0.02em",
        }}>
          <span style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 32, height: 32, borderRadius: "8px",
            background: "linear-gradient(135deg, #7c6ff7, #22d3ee)",
            fontSize: "1rem",
          }}>📄</span>
          <span style={{
            background: "linear-gradient(135deg, #c4b5fd, #67e8f9)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>ResumeAI</span>
        </div>
        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 500 }}>
          Parse · Extract · Profile
        </div>
      </nav>

      {/* Main content */}
      <main style={{
        maxWidth: 800,
        margin: "0 auto",
        padding: "4rem 1.5rem 6rem",
        position: "relative", zIndex: 1,
      }}>
        {error && (
          <div style={{
            background: "rgba(239,68,68,0.12)",
            border: "1px solid rgba(239,68,68,0.35)",
            color: "#fca5a5",
            borderRadius: "1rem",
            padding: "1rem 1.25rem",
            marginBottom: "2rem",
            fontSize: "0.9rem",
            display: "flex", alignItems: "center", gap: "0.75rem",
          }}>
            <span style={{ fontSize: "1.2rem" }}>⚠️</span>
            {error}
            <button
              onClick={() => setError(null)}
              style={{ marginLeft: "auto", background: "none", border: "none", color: "#fca5a5", cursor: "pointer", fontSize: "1rem" }}
            >✕</button>
          </div>
        )}

        {profile ? (
          <>
            <ProfileView data={profile} onReset={() => setProfile(null)} />
            {/* ── Debug panel: raw extracted lines ── */}
            <details style={{ marginTop: "2rem" }}>
              <summary style={{
                cursor: "pointer", color: "var(--text-muted)", fontSize: "0.8rem",
                fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase",
                padding: "0.5rem 0", userSelect: "none",
              }}>
                🔍 Debug — Raw extracted text (first 40 lines)
              </summary>
              <div style={{
                marginTop: "0.75rem",
                background: "#0d0d16",
                border: "1px solid rgba(124,111,247,0.2)",
                borderRadius: "1rem",
                padding: "1rem 1.25rem",
                fontFamily: "monospace",
                fontSize: "0.78rem",
                color: "#a0a0c0",
                lineHeight: 1.8,
                overflowX: "auto",
                maxHeight: 400,
                overflowY: "auto",
              }}>
                {profile.rawText
                  .split(/\r?\n/)
                  .slice(0, 40)
                  .map((line, i) => (
                    <div key={i} style={{ display: "flex", gap: "1rem" }}>
                      <span style={{ color: "#3d3d5c", minWidth: 28, textAlign: "right", flexShrink: 0 }}>{i + 1}</span>
                      <span style={{ color: line.trim() ? "#c4b5fd" : "#2a2a40" }}>
                        {line.trim() ? line : "·"}
                      </span>
                    </div>
                  ))}
              </div>
            </details>
          </>
        ) : (
          <UploadZone onFile={handleFile} loading={loading} />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: "center", padding: "2rem",
        borderTop: "1px solid var(--border-subtle)",
        color: "var(--text-muted)", fontSize: "0.8rem",
      }}>
        Built with ✨ — ResumeAI parses resumes entirely in your browser. No data is uploaded to any server.
      </footer>
    </div>
  );
}
