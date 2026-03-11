# FFTT Release Notes

Date: 2026-03-12

## Summary
- Rebuilt the training flow around repeat play instead of one-off sessions.
- Added category-based training content with recommended difficulty selection.
- Added profile editing, recent training history, and lightweight product analytics.

## What Changed
- Training session generation now supports category, intent, and difficulty metadata.
- Arena results now show streak, recent average score, previous-score delta, and clear next actions.
- Ranking page now supports nickname editing and viewing recent training history.
- Added server-side storage for richer training attempts and history queries.
- Added product event tracking for training starts, submissions, completions, next-round clicks, history opens, and nickname updates.

## New APIs
- `POST /api/training/session`
- `GET /api/training/history`
- `PATCH /api/users/profile`
- `POST /api/analytics/events`

## Validation
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`

## Deployment Notes
- Production App Hosting backend is `fftt-web` in Firebase project `fftt-gr-id`.
- Deployment used a prod-only Firebase config to avoid touching stage.
