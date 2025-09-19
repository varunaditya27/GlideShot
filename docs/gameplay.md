# Gameplay & Mechanics

This document reflects only the currently implemented mechanics.

## Core Loop

Aim (drag) → Release (apply velocity) → Ball updates under damping & boundary collisions → Hole detection → Score save → Next level after delay.

## Controls (Implemented)

| Action | Method |
|--------|--------|
| Aim & Power | Mouse drag from ball (drag distance capped) |
| Shoot | Release pointer while dragging |
| Camera | Automatic follow (no manual orbit UI) |

Keyboard, touch gestures, replay triggers, and advanced camera control are not implemented yet.

## UI Elements

| Element | Purpose |
|---------|---------|
| HUD | Displays strokes, par, relative score, power bar |
| Aim Assist | Direction line + glow, ghost ball, predictive dots; active while dragging |
| Leaderboard | Per‑level top entries (score + relative vs par) |
| Notice | Hole completion message (temporary) |

## Level Progression

Levels are loaded sequentially from an internal list of three JSON configs. After scoring a hole, the next level index is selected modulo length. No manual selection UI exists.

## Scoring

* Stroke count increments each shot.
* On goal: final strokes (including current shot) submitted with par.
* Relative score (strokes − par) displayed in HUD.

## Physics Snapshot

* Frame‑rate independent damping via exponential factor.
* Boundary collision inverts velocity component with 0.8 restitution.
* Hole detection: distance threshold + low speed gate.
* No slope/terrain variation, obstacles, spin, or wind currently active.

## Audio & Feedback

* Web Audio beeps for shot, stop, and success triple‑tone.
* Particles & ring pulse for bounce/goal events.

## Not Implemented (Explicitly)

Replay camera, obstacle interactions beyond walls, advanced power curve UI, mobile haptics, achievements, daily challenges, keyboard accessibility enhancements.

See `physics.md` for lower‑level motion details, `backend.md` for scoring persistence, and `ui.md` for HUD specifics.
