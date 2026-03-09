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
import { ensureAnonymousUser, type AnonymousUser } from "@/lib/anonymous-user";
import { MBTI_IMAGES } from "@/lib/mbti-images";
import { MBTI_MAP, type MbtiProfile } from "@/lib/mbti";

type ArenaPhase = "intro" | "solving" | "result";

type SessionPayload = {
  sessionId: string;
  prompt: string;
  topic: string;
  angle: string;
};

type StandingPayload = {
  totalScore: number;
  rank: number | null;
  attemptCount: number;
  bestScore: number;
};

type CurrentStandingPayload = {
  userId: string;
  displayName: string;
  overall: StandingPayload | null;
  mbti: StandingPayload | null;
};

type EvaluationPayload = {
  score: number;
  summary: string;
  exemplarAnswer: string;
  keyPoints: string[];
  model: string | null;
  responseSource: "ai" | "fallback";
  currentStanding?: CurrentStandingPayload;
};

type ErrorPayload = {
  error?: {
    message?: string;
  };
};

const STORAGE_KEY = "fftt.selected-mbti";
const MAX_LENGTH = 300;
const LIMIT_SECONDS = 120;
const INTRO_HEADLINES: Record<string, string> = {
  INTJ: "INTJ의 전략적인 사고 흐름을 먼저 읽어보세요",
  INTP: "INTP의 끝없는 아이디어 회로에 들어가보세요",
  ENTJ: "ENTJ가 반응하는 목표 중심 대화를 익혀보세요",
  ENTP: "ENTP가 좋아하는 재치 있는 발상을 꺼내보세요",
  INFJ: "INFJ와 깊이 있게 연결되는 말을 익혀보세요",
  INFP: "INFP의 마음을 여는 다정한 표현을 익혀보세요",
  ENFJ: "ENFJ를 움직이는 따뜻한 한마디를 배워보세요",
  ENFP: "ENFP와 금방 가까워지는 생동감 있는 말을 익혀보세요",
  ISTJ: "ISTJ가 신뢰하는 정확한 대화법을 익혀보세요",
  ISFJ: "ISFJ를 안심시키는 세심한 표현을 익혀보세요",
  ESTJ: "ESTJ가 납득하는 명확한 답변 구조를 익혀보세요",
  ESFJ: "ESFJ와 분위기를 맞추는 친절한 대화를 익혀보세요",
  ISTP: "ISTP가 편하게 받아들이는 담백한 말을 익혀보세요",
  ISFP: "ISFP와 자연스럽게 가까워지는 말투를 익혀보세요",
  ESTP: "ESTP가 바로 반응하는 시원한 대화를 익혀보세요",
  ESFP: "ESFP와 즐겁게 연결되는 밝은 표현을 익혀보세요",
};

function getResultSourceLabel(result: EvaluationPayload) {
  if (result.responseSource === "ai") {
    return result.model ? `AI 분석 사용 · ${result.model}` : "AI 분석 사용";
  }

  if (result.model) {
    return `대체 피드백 사용 · ${result.model} 호출 실패`;
  }

  return "대체 피드백 사용 · API 미연결";
}

function TrainingArenaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mbti, setMbti] = useState<MbtiProfile | null>(null);
  const [user, setUser] = useState<AnonymousUser | null>(null);
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
      router.replace("/training");
      return;
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, selectedMbti.code);
    }

    setMbti(selectedMbti);
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
          setErrorText(error instanceof Error ? error.message : "사용자 정보를 준비하지 못했습니다.");
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
      summary: "시간이 종료되어 답변이 제출되지 않았습니다. 다음 문제에서 다시 도전해보세요.",
      exemplarAnswer:
        "상황을 먼저 인정하고, 상대가 바로 이해할 수 있는 구조로 제안과 선택지를 짧게 전달하는 답변이 좋습니다.",
      keyPoints: [
        "첫 문장에서 상대의 상황이나 감정을 먼저 짚어주세요.",
        "요청이나 제안은 한두 문장 안에서 분명하게 전달해주세요.",
        "마무리에는 부담을 줄이는 선택지나 여지를 남겨주세요.",
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
    if (!mbti) {
      return;
    }

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

    if (!mbti || !session || !answer.trim() || !user) {
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/training/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.userId,
            sessionId: session.sessionId,
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
              <div className="aspect-[4/3] bg-[var(--primary-soft)]">
                <img
                  src={MBTI_IMAGES[mbti.code]}
                  alt={`${mbti.code} 대표 이미지`}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-6">
                <h2 className="text-2xl font-extrabold tracking-tight text-[var(--ink)]">
                  {INTRO_HEADLINES[mbti.code] ?? `${mbti.code}와 대화하는 감각을 먼저 익혀보세요`}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[rgba(27,23,13,0.64)]">
                  {mbti.longDescription}
                </p>
              </div>
            </section>

            <section className="app-card app-card--soft p-5">
              <div className="flex items-center gap-2">
                <Icon name="psychology" className="text-[20px] text-[var(--primary)]" />
                <h3 className="text-lg font-extrabold text-[var(--ink)]">MBTI 특성</h3>
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
                <h3 className="text-lg font-extrabold text-[var(--ink)]">이 MBTI와 대화할 때의 팁</h3>
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
              onClick={startSession}
              disabled={isPending}
              className="app-primary-button"
            >
              {isPending ? "문제를 준비하고 있어요..." : "시작하기"}
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
                     남은시간
                   </p>
                    <p className="mt-1 text-sm font-medium text-[rgba(27,23,13,0.58)]">
                     제한 시간 안에 상대가 좋아할 답변을 작성해보세요.
                   </p>
                 </div>
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
                 상황
               </p>
               <p className="mt-3 text-sm leading-7 text-[var(--ink)]">
                 최근 대화에서 작은 오해가 생겼습니다. 변명처럼 들리지 않으면서 내 의도를 차분하게
                 설명하는 답변을 작성해보세요.
               </p>
             </section>

             <form onSubmit={submitAnswer} className="space-y-4">
               <section className="app-card p-5">
                 <h2 className="text-lg font-extrabold leading-tight text-[var(--ink)]">
                   {mbti.code} 가 좋아할 답변을 작성해보세요
                 </h2>

                 <div className="mt-5">
                   <div className="mb-3 flex items-center justify-between px-1">
                     <label className="text-sm font-bold text-[var(--ink)]">답변 작성</label>
                    <span className="text-xs font-medium text-[rgba(27,23,13,0.42)]">
                      핵심만 간결하게 작성해주세요
                    </span>
                  </div>
                  <div className="relative">
                    <textarea
                      value={answer}
                      onChange={(event) => setAnswer(event.target.value.slice(0, MAX_LENGTH))}
                      disabled={isPending}
                      className="app-textarea"
                      maxLength={MAX_LENGTH}
                      placeholder="상대가 듣고 싶어 할 답변을 적어주세요."
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
        title="학습 결과"
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
              {(result?.score ?? 0) >= 80
                ? "훌륭한 답변이었어요"
                : "다음 문제에서 더 좋아질 수 있어요"}
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
                <Link href="/rank" className="rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-bold text-[var(--primary)]">
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
                총 {result.currentStanding.overall?.attemptCount ?? 0}회 플레이했고, 이번 점수가 랭킹에 반영되었습니다.
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
              모범 답안
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
            <button type="button" onClick={startSession} className="app-primary-button">
              다음 문제 풀기
            </button>
            <Link href="/" className="app-secondary-button">
              홈으로 이동
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
