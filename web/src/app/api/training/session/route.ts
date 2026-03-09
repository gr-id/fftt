import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";

import { MBTI_MAP } from "@/lib/mbti";
import { TOPIC_BANK } from "@/lib/training";

const requestSchema = z.object({
  mbti: z.string().trim().length(4),
});

export async function POST(request: Request) {
  let body: z.infer<typeof requestSchema>;

  try {
    body = requestSchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { error: { message: "올바른 MBTI를 전달해주세요." } },
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

  const randomTopic = TOPIC_BANK[Math.floor(Math.random() * TOPIC_BANK.length)];

  return NextResponse.json(
    {
      ...randomTopic,
      sessionId: randomUUID(),
    },
    {
    headers: { "Cache-Control": "no-store" },
    },
  );
}
