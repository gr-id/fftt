import OpenAI from "openai";
import { NextResponse } from "next/server";
import { ZodError, z } from "zod";

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
    `너는 ${FIXED_TARGET_MBTI} 성향 전문 소통 코치다.`,
    "사용자가 입력한 문장을 ISFJ가 더 편안하고 긍정적으로 받아들일 수 있게 교정한다.",
    "출력은 반드시 JSON 객체 하나로만 반환한다.",
    "JSON 스키마: {\"revised_sentence\": string, \"reason\": string}",
    "톤은 친근한 코치형으로 작성한다.",
    "항상 한국어로 답한다.",
    "의학/심리/법률 진단처럼 단정적 조언은 피하고 일반적 소통 가이드 관점으로 작성한다.",
  ].join(" ");
}

function mapModelError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_RESPONSE",
          message: "모델 응답 형식이 올바르지 않습니다.",
        },
      },
      { status: 502 },
    );
  }

  if (error instanceof SyntaxError) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_JSON",
          message: "모델이 JSON 형식으로 응답하지 않았습니다.",
        },
      },
      { status: 502 },
    );
  }

  const message =
    error instanceof Error ? error.message : "외부 모델 호출에 실패했습니다.";

  return NextResponse.json(
    { error: { code: "UPSTREAM_ERROR", message } },
    { status: 502 },
  );
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
            content: `원문 메시지: ${message}`,
          },
        ],
        response_format: { type: "json_object" },
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("모델 응답이 비어 있습니다.");
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
    return NextResponse.json(
      {
        error: {
          code: "MISSING_API_KEY",
          message: "GEMINI_API_KEY가 설정되지 않았습니다.",
        },
      },
      { status: 500 },
    );
  }

  let parsedBody: z.infer<typeof requestSchema>;
  try {
    parsedBody = requestSchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_INPUT",
          message: `message는 1자 이상 ${MAX_MESSAGE_LENGTH}자 이하로 입력해야 합니다.`,
        },
      },
      { status: 400 },
    );
  }

  const client = new OpenAI({
    apiKey,
    baseURL: GEMINI_BASE_URL,
  });

  try {
    const payload = await requestRevision(client, parsedBody.message);
    return NextResponse.json(payload);
  } catch (error) {
    return mapModelError(error);
  }
}
