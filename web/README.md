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
APP_ENV=production
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
FIREBASE_PROJECT_ID=fftt-gr-id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_ENABLE_GOOGLE_SSO=true
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCkkqoyG0WRbZ7lnnyB9sMVT0vB_MI48Dk
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=fftt-gr-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=fftt-gr-id
NEXT_PUBLIC_FIREBASE_APP_ID=1:639175436216:web:398e6ba36dff503b71914d
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=639175436216
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
   - `APP_ENV=production` with `NEXT_PUBLIC_ENABLE_GOOGLE_SSO=true`: rank page shows real Google link button
8. Check the result badge:
   - `AI used: gemini-2.5-flash` means the live model answered.
   - `Fallback used: no AI key configured` means no key was loaded.
   - `Fallback used: AI call failed (...)` means a key/model was configured but the upstream AI call failed, and local fallback logic was used instead.

## 5) Firebase deployment (App Hosting)

Recommended flow:
1. Use Firebase project `fftt-gr-id`.
2. Enable Firestore and Firebase Auth in that project.
3. Use App Hosting backend `fftt-web` with `web` as the app root.
4. Configure runtime env values:
   - `APP_ENV=production`
   - `FIREBASE_PROJECT_ID=fftt-gr-id`
   - `GEMINI_API_KEY`
   - Firebase Admin credentials if ADC is unavailable
   - `NEXT_PUBLIC_APP_ENV=production`
   - `NEXT_PUBLIC_ENABLE_GOOGLE_SSO=true`
   - `NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCkkqoyG0WRbZ7lnnyB9sMVT0vB_MI48Dk`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=fftt-gr-id.firebaseapp.com`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID=fftt-gr-id`
   - `NEXT_PUBLIC_FIREBASE_APP_ID=1:639175436216:web:398e6ba36dff503b71914d`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=639175436216`
5. Enable the Firebase Auth Google provider and register the production redirect domain.
6. Deploy only the `fftt-web` backend.

## Next

- Google SSO rollout hardening and conflict UX
- Chat mode (`/chat`)
- Nickname editing and profile settings
- Paid plan integration
