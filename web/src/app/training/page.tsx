"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { AppHeader, BottomNav, HeaderIconButton } from "@/components/app-chrome";
import { Icon } from "@/components/icon";
import { MBTI_LIST } from "@/lib/mbti";

const STORAGE_KEY = "fftt.selected-mbti";

const MBTI_IMAGES: Record<string, string> = {
  ISTJ:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCljAMGymj3NTkhHveD6h4varYT_2GtMUg8GuLeQx_jFa3HIhzj4VTxDdN7UoacFNFdxqfpI4hARhpbqXKaSDISX1_dGcJ0EW069dCO6cAGFlEWubT-LDnsy5TedZGgWyVV_Eb20KcU_0Wfu-dVpwEvF4h0yGgf-YhJIwkvKmqgp3Lz1w7cxOBmKHkVQEzKBgOPfco0gzhXlsdEqXA5YAyOxSXzakoKK13Zzs2VNhFn8icMklKPdfRiLl0jqsqVTYiw9ffQJeQTKkE",
  ISFJ:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBjEVotFaz79aZD6eW25ih7UAC-EWY4QntfPt43EnUymDvhxONXsZnlNCaUleqjmu2dW0XpOg4nhhWFLPqOl8qdg2lfRNGDzJxaK2HOOz7fQzy0rYrwHj308jiZT0Qgq8CrPMH4MF1Q-Er9rZ8UiRwE1Fe8Fgw6p54qcO8WSCQCvVywJ0OAsyeUR3iW4C-auQ5g6eap6XI5ue3K99D0g27MQ_BMolwDrY93XCw81_N6MuQc2_N-EsUsGb4hTgpSw347SQ4P2c13dDc",
  INFJ:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuD0oLy_EQYBIEVoH2ouEJKYaMIGKCHXtk_9BRswcjsLV7buYRD8Uvtasd_rv9JRwtSmK-0CMf9bUManGyPwNLi9sznXch45mWP15TTQP9ea-g-nEGu2Rjc7mj4seS53xY5SMX9ac_MwHoLpvTLKE8St9FPgdG9qsnfv4pzZ41j8WrZTHscRmFOHjDSSyUAjAFeRdx56m0JxUjwZ8yoQGb8JzhKTMrfASxseD5HcB0KiNZ8nmbJagYrlSwJJkmki4cr7OoqbfL0XeNw",
  INTJ:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuD9hHZefzbEaNpO5eHxBFI3ao6EvFETaiuHNMT1H9aXJ_Zr2mb8EiAfMNg8xF-5M-5rJVe5Z6oku3Tw5YRtleENWu4Q0YasebsAsKom-4VgYILCC702LfzurFNpTSYnBa4Qy0uJKX41XG_QyEuhBMgxfuY6tGwLPHdz9Xdo46fpT5--fwBfcT9JKT2z37o9fqiyhpovPd5vrGh1tuz20S10sAcYYkSY-2DQam7ToiheUi_aFOOWjZpg8oBsG8FYqzaW9EG-LU4fJ6c",
  ISTP:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAqQcHnbDcSEnPrLZBx0nbsTqnBOqylBvZZCjju7s_0NW2xmL5ETQcYnjj_K-qKMXmytQbyPZkpY1vqB_rFmsujN8xori8RwZDUkvXwTCIOtVUdz0PJdGSucVxLhApjcRWl6cfnRom1EF4hgitp8TaApP95wMEX9yg5kkQ-1dB_T9KKenpT4wbjWWh4WE-QtF-zAX2jv59VOw9yYwGnP6GiWRZ2j0PJ3Kt5knzXsgFqvHZonNh-HwqEwsSAt0w3MGj5yfODJ-gTAyI",
  ISFP:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCz4kgInZvSX_lq9ugKIKHPgJDIAXgjUzbFKi2Zu6Zvc0elIhglPMrtrdp16d1tzIkicLJN6mWYKlXzq0NwKf8e0EmSPp3OIFvzmEx6f4_0QUOtMKqsZ4WaufIRh_AK0VLtQ6_PxK4vWkDvsHn0iq7xajrYX84nl9LlIPebaLwYlHbIxNGun2ckoMzcq5VyM3eV9mIntQ_VWvztOhJTSIxkw0ay3Orv-rbWCYtSIL8rqbRRdhu4tLuHg0QOs_Zeo-wBGkRMCR-qGCk",
  INFP:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDnKw0FOUfvSHBtu1IwF8Frq_60W0BdmKFAmpICOhOJE9eeNdcXwgFiCjGD3kdUM9cKLEiWGrdXxRiKSKLM34WQLLVhuaS2ks7ey-2kY8qIgGev9F59oxV0OtACN5MwZnJCpu7NLPZIN5UNYfKgnu0Ti9mBe8qQSUKGQ5PZZGT4-yvK5eKkkKV4WTQo4UGEdXY74kgf35qrSwmiaLYXcGvR_ntg9ukHshoIdchWDBqx482rHwoUQzyRKC2rNwEamtTahFJnHrHWZGQ",
  INTP:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBM6NgRwvVaIqlqgndgKB-wPDrofYzGshrbkAe2RBrwqJLj13OdWDyeoAdUR0MAbGBDyNYOrTZNCLRYEM-kzGraptaicz3WRj1W2EdAIvHpw6eFqQlCgly4nb3IV_rumhbZjS4iruv87_5GIX-kI-0m20OzNVHCEdVHgqZ_3-A2HaRh13tLmOEIUT36TcQBvG1fqdtLoecH-3I9Q4SiCRDx-DzFFiusv9xqDxUOlfLfEhw5-yfiGRfRIjKE9mb9OL-8DWoBieOygPE",
  ESTP:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCFcGGa43vGsoozTIKoDs4o7BRCkKK0FlTqpbyqyRKkP4FX0_h-exk7DOYBOaz5XnKoFfkJKCmxqroRyzRS-xAZlX2X2h01VSygSSDlfgrP4SimYWLkmXNliyeSof3j4BmWcwXOAdn_fpN3MNTYByqMrWve8rA4Z7o_DgKHc3_SdST9YpzQ25zBp-nf0wPjPk2BAa4HV3TKLJRPZBx_TQwO1YQz7wM5KiCI3l8IsZ54H8H3Vr_7kpO1oEyZsJ2GfoURR3SwWmGQtQg",
  ESFP:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBNx7FKNrPFy-KkQ1j7wlsl7Thb3U3LbjigDU_UDu4Ee4hdvl4LWweSoPNSc6rAzhpktsrUfLgApH28qbHYTifO-feTWD9i3y9pXmSN6FqSAdlEJgp-GKDA96QdY2G2suw0lI3vG3g5FwS8z1FJ6-B-kHHKVOE4tU_28LnHP2Dk6B_fvAzxnV2ETLvlD6GHCvcY71wRoeDKHWI3cstkJK3Gnam72MK9y7sWcf_7ZKkia_T3_I73oyaj7ECDw3M5_PPFTP_XQAD6pnI",
  ENFP:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuA3T-pKY8G1jEZ1xX3DzCeG99O4Eq9xsEHeCQ8JY3_JhTxcWU8xPOig1T0KUv8s-rQKf0I9e0UbSQ4TNb5U37LmFaX_-BDnKu-0phXowaIJyog5uHuNKxQmjNoQmK0dlEVqRrS71OaD6XQpxn36kq2BNB87pVK66_2kDcvQYSyPEMtHMiAI5boLBmUMYmxoDKGN2sUQoXTMOCTZLca6tRlDq0eyJUmDGgcUAbbwuUCkmRsQFxIDxeuq33qyfBzoP_oARcpwT7IAMyY",
  ENTP:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuB7VNlawDFIMir7IvFza3Apxh0Jv055h-Qjy_0OYFx30AYUB2dLst_t0oUqqOV_omLfT71-pwbcyG0OcAinIbGchZ-rWRQ1VjN7UhoSP3r3t2KtUA8YWvhaYRKYKsWofCMut3zg5Uht2aOTZT7RVjW-x6Vod2KVRc0Z6sgMyjk3ZQWtjJ4LjeY2jLjPJifY6vH1gGNA-8sA_X7awAJoMKUjHU27jnqUukvYp6Kx4-ZL-E80nywCrNP7ORYd_LuvQ_9yaOqIYLgjeHk",
  ESTJ:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuA77owdWf2Y5vTYywJKVdVAo3sXaIZOttIO7c2wtl1F2NjkDyxnJSXXs1BNPRdTL2Xcb-Owwu9XpL1ySECuluzdO2SgM_oztEDUEQ87MzppglqrdgWJ679GoqDb6xuPUJi61679G45UM0IeUxPKFSSf14hLf41_qlmVVw_gkNyI_zXy1A5Jsi-Qg7gvjtB-CKxv6YaEgk-1r7pqFZ_xn-KedMHoChhEshJ4vChup2Pj0TPOTpZPcbB_2RLfQsSmrCyxI8oMxnuI_18",
  ESFJ:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuC4WCqFhyXcb4FrVx-aCEgNq8KEnhV4DwtNqauZt9FHg0Fnv4bTkYPyCRI9y3pO2c_BOv4YdTeTOZAxzKnz1VrWYBmU7bXic0EWrZ4Jg9YyGs3OQuAlSa_d2x7JDxFFu48E1CIERSQNHw3GEwecuKNM-dsMPuLedebC-Faud5ziq4tQOECa7-muPclcSWJcTYxVHeQGZxuZW9beOMtxQhZIGqhnPpt_H9Q3MDVbbsoVko9LRCEvNHlXkbff4xt_oDx0yauoBmo7xZ4",
  ENFJ:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuB_yGVswVMxPpOIknyl5NoFGibcIbWZvK1AaLJyDAWR_OMZlanQa15RrQbb0I1xBzlOvW1wM78a-cfaGz5m46TxbaCRcPvXD_e7ReoxaJWOOgPbk3v4bUzkOa6DgJ-BkmNfKXWWytZ1vzm1j6pjAIdt45sR1hQOpSVTr0svvm_i7hsJRMIZpT1adyZVtdSSA1fioRq-Gzxv_-IyM-YiXONO-D0xKF7A0ep1ISFRVhD6oCUVZFA0FLaV7S9Hk3Ky_kPZdEuBIbTTGvY",
  ENTJ:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuD7KKim1d0TKnVkN2eokTtFfcZzjgq9ORVb4nYHuChlBYqKbdQo5j02nJKerAIdaunEv-Gc5MigEHCKqIYHURzZfwtB1lIxOwDFV2HovnwqkOougzmrY59sHvXTsuJ_QOSvq1T-2lAXLI0YoBL_35nYEG3G0zf_4yhTIyv6yOdY8btI0adnBInzSVarAoeD-kt4toeX7XxKXaBaetafk1XIztdV5HAAskW7foatrzeICrywyY-iFG-kCUKlSiZF3xp9y5cEoXE3-B0",
};

export default function TrainingPage() {
  const router = useRouter();
  const [selectedCode, setSelectedCode] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return window.localStorage.getItem(STORAGE_KEY)?.toUpperCase() ?? "";
  });

  function moveToArena(code: string) {
    window.localStorage.setItem(STORAGE_KEY, code);
    router.push(`/training/arena?mbti=${code}`);
  }

  return (
    <>
      <AppHeader
        title="MBTI 유형 선택"
        left={<HeaderIconButton href="/" icon="arrow_back" label="뒤로 가기" />}
      />

      <main className="app-screen app-page">
        <div className="app-content pb-40">
          <section className="mb-8">
            <div className="mb-2 flex items-end justify-between">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-[0.24em] text-[var(--primary)]">
                  step 01
                </span>
                <h2 className="text-sm font-medium text-[rgba(27,23,13,0.65)]">유형 설정</h2>
              </div>
              <span className="text-sm font-extrabold text-[var(--ink)]">1 / 5</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--background-strong)]">
              <div className="h-full w-1/5 rounded-full bg-[var(--primary)]" />
            </div>
          </section>

          <section className="mb-10 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-[var(--ink)]">
              본인의 MBTI를 선택해주세요
            </h2>
            <p className="mt-3 text-sm leading-7 text-[rgba(27,23,13,0.62)]">
              선택한 성향을 기준으로 FFTT AI가
              <br />
              맞춤형 트레이닝을 시작합니다.
            </p>
          </section>

          <section className="grid grid-cols-2 gap-4">
            {MBTI_LIST.map((mbti) => {
              const selected = selectedCode === mbti.code;

              return (
                <button
                  key={mbti.code}
                  type="button"
                  onClick={() => setSelectedCode(mbti.code)}
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

      {selectedCode ? (
        <div className="app-floating-cta" aria-live="polite">
          <div className="app-floating-cta__inner">
            <div className="app-floating-cta__panel">
              <button
                type="button"
                onClick={() => moveToArena(selectedCode)}
                className="app-primary-button"
              >
                유형 확정 및 시작하기
              </button>
              <p className="mt-3 text-center text-xs text-[rgba(27,23,13,0.5)]">
                선택한 MBTI는 언제든 다시 변경할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <BottomNav current="training" />
    </>
  );
}
