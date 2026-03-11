"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  type FormEvent,
  Suspense,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";

import { AppHeader, HeaderIconButton } from "@/components/app-chrome";
import { Icon } from "@/components/icon";
import { ensureAnonymousUser, type AnonymousUser } from "@/lib/anonymous-user";
import { MBTI_IMAGES } from "@/lib/mbti-images";
import { MBTI_MAP, type MbtiProfile } from "@/lib/mbti";
import { trackProductEvent } from "@/lib/product-analytics-client";
import {
  normalizeTrainingCategory,
  TRAINING_CATEGORY_LABELS,
  TRAINING_DIFFICULTY_LABELS,
  TRAINING_INTENT_LABELS,
  type TrainingCategory,
  type TrainingDifficulty,
  type TrainingIntent,
} from "@/lib/training";

type ArenaPhase = "intro" | "solving" | "result";

type SessionPayload = {
  angle: string;
  category: Exclude<TrainingCategory, "all">;
  difficulty: TrainingDifficulty;
  intent: TrainingIntent;
  sessionId: string;
  prompt: string;
  topic: string;
};

type StandingPayload = {
  attemptCount: number;
  bestScore: number;
  rank: number | null;
  totalScore: number;
};

type CurrentStandingPayload = {
  userId: string;
  displayName: string;
  mbti: StandingPayload | null;
  overall: StandingPayload | null;
};

type HistoryStatsPayload = {
  previousScore: number | null;
  recentAverageScore: number | null;
  recentCount: number;
  scoreDelta: number | null;
  streakCount: number;
};

type EvaluationPayload = {
  score: number;
  summary: string;
  exemplarAnswer: string;
  keyPoints: string[];
  model: string | null;
  responseSource: "ai" | "fallback";
  currentStanding?: CurrentStandingPayload;
  historyStats?: HistoryStatsPayload;
};

type ErrorPayload = {
  error?: {
    message?: string;
  };
};

const MBTI_STORAGE_KEY = "fftt.selected-mbti";
const CATEGORY_STORAGE_KEY = "fftt.selected-training-category";
const MAX_LENGTH = 300;
const LIMIT_SECONDS = 120;

const INTRO_HEADLINES: Record<string, string> = {
  INTJ: "논리적이고 구조적인 설득을 먼저 보여 주세요.",
  INTP: "생각을 넓혀 주는 유연한 문장을 연습해 보세요.",
  ENTJ: "목표와 실행이 보이는 메시지를 만들어 보세요.",
  ENTP: "재치와 관점을 살린 대화를 시도해 보세요.",
  INFJ: "진심과 배려가 느껴지는 표현을 만들어 보세요.",
  INFP: "부드럽고 따뜻한 진심을 문장에 담아 보세요.",
  ENFJ: "격려와 연결감을 주는 답장을 연습해 보세요.",
  ENFP: "밝고 생동감 있는 공감 표현을 써 보세요.",
  ISTJ: "정확하고 신뢰감 있는 문장을 만들어 보세요.",
  ISFJ: "안정감과 배려가 느껴지는 답장을 써 보세요.",
  ESTJ: "기준과 실행이 선명한 답장을 연습해 보세요.",
  ESFJ: "따뜻하고 조화로운 대화 방식을 시도해 보세요.",
  ISTP: "간결하고 실용적인 메시지를 만들어 보세요.",
  ISFP: "편안하고 자연스러운 말투를 연습해 보세요.",
  ESTP: "직설적이면서 활기 있는 표현을 써 보세요.",
  ESFP: "친근하고 분위기 좋은 대화를 만들어 보세요.",
};

function getResultSourceLabel(result: EvaluationPayload) {
  if (result.responseSource === "ai") {
    return result.model ? `AI 사용: ${result.model}` : "AI 사용";
  }

  if (result.model) {
    return `대체 평가 사용: ${result.model} 호출 실패`;
  }

  return "대체 평가 사용: API 키 미설정";
}

function formatScoreDelta(scoreDelta: number | null | undefined) {
  if (scoreDelta === null || scoreDelta === undefined) {
    return "첫 기록";
  }

  if (scoreDelta > 0) {
    return `+${scoreDelta}점`;
  }

  if (scoreDelta < 0) {
    return `${scoreDelta}점`;
  }

  return "변화 없음";
}

function TrainingArenaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mbti, setMbti] = useState<MbtiProfile | null>(null);
  const [user, setUser] = useState<AnonymousUser | null>(null);
  const [phase, setPhase] = useState<ArenaPhase>("intro");
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [category, setCategory] = useState<TrainingCategory>("all");
  const [answer, setAnswer] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(LIMIT_SECONDS);
  const [result, setResult] = useState<EvaluationPayload | null>(null);
  const [errorText, setErrorText] = useState("");
  const [isPending, startTransition] = useTransition();
  const hasExpiredRef = useRef(false);

  useEffect(() => {
    const codeFromQuery = searchParams.get("mbti");
    const categoryFromQuery = searchParams.get("category");
    const codeFromStorage =
      typeof window !== "undefined" ? window.localStorage.getItem(MBTI_STORAGE_KEY) : null;
    const categoryFromStorage =
      typeof window !== "undefined" ? window.localStorage.getItem(CATEGORY_STORAGE_KEY) : null;
    const selectedCode = (codeFromQuery ?? codeFromStorage ?? "").toUpperCase();
    const selectedMbti = MBTI_MAP[selectedCode];

    if (!selectedMbti) {
      router.replace("/training");
      return;
    }

    const nextCategory = normalizeTrainingCategory(categoryFromQuery ?? categoryFromStorage);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(MBTI_STORAGE_KEY, selectedMbti.code);
      window.localStorage.setItem(CATEGORY_STORAGE_KEY, nextCategory);
    }

    setMbti(selectedMbti);
    setCategory(nextCategory);
  }, [router, searchParams]);

  useEffect(() => {
    let cancelled = false;

    void ensureAnonymousUser()
      .then((anonymousUser) => {
        if (!cancelled) {
          setUser(anonymousUser);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setErrorText(
            error instanceof Error ? error.message : "사용자 정보를 준비하지 못했습니다.",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (phase !== "solving") {
      return;
    }

    const timer = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "solving" || secondsLeft > 0 || hasExpiredRef.current) {
      return;
    }

    hasExpiredRef.current = true;
    setResult({
      score: 0,
      summary: "시간이 종료되어 답변이 제출되지 않았습니다. 다음 문제에서 다시 도전해 보세요.",
      exemplarAnswer:
        "상황을 먼저 인정하고, 상대가 바로 이해할 수 있게 제안과 선택지를 간단히 정리해 보세요.",
      keyPoints: [
        "첫 문장에서 상대의 상황이나 감정을 먼저 짚어 주세요.",
        "핵심 요청은 두 문장 안에 분명하게 담아 주세요.",
        "마지막에는 부담을 줄이는 선택지나 여지를 남겨 주세요.",
      ],
      model: null,
      responseSource: "fallback",
      historyStats: result?.historyStats,
    });
    setPhase("result");
  }, [phase, result?.historyStats, secondsLeft]);

  function resetState() {
    setAnswer("");
    setErrorText("");
    setResult(null);
    setSession(null);
    setSecondsLeft(LIMIT_SECONDS);
    hasExpiredRef.current = false;
  }

  function startSession(options?: { skipIntro?: boolean }) {
    if (!mbti) {
      return;
    }

    resetState();

    startTransition(async () => {
      try {
        const response = await fetch("/api/training/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category,
            mbti: mbti.code,
            userId: user?.userId,
          }),
        });

        const payload = (await response.json()) as SessionPayload | ErrorPayload;
        if (!response.ok || !("prompt" in payload)) {
          const message = "error" in payload ? payload.error?.message : undefined;
          throw new Error(message ?? "문제를 불러오지 못했습니다.");
        }

        setSession(payload);
        setPhase("solving");

        if (options?.skipIntro) {
          await trackProductEvent({
            eventName: "next_round_clicked",
            metadata: {
              category: payload.category,
              difficulty: payload.difficulty,
              sessionId: payload.sessionId,
            },
            targetMbti: mbti.code,
            userId: user?.userId ?? null,
          });
        }
      } catch (error) {
        setErrorText(
          error instanceof Error ? error.message : "문제를 준비하는 중 오류가 발생했습니다.",
        );
      }
    });
  }

  function submitAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!mbti || !session || !answer.trim() || !user) {
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/training/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            angle: session.angle,
            userId: user.userId,
            sessionId: session.sessionId,
            mbti: mbti.code,
            prompt: session.prompt,
            answer,
            category: session.category,
            difficulty: session.difficulty,
            intent: session.intent,
            topic: session.topic,
          }),
        });

        const payload = (await response.json()) as EvaluationPayload | ErrorPayload;
        if (!response.ok || !("score" in payload)) {
          const message = "error" in payload ? payload.error?.message : undefined;
          throw new Error(message ?? "평가 결과를 불러오지 못했습니다.");
        }

        setResult(payload);
        setPhase("result");
      } catch (error) {
        setErrorText(error instanceof Error ? error.message : "평가 중 오류가 발생했습니다.");
      }
    });
  }

  function continueWithSameMbti() {
    resetState();
    setPhase("intro");
  }

  if (!mbti) {
    return null;
  }

  const progress = (secondsLeft / LIMIT_SECONDS) * 100;
  const scoreOffset = result
    ? 552.92 - (552.92 * Math.max(0, Math.min(result.score, 100))) / 100
    : 552.92;

  if (phase === "intro") {
    return (
      <>
        <AppHeader
          title={mbti.code}
          left={<HeaderIconButton href="/training/select" icon="arrow_back" label="뒤로 가기" />}
          right={<HeaderIconButton icon="info" label="안내" />}
        />

        <main className="app-screen app-page">
          <div className="app-content space-y-6 pb-8">
            <section className="app-card overflow-hidden">
              <div className="relative aspect-[4/3] bg-[var(--primary-soft)]">
                <Image
                  src={MBTI_IMAGES[mbti.code]}
                  alt={`${mbti.code} 대표 이미지`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 430px) 100vw, 430px"
                />
              </div>
              <div className="p-6">
                <div className="mb-4 flex flex-wrap gap-2">
                  <span className="app-chip bg-[var(--primary-soft)] text-[var(--primary)]">
                    {TRAINING_CATEGORY_LABELS[category]}
                  </span>
                  <span className="app-chip bg-[rgba(255,255,255,0.6)] text-[var(--ink)]">
                    난이도 자동 추천
                  </span>
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight text-[var(--ink)]">
                  {INTRO_HEADLINES[mbti.code]}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[rgba(27,23,13,0.64)]">
                  {mbti.longDescription}
                </p>
              </div>
            </section>

            <section className="app-card app-card--soft p-5">
              <div className="flex items-center gap-2">
                <Icon name="psychology" className="text-[20px] text-[var(--primary)]" />
                <h3 className="text-lg font-extrabold text-[var(--ink)]">핵심 키워드</h3>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {mbti.keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[var(--ink)]"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-sm leading-7 text-[rgba(27,23,13,0.66)]">{mbti.summary}</p>
            </section>

            <section className="app-card app-card--soft p-3">
              <div className="mb-3 flex items-center gap-2 px-2">
                <Icon name="forum" className="text-[20px] text-[var(--primary)]" />
                <h3 className="text-lg font-extrabold text-[var(--ink)]">
                  이렇게 말하면 좋습니다
                </h3>
              </div>
              <div className="rounded-[22px] border border-[rgba(27,23,13,0.05)] bg-[rgba(255,255,255,0.42)] px-4 py-4">
                <ol className="space-y-3">
                  {mbti.tips.map((tip, index) => (
                    <li key={tip} className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-extrabold text-white">
                        {index + 1}
                      </span>
                      <p className="pt-0.5 text-sm leading-6 text-[var(--ink)]">{tip}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </section>

            {errorText ? (
              <p className="rounded-[20px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-[var(--danger)]">
                {errorText}
              </p>
            ) : null}

            <button
              type="button"
              onClick={() => startSession()}
              disabled={isPending}
              className="app-primary-button"
            >
              {isPending ? "문제를 준비하고 있습니다..." : "이어서 훈련하기"}
            </button>
          </div>
        </main>
      </>
    );
  }

  if (phase === "solving") {
    return (
      <>
        <AppHeader
          title={mbti.code}
          left={<HeaderIconButton href="/training/select" icon="arrow_back" label="뒤로 가기" />}
          right={<HeaderIconButton icon="info" label="안내" />}
        />

        <main className="app-screen app-page">
          <div className="app-content space-y-6 pb-10">
            <section className="app-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-[var(--primary)]">
                    제한 시간
                  </p>
                  <p className="mt-1 text-sm font-medium text-[rgba(27,23,13,0.58)]">
                    2분 안에 상대가 편안하게 받아들일 답장을 작성해 보세요.
                  </p>
                </div>
                <span className="rounded-full bg-[var(--primary-soft)] px-3 py-1 text-sm font-bold text-[var(--primary)]">
                  {secondsLeft}s
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-[var(--background-strong)] px-3 py-1 text-xs font-bold text-[var(--ink)]">
                  {session ? TRAINING_CATEGORY_LABELS[session.category] : ""}
                </span>
                <span className="rounded-full bg-[var(--background-strong)] px-3 py-1 text-xs font-bold text-[var(--ink)]">
                  {session ? TRAINING_DIFFICULTY_LABELS[session.difficulty] : ""}
                </span>
                <span className="rounded-full bg-[var(--background-strong)] px-3 py-1 text-xs font-bold text-[var(--ink)]">
                  {session ? TRAINING_INTENT_LABELS[session.intent] : ""}
                </span>
              </div>

              <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#e7e0d2]">
                <div
                  className="h-full rounded-full bg-[var(--primary)] transition-[width] duration-1000"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </section>

            <section className="app-card p-5">
              <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-[var(--primary)]">
                주제
              </p>
              <p className="mt-2 text-lg font-extrabold text-[var(--ink)]">{session?.topic}</p>
              <p className="mt-2 text-sm leading-6 text-[rgba(27,23,13,0.62)]">
                {session?.angle}
              </p>
            </section>

            <form onSubmit={submitAnswer} className="space-y-4">
              <section className="app-card p-5">
                <h2 className="text-lg font-extrabold leading-tight text-[var(--ink)]">
                  {session?.prompt}
                </h2>

                <div className="mt-5">
                  <div className="mb-3 flex items-center justify-between px-1">
                    <label className="text-sm font-bold text-[var(--ink)]">답변 작성</label>
                    <span className="text-xs font-medium text-[rgba(27,23,13,0.42)]">
                      짧지만 분명하게 작성해 주세요
                    </span>
                  </div>
                  <div className="relative">
                    <textarea
                      value={answer}
                      onChange={(event) => setAnswer(event.target.value.slice(0, MAX_LENGTH))}
                      disabled={isPending}
                      className="app-textarea"
                      maxLength={MAX_LENGTH}
                      placeholder="상대가 편안하게 받아들일 답장을 작성해 보세요."
                    />
                    <div className="absolute bottom-4 right-4 rounded-full border border-[var(--line)] bg-[rgba(248,247,246,0.94)] px-3 py-1">
                      <span className="text-xs font-bold text-[var(--ink)]">{answer.length}</span>
                      <span className="text-[10px] text-[rgba(27,23,13,0.4)]">
                        {" "}/ {MAX_LENGTH}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {errorText ? (
                <p className="rounded-[20px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-[var(--danger)]">
                  {errorText}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={!answer.trim() || isPending}
                className="app-primary-button"
              >
                <Icon name="send" className="text-[22px]" />
                {isPending ? "제출 중..." : "제출하기"}
              </button>
            </form>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <AppHeader
        title="훈련 결과"
        left={<HeaderIconButton href="/training" icon="arrow_back" label="뒤로 가기" />}
      />

      <main className="app-screen app-page">
        <div className="app-content flex min-h-[calc(100dvh-88px)] flex-col pb-8">
          <section className="px-2 py-6 text-center">
            <div className="app-score-ring">
              <svg viewBox="0 0 192 192" aria-hidden="true">
                <circle cx="96" cy="96" r="88" stroke="rgba(238,173,43,0.12)" strokeWidth="12" />
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="var(--primary)"
                  strokeWidth="12"
                  strokeDasharray="552.92"
                  strokeDashoffset={scoreOffset}
                />
              </svg>
              <div className="relative flex flex-col items-center">
                <span className="text-5xl font-extrabold tracking-tight text-[var(--ink)]">
                  {result?.score ?? 0}
                </span>
                <span className="font-semibold text-[var(--primary)]">/ 100</span>
              </div>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-[var(--ink)]">
              {(result?.score ?? 0) >= 80 ? "좋은 방향입니다" : "다음 문제에서 더 좋아질 수 있어요"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[rgba(27,23,13,0.48)]">{result?.summary}</p>
          </section>

          <section className="app-card p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Icon name="auto_awesome" className="text-[var(--primary)]" filled />
                <h3 className="font-extrabold text-[var(--ink)]">코칭 요약</h3>
              </div>
              <div className="rounded-full bg-[var(--primary-soft)] px-3 py-1 text-[11px] font-bold text-[var(--primary)]">
                {result ? getResultSourceLabel(result) : ""}
              </div>
            </div>
            <p className="text-sm leading-7 text-[rgba(27,23,13,0.68)]">{result?.summary}</p>
          </section>

          {result?.historyStats ? (
            <section className="mt-6 grid grid-cols-3 gap-3">
              <article className="app-card p-4">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[var(--muted)]">
                  streak
                </p>
                <p className="mt-2 text-2xl font-extrabold text-[var(--ink)]">
                  {result.historyStats.streakCount}
                </p>
                <p className="mt-1 text-xs text-[rgba(27,23,13,0.58)]">연속 플레이 일수</p>
              </article>
              <article className="app-card p-4">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[var(--muted)]">
                  avg 5
                </p>
                <p className="mt-2 text-2xl font-extrabold text-[var(--ink)]">
                  {result.historyStats.recentAverageScore ?? "-"}
                </p>
                <p className="mt-1 text-xs text-[rgba(27,23,13,0.58)]">최근 5회 평균</p>
              </article>
              <article className="app-card p-4">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[var(--muted)]">
                  delta
                </p>
                <p className="mt-2 text-xl font-extrabold text-[var(--ink)]">
                  {formatScoreDelta(result.historyStats.scoreDelta)}
                </p>
                <p className="mt-1 text-xs text-[rgba(27,23,13,0.58)]">
                  이전 {result.historyStats.previousScore ?? "-"}점 대비
                </p>
              </article>
            </section>
          ) : null}

          {result?.currentStanding ? (
            <section className="mt-6 app-card p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-[var(--primary)]">
                    Ranking
                  </p>
                  <h3 className="mt-2 text-lg font-extrabold text-[var(--ink)]">
                    {result.currentStanding.displayName}
                  </h3>
                </div>
                <Link
                  href="/rank"
                  className="rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-bold text-[var(--primary)]"
                >
                  랭킹 보기
                </Link>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-[20px] border border-[var(--line-strong)] bg-[var(--primary-soft)] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                    overall
                  </p>
                  <p className="mt-2 text-2xl font-extrabold text-[var(--ink)]">
                    #{result.currentStanding.overall?.rank ?? "-"}
                  </p>
                  <p className="mt-1 text-sm text-[rgba(27,23,13,0.62)]">
                    누적 {result.currentStanding.overall?.totalScore ?? 0}점
                  </p>
                </div>
                <div className="rounded-[20px] border border-[var(--line-strong)] bg-[var(--primary-soft)] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                    {mbti?.code ?? "MBTI"}
                  </p>
                  <p className="mt-2 text-2xl font-extrabold text-[var(--ink)]">
                    #{result.currentStanding.mbti?.rank ?? "-"}
                  </p>
                  <p className="mt-1 text-sm text-[rgba(27,23,13,0.62)]">
                    최고 {result.currentStanding.mbti?.bestScore ?? 0}점
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-[rgba(27,23,13,0.66)]">
                총 {result.currentStanding.overall?.attemptCount ?? 0}회 플레이했고 이번 점수가 랭킹에 반영되었습니다.
              </p>
            </section>
          ) : null}

          <section className="mt-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-extrabold text-[var(--ink)]">
              <Icon name="checklist" className="text-[var(--primary)]" />
              개선 포인트
            </h3>
            <div className="space-y-3">
              {result?.keyPoints.map((item, index) => (
                <div
                  key={item}
                  className={`rounded-[18px] border p-4 ${
                    index < 2
                      ? "border-[var(--line-strong)] bg-[var(--primary-soft)]"
                      : "border-[var(--line)] bg-[rgba(255,255,255,0.4)] opacity-70"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Icon
                      name={index < 2 ? "check_circle" : "radio_button_unchecked"}
                      className="mt-0.5 text-[var(--primary)]"
                    />
                    <p className="text-sm font-semibold leading-6 text-[var(--ink)]">{item}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-extrabold text-[var(--ink)]">
              <Icon name="menu_book" className="text-[var(--primary)]" />
              예시 답변
            </h3>
            <div className="relative overflow-hidden rounded-[24px] bg-[var(--primary-soft)] p-5">
              <Icon
                name="format_quote"
                className="absolute right-3 top-3 text-6xl text-[rgba(27,23,13,0.08)]"
              />
              <p className="relative z-10 text-sm italic leading-7 text-[var(--ink)]">
                {result?.exemplarAnswer}
              </p>
            </div>
          </section>

          <section className="mt-auto space-y-3 pt-8">
            <button
              type="button"
              onClick={() => startSession({ skipIntro: true })}
              className="app-primary-button"
            >
              다음 문제 바로 풀기
            </button>
            <button
              type="button"
              onClick={continueWithSameMbti}
              className="app-secondary-button"
            >
              같은 MBTI 계속 훈련
            </button>
            <Link
              href="/training/select"
              className="app-secondary-button border-transparent bg-[rgba(255,255,255,0.5)]"
            >
              다른 MBTI로 바꾸기
            </Link>
          </section>
        </div>
      </main>
    </>
  );
}

export default function TrainingArenaPage() {
  return (
    <Suspense fallback={null}>
      <TrainingArenaContent />
    </Suspense>
  );
}
