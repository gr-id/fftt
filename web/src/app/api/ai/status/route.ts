import OpenAI from "openai";
import { z } from "zod";

import { failure, success } from "@/lib/api-contract";

const MODEL =
  process.env.GEMINI_MODEL ?? process.env.OPENAI_MODEL ?? "gemini-2.5-flash";
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/";

const querySchema = z.object({
  probe: z.enum(["1"]).optional(),
});

function getApiKey() {
  return process.env.GEMINI_API_KEY ?? process.env.OPENAI_API_KEY ?? null;
}

export async function GET(request: Request) {
  const apiKey = getApiKey();
  const { searchParams } = new URL(request.url);
  const queryParsed = querySchema.safeParse({
    probe: searchParams.get("probe") ?? undefined,
  });

  if (!queryParsed.success) {
    return failure("INVALID_INPUT", "probe 쿼리 파라미터는 1만 허용됩니다.", 400, {
      details: queryParsed.error.flatten(),
      legacy: {
        configured: Boolean(apiKey),
        live: false,
        model: MODEL,
        provider: "gemini",
      },
    });
  }

  const shouldProbe = queryParsed.data.probe === "1";

  if (!shouldProbe) {
    const payload = {
      configured: Boolean(apiKey),
      live: false,
      model: MODEL,
      provider: "gemini",
    };

    return success(payload, { legacy: payload });
  }

  if (!apiKey) {
    return failure(
      "MISSING_API_KEY",
      "No API key loaded from web/.env.local.",
      500,
      {
        legacy: {
          configured: false,
          live: false,
          model: MODEL,
          provider: "gemini",
          error: "No API key loaded from web/.env.local.",
        },
      },
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

    const payload = {
      configured: true,
      live: true,
      model: MODEL,
      provider: "gemini",
      output: completion.choices[0]?.message?.content ?? "",
    };

    return success(payload, { legacy: payload });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "AI probe request failed.";

    return failure("UPSTREAM_ERROR", message, 502, {
      legacy: {
        configured: true,
        live: false,
        model: MODEL,
        provider: "gemini",
        error: message,
      },
    });
  }
}
