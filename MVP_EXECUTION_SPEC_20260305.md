# MBTI 소통 앱 MVP 실행 스펙 (2026-03-05)

## 1) 확정된 제품/기술 의사결정
- 1차 개발 시작 모드: 스킬 숙련 v1
- 초기 LLM 모델: `gpt-4o-mini`
- MVP 인증: 익명 사용 (추후 Google SSO 추가)
- 패키지 매니저: `npm`
- 배포: Firebase
- 초기 UI 언어: 한국어 only
- 스킬 숙련 v1 대상 MBTI: `ISFJ` 고정 (다음 업데이트에 MBTI 선택 기능 추가)
- 스킬 숙련 출력 톤: 친근한 코치형
- 안전 고지 문구: MVP 화면 비노출 (추후 가입 동의 플로우로 이전)
- 대화 실전 모드 컨텍스트: 최근 12턴
- 매칭률 산식: LLM 평가 기반
- 리더보드: 전체 공개형
- 결제 우선 수단: 토스페이먼츠
- B2B 1차 타깃: 검사 제공처

## 2) 개발 우선순위 (난이도/검증속도 기준)
1. 스킬 숙련 모드 v1 (MVP 핵심)
2. 대화 실전 모드
3. 스킬 숙련 모드 v2 (매칭률/점수/리더보드)
4. 진심 전달 모드 (실시간 1:1 번역)
5. 과금/티어 + B2B 기능

## 3) 권장 아키텍처
- Frontend: Next.js(App Router) + Tailwind CSS
- Backend: Next.js Route Handlers
- LLM: OpenAI API (`gpt-4o-mini`)
- 저장소(MVP): localStorage 중심
- 배포: Firebase App Hosting (Next.js SSR 호환)
- 추후 확장 DB: PostgreSQL (Supabase 또는 독립 RDS)

### 아키텍처 원칙
- 모드별 프롬프트 템플릿을 서버에서 중앙 관리
- 클라이언트는 모델/프롬프트 상세를 모르고 API만 호출
- 출력 파싱 실패 대비 재시도/검증 로직 서버에서 처리

## 4) Phase 1 상세 스펙

### 4.1 스킬 숙련 v1

#### 사용자 플로우
1. 사용자가 `훈련 시작` 클릭
2. 대상 MBTI는 `ISFJ`로 고정
3. 메시지 입력
4. 결과 표시
   - 교정 문장
   - 왜 이렇게 바꾸는지 이유

#### 화면 구성
- `/training`
  - `대상 MBTI: ISFJ` 고정 배지
  - 원문 입력 텍스트영역
  - 제출 버튼
  - 결과 카드 2개
    - `교정 문장`
    - `이유`

#### API 계약
- `POST /api/training/revise`
- Request
```json
{
  "message": "내일까지 자료 보내줘"
}
```
- Response (성공)
```json
{
  "revised_sentence": "내일 오전까지 검토하실 수 있도록 자료 정리해 전달드릴게요.",
  "reason": "ISFJ는 배려와 협조의 뉘앙스가 담긴 정중한 표현을 더 편안하게 받아들이는 경향이 있습니다.",
  "usage": { "input_tokens": 0, "output_tokens": 0, "total_tokens": 0 }
}
```
- Response (실패)
```json
{
  "error": { "code": "INVALID_INPUT", "message": "message is required" }
}
```

#### 서버 로직
- 입력 검증
  - `message` 길이 제한 (예: 1~500자)
- `targetMbti`는 서버에서 `ISFJ`로 강제 주입
- 시스템 프롬프트 + 사용자 입력 조합
- 모델 호출
- JSON 파싱/스키마 검증
- 실패 시 1회 재시도
- 결과 반환

#### 품질 기준
- 항상 한국어 출력
- 친근한 코치형 톤 유지
- `revised_sentence`는 1~3문장
- `reason`은 1~2문단, 추상적 MBTI 고정관념 최소화
- 민감 주제(진단/의학/법률) 요청은 직접적 진단 표현 금지

### 4.2 대화 실전 모드 (Phase 1 후반)

#### 사용자 플로우
1. `대화 시작` 클릭
2. MBTI 캐릭터 선택 + 이름 지정
3. 채팅창 오픈
4. 사용자 메시지 입력 시 MBTI 페르소나 응답

#### API 계약
- `POST /api/chat/respond`
- Request
```json
{
  "targetMbti": "ENFP",
  "personaName": "따뜻한 ENFP 친구",
  "history": [
    { "role": "user", "content": "요즘 지쳤어" },
    { "role": "assistant", "content": "무리 많이 했구나" }
  ],
  "message": "어떻게 회복하면 좋을까?"
}
```
- 정책
  - `history`는 최근 12턴만 반영

## 5) Phase 2~3 확장 스펙

### 5.1 스킬 숙련 v2 (매칭률/점수/리더보드)
- 기능
  - 사용자 문장별 매칭률(0~100)
  - 매칭률 기반 점수 누적
  - MBTI별 리더보드(전체 공개)
- 방식
  - LLM 평가 전용 프롬프트 별도 사용
  - 결과 스키마 예시
```json
{
  "match_rate": 82,
  "score": 164,
  "feedback": "핵심 의도는 명확했지만 상대의 의사결정 기준 언급이 부족했습니다."
}
```
- 보정
  - 평가 일관성 위해 기준 rubric 고정
  - 이상치 방지용 score clamp 적용

### 5.2 진심 전달 모드
- 실시간 1:1 채팅(WebSocket)
- 입장 시 각자 MBTI 입력
- 본문 아래 `상대 MBTI 친화 번역문` 표시
- 메시지 저장 시 원문/번역문 쌍 저장

### 5.3 수익화
- 토큰 티어 3단계
  - Free / Standard / Pro
- 티어별 월 토큰 한도
- 채팅창 추가 생성 과금(토스)
- B2B(검사 제공처)
  - 기관 계정
  - 사용량 대시보드
  - 리포트 export

## 6) 데이터 모델 초안 (DB 도입 시)
- `users`
  - id, auth_type(anonymous/google), created_at
- `sessions`
  - id, user_id, mode(training/chat), mbti, created_at
- `messages`
  - id, session_id, role, raw_text, revised_text, reason, created_at
- `scores`
  - id, user_id, mbti, match_rate, score, created_at
- `leaderboards`
  - mbti, user_id, total_score, rank, updated_at
- `billing_accounts`
  - user_id, tier, monthly_token_quota, token_used
- `payments`
  - id, user_id, provider(toss), amount, status, created_at

## 7) 1차 스프린트(1~2주) 작업 단위

### Sprint 1 (핵심 MVP)
- Next.js 프로젝트 초기화
- `/training` UI 구현
- `/api/training/revise` 구현
- 프롬프트/파서/에러 핸들링
- localStorage에 최근 입력/결과 저장
- 오류 상태/로딩 상태 UX

### Sprint 2 (대화 실전)
- `/chat` UI 구현
- 페르소나 선택/이름 지정
- `/api/chat/respond` 구현
- 12턴 컨텍스트 제한 로직
- 세션별 임시 저장

### Sprint 3 (점수/리더보드 베이스)
- LLM 평가 API 추가
- 매칭률/점수 계산 저장 구조
- 공개 리더보드 화면(읽기 전용)

## 8) 테스트/검증 체크리스트
- 단위 테스트
  - 입력 검증(유효 MBTI, 길이 제한)
  - JSON 파싱 실패 재시도
- 통합 테스트
  - 훈련 모드 E2E: 입력 -> 결과/이유 출력
  - 채팅 모드 E2E: 컨텍스트 12턴 유지
- 품질 점검
  - 16 MBTI 샘플 질의 5개씩 응답 품질 수동 리뷰
  - 토큰 사용량/응답 시간 로깅

## 9) 다음 구현 시작점
- 우선 `스킬 숙련 v1`을 개발 착수한다.
- 완료 기준:
  - 실사용 가능한 `/training` 화면
  - 실제 LLM 응답 연결
  - 응답 JSON 안정 파싱
  - 기본 에러 처리 및 로딩 처리
