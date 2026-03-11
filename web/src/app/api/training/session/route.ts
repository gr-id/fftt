import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";

import { recordProductEvent } from "@/lib/analytics-store";
import { MBTI_MAP } from "@/lib/mbti";
import { getRecommendedDifficulty } from "@/lib/ranking-store";
import {
  normalizeTrainingCategory,
  pickTrainingTopic,
  type TrainingDifficulty,
} from "@/lib/training";

const requestSchema = z.object({
  category: z.string().trim().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  mbti: z.string().trim().length(4),
  userId: z.string().trim().uuid().optional(),
});

export async function POST(request: Request) {
  let body: z.infer<typeof requestSchema>;

  try {
    body = requestSchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { error: { message: "올바른 세션 정보를 전달해주세요." } },
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

  const category = normalizeTrainingCategory(body.category);
  const recommendedDifficulty = await getRecommendedDifficulty(body.userId, mbtiCode);
  const difficulty = (body.difficulty ?? recommendedDifficulty) as TrainingDifficulty;
  const topic = pickTrainingTopic({ category, difficulty });
  const sessionId = randomUUID();

  if (body.userId) {
    await recordProductEvent({
      eventName: "training_started",
      metadata: {
        category: topic.category,
        difficulty: topic.difficulty,
        intent: topic.intent,
        recommendedDifficulty,
        sessionId,
        topicId: topic.id,
      },
      targetMbti: mbtiCode,
      userId: body.userId,
    });
  }

  return NextResponse.json(
    {
      angle: topic.angle,
      category: topic.category,
      difficulty: topic.difficulty,
      intent: topic.intent,
      prompt: topic.prompt,
      sessionId,
      topic: topic.topic,
    },
    {
      headers: { "Cache-Control": "no-store" },
    },
  );
}
