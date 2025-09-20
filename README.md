<div align="center">

# 🏌️ GlideShot

Refined browser-based 3D mini‑golf built with Next.js, React Three Fiber, and Firebase.

</div>

## Overview

GlideShot is a focused, minimal mini‑golf prototype. It implements a small but polished feature set: smooth camera follow, lightweight custom physics, intuitive drag‑to‑aim controls with an advanced, performance‑oriented aim assist (curved multi‑color trail, Fresnel ghost endpoint, power ring, distance ticks, smoothed power), a concise HUD, and persistent scoring with a per‑level leaderboard backed by Firebase. All documentation below reflects the current codebase only—no hypothetical or unimplemented functionality is described as present.

## Implemented Feature Set

| Area | Implemented |
|------|-------------|
| Rendering | React Three Fiber + Three.js scene (single procedural course per level) |
| Levels | 3 JSON‑defined levels (`public/levels/level-1..3.json`) with name, description, start, hole, par |
| Physics | Custom loop: velocity integration, frame‑rate independent damping, boundary bounce, hysteresis-based rest detection, hole radius detection |
| Input | Mouse drag to aim + power with pointer capture + global release safety; keyboard toggle aim mode (K) with arrow direction & +/- power |
| Aim Assist | Curved multi‑color trail + glow, Fresnel pulsing ghost, power ring arc fill, decay dots, distance ticks, hue shift & smoothed power response |
| UI | HUD (strokes, par, relative score, power bar with ticks), leaderboard panel, hole completion notice |
| Particles & FX | Bounce burst, goal burst, hole pulse, subtle audio beeps (Web Audio) |
| Camera | Smooth follow rig with damping offset |
| Persistence | Score saving on hole completion; per‑level leaderboard sorted by strokes |
| Auth | Firebase Auth (email/password supported via existing hook) |
| Backend | `/api/scores/get` & `/api/scores/post` (Node runtime) using Firebase Admin SDK |
| Data Model | Firestore collections: `users/{uid}/scores/{levelId}` & `leaderboard/{levelId}/entries/{uid}` |
| Performance Practices | Refs to avoid re‑renders, preallocated vectors/meshes, minimal per‑frame GC, no heavyweight physics engine |

## Not (Yet) Implemented (Explicitly Out of Scope Right Now)

Replay camera, spin / wind, moving obstacles, skins, social sharing, daily challenges, friend challenges, achievements, dynamic weather, accessibility modes beyond basic semantic HTML, keyboard navigation, level selector UI. Some of these appear in historical planning documents but are not active features.

## Quick Start

```bash
git clone https://github.com/varunaditya27/GlideShot.git
cd GlideShot
npm install
npm run dev
```

Open http://localhost:3000 and proceed to /game.

## Environment Variables

Create a `.env.local` with (client keys are safe for exposure in browser):

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...

# Server-side (do NOT expose these publicly)
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

`firebaseConfig.ts` consumes only `NEXT_PUBLIC_*` values. Admin SDK initialization in `firebaseAdmin.ts` is guarded—if the private key env vars are absent, API routes still warn gracefully.

## Gameplay Loop

1. Drag from ball (pointer captured) to set direction + power (distance capped, power smoothed for visuals).
2. Release (or space in keyboard aim mode): shot velocity applied (`power * 2`).
3. Physics: integrate, damping (`0.98^(dt*60)`), boundary response (invert component *0.8), update refs only while "moving".
4. Rest detection: hysteresis thresholds (start > 0.0009, stop < 0.00015, hard snap < 0.00005, 2-frame confirmation) re‑enable next shot promptly.
5. Hole detection: distance < 0.25 & speed < 1.5 → score saved → transition to next level after delay.
6. Leaderboard endpoint stores user score (merging strokes + par + timestamp) and updates per‑level entry.

## Data Model (Firestore)

```
users/{uid}/scores/{levelId}
	strokes: number
	par: number | null
	timestamp: Date

leaderboard/{levelId}/entries/{uid}
	uid: string
	name: string | null
	strokes: number
	par: number | null
	timestamp: Date
```

## Level Definition

Each level config (JSON) includes:

```jsonc

{
	"name": "Classic Starter",
	"description": "Straight fairway with a single hole.",
	"model": "",           // (Unused placeholder in current prototype)
	"start": [0, 0.2, 10],
	"hole": [0, 0.01, -10],
	"par": 3,
	"obstacles": []         // Currently unused by logic
}
```

The in‑scene geometry is procedural (`Level.tsx`)—rectangular ground + boundary walls + hole + flag.

## Performance Notes

* No physics engine; bespoke minimal math.
* Advanced aim assist preallocates geometry & shader materials; only mutates buffers & uniforms (no per‑frame allocations).
* Vertex-colored trail updates reuse a single Float32 buffer; colors updated in-place.
* Particle bursts & hole pulse reuse objects; zero per‑frame allocations for geometry.
* Camera rig smoothing uses simple lerp—no re‑renders triggered by React state per frame.
* Turbopack build; small dependency surface for 3D (three + R3F + drei subset).

Further detail: see `docs/performance.md` (added in this revision).

## Folder Structure (Relevant Portions)

```
src/
	app/
		page.tsx          # Landing page
		game/page.tsx     # Game UI + canvas
		api/scores/(get|post)/route.ts
	components/
		game/             # Level, Ball, PlayerControls, CameraRig, AimAssist
		ui/               # HUD, Leaderboard
	lib/                # firebaseConfig, firebaseAdmin
public/
	levels/             # level-1..3.json
docs/                 # Architecture, backend, gameplay, physics, ui, levels, roadmap, performance
```

## Security / Operational Notes

* Keep Admin credentials out of version control; rotate if exposed.

* Client only imports the `NEXT_PUBLIC_*` Firebase keys.

* API routes run in Node runtime, using Admin SDK to merge leaderboard + user score writes.

## Development Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Next.js dev server (Turbopack) |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

## Contributing

See `docs/contributing.md` for guidelines (lightweight; focused on accurate, minimal PR scope).

## License

MIT. See `LICENSE`.

## Credits

* Inspired by the open-source project [Open Golf](https://github.com/mgerdes/Open-Golf) (assets referenced in repo under `Open-Golf-master/`).

* Built with Next.js 15, React 19, React Three Fiber, Three.js, Firebase.

---
All claims above are derived from the current code; if you find a mismatch, open an issue describing the discrepancy.
