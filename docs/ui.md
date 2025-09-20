# UI & UX

This covers the currently implemented interface pieces only.

## HUD

* Positioned top-left.
* Displays strokes, par, relative score (E / + / −), and a horizontal power bar with tick marks.
* Power bar gradient: green → yellow → red (proportional fill, linear transition).
* Accessible labels (aria) for score card and power percentage.

## Aim Assist

Active while aiming (mouse drag with pointer capture or keyboard aim mode). Components:

| Component | Description |
|-----------|-------------|
| Curved Trail | Vertex‑colored multi‑point line with hue shift & glow duplicate |
| Ghost Endpoint | Pulsing Fresnel shader sphere at projected max distance |
| Power Ring | Ground ring with arc fill proportional to normalized power |
| Distance Ticks | Fading ring markers at fixed spacing along aim direction |
| Decay Dots | Ground dots with geometric distance falloff & opacity taper |
| Color Dynamics | Green→yellow→red + subtle hue shift across trail length |
| Smoothed Power | Lerp filter prevents harsh visual snapping during fast drag |

All geometry/material instances are reused; only buffer attributes and uniforms are mutated per frame (allocation minimization).

## Leaderboard Panel

* Positioned top-right (absolute overlay).
* Shows ranked top entries (up to 10) for current level (sorted by strokes asc).
* Relative vs par badge (color: green below, gray even, red above par).
* Skeleton placeholders while loading.
* Graceful error message if fetch fails.

## Hole Completion Notice

* Temporary centered text badge after goal event.
* Clears automatically when next level loads.

## Feedback Effects

| Effect | Purpose |
|--------|---------|
| Hole Pulse | Visual focus + success acknowledgment |
| Bounce Particles | Reinforce collision feedback |
| Goal Particles | Highlight successful putt |
| Audio Beeps | Minimal shot / stop / success triad |

## Not Implemented (UI)

Menus, settings panel, theme toggle, accessibility high-contrast mode, keyboard navigation framework, replay viewer, achievements toasts, mobile responsive optimizations (layout presently desktop-focused), touch gesture special states.

See `gameplay.md` for loop specifics and `performance.md` for optimization techniques applied to UI rendering.
