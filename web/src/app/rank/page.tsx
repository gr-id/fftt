import { BottomNav, AppHeader, HeaderIconButton } from "@/components/app-chrome";
import { Icon } from "@/components/icon";
import { RANKING_ENTRIES } from "@/lib/training";

const USER_AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDZUsL46VjKdH0BYi9A6MjR4fTdSdu4EAtB2vjDYmNtrj72kmCHuuB31h8KDOVL684SFpQ3d4LfRkzS55jH8dagNntoSPWRdng9SynvpimRqV5NAUp2i7vI66Hm04fCYyJFy1dTT5o5eJQtVr5jC38acgPZhpKsSJ1GDFmm_1LQFZXtS8a_dP6FW2MXtyM2A3UtIqBObsP-ckmvSpXhaH2J5zdKvG7qWhEH_j3wLRMaeVm9JTIYyP71vmBlRQfBQnD-2eP3IBl29_8";

const TOP_AVATARS = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDoC1OrBWSl5KXLgkG6lP2YqwPNnSI1a3BCwG3cot2oT6439_GIF1GCAfa_qFpizK3Vov2rjtnH9upeWglmc4ZLBveIGgaHMmGYFKhMw0b3rUBMknan2CteRvrraCbeKlgLBLSGOf20zVP8rErCJES_fD4GCmLbCTqEEmMlhyC3zKmswEtnblTcQQtbqN591eEgTZmBurvXqmBR6ouA92Sdz5zHgn2N5dYSBWLHeVSE28krcqVz2Sk_nMy9N47Gt3CxdqV5niXEbeg",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDO4Cu1aP9yvMUaMCYRD005xKXtMfvTkavbpmv8UKcpNF-qmBJeHujKOQ2X5dNrMwQE0JL5XxbFcWjhnvlm8QHkVMk5R4C5dOcO1JI391hdfgYuMtpyjhIk-IFAia3Nv4_KoZhYwPE-C0XNuBEv6HM3YwcxlROQbMj-44Howgls4SqkduTISg2-cYvJ2QcZyrrslzG9e-wHidMICOOV-NrhPGsOe740hgV2SvcFSjyAyMt-t_9gbN8uNopkjeAo_JkRmScrU-QZfz8",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBWvY-gN0hudAagZy6LutwvmexeuDqgpLM6wqFWpzt_O23eAaVnhZlV7Pc15OqiziCvGY01kOH13yFy6i0XaWo4gIeGV2BwwDieFBOdQe2ec99N8dZ9vLWbMbA5KVlFZWYS2ZhtDG38VEtdPf_oSybXoV7CgpnUWOnEu2pOWJHbObJveanjBQMqiRay8qgKTYqDzqElaVhwdOW4acxGXjgQfZl5PudZTVLUObQi87zfsPKycmbstbUdi6LjUXmt8g3eoVB2I5L2_EU",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAAyRfEAiPX9QFZyY5B9CHjlUZS010LvmqVzlyzgde-tNLTkXTXOVRSApYU6MqsqgUuVBAmgYIY_92KqtdaJEqSHiLn-mP1wycwTwGWaasH3Q1NTMRkWG5A-orc8RYMdQqNL8kiQStTg4tIw8ViV6jEA-WLTuVoGisQM2Ll2YGLp34m9no5mO6EaMT2DXoLJBk2ZlSdnkYXDCNiQ31ITsX6uyvyY3INJyKTpehKOM_cT0xCmBZf5jGIMeGNkH6IDQ9-F1HaFiJJTpw",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC3gqGtKiW4dkQ4xoKXCK2sUdiOVxFoqoYPXRLY4yLrech0-3XNmrSs86jcnYK8cNZg4rBi8dJ-oP6hp0Y3y_Ub2UqU3ALUJosQHNWPVremeuyqtmkx3KMii-mZcZ0L7g9oRTslam8S6BCdhjKrDJL8fiQplv2Qi47mVH6EyXbE7pJsj-Qb6jvrRjKVhU17nzoAu5ZGHJDFtnjfxozPSnyRfReHmSjCbn64Pl0FQ4q9o-uGhw721IqmB44t8SvgXxpMyC3C7pGjNCo",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA7w1AyIlFDlVimrweAGR0WTUZUDX3wbzNdE2NNb8vYW98hB4pFw8W43-2X3vjD4RWnAs6mozIhYkLhEYQ33YcuHvM7R-maomu6mgvrKafaZnkMzjyJB5sH-e93cSyGRfOstzLscEffHah2Eu0FHcawNtXnDX2BgzGuiwuxGqICnnoktg084NAQSS2a6y__tJx-I6o-IPzF2VX7F1viWzIDxULoe0xKiQzsF65jOUujnW8MikK_FkB2GU84HjlUMFhC4a6AVtAIUNo",
];

const MBTI_BADGE_CLASS: Record<string, string> = {
  INFJ: "bg-[rgba(238,173,43,0.18)] text-[var(--primary)]",
  ESTP: "bg-blue-100 text-blue-700",
  ENFP: "bg-green-100 text-green-700",
  INTJ: "bg-purple-100 text-purple-700",
  ISFJ: "bg-pink-100 text-pink-700",
  ENTJ: "bg-slate-200 text-slate-700",
};

export default function RankPage() {
  const topEntries = RANKING_ENTRIES.slice(0, 6);

  return (
    <>
      <AppHeader
        title="전체 랭킹"
        left={<HeaderIconButton href="/" icon="arrow_back" label="뒤로 가기" />}
        right={<HeaderIconButton icon="search" label="검색" />}
      />

      <main className="app-screen app-page">
        <div className="app-content pb-6">
          <section className="mb-4 flex gap-8 border-b border-[var(--line)] px-1">
            {["주간", "월간", "전체"].map((tab, index) => (
              <button
                key={tab}
                type="button"
                className={`border-b-[3px] pb-3 pt-2 text-sm font-bold ${
                  index === 0
                    ? "border-[var(--primary)] text-[var(--ink)]"
                    : "border-transparent text-[var(--muted)]"
                }`}
              >
                {tab}
              </button>
            ))}
          </section>

          <section className="mb-6 rounded-[24px] border border-[var(--line-strong)] bg-[var(--primary-soft)] p-5">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="h-16 w-16 overflow-hidden rounded-full border-4 border-white bg-[var(--primary)]">
                  <img src={USER_AVATAR} alt="내 아바타" className="h-full w-full object-cover" />
                </div>
                <div className="absolute -bottom-1 -right-1 rounded-full bg-[var(--ink)] px-2 py-0.5 text-[10px] font-bold text-white">
                  MY
                </div>
              </div>
              <div className="flex-1">
                <p className="text-xl font-extrabold text-[var(--ink)]">
                  124위 <span className="ml-1 text-sm font-medium text-[var(--muted)]">상위 5%</span>
                </p>
                <p className="text-sm text-[var(--muted)]">기록 980점 · 12일 연속</p>
              </div>
              <button type="button" className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-bold text-[var(--ink)]">
                내 기록
              </button>
            </div>
          </section>

          <section className="space-y-3 pb-4">
            <h2 className="px-1 text-base font-extrabold text-[var(--ink)]">실시간 리더보드</h2>
            {topEntries.map((entry, index) => {
              const badgeClass = MBTI_BADGE_CLASS[entry.mbti] ?? "bg-[var(--background-strong)] text-[var(--muted)]";

              return (
                <article
                  key={entry.rank}
                  className="app-glass-row relative flex items-center gap-4 p-4"
                  style={{ opacity: index === 0 ? 1 : Math.max(0.7, 1 - index * 0.08) }}
                >
                  {index === 0 ? (
                    <div className="absolute inset-y-0 left-0 w-1 rounded-l-[20px] bg-[var(--primary)]" />
                  ) : null}
                  <div className={`w-8 text-center ${index === 0 ? "text-[var(--primary)]" : "text-[var(--muted)]"}`}>
                    <span className="text-xl font-black italic">{entry.rank}</span>
                  </div>
                  <div className="h-10 w-10 overflow-hidden rounded-full bg-[var(--background-strong)]">
                    <img
                      src={TOP_AVATARS[index] ?? USER_AVATAR}
                      alt={`${entry.name} 아바타`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-bold text-[var(--ink)]">{entry.name}</span>
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${badgeClass}`}>
                        {entry.mbti}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-[var(--muted)]">
                      <span>{entry.score.toLocaleString()}점</span>
                      <span className="flex items-center gap-0.5 font-medium text-orange-500">
                        <Icon name="local_fire_department" className="text-sm" />
                        {entry.streak}일
                      </span>
                    </div>
                  </div>
                  {index === 0 ? (
                    <Icon name="emoji_events" className="text-[var(--primary)]" />
                  ) : null}
                </article>
              );
            })}
          </section>
        </div>
      </main>

      <BottomNav current="rank" />
    </>
  );
}
