const names = [
  "Mint", "Haru", "Noel", "Rin", "Maro", "Sena", "Luca", "Yuri", "Nabi", "Theo",
  "Jin", "Ari", "Evan", "Mina", "Dori", "Kian", "Lia", "Rumi", "Ian", "Sori",
  "Nox", "Hani", "Bora", "Sian", "Yuna", "Roa", "Taeo", "Elin", "Milo", "Jade",
  "Narin", "Sio", "Rian", "Dain", "Mio", "Seol", "Juno", "Aden", "Lumi", "Ren",
  "Hazel", "Cian", "Yeon", "Mori", "Beni", "Arin", "Yel", "Dami", "Onyu", "Rae",
];

const mbtis = [
  "INTJ", "ENFP", "ISFJ", "ENTP", "INFJ", "ESTJ", "ISTP", "ENFJ", "INFP", "ESFP",
];

export const TOPIC_BANK = [
  {
    topic: "친구와의 약속 조율",
    angle: "상대가 부담 없이 받아들이도록 제안하기",
    prompt:
      "친구가 약속 시간을 자꾸 바꾸고 있습니다. 기분이 상하지 않게, 하지만 내 일정도 지키면서 다시 시간을 정리하는 답장을 써보세요.",
  },
  {
    topic: "팀 프로젝트 피드백",
    angle: "부드럽지만 분명하게 개선점을 전달하기",
    prompt:
      "팀원이 제출한 초안에 아쉬운 부분이 있습니다. 관계를 해치지 않으면서도 수정이 꼭 필요하다는 점이 전달되도록 답변해보세요.",
  },
  {
    topic: "지친 상대 위로",
    angle: "상대의 상태를 존중하면서 힘이 되는 말 건네기",
    prompt:
      "상대가 요즘 많이 지쳤다며 연락했습니다. 가볍지 않게 공감하면서도 조금은 힘이 될 수 있는 답변을 작성해보세요.",
  },
  {
    topic: "새로운 제안 설득",
    angle: "부담보다 장점을 먼저 느끼게 만들기",
    prompt:
      "상대에게 새로운 모임 아이디어를 제안하려고 합니다. 억지로 밀지 않고도 흥미를 느끼게 할 답변을 써보세요.",
  },
  {
    topic: "오해 정리",
    angle: "방어적이지 않게 내 입장 설명하기",
    prompt:
      "최근 대화에서 작은 오해가 생겼습니다. 변명처럼 들리지 않으면서 내 의도를 차분하게 설명하는 답변을 작성해보세요.",
  },
  {
    topic: "감사 표현",
    angle: "짧아도 진심이 느껴지게 쓰기",
    prompt:
      "상대가 예상보다 큰 도움을 줬습니다. 부담스럽지 않지만 분명히 고마움이 전해지는 답변을 작성해보세요.",
  },
];

export const RANKING_ENTRIES = Array.from({ length: 50 }, (_, index) => ({
  rank: index + 1,
  name: names[index],
  mbti: mbtis[index % mbtis.length],
  score: 98 - Math.floor(index / 2),
  streak: 12 - Math.floor(index / 5),
}));
