# Backend & Persistence

This file documents only the backend logic that exists in the repository today.

## Components

| Component | Location | Purpose |
|-----------|----------|---------|
| Firebase Client Init | `src/lib/firebaseConfig.ts` | Initializes browser SDK using `NEXT_PUBLIC_*` env vars |
| Firebase Admin Init | `src/lib/firebaseAdmin.ts` | Provides `adminDb()` / `adminAuth()` for API routes (warns if not configured) |
| Score Fetch API | `app/api/scores/get/route.ts` | Returns leaderboard entries (by `levelId`) or user scores (by `uid`) |
| Score Post API | `app/api/scores/post/route.ts` | Upserts user score + leaderboard entry |

## Authentication (Implemented)

* Firebase Auth (email/password).
* `useAuth` hook (in `hooks/`) manages auth state client‑side.
* No custom tokens or providers currently configured.
* Anonymous play path not implemented (would require conditional writes logic).

## Data Model

On each holed shot the client calls `/api/scores/post` with `{ uid, levelId, strokes, par }`.

Firestore writes:

```text
users/{uid}/scores/{levelId}
  strokes: number
  par: number | null
  timestamp: Date

leaderboard/{levelId}/entries/{uid}
  uid: string
  name: string | null   // derived from displayName or email prefix if available
  strokes: number
  par: number | null
  timestamp: Date
```

`/api/scores/get`:

* With `?levelId=...` → returns array of entries sorted ascending by strokes.
* With `?uid=...` → returns all scores for that user.
* Without either → 400 error.

Display name enrichment: route attempts an Admin Auth batch lookup when entries lack a `name` field; failures are silently ignored so missing admin credentials degrade gracefully.

## Validation & Error Handling

* Input guard in POST ensures presence of `uid`, `levelId`, numeric `strokes`.
* Errors return JSON `{ error: string }` with 400 or 500.
* No rate limiting layer implemented (would be a future hardening step).

## Security Notes

* Admin credentials loaded from `FIREBASE_*` env vars server‑side only.
* Private key newline normalization is handled.
* If env vars absent the app warns but continues—score endpoints will fail gracefully if writes not possible.
* Firestore security rules are not included in repo; deploying requires configuring rules manually to restrict writes to authenticated users.

## Performance Considerations

* Simple per‑request Firestore reads/writes (no caching). Current scale is minimal.
* Batch user lookup only performed when needed (missing `name`).

## Future (Not Implemented)

Rate limiting, pagination for large leaderboards, server-side aggregation, analytics events, user profile documents, multi‑course sets.

See `architecture.md` for broader flow and `performance.md` for general optimization practices.
