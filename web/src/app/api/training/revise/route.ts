import OpenAI from "openai";
import { ZodError, z } from "zod";

import { failure, parseJsonWithSchema, success } from "@/lib/api-contract";

const MAX_MESSAGE_LENGTH = 500;
const MODEL =
  process.env.GEMINI_MODEL ?? process.env.OPENAI_MODEL ?? "gemini-2.5-flash";
const FIXED_TARGET_MBTI = "ISFJ";
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/";

const requestSchema = z.object({
  message: z.string().trim().min(1).max(MAX_MESSAGE_LENGTH),
});

const responseSchema = z.object({
  revised_sentence: z.string().trim().min(1).max(800),
  reason: z.string().trim().min(1).max(1200),
});

function getSystemPrompt() {
  return [
    `You are an ${FIXED_TARGET_MBTI} communication coach.`,
    "Rewrite the user's sentence so it feels calm, considerate, and reassuring.",
    "Return exactly one JSON object.",
    'JSON schema: {"revised_sentence": string, "reason": string}',
    "Write the explanation in a practical coaching tone.",
    "Keep the wording natural and conversational.",
    "Do not present legal, medical, or psychological diagnosis.",
  ].join(" ");
}

function mapModelError(error: unknown) {
  if (error instanceof ZodError) {
    return failure(
      "INVALID_RESPONSE",
      "The model response did not match the expected schema.",
      502,
    );
  }

  if (error instanceof SyntaxError) {
    return failure("INVALID_JSON", "The model did not return valid JSON.", 502);
  }

  const message =
    error instanceof Error ? error.message : "The upstream model request failed.";

  return failure("UPSTREAM_ERROR", message, 502);
}

type UsagePayload = {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
};

type RevisionPayload = z.infer<typeof responseSchema> & {
  usage: UsagePayload;
};

async function requestRevision(
  client: OpenAI,
  message: string,
): Promise<RevisionPayload> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const completion = await client.chat.completions.create({
        model: MODEL,
        temperature: 0.7,
        messages: [
          { role: "system", content: getSystemPrompt() },
          {
            role: "user",
            content: `Original message: ${message}`,
          },
        ],
        response_format: { type: "json_object" },
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("The model response was empty.");
      }

      const candidate = JSON.parse(content);
      const parsed = responseSchema.parse(candidate);

      return {
        ...parsed,
        usage: {
          input_tokens: completion.usage?.prompt_tokens ?? 0,
          output_tokens: completion.usage?.completion_tokens ?? 0,
          total_tokens: completion.usage?.total_tokens ?? 0,
        },
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return failure(
      "MISSING_API_KEY",
      "Missing AI API key. Set GEMINI_API_KEY in web/.env.local before running the service.",
      500,
    );
  }

  const parsedBody = await parseJsonWithSchema(request, requestSchema);
  if (!parsedBody.ok) {
    return failure(
      "INVALID_INPUT",
      `message must be between 1 and ${MAX_MESSAGE_LENGTH} characters.`,
      400,
    );
  }

  const client = new OpenAI({
    apiKey,
    baseURL: GEMINI_BASE_URL,
  });

  try {
    const payload = await requestRevision(client, parsedBody.data.message);
    return success(payload, { legacy: payload });
  } catch (error) {
    return mapModelError(error);
  }
}
