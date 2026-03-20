---
description: GitHub 자동 커밋 및 Firebase 전체 배포
---

이 워크플로우는 변경사항을 GitHub에 커밋 및 푸시하고 Firebase(Hosting 및 Functions)에 자동으로 배포하는 과정을 수행합니다.

// turbo-all

1. 현재까지의 모든 변경사항을 Git에 추가(Staging)합니다.
```bash
git add .
```

2. 변경사항을 커밋합니다. (기본 메시지 사용)
```bash
git commit -m "Auto-commit and deploy to Firebase"
```

3. GitHub 원격 저장소(`main` 브랜치)에 변경사항을 푸시합니다.
```bash
git push origin main
```

4. Firebase에 Hosting과 Cloud Functions를 배포합니다. (Windows PowerShell 정책 우회를 위해 cmd 환경에서 실행합니다.)
```bash
cmd.exe /c "firebase deploy"
```
