export type TrainingDifficulty = "easy" | "medium" | "hard";
export type TrainingCategory = "all" | "work" | "friend" | "relationship" | "family";
export type TrainingPlayableCategory = Exclude<TrainingCategory, "all">;
export type TrainingIntent = "persuasion" | "empathy" | "decline" | "coordination";

export type TrainingTopic = {
  id: string;
  topic: string;
  angle: string;
  prompt: string;
  category: TrainingPlayableCategory;
  difficulty: TrainingDifficulty;
  intent: TrainingIntent;
};

export const TRAINING_CATEGORY_OPTIONS: Array<{
  code: TrainingCategory;
  description: string;
  label: string;
}> = [
  {
    code: "all",
    description: "상황을 가리지 않고 다양한 문제를 섞어 풉니다.",
    label: "전체",
  },
  {
    code: "work",
    description: "업무 보고, 피드백, 일정 조율 같은 직장 상황을 다룹니다.",
    label: "업무",
  },
  {
    code: "friend",
    description: "친구와의 약속, 오해, 제안 같은 관계 상황을 다룹니다.",
    label: "친구",
  },
  {
    code: "relationship",
    description: "가까운 사이에서 감정과 배려를 조율하는 상황을 다룹니다.",
    label: "연인",
  },
  {
    code: "family",
    description: "가족 간 부탁, 걱정, 갈등 조율 상황을 다룹니다.",
    label: "가족",
  },
];

export const TRAINING_DIFFICULTY_LABELS: Record<TrainingDifficulty, string> = {
  easy: "easy",
  hard: "hard",
  medium: "medium",
};

export const TRAINING_CATEGORY_LABELS: Record<TrainingCategory, string> = {
  all: "전체",
  family: "가족",
  friend: "친구",
  relationship: "연인",
  work: "업무",
};

export const TRAINING_INTENT_LABELS: Record<TrainingIntent, string> = {
  coordination: "조율",
  decline: "거절",
  empathy: "공감",
  persuasion: "설득",
};

export const TOPIC_BANK: TrainingTopic[] = [
  {
    id: "friend-reschedule-easy",
    topic: "친구와의 약속 조율",
    angle: "서운함은 남기지 않고 일정만 차분하게 다시 정리하기",
    prompt:
      "친구가 약속 시간을 자주 바꾸고 있습니다. 서운함을 드러내되 관계를 해치지 않게, 다시 시간을 정리하자는 메시지를 작성해 보세요.",
    category: "friend",
    difficulty: "easy",
    intent: "coordination",
  },
  {
    id: "work-feedback-easy",
    topic: "팀 프로젝트 피드백",
    angle: "부드럽지만 분명하게 수정 요청하기",
    prompt:
      "팀원이 제출한 초안에 보완이 필요한 부분이 있습니다. 관계를 해치지 않으면서 수정이 필요하다는 점이 전달되도록 답장을 작성해 보세요.",
    category: "work",
    difficulty: "easy",
    intent: "persuasion",
  },
  {
    id: "friend-comfort-easy",
    topic: "지친 상대 위로",
    angle: "상대의 상태를 살피며 따뜻하게 건네기",
    prompt:
      "상대가 요즘 많이 지쳐 보입니다. 가볍게 공감하면서도 도움이 필요하면 말해 달라는 메시지를 작성해 보세요.",
    category: "friend",
    difficulty: "easy",
    intent: "empathy",
  },
  {
    id: "relationship-invite-easy",
    topic: "새로운 모임 제안",
    angle: "거절 부담을 줄이며 자연스럽게 제안하기",
    prompt:
      "상대에게 새로운 모임 아이디어를 제안하려고 합니다. 부담스럽지 않으면서도 관심이 생기도록 초대 메시지를 작성해 보세요.",
    category: "relationship",
    difficulty: "easy",
    intent: "persuasion",
  },
  {
    id: "family-misunderstanding-medium",
    topic: "오해 정리",
    angle: "방어적으로 들리지 않게 내 입장 설명하기",
    prompt:
      "최근 가족과의 대화에서 작은 오해가 생겼습니다. 변명처럼 들리지 않으면서도 내 의도를 차분하게 설명하는 메시지를 작성해 보세요.",
    category: "family",
    difficulty: "medium",
    intent: "coordination",
  },
  {
    id: "family-thanks-easy",
    topic: "감사 표현",
    angle: "진심은 분명하게, 과하지 않게 전하기",
    prompt:
      "가족이 예상보다 더 큰 도움을 주었습니다. 부담스럽지 않지만 분명하게 고마움을 전하는 메시지를 작성해 보세요.",
    category: "family",
    difficulty: "easy",
    intent: "empathy",
  },
  {
    id: "work-decline-medium",
    topic: "추가 업무 거절",
    angle: "관계를 지키면서도 우선순위를 분명히 전하기",
    prompt:
      "이미 일정이 꽉 찬 상태에서 추가 업무 요청을 받았습니다. 상대의 입장은 이해하되 지금은 어렵다는 점과 대안을 함께 전달하는 메시지를 작성해 보세요.",
    category: "work",
    difficulty: "medium",
    intent: "decline",
  },
  {
    id: "relationship-checkin-medium",
    topic: "서운함 표현",
    angle: "감정을 솔직하게 말하되 비난처럼 들리지 않게 전하기",
    prompt:
      "가까운 사람이 요즘 답장이 뜸해 서운함이 쌓였습니다. 상대를 몰아붙이지 않으면서 내 마음을 솔직하게 전하는 메시지를 작성해 보세요.",
    category: "relationship",
    difficulty: "medium",
    intent: "coordination",
  },
  {
    id: "friend-boundary-hard",
    topic: "부탁 선 긋기",
    angle: "미안함은 전하되 반복 요청은 막기",
    prompt:
      "친구가 자주 급한 부탁을 해 와서 부담이 커졌습니다. 관계를 해치지 않으면서도 앞으로는 선을 지키고 싶다는 점이 분명히 전달되게 답장을 작성해 보세요.",
    category: "friend",
    difficulty: "hard",
    intent: "decline",
  },
  {
    id: "work-escalation-hard",
    topic: "상향 보고 조율",
    angle: "문제 상황을 숨기지 않되 불필요한 불안을 키우지 않기",
    prompt:
      "일정 지연 가능성이 생겨 리더에게 먼저 공유해야 합니다. 책임 회피처럼 들리지 않으면서 현황, 영향, 대응안을 담아 메시지를 작성해 보세요.",
    category: "work",
    difficulty: "hard",
    intent: "persuasion",
  },
];

export function normalizeTrainingCategory(value?: string | null): TrainingCategory {
  const normalized = value?.trim().toLowerCase();
  return TRAINING_CATEGORY_OPTIONS.some((option) => option.code === normalized)
    ? (normalized as TrainingCategory)
    : "all";
}

export function pickTrainingTopic(params: {
  category: TrainingCategory;
  difficulty: TrainingDifficulty;
}) {
  const { category, difficulty } = params;
  const categoryFiltered =
    category === "all" ? TOPIC_BANK : TOPIC_BANK.filter((topic) => topic.category === category);
  const exactMatches = categoryFiltered.filter((topic) => topic.difficulty === difficulty);
  const fallbackPool =
    exactMatches.length > 0 ? exactMatches : categoryFiltered.length > 0 ? categoryFiltered : TOPIC_BANK;

  return fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
}
