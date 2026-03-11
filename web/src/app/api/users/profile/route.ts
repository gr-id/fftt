import { NextResponse } from "next/server";
import { z } from "zod";

import { recordProductEvent } from "@/lib/analytics-store";
import { updateUserDisplayName } from "@/lib/ranking-store";

const DISPLAY_NAME_REGEX = /^[0-9A-Za-z가-힣 ]+$/;

const requestSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2)
    .max(24)
    .refine((value) => DISPLAY_NAME_REGEX.test(value), {
      message: "닉네임은 한글, 영문, 숫자, 공백만 사용할 수 있습니다.",
    }),
  userId: z.string().trim().uuid(),
});

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  let body: z.infer<typeof requestSchema>;

  try {
    body = requestSchema.parse(await request.json());
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.issues[0]?.message ?? "닉네임 형식이 올바르지 않습니다."
        : "닉네임 형식이 올바르지 않습니다.";

    return NextResponse.json({ error: { message } }, { status: 400 });
  }

  try {
    const payload = await updateUserDisplayName(body);
    await recordProductEvent({
      eventName: "nickname_updated",
      metadata: {
        displayNameLength: body.displayName.length,
      },
      userId: body.userId,
    });

    return NextResponse.json(payload, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          message: error instanceof Error ? error.message : "닉네임을 저장하지 못했습니다.",
        },
      },
      { status: 500 },
    );
  }
}
