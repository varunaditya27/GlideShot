# GlideShot Physics & Mechanics

## Ball Physics

- **Velocity:** Ball moves in direction and speed set by shot
- **Friction:** Ball slows down over time, simulating grass/terrain
- **Collision:** Ball bounces off boundaries, obstacles, and interacts with terrain
- **Spin/Bounce:** (Bonus) Add spin or bounce for realism
- **Wind:** (Bonus) Subtle wind can affect trajectory

## Goal Detection

- Ball is considered in the hole if its center enters the goal area and velocity is below a threshold
- Visual and audio feedback on goal

## Obstacles & Terrain

- Static: Walls, ramps, slopes, curves
- Dynamic: Moving platforms, rotating obstacles (bonus)

## Replay System

- Store last shot's trajectory and camera path
- Play back in slow motion on demand

## Physics Implementation

- No full physics engine; custom logic for performance and control
- All calculations in game loop (React Three Fiber render/update cycle)

See `gameplay.md` for how physics integrates with controls and progression.