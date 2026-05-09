import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? "" });

export async function POST(req: NextRequest) {
  try {
    const { history } = await req.json() as {
      history: { role: string; content: string }[];
    };

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY not set." }, { status: 500 });
    }

    const transcript = history.map(h => `${h.role === "assistant" || h.role === "ai" ? "Interviewer" : "Candidate"}: ${h.content}`).join("\n\n");

    const systemInstruction = `You are an expert technical recruiter and interviewer.
Your task is to analyze the following interview transcript and provide a structured JSON feedback payload.

Evaluate the candidate based on:
1. Communication
2. Technical accuracy
3. Confidence
4. Problem Solving

You must output valid JSON ONLY, using this EXACT schema:
{
  "overallScore": number (0-100),
  "communication": number (0-100),
  "technical": number (0-100),
  "confidence": number (0-100),
  "problemSolving": number (0-100),
  "strengths": string[],
  "weaknesses": string[],
  "summary": string
}
Do not wrap it in markdown block quotes. Return raw JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [{ text: `Analyze this transcript:\n\n${transcript}` }],
        }
      ],
      config: {
        systemInstruction,
        maxOutputTokens: 800,
        temperature: 0.2,
      },
    });

    const text = response.text || "{}";
    
    // Attempt to parse JSON safely
    let parsedFeedback;
    try {
      const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
      parsedFeedback = JSON.parse(cleanText);
    } catch (e) {
      console.error("Failed to parse feedback JSON", e);
      return NextResponse.json({ error: "Failed to generate valid feedback format" }, { status: 500 });
    }

    return NextResponse.json({ feedback: parsedFeedback });
  } catch (err) {
    console.error("[feedback API]:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
