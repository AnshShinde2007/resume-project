import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? "" });

export async function POST(req: NextRequest) {
  try {
    const { history, userMessage, jd, resumeSkills, resumeProjects, resumeEducation, resumeExperience, resumeName, difficulty } = await req.json() as {
      history: { role: "user" | "model"; text: string }[];
      userMessage: string;
      jd: {
        title?: string;
        company?: string;
        experienceRequired?: string;
        responsibilities?: string[];
        qualifications?: string[];
        niceToHave?: string[];
        salaryRange?: string;
        skills?: string[];
        summary?: string;
      } | null;
      resumeSkills: string[];
      resumeProjects?: { name: string; description: string; technologies: string[] }[];
      resumeEducation?: { degree: string; institution: string; year: string }[];
      resumeExperience?: string;
      resumeName: string;
      difficulty?: string;
    };

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY not set." }, { status: 500 });
    }

    // ─── Build system prompt ──────────────────────────────────────────────────
    const jdSkills = (jd?.skills || []).concat(jd?.qualifications || []).join(", ");
    const jdNiceToHave = (jd?.niceToHave || []).join(", ");

    const contextProjects = (resumeProjects || []).filter(p => !!p.name).map(p => `${p.name} - ${p.description}`).join("; ") || "None";
    const contextEducation = (resumeEducation || []).filter(e => !!e.degree).map(e => `${e.degree} from ${e.institution} (${e.year})`).join("; ") || "None";

    const systemInstruction = `You are a strict technical interviewer.

Target Difficulty: ${difficulty || "Appropriate for the role"}

Context:
Skills: ${resumeSkills.join(", ") || "None"}
Projects: ${contextProjects}
Education: ${contextEducation}
Experience: ${resumeExperience || "None"}

JD:
* Mandatory: ${jdSkills || "None"}
* Nice: ${jdNiceToHave || "None"}
* Salary: ${jd?.salaryRange || "None"}

Rules:
* Ask 1 question at a time
* Prioritize Mandatory > Nice > Projects
* Adjust difficulty based on Target Difficulty + Experience
* Start basic → go deeper
* Weak answer → probe deeper
* Strong answer → increase difficulty
* Challenge answers below expected level
* No full answers

Eval:
* 1-line feedback + next question

Focus:
* Test mandatory skills deeply
* Use projects for real-world + system questions

End:
* Short performance summary (skills, gaps, level vs salary)`;

    // ─── Build contents array (history + current user message) ───────────────
    const contents = [
      ...history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }],
      })),
      {
        role: "user" as const,
        parts: [{ text: userMessage }],
      },
    ];

    // ─── Call Gemini via new SDK ──────────────────────────────────────────────
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents,
      config: {
        systemInstruction,
        maxOutputTokens: 512,
        temperature: 0.8,
      },
    });

    const text = response.text;

    return NextResponse.json({ text });
  } catch (err) {
    console.error("[interview API]:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
