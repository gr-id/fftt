# TTFF Web (MVP)

MBTI 소통 훈련 웹앱 MVP입니다.

현재 구현 범위:
- 스킬 숙련 v1 (`/training`)
- 대상 MBTI `ISFJ` 고정
- Gemini `gemini-2.5-flash` 기반 첨삭 API (`/api/training/revise`)
- JSON 스키마 검증 + 파싱 실패 시 1회 재시도

## 1) 환경 변수 설정
프로젝트 루트(`web`)에 `.env.local` 파일을 만들고 아래 값을 채워주세요.

```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
```

## 2) 로컬 실행
```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000/training` 접속.

## 3) 품질 확인
```bash
npm run lint
npm run build
```

## 4) Firebase 배포 (App Hosting)
Firebase 콘솔/CLI에서 App Hosting으로 Next.js 앱을 연결해 배포합니다.

권장 순서:
1. Firebase 프로젝트 생성
2. App Hosting 백엔드 생성
3. 저장소 연결 후 `web` 디렉터리를 앱 루트로 지정
4. 런타임 환경변수에 `GEMINI_API_KEY` 설정 (`GEMINI_MODEL`은 `apphosting.yaml` 기본값 사용)
5. 배포 실행

## 다음 단계
- 대화 실전 모드 (`/chat`)
- 매칭률/점수/리더보드
- 익명 사용자 -> Google SSO 전환
- 토스 결제 연동
