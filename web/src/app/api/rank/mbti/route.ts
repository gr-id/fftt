import { NextResponse } from "next/server";

import { getMbtiLeaderboard } from "@/lib/ranking-store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mbti = (searchParams.get("mbti") ?? "").trim().toUpperCase();
  const rawLimit = Number.parseInt(searchParams.get("limit") ?? "20", 10);
  const limit = Number.isNaN(rawLimit) ? 20 : Math.min(Math.max(rawLimit, 1), 100);

  if (!mbti) {
    return NextResponse.json(
      { error: { message: "mbti is required." } },
      { status: 400 },
    );
  }

  try {
    const entries = await getMbtiLeaderboard(mbti, limit);
    return NextResponse.json(
      { entries, mbti },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          message: error instanceof Error ? error.message : "Unable to load rankings.",
        },
      },
      { status: 500 },
    );
  }
}
