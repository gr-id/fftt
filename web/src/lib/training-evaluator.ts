import OpenAI from "openai";
import { z } from "zod";

import { MBTI_MAP } from "@/lib/mbti";

const MODEL =
  process.env.GEMINI_MODEL ?? process.env.OPENAI_MODEL ?? "gemini-2.5-flash";
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/";

const evaluationSchema = z.object({
  score: z.number().min(0).max(100),
  summary: z.string().trim().min(1).max(240),
  exemplarAnswer: z.string().trim().min(1).max(320),
  keyPoints: z.array(z.string().trim().min(1).max(120)).min(3).max(3),
});

type EvaluationPayload = z.infer<typeof evaluationSchema>;

export type EvaluationResult = EvaluationPayload & {
  model: string | null;
  responseSource: "ai" | "fallback";
};

function pickSentenceScore(answer: string) {
  const sentences = answer
    .split(/[.!?\n]/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (sentences.length >= 2 && sentences.length <= 4) return 8;
  if (sentences.length === 1 || sentences.length === 5) return 5;
  return 2;
}

function buildFallbackResult(
  mbtiCode: string,
  prompt: string,
  answer: string,
): EvaluationPayload {
  const profile = MBTI_MAP[mbtiCode];
  const normalized = answer.toLowerCase();
  const matches = profile.keywords.filter((keyword) =>
    normalized.includes(keyword.toLowerCase()),
  );

  const toneScore = /감사|괜찮|좋겠|부담|배려|함께|천천히/.test(answer) ? 10 : 4;
  const lengthScore = Math.min(20, Math.round((answer.trim().length / 300) * 20));
  const keywordScore = Math.min(30, matches.length * 8);
  const sentenceScore = pickSentenceScore(answer);
  const clarityScore = /[,.!?]/.test(answer) ? 8 : 4;
  const score = Math.min(
    100,
    28 + toneScore + lengthScore + keywordScore + sentenceScore + clarityScore,
  );

  return {
    score,
    summary:
      score >= 85
        ? `${mbtiCode} 성향에 맞는 어조와 구조가 비교적 안정적으로 드러났습니다.`
        : `${mbtiCode} 방향성은 보였지만 표현의 선명도와 배려의 밀도를 더 높일 여지가 있습니다.`,
    exemplarAnswer: `${prompt} 이 상황이라면 상대의 입장을 먼저 인정한 뒤, ${profile.tips[0]} 흐름으로 핵심 요청을 짧게 전하고, 마지막에 부담 없는 선택지를 덧붙이는 답변이 좋습니다.`,
    keyPoints: [
      `${profile.code} 관점에서는 ${profile.tips[0]} 방식이 먼저 보여야 합니다.`,
      `${profile.keywords.slice(0, 2).join(", ")} 같은 성향 키워드가 답변 안에 드러나면 설득력이 높아집니다.`,
      "첫 문장은 공감 또는 상황 정리, 둘째 문장은 핵심 제안, 마지막 문장은 여지를 남기는 흐름이 좋습니다.",
    ],
  };
}

function buildSystemPrompt(mbtiCode: string) {
  const profile = MBTI_MAP[mbtiCode];
  return [
    `너는 MBTI 맞춤형 답변 훈련 평가자다. 대상 MBTI는 ${mbtiCode} (${profile.label})다.`,
    `이 MBTI 설명: ${profile.longDescription}`,
    `중요 포인트: ${profile.tips.join(", ")}`,
    "사용자 답변이 이 MBTI가 선호할 어조와 구조에 얼마나 맞는지 0~100점으로 평가한다.",
    '반드시 JSON 객체만 반환한다. 형식은 {"score": number, "summary": string, "exemplarAnswer": string, "keyPoints": string[]}',
    "summary는 한 문장, exemplarAnswer는 2~3문장, keyPoints는 정확히 3개의 항목으로 작성한다.",
    "모범답안은 질문에 바로 사용할 수 있는 자연스러운 한국어 예시로 작성한다.",
  ].join(" ");
}

export async function evaluateTrainingAnswer(
  mbtiCode: string,
  prompt: string,
  answer: string,
): Promise<EvaluationResult> {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      ...buildFallbackResult(mbtiCode, prompt, answer),
      model: null,
      responseSource: "fallback",
    };
  }

  try {
    const client = new OpenAI({
      apiKey,
      baseURL: GEMINI_BASE_URL,
    });

    const completion = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.5,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildSystemPrompt(mbtiCode) },
        {
          role: "user",
          content: `질문: ${prompt}\n사용자 답변: ${answer}`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return {
        ...buildFallbackResult(mbtiCode, prompt, answer),
        model: MODEL,
        responseSource: "fallback",
      };
    }

    return {
      ...evaluationSchema.parse(JSON.parse(content)),
      model: MODEL,
      responseSource: "ai",
    };
  } catch {
    return {
      ...buildFallbackResult(mbtiCode, prompt, answer),
      model: MODEL,
      responseSource: "fallback",
    };
  }
}
