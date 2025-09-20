# Levels

Only three JSON-defined levels ship with the current codebase. Geometry in-game is procedural (no external model loading yet).

## Current Level Files

| File | Name | Par | Hole | Notes |
|------|------|-----|------|-------|
| `level-1.json` | Classic Starter | 3 | (0, -10) | Straight fairway |
| `level-2.json` | Gentle Challenge | 3 | (~2, -9) | Slight lateral offset hole |
| `level-3.json` | Modern Maze | 4 | (~-2, -8) | Simple zig-zag path intention (currently flat) |

Each config format:

```jsonc
{
  "name": "Classic Starter",
  "description": "Straight fairway with a single hole.",
  "model": "",          // placeholder, unused
  "start": [0, 0.2, 10],
  "hole": [0, 0.01, -10],
  "par": 3,
  "obstacles": []        // not consumed yet
}
```

## How They Load

`game/page.tsx` contains a static array of filenames: `['level-1.json','level-2.json','level-3.json']`. On mount it fetches each, stores parsed config, sets initial ball position & hole vector.

## In-Scene Representation

`Level.tsx` generates:

* Ground plane (20 × 30)
* Four perimeter walls
* Hole (ring + cylinder + glowing outer ring)
* Flag pole + flag mesh

No per-level geometry variation occurs beyond hole position & par values.

Rest detection thresholds and aim assist visuals are global systems and do not alter the JSON level schema; adding levels requires no changes to those mechanics.

## Adding a New Level (Current Process)

1. Create `public/levels/level-4.json` with same schema.
2. Add filename to the `files` array in the effect inside `game/page.tsx`.
3. (Optional) Adjust hole coordinates to remain within ground bounds.

## Not Implemented

Auto-discovery of JSON files, loading GLTF/OBJ meshes, dynamic obstacles, ramps/slopes, daily/random level rotation, par-based difficulty scaling.

See `gameplay.md` for progression details.
