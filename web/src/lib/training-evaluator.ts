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

  const toneScore = /고마워|배려|이해|괜찮|도와|함께|미안|조심/.test(answer) ? 10 : 4;
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
        ? `${mbtiCode} 성향에 맞는 표현과 구조가 비교적 안정적으로 보입니다.`
        : `${mbtiCode} 성향은 일부 드러나지만 표현을 더 부드럽고 선명하게 다듬을 여지가 있습니다.`,
    exemplarAnswer: `${prompt} 이 상황이라면 상대의 입장을 먼저 인정한 뒤, ${profile.tips[0]} 방식을 살려 핵심 요청을 간단히 전하고 마지막에 부담을 줄이는 문장을 덧붙여 보세요.`,
    keyPoints: [
      `${profile.code}에게는 "${profile.tips[0]}" 방식이 특히 효과적입니다.`,
      `${profile.keywords.slice(0, 2).join(", ")} 같은 키워드가 자연스럽게 드러나면 설득력이 높아집니다.`,
      "공감 또는 상황 인식, 핵심 요청, 부담을 줄이는 마무리의 3단 구조를 의식해 보세요.",
    ],
  };
}

function buildSystemPrompt(mbtiCode: string) {
  const profile = MBTI_MAP[mbtiCode];
  return [
    `당신은 MBTI 맞춤형 커뮤니케이션 코치입니다. 대상 MBTI는 ${mbtiCode} (${profile.label}) 입니다.`,
    `대상 MBTI 설명: ${profile.longDescription}`,
    `중요 포인트: ${profile.tips.join(", ")}`,
    "사용자 답변이 이 MBTI가 선호하는 말투와 구조에 얼마나 잘 맞는지 0~100점으로 평가하세요.",
    '반드시 JSON 객체만 반환하세요. 형식은 {"score": number, "summary": string, "exemplarAnswer": string, "keyPoints": string[]} 입니다.',
    "summary는 한두 문장, exemplarAnswer는 2~3문장, keyPoints는 정확히 3개를 작성하세요.",
    "모범 답안은 실제 메시지로 바로 쓸 수 있게 자연스러운 한국어로 작성하세요.",
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
          content: `상황: ${prompt}\n사용자 답변: ${answer}`,
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
