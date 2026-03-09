import { NextResponse } from "next/server";
import { z } from "zod";

import { getAppEnv } from "@/lib/app-env";
import { firebaseAuth } from "@/lib/firebase-admin";
import { linkGoogleIdentity } from "@/lib/ranking-store";

export const runtime = "nodejs";

const requestSchema = z.object({
  idToken: z.string().trim().min(1),
  userId: z.string().trim().uuid(),
});

export async function POST(request: Request) {
  if (getAppEnv() !== "production") {
    return NextResponse.json(
      { error: { message: "Google SSO linking is only available in production." } },
      { status: 403 },
    );
  }

  let body: z.infer<typeof requestSchema>;
  try {
    body = requestSchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { error: { message: "userId and idToken are required." } },
      { status: 400 },
    );
  }

  try {
    const decoded = await firebaseAuth.verifyIdToken(body.idToken);
    if (!decoded.sub) {
      throw new Error("Google account identifier is missing.");
    }

    const payload = await linkGoogleIdentity({
      googleDisplayName: decoded.name ?? null,
      googleSub: decoded.sub,
      userId: body.userId,
    });

    return NextResponse.json(payload, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          message: error instanceof Error ? error.message : "Unable to link Google account.",
        },
      },
      { status: 500 },
    );
  }
}
