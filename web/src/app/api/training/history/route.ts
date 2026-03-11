import { NextResponse } from "next/server";

import { MBTI_MAP } from "@/lib/mbti";
import { getTrainingHistory } from "@/lib/ranking-store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = (searchParams.get("userId") ?? "").trim();
  const mbti = (searchParams.get("mbti") ?? "").trim().toUpperCase() || null;
  const rawLimit = Number.parseInt(searchParams.get("limit") ?? "5", 10);
  const limit = Number.isNaN(rawLimit) ? 5 : Math.min(Math.max(rawLimit, 1), 20);

  if (!userId) {
    return NextResponse.json(
      { error: { message: "userId is required." } },
      { status: 400 },
    );
  }

  if (mbti && !MBTI_MAP[mbti]) {
    return NextResponse.json(
      { error: { message: "지원하지 않는 MBTI입니다." } },
      { status: 400 },
    );
  }

  try {
    const payload = await getTrainingHistory(userId, mbti, limit);
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          message: error instanceof Error ? error.message : "훈련 기록을 불러오지 못했습니다.",
        },
      },
      { status: 500 },
    );
  }
}
