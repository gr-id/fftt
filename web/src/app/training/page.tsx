"use client";

import Link from "next/link";
import { useState } from "react";

import { AppHeader, BottomNav, HeaderIconButton } from "@/components/app-chrome";
import { Icon } from "@/components/icon";

const VALUE_CARDS = [
  {
    icon: "psychology",
    title: "성향별 반응 포인트",
    body: "MBTI별로 어떤 표현이 더 편안하게 받아들여지는지 빠르게 익힙니다.",
  },
  {
    icon: "chat_bubble",
    title: "실전 답장 훈련",
    body: "현실적인 대화 상황을 기준으로 바로 써먹을 문장을 연습합니다.",
  },
  {
    icon: "bolt",
    title: "AI 코칭 피드백",
    body: "점수, 개선 포인트, 예시 답변까지 한 번에 확인합니다.",
  },
] as const;

export default function TrainingTabPage() {
  const [continueHref] = useState(() => {
    if (typeof window === "undefined") {
      return "/training/select";
    }

    const mbti = window.localStorage.getItem("fftt.selected-mbti")?.toUpperCase();
    const category = window.localStorage.getItem("fftt.selected-training-category") ?? "all";

    return mbti ? `/training/arena?mbti=${mbti}&category=${category}` : "/training/select";
  });

  return (
    <>
      <AppHeader
        title="커뮤니케이션 훈련"
        left={<HeaderIconButton icon="notes" label="메뉴" />}
        right={<HeaderIconButton icon="account_circle" label="프로필" />}
      />

      <main className="app-screen app-page">
        <div className="app-content pb-8">
          <section className="rounded-[24px] bg-[#ebe2cf] px-6 py-10">
            <div className="space-y-4">
              <h2 className="text-[36px] font-medium leading-[1.1] tracking-[-0.02em] text-[var(--ink)]">
                다시 들어오게 만드는
                <br />
                맞춤형 훈련 루프
              </h2>
              <p className="text-[18px] font-medium leading-[1.35] text-[rgba(27,23,13,0.72)]">
                이전 MBTI와 카테고리를 기억하고 바로 다음 문제로 이어집니다.
              </p>
            </div>

            <div className="mt-8 space-y-3">
              <Link href={continueHref} className="app-primary-button rounded-[24px]">
                이어서 훈련하기
              </Link>
              <Link
                href="/training/select"
                className="app-secondary-button rounded-[24px] border-transparent bg-[rgba(255,255,255,0.55)]"
              >
                MBTI 다시 고르기
              </Link>
            </div>
          </section>

          <section className="px-1 py-8">
            <h3 className="text-[18px] font-extrabold tracking-[-0.02em] text-[var(--ink)]">
              무엇을 훈련하나요
            </h3>

            <div className="mt-4 space-y-4">
              {VALUE_CARDS.map((card) => (
                <article
                  key={card.title}
                  className="app-card flex items-center gap-4 rounded-[24px] border-[rgba(231,223,207,0.5)] bg-[rgba(255,255,255,0.84)] px-5 py-[21px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[rgba(238,173,43,0.1)] text-[var(--primary)]">
                    <Icon name={card.icon} className="text-[26px]" />
                  </div>
                  <div>
                    <h4 className="text-[16px] font-bold tracking-[-0.015em] text-[var(--ink)]">
                      {card.title}
                    </h4>
                    <p className="text-[14px] leading-[1.45] text-[rgba(27,23,13,0.54)]">
                      {card.body}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>

      <BottomNav current="training" />
    </>
  );
}
