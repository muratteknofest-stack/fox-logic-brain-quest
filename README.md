# Fox Logic: Brain Quest 🦊🧠

A fast-paced, high-quality HTML5 visual logic & brain training puzzle game built specifically for **Poki**, **CrazyGames**, and **GameDistribution**.

## 🌟 Highlights
- **No Language Barrier**: 100% visual abstract puzzles (Raven Matrices, Analogies, Sequence Patterns, Geometric Rotations).
- **50 Unlockable Levels**: World 1-5 progressive difficulty with 1 to 3 stars rating saved to `localStorage`.
- **Official PokiSDK v2 Integration**:
  - `PokiSDK.commercialBreak()` triggered every 2-3 levels on victory.
  - `PokiSDK.rewardedBreak()` for hint power-ups (eliminating 2 incorrect options).
  - `PokiSDK.gameplayStart()` and `PokiSDK.gameplayStop()` lifecycle hooks.
- **Synthesized Audio Engine**: Zero licensed audio dependencies — uses Web Audio API real-time retro chimes and victory fanfares.
- **Responsive 60 FPS**: Works smoothly across mobile touchscreens and desktop keyboards/mice.

## 🚀 Quick Start
```bash
# Install dependencies
npm install

# Start local dev server
npm run dev

# Build production bundle
npm run build
```

## 📦 How to Submit to Poki
1. Run `npm run build`.
2. Zip the contents of the `dist/` folder.
3. Upload to your **[Poki for Developers](https://developers.poki.com)** dashboard!

## 📄 License
MIT License • Created with Bilsem Junior Engine
