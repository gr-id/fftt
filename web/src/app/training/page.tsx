"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type ReviseSuccess = {
  revised_sentence: string;
  reason: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
};

type ApiError = {
  error?: {
    code?: string;
    message?: string;
  };
};

const STORAGE_KEY = "ttff.training.isfj.v1";

export default function TrainingPage() {
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<ReviseSuccess | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        message?: string;
        result?: ReviseSuccess;
      };
      if (parsed.message) setMessage(parsed.message);
      if (parsed.result) setResult(parsed.result);
    } catch {
      // Ignore invalid local storage payloads.
    }
  }, []);

  const isSubmitDisabled = useMemo(
    () => isLoading || message.trim().length === 0,
    [isLoading, message],
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorText("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/training/revise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        const errorPayload = (await response.json()) as ApiError;
        throw new Error(
          errorPayload.error?.message ?? "요청 처리 중 오류가 발생했습니다.",
        );
      }

      const payload = (await response.json()) as ReviseSuccess;
      setResult(payload);

      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          message,
          result: payload,
        }),
      );
    } catch (error) {
      const messageFromError =
        error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
      setErrorText(messageFromError);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5 py-10 sm:px-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          대상 MBTI: ISFJ (MVP 고정)
        </p>
        <h1 className="mt-4 text-3xl font-bold text-slate-900">스킬 숙련 모드</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          하고 싶은 말을 입력하면, ISFJ가 듣기 좋은 방식으로 친근하게 첨삭해드려요.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-800">
              원문 메시지
            </span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="예: 이번 주 안에 피드백 주실 수 있을까요?"
              className="h-36 w-full resize-none rounded-xl border border-slate-300 px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900"
              maxLength={500}
            />
            <span className="mt-1 block text-right text-xs text-slate-500">
              {message.length}/500
            </span>
          </label>

          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="inline-flex items-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isLoading ? "첨삭 중..." : "첨삭 받기"}
          </button>
        </form>

        {errorText ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorText}
          </p>
        ) : null}
      </section>

      {result ? (
        <section className="mt-6 grid gap-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-500">교정 문장</h2>
            <p className="mt-2 whitespace-pre-wrap text-base leading-7 text-slate-900">
              {result.revised_sentence}
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-500">이유</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">
              {result.reason}
            </p>
          </article>

          {result.usage ? (
            <p className="text-right text-xs text-slate-500">
              토큰 사용량: {result.usage.total_tokens} (입력{" "}
              {result.usage.input_tokens} / 출력 {result.usage.output_tokens})
            </p>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}
