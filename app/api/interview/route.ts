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
      summarizedProjects?: string;
      resumeEducation?: { degree: string; institution: string; year: string }[];
      resumeExperience?: { company: string; role: string; duration: string; description: string; technologies?: string[] }[];
      resumeName: string;
      difficulty?: string;
    };

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY not set." }, { status: 500 });
    }

    // ─── Build system prompt ──────────────────────────────────────────────────
    const jdSkills = (jd?.skills || []).concat(jd?.qualifications || []).join(", ");
    const jdNiceToHave = (jd?.niceToHave || []).join(", ");

    const contextProjects = summarizedProjects || (resumeProjects || []).filter(p => !!p.name).map(p => `${p.name} - ${p.description}`).join("; ") || "None";
    const contextEducation = (resumeEducation || []).filter(e => !!e.degree).map(e => `${e.degree} from ${e.institution} (${e.year})`).join("; ") || "None";
    const contextExperience = (resumeExperience || []).map(e => `${e.role} at ${e.company} (${e.duration}): ${e.description}`).join(" | ") || "None";

    const systemInstruction = `You are a strict, no-nonsense technical interviewer.

Interviewing ${resumeName} for the role of ${jd?.title || "Software Engineer"} at ${jd?.company || "Unknown Company"}.

Target Difficulty: ${difficulty || "intermediate"}

Context:
Skills: ${resumeSkills.join(", ") || "None"}
Projects: ${contextProjects}
Education: ${contextEducation}
Experience: ${contextExperience}

JD:
* Mandatory: ${jdSkills || "None"}
* Nice: ${jdNiceToHave || "None"}

STRICT RULES:
- NEVER ask beginner or definition-based questions
- DO NOT ask:
  * "what is"
  * "define"
  * "difference between"
- ALWAYS ask applied, real-world, scenario-based questions
- At least 50% of questions MUST reference candidate's projects
- Questions MUST align with JD requirements

INTERVIEW STYLE:
- Ask ONLY 1 question at a time
- Assume candidate is NOT a beginner
- Start directly with practical/project-based questions (NO basic warmups)
- Weak answer → ask deeper follow-up question
- Strong answer → increase complexity (system design, scaling, trade-offs)
- Challenge vague or shallow answers

EVALUATION:
- Give 1 concise line of feedback on the answer
- Then immediately ask the next question

FOCUS AREAS:
- Backend logic, APIs, authentication, scalability
- Real-world problem solving
- Trade-offs and decision making
- Project-based deep dives

END CONDITION:
- After several questions, give a short performance summary:
  - strengths
  - weaknesses
  - estimated level vs role expectations`;

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
        maxOutputTokens: 800,
        temperature: 0.4,
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
