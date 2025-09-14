# GlideShot Level Design & Extensibility

## Level Structure

- Each level is defined by a 3D model (OBJ/GLTF) and a config file (JSON/TS)
- Config includes:
  - Start position
  - Hole position/size
  - Par value
  - Obstacles (static/dynamic)
  - Terrain properties (friction, slope, etc.)

## Adding New Levels

1. Place model in `public/levels/` (e.g., `level-1.glb`)
2. Create config in `public/levels/level-1.json`
3. Update level list in game logic (or use auto-discovery)

## Terrain Variations

- Ramps, slopes, curves, moving platforms
- Define via model geometry and config

## Dynamic Obstacles

- Specify movement path, speed, and trigger in config
- Supported types: rotating, sliding, toggling

## Level Progression

- Levels can be played linearly or via selector
- Progress and scores tracked per level

## Bonus: Daily/Randomized Levels

- Generate or select a new challenge each day

See `gameplay.md` and `ui.md` for how levels integrate with the game loop and UI.