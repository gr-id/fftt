# TTFF Web (MVP)

MBTI communication training MVP.

Current scope:
- Sentence training v1 (`/training`)
- Fixed target MBTI: `ISFJ`
- Gemini `gemini-2.5-flash` based revision API (`/api/training/revise`)
- JSON schema validation with one retry on parsing failure

## 1) AI key management

The AI key required to run this service should be stored locally in a file like
`web/.env.local`. It should not be committed to the repository. Later, this will
be managed through Firebase.

Create `web/.env.local` and add:

```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
```

## 2) Local run

```bash
npm install
npm run dev
```

Open `http://localhost:3000/training`.

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
6. Check the result badge:
   - `AI used: gemini-2.5-flash` means the live model answered.
   - `Fallback used: no AI key configured` means no key was loaded.
   - `Fallback used: AI call failed (...)` means a key/model was configured but the upstream AI call failed, and local fallback logic was used instead.

## 5) Firebase deployment (App Hosting)

Recommended flow:
1. Create a Firebase project.
2. Create an App Hosting backend.
3. Connect the repository and set `web` as the app root.
4. Configure `GEMINI_API_KEY` in the hosting environment.
5. Deploy.

## Next

- Firebase-based AI key management
- Chat mode (`/chat`)
- Metrics and leaderboard
- Anonymous users to Google SSO
- Paid plan integration
