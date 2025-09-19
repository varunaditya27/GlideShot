# Performance Profile & Optimizations

This file documents only optimizations that actually exist in the current codebase, plus measurable rationale for keeping frame timing stable in a browser context.

## Goals

- Keep frame time stable (no GC spikes) for smooth input + physics.
- Avoid unnecessary React reconciliation per frame.
- Minimize Three.js object churn.
- Keep bundle lean for fast first load.

## Implemented Techniques

| Area | Technique | Notes |
|------|----------|-------|
| Physics Loop | Fixed-step integration decoupled from render | Prevents variable step instability on slow frames. |
| Math Objects | Reused Vector objects in update logic | Reduces per-frame allocations & GC pressure. |
| Scene Assets | Preloaded static GLTF/geometry once at mount | Avoids runtime fetch + parse mid-session. |
| React Components | Pure presentational HUD components kept shallow | Minimal prop churn limits re-render cost. |
| State Management | Local component state + minimal context | Avoids global re-renders. |
| Conditional Effects | Only spawn particle / pulses on events | No idle update overhead. |
| Leaderboard Fetch | Debounced / explicit triggers (not every frame) | Prevents network noise impacting frame budget. |
| CSS | Tailwind utility classes (no heavy runtime) | Eliminates dynamic style calculation overhead. |

## Why Fixed-Step Physics

A fixed timestep (e.g., 60 Hz) ensures deterministic motion within tolerance. Rendering interpolates naturally at browser refresh. This avoids:

- Fast machine divergence (overshooting on high FPS)
- Slow frame tunneling (large dt causing missed collisions)

## Memory Strategy

- Reuse vectors / temp objects inside the physics loop.
- Avoid allocating new arrays inside animation callbacks.
- Keep transient effect objects short-lived and sparse.

## Avoided Patterns (Deliberately Not Used)

| Pattern | Reason for Avoidance |
|---------|----------------------|
| Per-frame setState for physics | Would thrash React reconciliation. |
| Creating new Mesh/Material each stroke | Expensive GPU + JS allocation. |
| Large physics libs (Cannon/Oimo/Ammo) | Overkill for putting mechanic. |
| Global event bus for every interaction | Adds indirection + debugging cost. |

## Monitoring & Verification

Current qualitative checks:

- Manual DevTools performance recording: no long task clusters during idle.
- Memory panel: flat retained size during sustained play.

Future instrumentation ideas (NOT implemented):

| Idea | Benefit |
|------|---------|
| Frame time histogram overlay | Surfacing spikes early. |
| Physics step duration logging | Detect drift or heavy new logic. |
| Asset load timing metrics | Budgeting for future level complexity. |

## Extension Points

When adding complexity (slopes, moving obstacles, more levels):

1. Keep new math allocation-free inside hot loops.
2. Batch any dynamic geometry updates.
3. Guard expensive effects with feature flags.
4. Measure before/after with a simple frame cost log.

## Browser Considerations

- Layout thrash avoided: gameplay canvas isolated; HUD uses simple flow layout.
- No blocking synchronous XHR / heavy main-thread parsing after first load.

## Summary

The existing implementation favors a lean, allocation-light inner loop with minimal React overhead. This gives headroom for upcoming gameplay features without immediate refactors.

