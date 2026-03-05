import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-start justify-center px-6 py-16">
      <span className="rounded-full border border-sky-300 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
        MBTI 소통 훈련 MVP
      </span>
      <h1 className="mt-5 text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
        상대를 이해하는 말습관을
        <br />
        먼저 연습해보세요.
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
        MVP에서는 ISFJ 성향을 기준으로 문장을 첨삭합니다. 친근한 코치형
        피드백으로 내 문장을 더 부드럽고 설득력 있게 바꿔보세요.
      </p>
      <div className="mt-8">
        <Link
          href="/training"
          className="inline-flex items-center rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          스킬 숙련 시작하기
        </Link>
      </div>
    </main>
  );
}
