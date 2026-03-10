import { z } from "zod";

import { failure, parseJsonWithSchema, success } from "@/lib/api-contract";
import { MBTI_MAP } from "@/lib/mbti";
import { evaluateTrainingAnswer } from "@/lib/training-evaluator";

const requestSchema = z.object({
  mbti: z.string().trim().length(4),
  prompt: z.string().trim().min(1).max(400),
  answer: z.string().trim().min(1).max(300),
});

export async function POST(request: Request) {
  const parsed = await parseJsonWithSchema(request, requestSchema);
  if (!parsed.ok) {
    return failure(
      "INVALID_INPUT",
      "MBTI, 질문, 답변을 올바르게 전달해 주세요.",
      400,
    );
  }

  const mbtiCode = parsed.data.mbti.toUpperCase();
  if (!MBTI_MAP[mbtiCode]) {
    return failure("INVALID_MBTI", "지원하지 않는 MBTI입니다.", 400);
  }

  const result = await evaluateTrainingAnswer(
    mbtiCode,
    parsed.data.prompt,
    parsed.data.answer,
  );

  return success(result, {
    legacy: result,
    headers: { "Cache-Control": "no-store" },
  });
}
