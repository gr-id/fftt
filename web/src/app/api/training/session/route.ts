import { z } from "zod";

import { failure, parseJsonWithSchema, success } from "@/lib/api-contract";
import { MBTI_MAP } from "@/lib/mbti";
import { TOPIC_BANK } from "@/lib/training";

const requestSchema = z.object({
  mbti: z.string().trim().length(4),
});

export async function POST(request: Request) {
  const parsed = await parseJsonWithSchema(request, requestSchema);
  if (!parsed.ok) {
    return failure("INVALID_INPUT", "올바른 MBTI를 전달해주세요.", 400);
  }

  const mbtiCode = parsed.data.mbti.toUpperCase();
  if (!MBTI_MAP[mbtiCode]) {
    return failure("INVALID_MBTI", "지원하지 않는 MBTI입니다.", 400);
  }

  const randomTopic = TOPIC_BANK[Math.floor(Math.random() * TOPIC_BANK.length)];

  return success(randomTopic, {
    legacy: randomTopic,
    headers: { "Cache-Control": "no-store" },
  });
}
