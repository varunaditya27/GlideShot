# UI & UX

This covers the currently implemented interface pieces only.

## HUD

* Positioned top-left.
* Displays strokes, par, relative score (E / + / −), and a horizontal power bar with tick marks.
* Power bar gradient: green → yellow → red (proportional fill, linear transition).
* Accessible labels (aria) for score card and power percentage.

## Aim Assist

* Active while dragging.
* Components: direction line (sharp + glow), predictive decay dots, ghost ball, dynamic color scaling by normalized power.
* All geometry & materials reused (allocation minimization).

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
