import { NextResponse } from "next/server";
import { z } from "zod";

import { MBTI_MAP } from "@/lib/mbti";
import { evaluateTrainingAnswer } from "@/lib/training-evaluator";

const requestSchema = z.object({
  mbti: z.string().trim().length(4),
  prompt: z.string().trim().min(1).max(400),
  answer: z.string().trim().min(1).max(300),
});

export async function POST(request: Request) {
  let body: z.infer<typeof requestSchema>;

  try {
    body = requestSchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { error: { message: "MBTI, 질문, 답변을 올바르게 전달해 주세요." } },
      { status: 400 },
    );
  }

  const mbtiCode = body.mbti.toUpperCase();
  if (!MBTI_MAP[mbtiCode]) {
    return NextResponse.json(
      { error: { message: "지원하지 않는 MBTI입니다." } },
      { status: 400 },
    );
  }

  const result = await evaluateTrainingAnswer(mbtiCode, body.prompt, body.answer);
  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store" },
  });
}
