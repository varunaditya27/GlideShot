# Physics & Motion

Only currently implemented behaviors are described below.

## Integration & Damping

* Velocity applied from drag‑derived vector (`aim.power * 2`).
* Frame‑rate independent damping factor: `v *= 0.98^(dt*60)` caps integration variance.

## Movement

* Position increment: `pos += v * dt` (scalar delta limited to 1/60s max step).
* No gravity or Y‑axis motion; gameplay is planar (XZ plane), with constant Y offset for the ball.

## Boundary Collisions

* Course rectangle: width 20, length 30 (see `Level.tsx`).
* When next position crosses boundary (after applying displacement):
  * Velocity component (x or z) inverted and scaled: `component *= -0.8`.
  * Position clamped inside bounds minus ball radius.
* No angular momentum or spin currently modeled.

## Hole Detection

* Radius check: `distance(ballPos, holePos) < 0.25`.
* Speed gate: only triggers if `|v| < 1.5` (prevents fast pass‑through registering early).
* On success: velocity zeroed, stroke counted, score persisted, visual pulse + success tones.

## Visual/Feedback Physics Adjacent Effects

| Effect | Trigger | Implementation |
|--------|---------|----------------|
| Hole Pulse | Hole scored | Ring mesh scale & fade over ~0.7s using timestamp diff |
| Bounce Particles | Boundary bounce | Preallocated circle sprites repositioned + radial velocity vectors |
| Goal Particles | Hole scored | Second particle burst at hole location |

## Not Implemented (Physics)

Spin, slope response, rolling resistance by surface type, wind, ramps, dynamic obstacles, restitution variation per surface, multi‑ball interactions.

## Design Rationale

Keeping a minimal custom loop reduces bundle size and GC pressure and keeps deterministic control over motion profiles. If future features require slopes or complex collisions, a light physics library layer (e.g., cannon‑es or Rapier) could be added incrementally.

See `gameplay.md` for user interaction flow.
