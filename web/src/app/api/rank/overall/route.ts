import { NextResponse } from "next/server";

import { getOverallLeaderboard } from "@/lib/ranking-store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawLimit = Number.parseInt(searchParams.get("limit") ?? "20", 10);
  const limit = Number.isNaN(rawLimit) ? 20 : Math.min(Math.max(rawLimit, 1), 100);

  try {
    const entries = await getOverallLeaderboard(limit);
    return NextResponse.json(
      { entries },
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
