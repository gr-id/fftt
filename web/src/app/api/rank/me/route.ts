import { NextResponse } from "next/server";

import { getCurrentStanding } from "@/lib/ranking-store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = (searchParams.get("userId") ?? "").trim();
  const mbti = (searchParams.get("mbti") ?? "").trim().toUpperCase() || null;

  if (!userId) {
    return NextResponse.json(
      { error: { message: "userId is required." } },
      { status: 400 },
    );
  }

  try {
    const standing = await getCurrentStanding(userId, mbti);
    return NextResponse.json(standing, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          message: error instanceof Error ? error.message : "Unable to load standing.",
        },
      },
      { status: 500 },
    );
  }
}
