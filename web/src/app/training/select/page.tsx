"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { AppHeader, BottomNav, HeaderIconButton } from "@/components/app-chrome";
import { Icon } from "@/components/icon";
import { MBTI_IMAGES } from "@/lib/mbti-images";
import { MBTI_LIST, MBTI_MAP } from "@/lib/mbti";

const STORAGE_KEY = "fftt.selected-mbti";

export default function TrainingSelectPage() {
  const router = useRouter();
  const [selectedCode, setSelectedCode] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return window.localStorage.getItem(STORAGE_KEY)?.toUpperCase() ?? "";
  });
  const [sheetCode, setSheetCode] = useState<string | null>(null);
  const selectedMbti = sheetCode ? MBTI_MAP[sheetCode] : null;

  function moveToArena(code: string) {
    window.localStorage.setItem(STORAGE_KEY, code);
    router.push(`/training/arena?mbti=${code}`);
  }

  return (
    <>
      <AppHeader
        title="MBTI 유형 선택"
        left={<HeaderIconButton href="/training" icon="arrow_back" label="뒤로 가기" />}
      />

      <main className="app-screen app-page">
        <div className="app-content pb-40">
          <section className="mb-10 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-[var(--ink)]">
              본인의 MBTI를 선택해주세요
            </h2>
            <p className="mt-3 text-sm leading-7 text-[rgba(27,23,13,0.62)]">
              선택한 성향을 기준으로 FFTT AI가
              <br />
              맞춤형 트레이닝을 시작합니다
            </p>
          </section>

          <section className="grid grid-cols-2 gap-4">
            {MBTI_LIST.map((mbti) => {
              const selected = selectedCode === mbti.code;

              return (
                <button
                  key={mbti.code}
                  type="button"
                  onClick={() => {
                    setSelectedCode(mbti.code);
                    setSheetCode(mbti.code);
                  }}
                  className={`rounded-[22px] border p-4 text-left transition ${
                    selected
                      ? "border-[var(--primary)] bg-[var(--background-strong)] shadow-lg"
                      : "border-transparent bg-[var(--background-strong)]"
                  }`}
                >
                  <div
                    className={`mb-4 aspect-square overflow-hidden rounded-[18px] bg-[var(--primary-soft)] ${
                      selected ? "ring-2 ring-[var(--primary)]" : ""
                    }`}
                  >
                    <img
                      src={MBTI_IMAGES[mbti.code]}
                      alt={`${mbti.code} 캐릭터 일러스트`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-[var(--primary)]">
                        {mbti.code}
                      </span>
                      {selected ? (
                        <Icon name="check_circle" className="text-[18px] text-[var(--primary)]" />
                      ) : null}
                    </div>
                    <h3 className="line-clamp-2 text-sm font-extrabold text-[var(--ink)]">
                      {mbti.label}
                    </h3>
                    <p className="line-clamp-2 text-xs leading-5 text-[rgba(27,23,13,0.54)]">
                      {mbti.summary}
                    </p>
                  </div>
                </button>
              );
            })}
          </section>
        </div>
      </main>

      {selectedMbti ? (
        <div className="app-bottom-sheet" role="presentation" onClick={() => setSheetCode(null)}>
          <div
            className="app-bottom-sheet__panel"
            role="dialog"
            aria-modal="true"
            aria-label={`${selectedMbti.code} 상세 정보`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-5 h-1.5 w-12 shrink-0 rounded-full bg-[var(--background-strong)]" />

            <div className="app-bottom-sheet__content">
              <div className="shrink-0 text-center">
                <h3 className="text-[24px] font-medium leading-none text-[var(--primary)]">
                  {selectedMbti.code}
                </h3>
                <p className="mt-2 text-[16px] font-bold leading-tight tracking-tight text-[var(--ink)]">
                  {selectedMbti.label}
                </p>
              </div>

              <div className="app-bottom-sheet__body">
                <article className="mt-4 rounded-[28px] border border-transparent bg-[var(--background-strong)] p-4">
                  <div className="overflow-hidden rounded-[20px] bg-[var(--primary-soft)]">
                    <img
                      src={MBTI_IMAGES[selectedMbti.code]}
                      alt={`${selectedMbti.code} 캐릭터 일러스트`}
                      className="aspect-[4/3] w-full object-cover"
                    />
                  </div>

                  <div className="mt-5 space-y-5">
                    <div>
                      <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[var(--primary)]">
                        MBTI 특성
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[rgba(27,23,13,0.72)]">
                        {selectedMbti.longDescription}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[var(--primary)]">
                        핵심 키워드
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedMbti.keywords.map((keyword) => (
                          <span
                            key={keyword}
                            className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[var(--ink)]"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[var(--primary)]">
                        이렇게 말하면 잘 통합니다
                      </p>
                      <div className="mt-3 space-y-2">
                        {selectedMbti.tips.map((tip) => (
                          <div
                            key={tip}
                            className="flex items-start gap-3 rounded-[18px] bg-white px-3 py-3"
                          >
                            <Icon
                              name="check_circle"
                              className="mt-0.5 text-[18px] text-[var(--primary)]"
                            />
                            <p className="text-sm leading-6 text-[var(--ink)]">{tip}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              </div>

              <div className="mt-6 shrink-0">
                <button
                  type="button"
                  onClick={() => moveToArena(selectedMbti.code)}
                  className="app-primary-button rounded-[24px]"
                >
                  유형 확정 및 시작하기
                </button>
                <p className="mt-4 text-center text-[12px] leading-5 text-[rgba(27,23,13,0.5)]">
                  선택한 MBTI를 기준으로 첫 문제와 피드백 톤이 설정됩니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <BottomNav current="training" />
    </>
  );
}
