# Gameplay & Mechanics

This document reflects only the currently implemented mechanics.

## Core Loop

Aim (drag) → Release (apply velocity) → Ball updates under damping & boundary collisions → Hole detection → Score save → Next level after delay.

## Controls (Implemented)

| Action | Method |
|--------|--------|
| Aim & Power (Mouse) | Drag from ball (pointer captured; leaving plane bounds will not auto-release) |
| Shoot (Mouse) | Release pointer while dragging |
| Toggle Keyboard Aim | Press `K` to enter/exit keyboard aiming mode |
| Aim Direction (Keyboard) | Arrow keys rotate direction about Y (planar) |
| Adjust Power (Keyboard) | `+ / =` increase, `-` decrease (0..5) |
| Shoot (Keyboard) | Space bar (if power > 0) |
| Camera | Automatic follow (no manual orbit UI) |

Touch, replay triggers, and manual camera orbit remain unimplemented.

## UI Elements

| Element | Purpose |
|---------|---------|
| HUD | Displays strokes, par, relative score, power bar |
| Aim Assist | Curved multi‑color trail + glow, Fresnel pulsing ghost, power ring arc fill, distance ticks, decay dots, hue shift, smoothed power; active while aiming |
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
* Rest detection hysteresis: start if speed² > 0.0009; stop after 2 frames below 0.00015; hard snap below 0.00005 or after 8s to prevent drift.
* Hole detection: distance < 0.25 & speed < 1.5.
* Planar only; no slopes/terrain variation, obstacles, spin, or wind active yet.

## Audio & Feedback

* Web Audio beeps for shot, stop, and success triple‑tone.
* Particles & ring pulse for bounce/goal events.

## Not Implemented (Explicitly)

Replay camera, obstacle interactions beyond walls, advanced power curve UI, mobile haptics, achievements, daily challenges, keyboard accessibility enhancements.

See `physics.md` for lower‑level motion & thresholds, `backend.md` for scoring persistence, and `ui.md` for HUD specifics.
