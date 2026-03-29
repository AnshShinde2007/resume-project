import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, Content } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

export async function POST(req: NextRequest) {
  try {
    const { history, userMessage, jd, resumeSkills, resumeName } = await req.json() as {
      history: { role: "user" | "model"; text: string }[];
      userMessage: string;
      jd: {
        title?: string;
        company?: string;
        experienceRequired?: string;
        responsibilities?: string[];
        qualifications?: string[];
        skills?: string[];
        summary?: string;
      } | null;
      resumeSkills: string[];
      resumeName: string;
    };

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY not set." }, { status: 500 });
    }

    // ─── Build system prompt ──────────────────────────────────────────────────
    const jdContext = jd
      ? `
Job Description Context:
- Role: ${jd.title ?? "N/A"}
- Company: ${jd.company ?? "N/A"}
- Experience Required: ${jd.experienceRequired ?? "N/A"}
- Key Skills Required: ${(jd.skills ?? []).join(", ") || "N/A"}
- Summary: ${jd.summary ?? "N/A"}
- Responsibilities: ${(jd.responsibilities ?? []).slice(0, 5).map((r, i) => `${i + 1}. ${r}`).join(" ")}
- Qualifications: ${(jd.qualifications ?? []).slice(0, 4).map((q, i) => `${i + 1}. ${q}`).join(" ")}
`.trim()
      : "No job description provided — conduct a general software engineering interview.";

    const candidateContext = resumeName
      ? `Candidate Name: ${resumeName}. Candidate Skills from Resume: ${resumeSkills.join(", ") || "unknown"}.`
      : "No resume uploaded — ask general questions.";

    const systemInstruction = `You are an expert AI technical interviewer conducting a realistic mock job interview. Your tone is professional, encouraging, and constructive.

${jdContext}

${candidateContext}

Guidelines:
- Ask ONE focused interview question per response. Never ask multiple questions at once.
- Start the conversation by introducing yourself briefly and asking the first question.
- Progress naturally: start with intro/background, then technical questions, then behavioral, then system design if relevant, then closing.
- Reference the job description and candidate's known skills when formulating questions to make it specific and realistic.
- After the candidate answers, give brief, constructive feedback (1-2 sentences) before asking the next question.
- Keep responses concise — under 120 words per turn unless giving detailed feedback.
- Use **bold** for key terms when needed.
- Do NOT reveal that you are an AI model or mention "Gemini". You are the human interviewer for this role.`;

    // ─── Build conversation history for Gemini ────────────────────────────────
    const formattedHistory: Content[] = history.map(h => ({
      role: h.role,
      parts: [{ text: h.text }],
    }));

    // ─── Start chat ───────────────────────────────────────────────────────────
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-preview-04-17",
      systemInstruction,
    });

    const chat = model.startChat({
      history: formattedHistory,
      generationConfig: {
        maxOutputTokens: 512,
        temperature: 0.8,
      },
    });

    const result = await chat.sendMessage(userMessage);
    const text = result.response.text();

    return NextResponse.json({ text });
  } catch (err) {
    console.error("[interview API]:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
