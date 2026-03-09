import { NextResponse } from "next/server";
import { z } from "zod";

import { createOrRestoreAnonymousUser } from "@/lib/ranking-store";

export const runtime = "nodejs";

const requestSchema = z.object({
  anonymousToken: z.string().trim().uuid().nullable().optional(),
});

export async function POST(request: Request) {
  let body: z.infer<typeof requestSchema>;

  try {
    body = requestSchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { error: { message: "Invalid anonymous user request." } },
      { status: 400 },
    );
  }

  try {
    const session = await createOrRestoreAnonymousUser(body.anonymousToken ?? null);
    return NextResponse.json(session, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          message:
            error instanceof Error ? error.message : "Unable to create an anonymous user.",
        },
      },
      { status: 500 },
    );
  }
}
