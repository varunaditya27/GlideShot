# GlideShot Backend & Persistence

## Overview

GlideShot uses Firebase for all backend needs: authentication, score storage, and leaderboard management. Next.js API routes act as a secure bridge between the frontend and Firebase.

## Authentication

- **Email-based login:** Users sign up/sign in with email/password
- **Session management:** Firebase Auth handles tokens and session state
- **Anonymous play:** (Optional) Allow guest play with limited features

## Score Storage

- **Firestore:** Stores per-user scores, per-hole stats, and total scores
- **Schema:**
  - `/users/{uid}/scores/{levelId}`: { strokes, par, timestamp }
  - `/leaderboard/{levelId}`: { uid, strokes, timestamp }
- **Persistence:** Scores update in real-time; users can resume progress

## API Routes

- **/api/scores/get:** Fetch scores for user or leaderboard
- **/api/scores/post:** Submit/update score after each hole
- **/api/auth:** (Optional) Custom auth endpoints if needed

## Leaderboard

- Global and per-level leaderboards
- Sorted by lowest strokes, then fastest time

## Security

- Firestore rules restrict access to authenticated users
- API routes validate input and sanitize data

## Deployment

- Vercel for frontend/API
- Firebase Console for backend setup

See `architecture.md` for integration details and `gameplay.md` for score logic.