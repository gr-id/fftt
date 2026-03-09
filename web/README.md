# TTFF Web (MVP)

MBTI communication training MVP.

Current scope:
- Sentence training v1 (`/training`)
- Training evaluation with score persistence (`/api/training/evaluate`)
- Anonymous user creation prepared for later Google SSO linking (`/api/users/anonymous`)
- Live overall and MBTI ranking APIs (`/api/rank/*`)
- Prod-only Google SSO linking (`/api/auth/google/link`)
- Stage-only mock Google link flow (`/api/auth/google/mock-link`)

## 1) AI key management

The AI key required to run this service should be stored locally in a file like
`web/.env.local`. It should not be committed to the repository. Later, this will
be managed through Firebase.

Create `web/.env.local` and add:

```env
APP_ENV=stage
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
NEXT_PUBLIC_APP_ENV=stage
NEXT_PUBLIC_ENABLE_GOOGLE_SSO=false
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_web_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
```

For Firebase App Hosting or another Google Cloud environment with Application
Default Credentials, the `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY`
values can be omitted if the runtime already exposes a service account.

## 2) Local run

```bash
npm install
npm run dev
```

Open `http://localhost:3000/training` and `http://localhost:3000/rank`.

## 3) Checks

```bash
npm run lint
npm run build
```

## 4) How to verify real AI usage

1. Create `web/.env.local` with a valid `GEMINI_API_KEY`.
2. Run `npm run dev` inside `web`.
3. Open `http://localhost:3000/api/ai/status` to confirm the server loaded the key.
4. Open `http://localhost:3000/api/ai/status?probe=1` to run a live AI probe request.
5. Open `http://localhost:3000/training` and submit an answer in the arena.
6. Open `http://localhost:3000/rank` and confirm the score appears in:
   - overall ranking
   - selected MBTI ranking
   - your personal standing card
7. Confirm auth behavior:
   - `APP_ENV=stage`: rank page shows `테스트용 Google 연결`
   - `APP_ENV=production` with `NEXT_PUBLIC_ENABLE_GOOGLE_SSO=true`: rank page shows real Google link button
8. Check the result badge:
   - `AI used: gemini-2.5-flash` means the live model answered.
   - `Fallback used: no AI key configured` means no key was loaded.
   - `Fallback used: AI call failed (...)` means a key/model was configured but the upstream AI call failed, and local fallback logic was used instead.

## 5) Firebase deployment (App Hosting)

Recommended flow:
1. Create two Firebase projects: `prod` and `stage`.
2. Enable Firestore in both projects.
3. Create two App Hosting backends: `fftt-web-prod` and `fftt-web-stage`.
4. Connect the same repository and set `web` as the app root for both.
5. Configure per-backend env values:
   - `APP_ENV`
   - `FIREBASE_PROJECT_ID`
   - `GEMINI_API_KEY`
   - Firebase Admin credentials if ADC is unavailable
   - Firebase web app envs for the matching project
6. In prod only:
   - enable Firebase Auth Google provider
   - set `NEXT_PUBLIC_ENABLE_GOOGLE_SSO=true`
   - register the production redirect domain
7. In stage:
   - set `NEXT_PUBLIC_ENABLE_GOOGLE_SSO=false`
   - use the mock Google link flow
8. Deploy each backend separately.

## Next

- Google SSO rollout hardening and conflict UX
- Chat mode (`/chat`)
- Nickname editing and profile settings
- Paid plan integration
