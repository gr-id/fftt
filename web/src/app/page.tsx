"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { AppHeader, BottomNav, HeaderIconButton } from "@/components/app-chrome";
import { Icon } from "@/components/icon";

const MODES = [
  {
    name: "문장 트레이닝",
    description: "실전 상황에서 MBTI 맞춤형 답장을 연습합니다.",
    icon: "forum",
    status: "active",
    href: "/training",
  },
  {
    name: "비즈니스 회의",
    description: "업무 커뮤니케이션용 훈련 모드가 곧 추가됩니다.",
    icon: "work",
    status: "soon",
    href: "",
  },
  {
    name: "관계 코칭",
    description: "감정 케어 중심의 훈련 모드가 곧 추가됩니다.",
    icon: "favorite",
    status: "soon",
    href: "",
  },
] as const;

const VALUE_CARDS = [
  {
    icon: "psychology",
    title: "성향 기반 이해",
    body: "상대 성향에 맞는 말하기 방식과 반응 포인트를 빠르게 파악합니다.",
  },
  {
    icon: "chat_bubble",
    title: "실전형 연습",
    body: "현실적인 상황 카드로 바로 써먹을 수 있는 답장을 훈련합니다.",
  },
  {
    icon: "bolt",
    title: "즉시 피드백",
    body: "AI 평가와 예시 답변으로 개선 방향을 바로 확인할 수 있습니다.",
  },
] as const;

export default function HomePage() {
  const [isModeSheetOpen, setIsModeSheetOpen] = useState(false);
  const [continueHref] = useState(() => {
    if (typeof window === "undefined") {
      return "/training";
    }

    const mbti = window.localStorage.getItem("fftt.selected-mbti")?.toUpperCase();
    const category = window.localStorage.getItem("fftt.selected-training-category") ?? "all";
    return mbti ? `/training/arena?mbti=${mbti}&category=${category}` : "/training";
  });

  return (
    <>
      <AppHeader
        title={<Image src="/logo.png" alt="FFTT Logo" width={84} height={32} className="object-contain" priority />}
        left={<HeaderIconButton icon="notes" label="메뉴" />}
        right={<HeaderIconButton icon="account_circle" label="프로필" />}
      />

      <main className="app-screen app-page">
        <div className="app-content">
          <section className="relative min-h-[420px] overflow-hidden rounded-[28px] bg-[var(--primary-soft)] p-6">
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(238,173,43,0.28)] to-transparent" />
              <Image
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDQbj3ERWLJGm17KFnxd0mlMgmzr_ZieiKcM65MnPq-5MXGjWgub_1HDi2AkNG82wkdQwPD3Qvdof8YWc2OqEG_ZUbGXq7nQJl1BiTkCVZbDtbZQAaIZDQPZX2qxm7UsYhftS0kZwZgn0Ld9BsdGxD7Lbe-vpHdqzc8ohe-XgyzR92DlVnsPxPUCfard8qPAzPTWBduw-jewPOVe4cVtrKoTahr5h4WiH2loErMF-q__vhcTJKXbo0-BqP4xfQJ_a2iKySjPC6vrqY"
                alt="다양한 성향의 사람들이 함께 대화하는 장면"
                fill
                className="object-cover mix-blend-overlay"
                sizes="(max-width: 430px) 100vw, 430px"
                priority
              />
            </div>

            <div className="relative z-10 flex min-h-[372px] flex-col justify-end gap-4">
              <span className="app-chip w-fit bg-[var(--primary)] text-[var(--ink)]">
                MBTI Communication Training
              </span>
              <div className="space-y-3">
                <h2 className="text-[2rem] font-extrabold leading-[1.08] tracking-tight text-[var(--ink)]">
                  서로 다른 상대를
                  <br />
                  이해하는 첫 훈련
                </h2>
                <p className="max-w-[280px] text-base font-medium leading-7 text-[rgba(27,23,13,0.74)]">
                  MBTI 성향에 맞춘 말하기 연습으로 관계와 설득력을 함께 높여 보세요.
                </p>
              </div>
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModeSheetOpen(true)}
                  className="app-primary-button"
                >
                  이어서 훈련하기
                </button>
                <Link href="/rank" className="app-secondary-button">
                  랭킹 보기
                </Link>
              </div>
            </div>
          </section>

          <section className="space-y-4 px-0 py-6">
            <h3 className="px-1 text-xl font-extrabold tracking-tight text-[var(--ink)]">
              왜 FFTT인가요
            </h3>
            <div className="space-y-4">
              {VALUE_CARDS.map((card) => (
                <article
                  key={card.title}
                  className="app-card flex items-center gap-4 rounded-3xl p-5"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
                    <Icon name={card.icon} className="text-[30px]" />
                  </div>
                  <div>
                    <h4 className="text-lg font-extrabold text-[var(--ink)]">{card.title}</h4>
                    <p className="text-sm leading-6 text-[var(--muted)]">{card.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>

      {isModeSheetOpen ? (
        <div
          className="app-bottom-sheet"
          role="presentation"
          onClick={() => setIsModeSheetOpen(false)}
        >
          <div
            className="app-bottom-sheet__panel"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-8 h-1.5 w-12 rounded-full bg-[var(--background-strong)]" />
            <h3 className="text-center text-2xl font-extrabold tracking-tight text-[var(--ink)]">
              트레이닝 모드 선택
            </h3>

            <div className="mt-6 space-y-4">
              {MODES.map((mode) =>
                mode.status === "active" ? (
                  <Link
                    key={mode.name}
                    href={mode.href}
                    className="block rounded-[24px] border-2 border-[var(--primary)] bg-[rgba(238,173,43,0.12)] p-4 shadow-[0_0_0_8px_rgba(238,173,43,0.05)]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--primary)] text-[var(--ink)] shadow-md">
                        <Icon name={mode.icon} className="text-[30px]" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-extrabold text-[var(--ink)]">{mode.name}</h4>
                          <span className="rounded-full bg-[var(--primary)] px-2 py-0.5 text-[10px] font-black uppercase text-[var(--ink)]">
                            active
                          </span>
                        </div>
                        <p className="text-sm text-[var(--muted)]">{mode.description}</p>
                      </div>
                      <Icon name="check_circle" className="text-[var(--primary)]" />
                    </div>
                  </Link>
                ) : (
                  <div
                    key={mode.name}
                    className="rounded-[24px] border border-[var(--line)] bg-[rgba(255,255,255,0.56)] p-4 opacity-60"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--background-strong)] text-[var(--muted)]">
                        <Icon name={mode.icon} className="text-[30px]" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-extrabold text-[var(--ink)]">{mode.name}</h4>
                          <span className="rounded-full bg-[var(--background-strong)] px-2 py-0.5 text-[10px] font-bold uppercase text-[var(--muted)]">
                            soon
                          </span>
                        </div>
                        <p className="text-sm text-[var(--muted)]">{mode.description}</p>
                      </div>
                      <Icon name="lock" className="text-[var(--muted)]" />
                    </div>
                  </div>
                ),
              )}
            </div>

            <Link
              href={continueHref}
              onClick={() => setIsModeSheetOpen(false)}
              className="app-primary-button mt-8"
            >
              바로 이어서 훈련하기
            </Link>
          </div>
        </div>
      ) : null}

      <BottomNav current="home" />
    </>
  );
}
