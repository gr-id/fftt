import { NextResponse } from "next/server";
import { z } from "zod";

import { getAppEnv } from "@/lib/app-env";
import { mockLinkGoogleIdentity } from "@/lib/ranking-store";

export const runtime = "nodejs";

const requestSchema = z.object({
  userId: z.string().trim().uuid(),
});

export async function POST(request: Request) {
  if (getAppEnv() !== "stage") {
    return NextResponse.json(
      { error: { message: "Mock Google linking is only available in stage." } },
      { status: 403 },
    );
  }

  let body: z.infer<typeof requestSchema>;
  try {
    body = requestSchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { error: { message: "userId is required." } },
      { status: 400 },
    );
  }

  try {
    const payload = await mockLinkGoogleIdentity(body.userId);
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          message: error instanceof Error ? error.message : "Unable to mock-link Google account.",
        },
      },
      { status: 500 },
    );
  }
}
