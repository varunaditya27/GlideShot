# GlideShot Architecture

## Overview
GlideShot is architected for modularity, scalability, and maintainability. It leverages Next.js (App Router), React Three Fiber for 3D rendering, and Firebase for backend services.

## High-Level Structure
- **Frontend:** Next.js (TypeScript), React Three Fiber, Tailwind CSS, shadcn/ui
- **Backend:** Next.js API routes, Firebase Firestore, Firebase Auth
- **Deployment:** Vercel (frontend), Firebase Console (backend)

## Key Modules
- **Game Engine:** Handles 3D scene, physics, input, and state
- **UI Layer:** HUD, controls, overlays, transitions
- **Persistence Layer:** Score storage, authentication, leaderboard
- **Assets:** Models, textures, audio, shaders

## Data Flow
1. User interacts with UI or 3D scene
2. Game engine updates state and visuals
3. On score events, API routes update Firestore
4. Auth state managed via Firebase Auth

## Extensibility
- Add new levels by dropping models/configs in `public/levels/`
- Add new UI components in `app/game/ui/`
- Extend backend via new API routes

See other docs for deeper dives into each subsystem.
