import { NextRequest, NextResponse } from "next/server";
import { InferenceClient } from "@huggingface/inference";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text || text.trim() === "") {
      return NextResponse.json({ summary: "" });
    }

    const client = new InferenceClient(process.env.HF_TOKEN);
    const output = await client.summarization({
      model: "google/pegasus-large",
      inputs: text,
      provider: "hf-inference",
    });

    // output is typically an object like { summary_text: string }
    return NextResponse.json({ summary: output.summary_text || "" });
  } catch (error: any) {
    console.error("[HF Summarization API]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
