import OpenAI from "openai";
import { z } from "zod";

import { failure, parseJsonWithSchema, success } from "@/lib/api-contract";

const geminiSchema = z.object({
  models: z.array(z.object({ name: z.string() })).optional(),
});

const requestSchema = z.object({
  provider: z.enum(["chatgpt", "gemini", "other"]),
  apiKey: z.string().trim().min(10).max(300),
});

async function validateChatGpt(apiKey: string) {
  const client = new OpenAI({ apiKey });
  const response = await client.models.list();
  const modelName = response.data[0]?.id;

  return {
    provider: "chatgpt" as const,
    message: modelName
      ? `OpenAI 인증 성공 (${modelName})`
      : "OpenAI 인증 성공",
  };
}

async function validateGemini(apiKey: string) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as {
      error?: { message?: string };
    };
    throw new Error(payload.error?.message ?? "Gemini API 인증에 실패했습니다.");
  }

  const payload = geminiSchema.parse(await response.json());
  const modelName = payload.models?.[0]?.name;

  return {
    provider: "gemini" as const,
    message: modelName
      ? `Gemini 인증 성공 (${modelName})`
      : "Gemini 인증 성공",
  };
}

export async function POST(request: Request) {
  const parsed = await parseJsonWithSchema(request, requestSchema);
  if (!parsed.ok) {
    const message = "provider와 apiKey를 올바르게 입력해주세요.";
    return failure("INVALID_INPUT", message, 400, { legacy: { message } });
  }
  const body = parsed.data;

  if (body.provider === "other") {
    const payload = {
      provider: "other",
      message:
        "기타 타입은 연결 엔드포인트가 없어 키 형식만 검증했습니다. 실제 호출 검증은 별도 연동이 필요합니다.",
    };
    return success(payload, { legacy: payload });
  }

  try {
    const result =
      body.provider === "chatgpt"
        ? await validateChatGpt(body.apiKey)
        : await validateGemini(body.apiKey);
    return success(result, { legacy: result });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "외부 API 검증 중 오류가 발생했습니다.";

    return failure("PROVIDER_VALIDATION_FAILED", message, 502, {
      legacy: {
        provider: body.provider,
        message,
      },
    });
  }
}
