import { ParsedJobDescription } from "../lib/jobDescriptionParser";

// ─── PDF Extraction ────────────────────────────────────────────────────────────
export async function extractTextFromPDF(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  const ab = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: ab }).promise;
  const parts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    parts.push(content.items.map((it: any) => it.str ?? "").join(" "));
  }
  return parts.join("\n");
}

export async function extractText(file: File): Promise<string> {
  if (file.type === "application/pdf") return extractTextFromPDF(file);
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsText(file);
  });
}

// ─── Colour helpers ────────────────────────────────────────────────────────────
export const TAG_COLOURS = [
  { bg: "rgba(124,111,247,0.18)", border: "rgba(124,111,247,0.4)", text: "#c4b5fd" },
  { bg: "rgba(34,211,238,0.14)",  border: "rgba(34,211,238,0.35)",  text: "#67e8f9" },
  { bg: "rgba(244,114,182,0.14)", border: "rgba(244,114,182,0.35)", text: "#f9a8d4" },
  { bg: "rgba(74,222,128,0.14)",  border: "rgba(74,222,128,0.35)",  text: "#86efac" },
  { bg: "rgba(251,191,36,0.14)",  border: "rgba(251,191,36,0.35)",  text: "#fde68a" },
];

export function tagColour(i: number) { return TAG_COLOURS[i % TAG_COLOURS.length]; }

export function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("");
}

// ─── Skill categories (for profile panel) ─────────────────────────────────────
export function categoriseSkills(skills: string[]) {
  const LANG  = new Set(["JavaScript","TypeScript","Python","Java","C++","C#","C","Go","Rust","Swift","Kotlin","Ruby","PHP","Scala","R","MATLAB","Dart","Lua","Perl","Bash","Shell"]);
  const FE    = new Set(["React","Next.js","Vue","Vue.js","Angular","Svelte","HTML","HTML5","CSS","CSS3","Sass","SCSS","Tailwind","TailwindCSS","Bootstrap","jQuery","Redux","Zustand","Vite","Webpack","Babel"]);
  const BE    = new Set(["Node.js","Express","FastAPI","Django","Flask","Spring","Spring Boot","Laravel","Rails","NestJS","Hono","Bun","Deno"]);
  const DB    = new Set(["MongoDB","PostgreSQL","MySQL","SQLite","Redis","Firebase","Supabase","DynamoDB","Cassandra","Prisma","Mongoose","SQL","NoSQL"]);
  const CLOUD = new Set(["AWS","GCP","Azure","Docker","Kubernetes","CI/CD","GitHub Actions","Vercel","Netlify","Heroku","Linux","Nginx","Apache","Terraform","Ansible"]);
  const AI    = new Set(["TensorFlow","PyTorch","Keras","scikit-learn","Pandas","NumPy","OpenCV","Hugging Face","LangChain","OpenAI","LLM","NLP","Machine Learning","Deep Learning","Computer Vision"]);
  const cats: Record<string,string[]> = { Languages:[], Frontend:[], Backend:[], Databases:[], "Cloud & DevOps":[], "AI / ML":[], Tools:[] };
  
  for (const s of skills) {
    if      (LANG.has(s))  cats.Languages.push(s);
    else if (FE.has(s))    cats.Frontend.push(s);
    else if (BE.has(s))    cats.Backend.push(s);
    else if (DB.has(s))    cats.Databases.push(s);
    else if (CLOUD.has(s)) cats["Cloud & DevOps"].push(s);
    else if (AI.has(s))    cats["AI / ML"].push(s);
    else                   cats.Tools.push(s);
  }
  return Object.entries(cats).filter(([,v]) => v.length > 0);
}

// ─── Real Gemini API call ─────────────────────────────────────────────────────
export async function callGemini({
  history,
  userMessage,
  jd,
  resumeSkills,
  resumeProjects,
  resumeEducation,
  resumeExperience,
  resumeName,
  difficulty,
}: {
  history: { role: "user" | "model"; text: string }[];
  userMessage: string;
  jd: ParsedJobDescription | null;
  resumeSkills: string[];
  resumeProjects: { name: string; description: string; technologies: string[] }[];
  resumeEducation: { degree: string; institution: string; year: string }[];
  resumeExperience: string;
  resumeName: string;
  difficulty?: string;
}): Promise<string> {
  const res = await fetch("/api/interview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ history, userMessage, jd, resumeSkills, resumeProjects, resumeEducation, resumeExperience, resumeName, difficulty }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `API error ${res.status}`);
  }
  const data = await res.json();
  return data.text as string;
}

