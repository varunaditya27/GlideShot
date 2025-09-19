# Contributing to GlideShot

Thanks for your interest in improving GlideShot. The project is currently small and focused; this guide keeps contributions lean and aligned with implemented scope.

## Core Principles

- Keep the gameplay loop fast, clear, and minimal.
- Avoid adding dependencies unless they remove meaningful complexity.
- Do not document or reference features that are not implemented.
- Favor small, reviewable pull requests.

## Project Structure (High-Level)

```text
/ src/app           Next.js app router pages & game UI
/ src/app/game      Game logic (React Three Fiber, physics loop, rendering)
/ public/levels     JSON level descriptors
/ docs              Architecture & feature docs (must stay factual)
```

## Getting Started

1. Fork the repo.
2. Create a feature branch: `feat/<short-description>`.
3. Install deps: `npm install`.
4. Run dev server: `npm run dev`.
5. Open in browser at the printed URL.

## Development Guidelines

### Code Style

- Use existing ESLint + TypeScript config conventions.
- Keep functions short and single-purpose.
- Prefer explicit naming over comments.

### React / Rendering

- Avoid per-frame React state updates for physics; use refs or local mutable objects.
- Keep HUD components presentational.

### Three.js / R3F

- Reuse geometry/material instances when possible.
- Avoid allocating new Vector/Quaternion objects inside animation loops.

### Physics

- Maintain fixed-step integration invariants.
- Benchmark any added collision logic for allocation spikes.

### Levels

- Validate new level JSON matches existing schema (see `docs/levels.md`).
- Keep texture/model references consistent with loaded assets.

## Commit Messages

Use conventional style (informal but scoped):

```text
feat: add slope collision normal handling
fix: prevent stroke count underflow on reset
chore: tighten lint rule for unused vars
docs: document performance budget
refactor: extract aim vector calc
```

## Pull Requests

Include:

- Summary of change & rationale.
- Any performance notes (especially allocations / frame impact).
- Screenshots or short clip if UI/visual.
- Checklist confirming no undocumented features were added.

## Reporting Issues

Provide:

- Environment (browser + OS).
- Steps to reproduce.
- Expected vs actual behavior.
- Console errors (if any).

## Security

Currently no elevated risk surface (no custom auth flows beyond Firebase). Report any concerns via issue with `[SEC]` prefix.

## Roadmap Boundaries

See `docs/innovation.md`. Do not implement items from later sections without discussion.

## License

This project inherits licensing from included third-party code where applicable; see `LICENSE` in submodules if present. Add new licenses for assets you contribute.

---
Small, factual, maintainable improvements are the most helpful. Thanks for contributing!
