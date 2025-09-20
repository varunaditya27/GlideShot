# Architecture

This document describes only what exists in the current GlideShot codebase.

## Stack Summary

| Layer | Technology | Notes |
|-------|------------|-------|
| Runtime / App | Next.js App Router (TypeScript) | `src/app` structure |
| 3D Rendering | React Three Fiber + Three.js | Single Canvas on `/game` |
| UI | Inline styles + minimal Tailwind (global), custom components | No design system abstraction layer yet |
| State | React local state + refs | No global store (Redux/Zustand) |
| Auth | Firebase Auth | Email/password paths supported via hook `useAuth` |
| Persistence | Firestore (via Admin SDK in API routes) | Scores + leaderboard entries |
| Hosting (intended) | Vercel (frontend + API) | Not hard‑coded; assumed standard Next deployment |

## Module Overview

* `game/page.tsx`: Orchestrates game loop composition (HUD, Canvas, leaderboard, level progression, rest detection thresholds).
* `components/game/*`: Rendering units (Ball, Level, PlayerControls, CameraRig, enhanced AimAssist) + visual effects (particles, hole pulse).
* `components/ui/*`: HUD and Leaderboard.
* `lib/firebaseConfig.ts`: Client Firebase initialization using `NEXT_PUBLIC_*` env vars.
* `lib/firebaseAdmin.ts`: Lazy Admin SDK init for server routes (warns if not fully configured).
* `app/api/scores/(get|post)`: Firestore read/write bridge for scores & leaderboard.

## Data / Control Flow

1. Player aims (pointer events captured by `PlayerControls`).
2. On release (or keyboard trigger), velocity vector applied to ball refs; `GameScene` advances physics only while moving (hysteresis-driven state machine).
3. Hole detection triggers score submission via `saveScore` (client) → `/api/scores/post` (server) → Firestore.
4. Leaderboard fetch on level load calls `/api/scores/get?levelId=...`.
5. Auth hook listens to Firebase Auth state; authenticated user id passed with score submissions.

## Physics Loop (Simplified)

```text
if moving:
  v *= dampingFactor (frame‑rate independent)
  pos += v * dt
  if boundary hit -> invert component * 0.8
  if near hole && speed < threshold -> goal
  if speed² < stopThreshold for N frames OR speed² < hardSnap OR elapsed > maxMoveTime -> moving=false
```

## Firestore Collections

* `users/{uid}/scores/{levelId}` – per user per level
* `leaderboard/{levelId}/entries/{uid}` – flattened leaderboard view

## Extensibility Points (Presently Minimal)

| Area | How to Extend |
|------|---------------|
| Levels | Add a new `public/levels/level-N.json` and include in load list (`game/page.tsx`) |
| Visual FX | Create new R3F component and mount in `<Canvas>` |
| Backend | Add `app/api/<feature>/route.ts` with Node runtime |
| Auth | Extend `useAuth` for providers (Google, etc.) |

## Deliberate Omissions (Not Implemented Yet)

Level selector UI, dynamic obstacle system, achievements, replay system, wind/spin, in‑game settings panel.

## Constraints

* Single Canvas; no SSR of 3D scene.
* All physics & camera math executed inside R3F `useFrame` with preallocated vectors.
* Minimal cross‑module coupling; no DI layer.

See `backend.md`, `gameplay.md`, and `performance.md` for focused discussions.
