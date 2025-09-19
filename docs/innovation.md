# Roadmap & Potential Enhancements

This document separates what exists now from ideas explicitly not implemented. It provides a factual baseline for future iteration while avoiding speculative claims in other documentation.

## Implemented (As of Current Commit)
 
| Area | Implemented |
|------|-------------|
| Core Gameplay | Drag to aim/shoot, 3 custom physics levels |
| Scoring | Stroke counting, per-level par, relative score |
| Persistence | Score + leaderboard Firestore writes |
| Auth | Firebase email/password |
| Visual Feedback | Aim assist, particles (bounce/goal), hole pulse |
| Audio | Minimal Web Audio beeps |
| UI | HUD, leaderboard, notice overlay |

## Near-Term Candidate Enhancements (Not Implemented)
 
| Category | Idea | Rationale |
|----------|------|-----------|
| Physics | Slopes / ramps | Adds depth & shot planning |
| Gameplay | Moving obstacles | Increases challenge variety |
| UX | Level selector screen | Manual replay & practice |
| Feedback | Replay last shot camera | Skill learning tool |
| Progression | Additional level set | Content longevity |
| Accessibility | Keyboard-only aim mode | Inclusive input |
| Performance | Dynamic resolution scaling | Better low-end FPS |

## Longer-Term Concepts (Not Implemented)
 
| Concept | Notes |
|---------|-------|
| Wind / Spin | Additional physics layer; careful tuning required |
| Achievements | Meta goals & retention |
| Daily Challenge | Rotating featured level variant |
| Cosmetic Skins | Non-paywalled personalization |
| Cloud Replays | Store top shots for ghost comparisons |
| Multi-Player Ghost Mode | Async competition |
| Mobile Haptics | Enhance impact feel |

## Evaluation Principles
 
When considering additions:

1. Preserve minimal bundle growth (budget first, feature second).
2. Avoid introducing heavy physics libs unless essential.
3. Keep UI surface area restrained—focus on clarity.
4. Ensure opt-in for visually intensive effects.

## Out of Scope (Deliberately Excluded For Now)
 
Ads, monetization hooks, in-game chat, real-time spectator streaming, complex economy systems.

All items outside the Implemented table above are currently absent from the repository.
