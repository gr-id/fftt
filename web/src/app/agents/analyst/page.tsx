"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type AiProvider = "chatgpt" | "gemini" | "other";

type BasicInfoPayload = {
  isEnabled: boolean;
  name: string;
};

type AiInfoPayload = {
  provider: AiProvider;
  apiKey: string;
};

type RunHistory = {
  startedAt: string;
  progressState: string;
  runId: string;
  trigger: string;
  handledArticles: number;
  resultState: string;
};

type ValidateResponse = {
  ok: boolean;
  message: string;
};

const BASIC_STORAGE_KEY = "ttff.agent.analyst.basic.v1";
const AI_STORAGE_KEY = "ttff.agent.analyst.ai.v1";
const FORMAT_STORAGE_KEY = "ttff.agent.analyst.format.v1";

const DEFAULT_TEMPLATE =
  "<p><strong>제목:</strong> {} 기사 제목</p><p><strong>URL:</strong> {} 기사 링크</p><p><strong>요약:</strong> {} 분석 결과 요약</p>";

const DEFAULT_COLUMNS = ["기사 제목", "기사 링크", "분석 결과 요약", "작성일"];

const RUN_HISTORIES: RunHistory[] = [
  {
    startedAt: "2026-03-05 18:20",
    progressState: "완료",
    runId: "RUN-20260305-0008",
    trigger: "수동 실행",
    handledArticles: 14,
    resultState: "성공",
  },
  {
    startedAt: "2026-03-05 17:40",
    progressState: "완료",
    runId: "RUN-20260305-0007",
    trigger: "정기 실행",
    handledArticles: 12,
    resultState: "성공",
  },
  {
    startedAt: "2026-03-05 16:10",
    progressState: "실패",
    runId: "RUN-20260305-0006",
    trigger: "재시도",
    handledArticles: 0,
    resultState: "API 오류",
  },
];

function commandForToolbar(command: string, value?: string) {
  if (typeof document === "undefined") return;
  document.execCommand(command, false, value);
}

export default function AnalystAgentPage() {
  const editorRef = useRef<HTMLDivElement | null>(null);

  const [isEnabled, setIsEnabled] = useState(true);
  const [name, setName] = useState("뉴스 분석가");
  const [provider, setProvider] = useState<AiProvider>("chatgpt");
  const [apiKey, setApiKey] = useState("");
  const [templateHtml, setTemplateHtml] = useState(DEFAULT_TEMPLATE);
  const [columns, setColumns] = useState<string[]>(DEFAULT_COLUMNS);
  const [newColumn, setNewColumn] = useState("");

  const [basicSaveText, setBasicSaveText] = useState("");
  const [aiSaveText, setAiSaveText] = useState("");
  const [formatSaveText, setFormatSaveText] = useState("");
  const [validationText, setValidationText] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    try {
      const rawBasic = localStorage.getItem(BASIC_STORAGE_KEY);
      if (rawBasic) {
        const parsed = JSON.parse(rawBasic) as BasicInfoPayload;
        setIsEnabled(parsed.isEnabled);
        setName(parsed.name);
      }

      const rawAi = localStorage.getItem(AI_STORAGE_KEY);
      if (rawAi) {
        const parsed = JSON.parse(rawAi) as AiInfoPayload;
        setProvider(parsed.provider);
        setApiKey(parsed.apiKey);
      }

      const rawFormat = localStorage.getItem(FORMAT_STORAGE_KEY);
      if (rawFormat) {
        const parsed = JSON.parse(rawFormat) as {
          templateHtml?: string;
          columns?: string[];
        };
        if (parsed.templateHtml) setTemplateHtml(parsed.templateHtml);
        if (parsed.columns?.length) setColumns(parsed.columns);
      }
    } catch {
      // Ignore invalid local storage payloads.
    }
  }, []);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== templateHtml) {
      editorRef.current.innerHTML = templateHtml;
    }
  }, [templateHtml]);

  function saveBasicInfo() {
    const payload: BasicInfoPayload = {
      isEnabled,
      name: name.trim(),
    };

    localStorage.setItem(BASIC_STORAGE_KEY, JSON.stringify(payload));
    setBasicSaveText("기본 정보를 저장했습니다.");
  }

  function saveAiInfo() {
    const payload: AiInfoPayload = {
      provider,
      apiKey: apiKey.trim(),
    };
    localStorage.setItem(AI_STORAGE_KEY, JSON.stringify(payload));
    setAiSaveText("AI 설정을 저장했습니다.");
  }

  async function validateApiKey() {
    setValidationText("");
    setIsValidating(true);

    try {
      const response = await fetch("/api/agents/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          apiKey: apiKey.trim(),
        }),
      });

      const payload = (await response.json()) as ValidateResponse;
      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || "검증에 실패했습니다.");
      }

      setValidationText(payload.message);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "검증 중 오류가 발생했습니다.";
      setValidationText(message);
    } finally {
      setIsValidating(false);
    }
  }

  function saveFormat() {
    const currentTemplate = editorRef.current?.innerHTML ?? templateHtml;
    setTemplateHtml(currentTemplate);
    localStorage.setItem(
      FORMAT_STORAGE_KEY,
      JSON.stringify({ templateHtml: currentTemplate, columns }),
    );
    setFormatSaveText("서식 설정을 저장했습니다.");
  }

  function addColumn() {
    const trimmed = newColumn.trim();
    if (!trimmed || columns.includes(trimmed)) return;
    setColumns((prev) => [...prev, trimmed]);
    setNewColumn("");
  }

  function insertColumn(columnName: string) {
    commandForToolbar("insertText", `{} ${columnName}`);
    const currentTemplate = editorRef.current?.innerHTML ?? templateHtml;
    setTemplateHtml(currentTemplate);
  }

  const isValidateDisabled = useMemo(
    () => isValidating || apiKey.trim().length < 10,
    [apiKey, isValidating],
  );

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-5 py-10 sm:px-8">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">분석가 에이전트</h1>
        <p className="mt-2 text-sm text-slate-600">
          분석가 상세 설정, AI 인증, 출력 서식, 실행 이력을 이 화면에서 관리합니다.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">기본 정보</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(event) => setIsEnabled(event.target.checked)}
              className="h-4 w-4"
            />
            <span className="text-sm font-medium text-slate-800">활성화</span>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">이름</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              placeholder="에이전트 이름을 입력해 주세요."
            />
          </label>
        </div>
        <p className="mt-3 text-sm text-slate-600">유형: 분석가 (고정)</p>
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={saveBasicInfo}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            저장
          </button>
          {basicSaveText ? <span className="text-sm text-emerald-700">{basicSaveText}</span> : null}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">AI 설정</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">AI 제공자</span>
            <select
              value={provider}
              onChange={(event) => setProvider(event.target.value as AiProvider)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
            >
              <option value="chatgpt">ChatGPT</option>
              <option value="gemini">Gemini</option>
              <option value="other">기타</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">API Key</span>
            <input
              type="password"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              placeholder="API 키를 입력해 주세요."
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={saveAiInfo}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
          >
            저장
          </button>
          <button
            type="button"
            onClick={validateApiKey}
            disabled={isValidateDisabled}
            className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {isValidating ? "검증 중..." : "검증"}
          </button>
          {aiSaveText ? <span className="text-sm text-emerald-700">{aiSaveText}</span> : null}
          {validationText ? <span className="text-sm text-slate-700">{validationText}</span> : null}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">출력 서식</h2>
        <p className="mt-2 text-sm text-slate-600">
          텍스트를 자유롭게 작성하고 컬럼 토큰을 삽입해 결과 서식을 구성합니다.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <button type="button" onClick={() => commandForToolbar("bold")} className="rounded-md border border-slate-300 px-2 py-1 text-sm">
            B
          </button>
          <button type="button" onClick={() => commandForToolbar("italic")} className="rounded-md border border-slate-300 px-2 py-1 text-sm">
            I
          </button>
          <button type="button" onClick={() => commandForToolbar("strikeThrough")} className="rounded-md border border-slate-300 px-2 py-1 text-sm">
            S
          </button>
          <button type="button" onClick={() => commandForToolbar("insertUnorderedList")} className="rounded-md border border-slate-300 px-2 py-1 text-sm">
            UL
          </button>
          <button type="button" onClick={() => commandForToolbar("insertOrderedList")} className="rounded-md border border-slate-300 px-2 py-1 text-sm">
            OL
          </button>
          <button
            type="button"
            onClick={() => {
              const link = window.prompt("링크 URL을 입력해 주세요.");
              if (link) commandForToolbar("createLink", link);
            }}
            className="rounded-md border border-slate-300 px-2 py-1 text-sm"
          >
            Link
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={newColumn}
            onChange={(event) => setNewColumn(event.target.value)}
            placeholder="컬럼명 추가"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
          />
          <button
            type="button"
            onClick={addColumn}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            컬럼 추가
          </button>
          {columns.map((column) => (
            <button
              key={column}
              type="button"
              onClick={() => insertColumn(column)}
              className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
            >
              {`{} ${column}`}
            </button>
          ))}
        </div>

        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={(event) => {
            setTemplateHtml(event.currentTarget.innerHTML);
          }}
          className="mt-4 min-h-44 rounded-2xl border border-slate-300 bg-white px-4 py-4 text-sm leading-7 text-slate-900 outline-none focus:border-slate-900"
        />

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={saveFormat}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            저장
          </button>
          {formatSaveText ? <span className="text-sm text-emerald-700">{formatSaveText}</span> : null}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">실행 이력</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600">
                <th className="px-3 py-2 font-medium">시작 시각</th>
                <th className="px-3 py-2 font-medium">진행 상태</th>
                <th className="px-3 py-2 font-medium">실행 ID</th>
                <th className="px-3 py-2 font-medium">트리거</th>
                <th className="px-3 py-2 font-medium">처리 기사 수</th>
                <th className="px-3 py-2 font-medium">결과</th>
                <th className="px-3 py-2 font-medium">보기</th>
              </tr>
            </thead>
            <tbody>
              {RUN_HISTORIES.map((history) => (
                <tr key={history.runId} className="border-b border-slate-100">
                  <td className="px-3 py-3 text-slate-700">{history.startedAt}</td>
                  <td className="px-3 py-3 text-slate-700">{history.progressState}</td>
                  <td className="px-3 py-3 font-mono text-xs text-slate-700">{history.runId}</td>
                  <td className="px-3 py-3 text-slate-700">{history.trigger}</td>
                  <td className="px-3 py-3 text-slate-700">{history.handledArticles}</td>
                  <td className="px-3 py-3 text-slate-700">{history.resultState}</td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      보기
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
