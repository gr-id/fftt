import { NextResponse } from "next/server";
import { z } from "zod";

import { recordProductEvent } from "@/lib/analytics-store";
import { MBTI_MAP } from "@/lib/mbti";
import { saveTrainingAttempt } from "@/lib/ranking-store";
import { evaluateTrainingAnswer } from "@/lib/training-evaluator";

const requestSchema = z.object({
  angle: z.string().trim().min(1).max(160),
  answer: z.string().trim().min(1).max(300),
  category: z.enum(["work", "friend", "relationship", "family"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  intent: z.enum(["persuasion", "empathy", "decline", "coordination"]),
  mbti: z.string().trim().length(4),
  prompt: z.string().trim().min(1).max(400),
  sessionId: z.string().trim().uuid(),
  topic: z.string().trim().min(1).max(120),
  userId: z.string().trim().uuid(),
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

  await recordProductEvent({
    eventName: "training_submitted",
    metadata: {
      answerLength: body.answer.length,
      category: body.category,
      difficulty: body.difficulty,
      intent: body.intent,
      sessionId: body.sessionId,
    },
    targetMbti: mbtiCode,
    userId: body.userId,
  });

  try {
    const result = await evaluateTrainingAnswer(mbtiCode, body.prompt, body.answer);
    const saved = await saveTrainingAttempt({
      angle: body.angle,
      answer: body.answer,
      category: body.category,
      difficulty: body.difficulty,
      evaluation: result,
      intent: body.intent,
      prompt: body.prompt,
      sessionId: body.sessionId,
      targetMbti: mbtiCode,
      topic: body.topic,
      userId: body.userId,
    });

    await recordProductEvent({
      eventName: "training_completed",
      metadata: {
        category: body.category,
        difficulty: body.difficulty,
        responseSource: result.responseSource,
        score: result.score,
        sessionId: body.sessionId,
      },
      targetMbti: mbtiCode,
      userId: body.userId,
    });

    return NextResponse.json(
      {
        ...result,
        currentStanding: saved.currentStanding,
        historyStats: saved.historyStats,
      },
      {
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          message: error instanceof Error ? error.message : "훈련 점수를 저장하지 못했습니다.",
        },
      },
      { status: 500 },
    );
  }
}
