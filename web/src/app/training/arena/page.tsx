"use client";

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
import { MBTI_MAP, type MbtiProfile } from "@/lib/mbti";

type ArenaPhase = "intro" | "solving" | "result";

type SessionPayload = {
  prompt: string;
  topic: string;
  angle: string;
};

type EvaluationPayload = {
  score: number;
  summary: string;
  exemplarAnswer: string;
  keyPoints: string[];
  model: string | null;
  responseSource: "ai" | "fallback";
};

type ErrorPayload = {
  error?: {
    message?: string;
  };
};

const STORAGE_KEY = "fftt.selected-mbti";
const MAX_LENGTH = 500;
const LIMIT_SECONDS = 90;
const HERO_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAKIu7rnyIwsXT6Q5m5AjIfu62tnpNW79t0b4Ev86WNWld00OCkEoylo_tV8AqNPy-eMBCRH-h-OxHSKd7gq8A4PwD4QMCpn_m3fJFzc1Z8qTLrHbUaPb3VpAFGvwIZ60y-MotYME4ZsYecLg50UY5okrdXVxXcrFP-wwCgJqAMQSd3_krBOzGTZyFzi4Gvh_F-XVc1j9p3PjLJDb2feiIhLuxiTvy1SfmaOW1UuMGQjNkh0k4bd1FyJcr0rOu9C2gOp646uayqKs8";

function formatUnit(value: number) {
  return String(value).padStart(2, "0");
}

type ImprovementItem = {
  title: string;
  description: string;
  completed: boolean;
};

function buildImprovementItems(points: string[] | undefined): ImprovementItem[] {
  if (!points?.length) return [];

  return points.map((point, index) => {
    const normalized = point.trim();
    const colonIndex = normalized.indexOf(":");

    if (colonIndex > 0) {
      const title = normalized.slice(0, colonIndex).trim();
      const description = normalized.slice(colonIndex + 1).trim();

      return {
        title,
        description: description || normalized,
        completed: index < 2,
      };
    }

    const sentenceSplit = normalized.split(/(?<=[.!?])\s+/);
    if (sentenceSplit.length > 1) {
      return {
        title: sentenceSplit[0].trim(),
        description: sentenceSplit.slice(1).join(" ").trim() || normalized,
        completed: index < 2,
      };
    }

    return {
      title: normalized,
      description: normalized,
      completed: index < 2,
    };
  });
}

function getPartnerMbti(angle: string | undefined) {
  if (!angle) return "상대";
  const match = angle.toUpperCase().match(/\b[A-Z]{4}\b/);
  return match?.[0] ?? "상대";
}

function ResultBottomNav() {
  return (
    <nav className="app-bottom-nav" aria-label="결과 하단 메뉴">
      <div className="app-screen app-bottom-nav__inner">
        <Link href="/" className="app-bottom-nav__item">
          <span className="app-bottom-nav__icon">
            <Icon name="home" className="text-[24px]" />
          </span>
          <span>홈</span>
        </Link>
        <Link href="/training" className="app-bottom-nav__item">
          <span className="app-bottom-nav__icon">
            <Icon name="menu_book" className="text-[24px]" />
          </span>
          <span>학습</span>
        </Link>
        <span className="app-bottom-nav__item is-active" aria-current="page">
          <span className="app-bottom-nav__icon is-active">
            <Icon name="bar_chart" className="text-[24px]" filled />
          </span>
          <span>결과</span>
        </span>
        <span className="app-bottom-nav__item">
          <span className="app-bottom-nav__icon">
            <Icon name="settings" className="text-[24px]" />
          </span>
          <span>설정</span>
        </span>
      </div>
    </nav>
  );
}

function TrainingArenaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mbti, setMbti] = useState<MbtiProfile | null>(null);
  const [phase, setPhase] = useState<ArenaPhase>("intro");
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [answer, setAnswer] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(LIMIT_SECONDS);
  const [result, setResult] = useState<EvaluationPayload | null>(null);
  const [errorText, setErrorText] = useState("");
  const [isPending, startTransition] = useTransition();
  const hasExpiredRef = useRef(false);

  useEffect(() => {
    const codeFromQuery = searchParams.get("mbti");
    const codeFromStorage =
      typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    const selectedCode = (codeFromQuery ?? codeFromStorage ?? "").toUpperCase();
    const selectedMbti = MBTI_MAP[selectedCode];

    if (!selectedMbti) {
      router.replace("/training/select");
      return;
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, selectedMbti.code);
    }

    setMbti(selectedMbti);
  }, [router, searchParams]);

  useEffect(() => {
    if (phase !== "solving") return;

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
    if (phase !== "solving" || secondsLeft > 0 || hasExpiredRef.current) return;

    hasExpiredRef.current = true;
    setResult({
      score: 0,
      summary:
        "시간이 종료되어 답변이 제출되지 않았습니다. 다음 문제에서 다시 도전해보세요.",
      exemplarAnswer:
        "상대 상황을 먼저 인정하고, 핵심 제안을 짧고 분명하게 전한 뒤 선택지를 덧붙이는 답변이 좋습니다.",
      keyPoints: [
        "첫 문장에서 상대의 감정이나 상황을 먼저 짚어주세요.",
        "요청이나 제안은 두 문장 안에서 명확하게 전달해주세요.",
        "마무리에는 부담을 줄이는 선택지나 여지를 덧붙여주세요.",
      ],
      model: null,
      responseSource: "fallback",
    });
    setPhase("result");
  }, [phase, secondsLeft]);

  function resetState() {
    setAnswer("");
    setErrorText("");
    setResult(null);
    setSession(null);
    setSecondsLeft(LIMIT_SECONDS);
    hasExpiredRef.current = false;
  }

  function startSession() {
    if (!mbti) return;

    resetState();

    startTransition(async () => {
      try {
        const response = await fetch("/api/training/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mbti: mbti.code }),
        });

        const payload = (await response.json()) as SessionPayload | ErrorPayload;
        if (!response.ok || !("prompt" in payload)) {
          const message = "error" in payload ? payload.error?.message : undefined;
          throw new Error(message ?? "문제를 불러오지 못했습니다.");
        }

        setSession(payload);
        setPhase("solving");
      } catch (error) {
        setErrorText(
          error instanceof Error ? error.message : "문제를 준비하는 중 오류가 발생했습니다.",
        );
      }
    });
  }

  function submitAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!mbti || !session || !answer.trim()) return;

    startTransition(async () => {
      try {
        const response = await fetch("/api/training/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mbti: mbti.code,
            prompt: session.prompt,
            answer,
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

  if (!mbti) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progress = (secondsLeft / LIMIT_SECONDS) * 100;
  const remainingTimeLabel = `${formatUnit(minutes)}:${formatUnit(seconds)}`;
  const partnerMbti = getPartnerMbti(session?.angle);
  const improvementItems = buildImprovementItems(result?.keyPoints);
  const scoreOffset = result
    ? 552.92 - (552.92 * Math.max(0, Math.min(result.score, 100))) / 100
    : 552.92;

  if (phase === "intro") {
    return (
      <>
        <AppHeader
          title={mbti.code}
          subtitle="training arena"
          left={<HeaderIconButton href="/training/select" icon="arrow_back" label="뒤로 가기" />}
          right={<HeaderIconButton icon="info" label="안내" />}
        />

        <main className="app-screen app-page">
          <div className="app-content space-y-6 pb-8">
            <section className="app-card overflow-hidden">
              <div
                className="h-52 bg-cover bg-center"
                style={{ backgroundImage: `url('${HERO_IMAGE}')` }}
              />
              <div className="p-6">
                <div className="app-chip mb-3">
                  <Icon name="chat_bubble" className="text-base" />
                  의사소통 챌린지
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight text-[var(--ink)]">
                  {mbti.code}와 대화할 때 더 자연스러운 답변을 훈련합니다
                </h2>
                <p className="mt-3 text-sm leading-7 text-[rgba(27,23,13,0.64)]">
                  {mbti.longDescription}
                </p>
              </div>
            </section>

            <section className="app-card app-card--soft p-3">
              <div className="space-y-3">
                {mbti.tips.map((tip) => (
                  <article
                    key={tip}
                    className="rounded-[22px] border border-[rgba(27,23,13,0.05)] bg-[rgba(255,255,255,0.42)] px-4 py-4"
                  >
                    <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--primary)]">
                      tip
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--ink)]">{tip}</p>
                  </article>
                ))}
              </div>
            </section>

            {errorText ? (
              <p className="rounded-[20px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-[var(--danger)]">
                {errorText}
              </p>
            ) : null}

            <button
              type="button"
              onClick={startSession}
              disabled={isPending}
              className="app-primary-button"
            >
              {isPending ? "문제를 준비하고 있어요..." : "트레이닝 시작하기"}
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
          <div className="app-content space-y-7 pb-12">
            <section className="app-card overflow-hidden">
              <div
                className="h-80 bg-cover bg-center"
                style={{ backgroundImage: `url('${HERO_IMAGE}')` }}
              />
              <div className="p-7">
                <h2 className="text-[42px] font-extrabold leading-[1.22] tracking-[-0.02em] text-[var(--ink)]">
                  상황: {session?.topic}
                </h2>
                <p className="mt-6 text-[22px] font-medium leading-[1.55] text-[rgba(27,23,13,0.72)]">
                  {session?.prompt}
                </p>
              </div>
            </section>

            <section className="space-y-2 px-1">
              <div className="space-y-2">
                <div className="flex items-end justify-between px-1">
                  <span className="text-2xl font-extrabold tracking-tight text-[var(--muted)]">
                    남은 시간
                  </span>
                  <span className="text-5xl font-black tracking-tight text-[var(--primary)]">{remainingTimeLabel}</span>
                </div>
                <div className="h-5 overflow-hidden rounded-full bg-[#d9dde5]">
                  <div
                    className="h-full rounded-full bg-[var(--primary)] transition-[width] duration-1000"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </section>

            <form onSubmit={submitAnswer} className="space-y-3">
              <div className="px-1 pt-1">
                <label className="text-[17px] font-bold tracking-[-0.01em] text-[var(--ink)]">
                  <span className="text-[var(--primary)]">{partnerMbti}</span>는 어떤 답변을 좋아할까요?
                </label>
              </div>
              <div className="relative">
                <textarea
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value.slice(0, MAX_LENGTH))}
                  disabled={isPending}
                  className="app-textarea"
                  maxLength={MAX_LENGTH}
                  placeholder="여기에 답변을 입력하세요..."
                />
                <div className="absolute bottom-5 right-5 rounded-full border border-[var(--line)] bg-[rgba(248,247,246,0.96)] px-4 py-1.5">
                  <span className="text-[34px] font-extrabold tracking-tight text-[var(--ink)]">{answer.length}</span>
                  <span className="ml-2 text-base text-[rgba(27,23,13,0.36)]">/ {MAX_LENGTH}자</span>
                </div>
              </div>

              {errorText ? (
                <p className="rounded-[20px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-[var(--danger)]">
                  {errorText}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={!answer.trim() || isPending}
                className="app-primary-button mt-7 min-h-[70px] rounded-[24px] text-[22px]"
              >
                <Icon name="send" className="text-[22px]" />
                {isPending ? "제출 중..." : "제출하기"}
              </button>
              <p className="mt-7 text-center text-[15px] font-medium text-[rgba(27,23,13,0.38)]">
                제출 후 AI가 답변을 분석해드립니다.
              </p>
            </form>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <AppHeader
        title="결과"
        left={<HeaderIconButton href="/training/select" icon="arrow_back" label="뒤로 가기" />}
      />

      <main className="app-screen app-page">
        <div className="app-content pb-[120px]">
          <section className="px-2 py-7 text-center">
            <div className="app-score-ring h-[220px] w-[220px]">
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
                <span className="text-[76px] font-extrabold tracking-tight text-[var(--ink)]">
                  {result?.score ?? 0}
                </span>
                <span className="text-[44px] font-semibold text-[var(--primary)]">/ 100</span>
              </div>
            </div>
            <h2 className="mt-4 text-[56px] font-extrabold tracking-[-0.02em] text-[var(--ink)]">
              {(result?.score ?? 0) >= 80
                ? "훌륭한 실력이에요!"
                : "다음 문제에서 더 좋아질 수 있어요"}
            </h2>
          </section>

          <section className="app-card p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Icon name="auto_awesome" className="text-[var(--primary)]" filled />
                <h3 className="text-[18px] font-extrabold text-[var(--ink)]">코칭 요약</h3>
              </div>
              <div className="rounded-full bg-[var(--primary-soft)] px-3 py-1 text-[11px] font-bold text-[var(--primary)]">
                AI 배지 획득
              </div>
            </div>
            <p className="text-[16px] leading-8 text-[rgba(27,23,13,0.68)]">{result?.summary}</p>
          </section>

          <section className="mt-6">
            <h3 className="mb-4 flex items-center gap-2 text-[20px] font-extrabold text-[var(--ink)]">
              <Icon name="checklist" className="text-[var(--primary)]" />
              개선 포인트
            </h3>
            <div className="app-card app-card--soft p-5">
              <div className="space-y-5">
                {improvementItems.map((item) => (
                  <div key={item.title} className="flex items-start gap-4">
                    <Icon
                      name={item.completed ? "check_circle" : "radio_button_unchecked"}
                      className={`mt-0.5 text-[34px] ${item.completed ? "text-[var(--primary)]" : "text-[rgba(123,106,71,0.58)]"}`}
                    />
                    <div>
                      <p className="text-[16px] font-extrabold tracking-[-0.01em] text-[var(--ink)]">{item.title}</p>
                      <p className="mt-1 text-[14px] font-medium leading-6 text-[rgba(27,23,13,0.52)]">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-6">
            <h3 className="mb-4 flex items-center gap-2 text-[20px] font-extrabold text-[var(--ink)]">
              <Icon name="menu_book" className="text-[var(--primary)]" />
              모범 답안
            </h3>
            <div className="relative overflow-hidden rounded-[24px] bg-[var(--primary-soft)] p-5">
              <Icon
                name="format_quote"
                className="absolute right-3 top-3 text-[56px] text-[rgba(27,23,13,0.08)]"
              />
              <p className="relative z-10 text-[16px] font-semibold leading-8 text-[var(--ink)]">
                {result?.exemplarAnswer}
              </p>
            </div>
          </section>

          <section className="mt-10 space-y-4">
            <button type="button" onClick={startSession} className="app-primary-button">
              다음 문제 풀기
            </button>
            <Link href="/" className="app-secondary-button bg-[#d9dde5]">
              홈으로 이동
            </Link>
          </section>
        </div>
      </main>

      <ResultBottomNav />
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
