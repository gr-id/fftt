import OpenAI from "openai";
import { NextResponse } from "next/server";

const MODEL =
  process.env.GEMINI_MODEL ?? process.env.OPENAI_MODEL ?? "gemini-2.5-flash";
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/";

function getApiKey() {
  return process.env.GEMINI_API_KEY ?? process.env.OPENAI_API_KEY ?? null;
}

export async function GET(request: Request) {
  const apiKey = getApiKey();
  const { searchParams } = new URL(request.url);
  const shouldProbe = searchParams.get("probe") === "1";

  if (!shouldProbe) {
    return NextResponse.json({
      configured: Boolean(apiKey),
      live: false,
      model: MODEL,
      provider: "gemini",
    });
  }

  if (!apiKey) {
    return NextResponse.json(
      {
        configured: false,
        live: false,
        model: MODEL,
        provider: "gemini",
        error: "No API key loaded from web/.env.local.",
      },
      { status: 500 },
    );
  }

  try {
    const client = new OpenAI({
      apiKey,
      baseURL: GEMINI_BASE_URL,
    });

    const completion = await client.chat.completions.create({
      model: MODEL,
      temperature: 0,
      messages: [{ role: "user", content: "Reply with OK" }],
    });

    return NextResponse.json({
      configured: true,
      live: true,
      model: MODEL,
      provider: "gemini",
      output: completion.choices[0]?.message?.content ?? "",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "AI probe request failed.";

    return NextResponse.json(
      {
        configured: true,
        live: false,
        model: MODEL,
        provider: "gemini",
        error: message,
      },
      { status: 502 },
    );
  }
}
