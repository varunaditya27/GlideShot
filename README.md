# 🏌️ GlideShot — World-Class 3D Minigolf Clone

## Security notes

- Client-side Firebase config now reads from `NEXT_PUBLIC_*` env vars. These are expected for frontend use and are safe to expose.
- Do not keep Admin SDK secrets (service account private keys) in the client repository. If present in `.env`, ensure they are not imported or used on the client, and consider moving them to server-only environment variables or a secret store. Remove the private key from version control and rotate it if it was ever committed.
- The server-backed scoring API (`/api/scores/post`) should use server-side credentials only; the client only calls this endpoint.

## Overview
GlideShot is a modern, web-based 3D minigolf game inspired by the open-source classic "Open Golf." It is rebuilt for the web with a focus on elegance, interactivity, and persistent scoring. GlideShot combines smooth gameplay, aesthetic minimalism, and robust backend integration to deliver a world-class experience.

## Features
- 3D minigolf gameplay in the browser (Next.js + React Three Fiber + Three.js)
- Minimal, elegant UI with HUD, power bar, and aiming indicators
- Simplified physics: velocity, friction, collision, and goal detection
- Multiple levels with terrain variations and moving obstacles
- Cinematic replay camera and smooth transitions
- Persistent score tracking and leaderboards (Firebase Firestore)
- Email-based authentication (Firebase Auth)
- Social features: share scores, friend challenges, daily challenges
- Customizable ball skins, audio cues, and accessibility options

## Quick Start
1. **Clone the repository:**

```sh
git clone https://github.com/varunaditya27/GlideShot.git
cd GlideShot
```
2. **Install dependencies:**

```sh
npm install
```
3. **Configure Firebase:**

- Create a Firebase project (Firestore + Auth enabled)
- Put your client config in `.env` as `NEXT_PUBLIC_*` vars (already wired in `src/lib/firebaseConfig.ts`). Avoid placing Admin keys in client repos.
4. **Run the development server:**

```sh
npm run dev
```
5. **Open in browser:**
	- Visit [http://localhost:3000](http://localhost:3000)

## File Structure
```
GlideShot/
├── app/                   # Next.js App Router
│   ├── page.tsx           # Landing page
│   ├── game/              # Main game scene & components
│   └── api/               # API routes for scores
├── lib/                   # Firebase config, helpers
├── public/                # Static assets (models, textures)
├── styles/                # Tailwind + global styles
├── docs/                  # In-depth documentation
├── README.md              # This file
└── package.json
```

## Documentation
- See the `docs/` folder for detailed guides on architecture, gameplay, UI, physics, backend, and more.

## License
This project is open-source and MIT licensed. See `LICENSE` for details.

## Credits
- Inspired by [Open Golf](https://github.com/mgerdes/Open-Golf)
- Built with Next.js, React Three Fiber, Three.js, Firebase, Tailwind CSS, shadcn/ui