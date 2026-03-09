import Link from "next/link";

import { AppHeader, BottomNav, HeaderIconButton } from "@/components/app-chrome";
import { Icon } from "@/components/icon";

const VALUE_CARDS = [
  {
    icon: "psychology",
    title: "타인에 대한 깊은 이해",
    body: "MBTI 기반의 정밀한 성향 분석 시스템",
  },
  {
    icon: "chat_bubble",
    title: "실전 같은 대화 연습",
    body: "현장감을 극대화한 시나리오 트레이닝",
  },
  {
    icon: "bolt",
    title: "즉각적인 AI 피드백",
    body: "전문 코치 수준의 정교한 대화 분석",
  },
] as const;

export default function TrainingTabPage() {
  return (
    <>
      <AppHeader
        title="의사소통 챌린지"
        left={<HeaderIconButton icon="notes" label="메뉴" />}
        right={<HeaderIconButton icon="account_circle" label="프로필" />}
      />

      <main className="app-screen app-page">
        <div className="app-content pb-8">
          <section className="rounded-[24px] bg-[#ebe2cf] px-6 py-10">
            <div className="space-y-4">
              <h2 className="text-[36px] font-medium leading-[1.1] tracking-[-0.02em] text-[var(--ink)]">
                나와 다른 상대를
                <br />
                이해하는 첫 걸음
              </h2>
              <p className="text-[18px] font-medium leading-[1.35] text-[rgba(27,23,13,0.72)]">
                MBTI별 맞춤 대화법을 직접 익혀보세요
              </p>
            </div>

            <div className="mt-8 space-y-3">
              <Link href="/training/select" className="app-primary-button rounded-[24px]">
                트레이닝 시작하기
              </Link>
              <Link
                href="/rank"
                className="app-secondary-button rounded-[24px] border-transparent bg-[rgba(255,255,255,0.55)]"
              >
                랭킹 보기
              </Link>
            </div>
          </section>

          <section className="px-1 py-8">
            <h3 className="text-[18px] font-extrabold tracking-[-0.02em] text-[var(--ink)]">
              무엇을 할 수 있나요?
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
                    <h4 className="text-[16px] font-bold tracking-[-0.015em] text-[var(--ink)]">{card.title}</h4>
                    <p className="text-[14px] leading-[1.45] text-[rgba(27,23,13,0.54)]">{card.body}</p>
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
