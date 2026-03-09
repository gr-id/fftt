import { NextResponse } from "next/server";
import { z } from "zod";

import { MBTI_MAP } from "@/lib/mbti";
import { saveTrainingAttempt } from "@/lib/ranking-store";
import { evaluateTrainingAnswer } from "@/lib/training-evaluator";

const requestSchema = z.object({
  userId: z.string().trim().uuid(),
  sessionId: z.string().trim().uuid(),
  mbti: z.string().trim().length(4),
  prompt: z.string().trim().min(1).max(400),
  answer: z.string().trim().min(1).max(300),
});

export const runtime = "nodejs";

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

  try {
    const result = await evaluateTrainingAnswer(mbtiCode, body.prompt, body.answer);
    const currentStanding = await saveTrainingAttempt({
      answer: body.answer,
      evaluation: result,
      prompt: body.prompt,
      sessionId: body.sessionId,
      targetMbti: mbtiCode,
      userId: body.userId,
    });

    return NextResponse.json(
      {
        ...result,
        currentStanding,
      },
      {
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          message: error instanceof Error ? error.message : "Unable to save training score.",
        },
      },
      { status: 500 },
    );
  }
}
