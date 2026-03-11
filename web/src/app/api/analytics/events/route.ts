import { NextResponse } from "next/server";
import { z } from "zod";

import { recordProductEvent } from "@/lib/analytics-store";

const requestSchema = z.object({
  eventName: z.enum([
    "history_opened",
    "next_round_clicked",
    "nickname_updated",
    "training_completed",
    "training_started",
    "training_submitted",
  ]),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
  targetMbti: z.string().trim().length(4).nullable().optional(),
  userId: z.string().trim().uuid().nullable().optional(),
});

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: z.infer<typeof requestSchema>;

  try {
    body = requestSchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { error: { message: "이벤트 형식이 올바르지 않습니다." } },
      { status: 400 },
    );
  }

  try {
    await recordProductEvent(body);
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          message: error instanceof Error ? error.message : "이벤트를 저장하지 못했습니다.",
        },
      },
      { status: 500 },
    );
  }
}
