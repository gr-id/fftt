"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { AppHeader, BottomNav, HeaderIconButton } from "@/components/app-chrome";
import { Icon } from "@/components/icon";
import { MBTI_IMAGES } from "@/lib/mbti-images";
import { MBTI_LIST, MBTI_MAP } from "@/lib/mbti";
import {
  TRAINING_CATEGORY_OPTIONS,
  type TrainingCategory,
} from "@/lib/training";

const MBTI_STORAGE_KEY = "fftt.selected-mbti";
const CATEGORY_STORAGE_KEY = "fftt.selected-training-category";

export default function TrainingSelectPage() {
  const router = useRouter();
  const [selectedCode, setSelectedCode] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return window.localStorage.getItem(MBTI_STORAGE_KEY)?.toUpperCase() ?? "";
  });
  const [selectedCategory, setSelectedCategory] = useState<TrainingCategory>(() => {
    if (typeof window === "undefined") {
      return "all";
    }

    const stored = window.localStorage.getItem(CATEGORY_STORAGE_KEY);
    return TRAINING_CATEGORY_OPTIONS.some((option) => option.code === stored)
      ? (stored as TrainingCategory)
      : "all";
  });
  const [sheetCode, setSheetCode] = useState<string | null>(null);
  const selectedMbti = sheetCode ? MBTI_MAP[sheetCode] : null;

  function moveToArena(code: string) {
    window.localStorage.setItem(MBTI_STORAGE_KEY, code);
    window.localStorage.setItem(CATEGORY_STORAGE_KEY, selectedCategory);
    router.push(`/training/arena?mbti=${code}&category=${selectedCategory}`);
  }

  return (
    <>
      <AppHeader
        title="MBTI 유형 선택"
        left={<HeaderIconButton href="/training" icon="arrow_back" label="뒤로 가기" />}
      />

      <main className="app-screen app-page">
        <div className="app-content pb-40">
          <section className="mb-8 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-[var(--ink)]">
              어떤 상대를 먼저 훈련할까요
            </h2>
            <p className="mt-3 text-sm leading-7 text-[rgba(27,23,13,0.62)]">
              MBTI와 대화 카테고리를 고르면
              <br />
              난이도는 최근 성과에 맞춰 자동으로 조정됩니다.
            </p>
          </section>

          <section className="mb-8">
            <div className="mb-3 flex items-center gap-2 px-1">
              <Icon name="forum" className="text-[20px] text-[var(--primary)]" />
              <h3 className="text-base font-extrabold text-[var(--ink)]">카테고리 선택</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {TRAINING_CATEGORY_OPTIONS.map((option) => (
                <button
                  key={option.code}
                  type="button"
                  onClick={() => setSelectedCategory(option.code)}
                  className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                    selectedCategory === option.code
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--background-strong)] text-[var(--ink)]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="mt-3 px-1 text-sm text-[rgba(27,23,13,0.56)]">
              {
                TRAINING_CATEGORY_OPTIONS.find((option) => option.code === selectedCategory)
                  ?.description
              }
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
                    className={`relative mb-4 aspect-square overflow-hidden rounded-[18px] bg-[var(--primary-soft)] ${
                      selected ? "ring-2 ring-[var(--primary)]" : ""
                    }`}
                  >
                    <Image
                      src={MBTI_IMAGES[mbti.code]}
                      alt={`${mbti.code} 캐릭터 일러스트`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 430px) 45vw, 180px"
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
                  <div className="relative overflow-hidden rounded-[20px] bg-[var(--primary-soft)]">
                    <Image
                      src={MBTI_IMAGES[selectedMbti.code]}
                      alt={`${selectedMbti.code} 캐릭터 일러스트`}
                      width={800}
                      height={600}
                      className="aspect-[4/3] w-full object-cover"
                      sizes="(max-width: 430px) 100vw, 400px"
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
                        이번 훈련 카테고리
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {TRAINING_CATEGORY_OPTIONS.filter((option) => option.code !== "all").map(
                          (option) => (
                            <button
                              key={option.code}
                              type="button"
                              onClick={() => setSelectedCategory(option.code)}
                              className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                                selectedCategory === option.code
                                  ? "bg-[var(--primary)] text-white"
                                  : "bg-white text-[var(--ink)]"
                              }`}
                            >
                              {option.label}
                            </button>
                          ),
                        )}
                      </div>
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
                        이렇게 말하면 좋습니다
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
                  이 유형으로 이어서 훈련하기
                </button>
                <p className="mt-4 text-center text-[12px] leading-5 text-[rgba(27,23,13,0.5)]">
                  카테고리는 {TRAINING_CATEGORY_OPTIONS.find((option) => option.code === selectedCategory)?.label}
                  , 난이도는 최근 점수 기준으로 자동 선택됩니다.
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
