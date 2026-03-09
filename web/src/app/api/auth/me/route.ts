import { NextResponse } from "next/server";

import { getAppEnv } from "@/lib/app-env";
import { getUserAuthState } from "@/lib/ranking-store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = (searchParams.get("userId") ?? "").trim();

  if (!userId) {
    return NextResponse.json(
      { error: { message: "userId is required." } },
      { status: 400 },
    );
  }

  try {
    const payload = await getUserAuthState(userId, getAppEnv());
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          message: error instanceof Error ? error.message : "Unable to load auth state.",
        },
      },
      { status: 500 },
    );
  }
}
