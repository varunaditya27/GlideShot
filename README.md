# 🏌️ GlideShot — World-Class 3D Minigolf Clone

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
	- Copy your config to `lib/firebaseConfig.ts`
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