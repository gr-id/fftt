"use client";

import { useEffect, useState } from "react";

import {
  fetchAuthState,
  linkGoogleOnProduction,
  mockLinkGoogleOnStage,
  type AuthState,
} from "@/lib/auth-client";
import { ensureAnonymousUser } from "@/lib/anonymous-user";
import { hasFirebaseClientConfig } from "@/lib/firebase-client";
import { BottomNav, AppHeader, HeaderIconButton } from "@/components/app-chrome";
import { Icon } from "@/components/icon";
import { MBTI_LIST } from "@/lib/mbti";

type LeaderboardEntry = {
  attemptCount: number;
  bestScore: number;
  displayName: string;
  lastPlayedAt: string;
  rank: number;
  targetMbti: string | null;
  totalScore: number;
  userId: string;
};

type Standing = {
  attemptCount: number;
  bestScore: number;
  rank: number | null;
  totalScore: number;
};

type CurrentStanding = {
  displayName: string;
  mbti: Standing | null;
  overall: Standing | null;
  userId: string;
};

const MBTI_STORAGE_KEY = "fftt.selected-mbti";
const APP_ENV = process.env.NEXT_PUBLIC_APP_ENV === "stage" ? "stage" : "production";
const ENABLE_GOOGLE_SSO = process.env.NEXT_PUBLIC_ENABLE_GOOGLE_SSO === "true";

function formatRank(rank: number | null | undefined) {
  return rank ? `#${rank}` : "-";
}

function LeaderboardSection({
  entries,
  title,
}: {
  entries: LeaderboardEntry[];
  title: string;
}) {
  return (
    <section className="mt-6">
      <h2 className="mb-4 text-base font-extrabold text-[var(--ink)]">{title}</h2>
      <div className="space-y-3">
        {entries.map((entry) => (
          <article
            key={`${title}-${entry.userId}`}
            className="app-glass-row flex items-center gap-4 p-4"
          >
            <div className="w-8 text-center">
              <span className="text-xl font-black italic text-[var(--primary)]">{entry.rank}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[var(--ink)]">{entry.displayName}</span>
                {entry.targetMbti ? (
                  <span className="rounded-full bg-[var(--primary-soft)] px-2 py-0.5 text-[10px] font-bold text-[var(--primary)]">
                    {entry.targetMbti}
                  </span>
                ) : null}
              </div>
              <div className="mt-1 flex flex-wrap gap-3 text-xs text-[var(--muted)]">
                <span>{entry.totalScore.toLocaleString()}점</span>
                <span>최고 {entry.bestScore}점</span>
                <span>{entry.attemptCount}회 플레이</span>
              </div>
            </div>
            {entry.rank <= 3 ? (
              <Icon name="emoji_events" className="text-[var(--primary)]" />
            ) : null}
          </article>
        ))}
        {entries.length === 0 ? (
          <div className="app-card p-5 text-sm text-[var(--muted)]">
            아직 집계된 랭킹이 없습니다.
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default function RankPage() {
  const [selectedMbti, setSelectedMbti] = useState("ISFJ");
  const [myStanding, setMyStanding] = useState<CurrentStanding | null>(null);
  const [authState, setAuthState] = useState<AuthState | null>(null);
  const [overallEntries, setOverallEntries] = useState<LeaderboardEntry[]>([]);
  const [mbtiEntries, setMbtiEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLinking, setIsLinking] = useState(false);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    const storedMbti =
      typeof window !== "undefined" ? window.localStorage.getItem(MBTI_STORAGE_KEY) : null;
    const normalized = (storedMbti ?? "ISFJ").toUpperCase();
    const exists = MBTI_LIST.some((profile) => profile.code === normalized);
    setSelectedMbti(exists ? normalized : "ISFJ");
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadRankings() {
      setIsLoading(true);
      setErrorText("");

      try {
        const user = await ensureAnonymousUser();
        const [overallResponse, mbtiResponse, meResponse, authResponse] = await Promise.all([
          fetch("/api/rank/overall?limit=20", { cache: "no-store" }),
          fetch(`/api/rank/mbti?mbti=${selectedMbti}&limit=20`, { cache: "no-store" }),
          fetch(`/api/rank/me?userId=${user.userId}&mbti=${selectedMbti}`, {
            cache: "no-store",
          }),
          fetchAuthState(user.userId),
        ]);

        const [overallPayload, mbtiPayload, mePayload] = await Promise.all([
          overallResponse.json(),
          mbtiResponse.json(),
          meResponse.json(),
        ]);

        if (!overallResponse.ok) {
          throw new Error(overallPayload.error?.message ?? "전체 랭킹을 불러오지 못했습니다.");
        }

        if (!mbtiResponse.ok) {
          throw new Error(mbtiPayload.error?.message ?? "MBTI 랭킹을 불러오지 못했습니다.");
        }

        if (!meResponse.ok) {
          throw new Error(mePayload.error?.message ?? "내 순위를 불러오지 못했습니다.");
        }

        if (!cancelled) {
          setOverallEntries(overallPayload.entries ?? []);
          setMbtiEntries(mbtiPayload.entries ?? []);
          setMyStanding(mePayload);
          setAuthState(authResponse);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorText(error instanceof Error ? error.message : "랭킹 데이터를 불러오지 못했습니다.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadRankings();

    return () => {
      cancelled = true;
    };
  }, [selectedMbti]);

  const linkedGoogleProvider = authState?.providers.find((provider) => provider.provider === "google");
  const canUseRealGoogle = APP_ENV === "production" && ENABLE_GOOGLE_SSO && hasFirebaseClientConfig();
  const canUseMockGoogle = APP_ENV === "stage";

  async function handleGoogleLink() {
    setIsLinking(true);
    setErrorText("");

    try {
      const nextAuthState = canUseMockGoogle
        ? await mockLinkGoogleOnStage()
        : await linkGoogleOnProduction();
      setAuthState(nextAuthState);
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "Google 연결에 실패했습니다.");
    } finally {
      setIsLinking(false);
    }
  }

  return (
    <>
      <AppHeader
        title="랭킹"
        left={<HeaderIconButton href="/" icon="arrow_back" label="뒤로 가기" />}
      />

      <main className="app-screen app-page">
        <div className="app-content pb-6">
          <section className="app-card p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-[var(--primary)]">
                  My standing
                </p>
                <h2 className="mt-2 text-xl font-extrabold text-[var(--ink)]">
                  {myStanding?.displayName ?? "익명 사용자"}
                </h2>
              </div>
              <div className="rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-bold text-[var(--primary)]">
                {selectedMbti}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-[20px] border border-[var(--line-strong)] bg-[var(--primary-soft)] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                  overall
                </p>
                <p className="mt-2 text-2xl font-extrabold text-[var(--ink)]">
                  {formatRank(myStanding?.overall?.rank)}
                </p>
                <p className="mt-1 text-sm text-[rgba(27,23,13,0.62)]">
                  누적 {myStanding?.overall?.totalScore ?? 0}점
                </p>
              </div>
              <div className="rounded-[20px] border border-[var(--line-strong)] bg-[var(--primary-soft)] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                  {selectedMbti}
                </p>
                <p className="mt-2 text-2xl font-extrabold text-[var(--ink)]">
                  {formatRank(myStanding?.mbti?.rank)}
                </p>
                <p className="mt-1 text-sm text-[rgba(27,23,13,0.62)]">
                  최고 {myStanding?.mbti?.bestScore ?? 0}점
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-[20px] border border-[var(--line-strong)] bg-[rgba(255,255,255,0.54)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--muted)]">
                    auth
                  </p>
                  <h3 className="mt-1 text-base font-extrabold text-[var(--ink)]">
                    {APP_ENV === "stage" ? "Stage 인증 상태" : "Google 계정 연결"}
                  </h3>
                </div>
                <span className="rounded-full bg-[var(--primary-soft)] px-3 py-1 text-[11px] font-bold text-[var(--primary)]">
                  {authState?.environment ?? APP_ENV}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {authState?.providers.map((provider) => (
                  <span
                    key={`${provider.provider}-${provider.mode}`}
                    className="rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-bold text-[var(--primary)]"
                  >
                    {provider.provider === "anonymous" ? "익명" : provider.mode === "mock" ? "Google(mock)" : "Google"}
                  </span>
                ))}
              </div>

              <p className="mt-3 text-sm leading-6 text-[rgba(27,23,13,0.66)]">
                {linkedGoogleProvider
                  ? linkedGoogleProvider.mode === "mock"
                    ? "현재 stage 환경에서 테스트용 Google 연결 상태입니다."
                    : "현재 Google 계정이 연결된 상태입니다."
                  : APP_ENV === "stage"
                    ? "stage에서는 실제 OAuth 없이 테스트용 Google 연결 상태만 검증합니다."
                    : "prod에서만 실제 Google OAuth를 통해 기존 익명 사용자를 승격합니다."}
              </p>

              {!linkedGoogleProvider ? (
                <button
                  type="button"
                  onClick={handleGoogleLink}
                  disabled={isLinking || (!canUseMockGoogle && !canUseRealGoogle)}
                  className="app-primary-button mt-4"
                >
                  <Icon name="account_circle" className="text-[22px]" />
                  {isLinking
                    ? "연결 중..."
                    : APP_ENV === "stage"
                      ? "테스트용 Google 연결"
                      : "Google 계정 연결"}
                </button>
              ) : null}

              {!canUseMockGoogle && !canUseRealGoogle && !linkedGoogleProvider ? (
                <p className="mt-3 text-xs text-[var(--muted)]">
                  현재 환경에서는 Google SSO 설정이 비활성화되어 있습니다.
                </p>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {MBTI_LIST.map((profile) => (
                <button
                  key={profile.code}
                  type="button"
                  onClick={() => {
                    setSelectedMbti(profile.code);
                    window.localStorage.setItem(MBTI_STORAGE_KEY, profile.code);
                  }}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                    profile.code === selectedMbti
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[rgba(255,255,255,0.65)] text-[var(--ink)]"
                  }`}
                >
                  {profile.code}
                </button>
              ))}
            </div>
          </section>

          {errorText ? (
            <div className="mt-6 rounded-[20px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-[var(--danger)]">
              {errorText}
            </div>
          ) : null}

          {isLoading ? (
            <div className="mt-6 app-card p-5 text-sm text-[var(--muted)]">랭킹을 불러오는 중입니다.</div>
          ) : (
            <>
              <LeaderboardSection entries={overallEntries} title="전체 누적 랭킹" />
              <LeaderboardSection entries={mbtiEntries} title={`${selectedMbti} 랭킹`} />
            </>
          )}
        </div>
      </main>

      <BottomNav current="rank" />
    </>
  );
}
