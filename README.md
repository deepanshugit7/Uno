# 🃏 UNO — The Card Game

> A fully playable browser-based UNO game built with React, TypeScript, and Vite.  
> Play solo against AI bots **or pass the device with friends** in local hot-seat multiplayer — yell UNO and enjoy the classic card-matching fun right in your browser!

---

## What is This Project?

This is a complete digital recreation of the classic UNO card game. You match colors, numbers, and action cards, throw Skip cards at your opponents, and shout "UNO!" when you're down to your last card.

Everything runs in the browser — no server, no sign-up, no download required. You pick your name, configure up to **4 human players** and up to **3 AI bots**, and the game starts immediately. When playing with multiple human players, a **hot-seat handoff screen** appears between turns so each player's cards remain secret. Bots take their turns automatically, all UNO rules are enforced, and the game comes alive with smooth animations, a particle background on the start screen, and synthesized sound effects built entirely using the Web Audio API — meaning no audio files are needed at all.

---

## Features

- **Local Multiplayer (Hot-Seat)** — Up to 4 human players can share a single device; a full-screen handoff overlay appears between turns so cards stay secret
- **AI Opponents** — Play against 1 to 3 bots that take their turns automatically
- **Full UNO Rules** — Skip, Reverse, Draw 2, Wild, and Wild Draw 4 all work correctly
- **Big UNO Button** — A large, animated UNO! button appears right above your hand cards when you have 2 cards left — impossible to miss
- **Synthesized Sound** — 8 unique sound effects generated in real-time using the Web Audio API
- **Particle Background** — Animated canvas effect on the start screen
- **Dark Theme** — Sleek dark UI with color-coded cards and smooth transitions
- **Auto Reshuffle** — When the draw pile runs out, the discard pile is reshuffled automatically
- **Win Detection** — Game ends the moment any player plays their last card

---

## How Multiplayer Works

The game supports **local hot-seat multiplayer** — multiple humans playing on the same device, passing it around between turns.

1. **On the Start Screen**, select **2, 3, or 4 Human Players** and optionally add AI bots (total players ≤ 4).
2. **Player 1's name** is entered on the start screen. Additional human players are automatically named Player 2, Player 3, and Player 4.
3. **During the game**, when the turn shifts to a different human player, a full-screen **"Pass the Device"** overlay appears:
   - The overlay blurs and hides the previous player's cards
   - It shows the name of the next player and prompts them to tap **"I'm Ready"**
   - Only after tapping does the hand get revealed
4. **AI bots** take their turns automatically — no handoff needed.

> **Tip:** The "How to Play" section on the start screen reminds you to pass the device when playing with multiple humans.

---

## Project Structure

```
Uno/
│
├── index.html                  # HTML entry point — loads fonts, sets page title & meta
├── package.json                # Project dependencies and npm scripts
├── package-lock.json           # Locked dependency versions
├── vite.config.ts              # Vite bundler configuration
├── tsconfig.json               # TypeScript configuration
├── tsconfig.node.json          # TypeScript config for Vite's Node environment
│
└── src/
    ├── main.tsx                # Mounts <App /> into the DOM
    ├── App.tsx                 # Root component — switches between Start Screen and Game Board
    ├── App.css                 # Root-level styles
    ├── index.css               # Global CSS variables, resets, and base styles
    ├── vite-env.d.ts           # Vite type declarations
    │
    ├── types/
    │   └── game.ts             # All shared TypeScript types (Card, Player, GameState, etc.)
    │
    ├── logic/
    │   ├── deck.ts             # Builds and shuffles the standard 108-card UNO deck
    │   ├── rules.ts            # canPlayCard() — checks if a move is legal
    │   ├── gameEngine.ts       # Core game engine — all state transitions live here
    │   └── ai.ts               # AI logic — decides which card to play and which color to pick
    │
    ├── hooks/
    │   └── useSound.ts         # Custom React hook for 8 synthesized sound effects
    │
    └── components/
        ├── StartScreen/        # Welcome screen with name input, human count & bot count selectors
        ├── GameBoard/          # Main game UI — cards, players, actions, status messages, handoff overlay
        ├── Card/               # Individual card component with color and type rendering
        ├── GameOverModal/      # End-of-game popup showing the winner
        └── Particles/          # Animated particle canvas for the start screen background
```

---

## How the Game Logic Works

All game logic lives in `src/logic/` as pure TypeScript functions. They take the current game state and return a new one — no side effects. The UI simply calls these functions and re-renders.

### Deck — `deck.ts`

Builds a standard 108-card UNO deck:
- **76 number cards** — 0 through 9 in Red, Blue, Green, Yellow (two of each 1–9, one 0 per color)
- **24 action cards** — Skip, Reverse, Draw 2 (two per color)
- **8 wild cards** — 4 Wild + 4 Wild Draw 4

### Rules — `rules.ts`

A single function `canPlayCard()` that returns `true` or `false` based on whether the chosen card matches the top of the discard pile by color, number, or type.

### Game Engine — `gameEngine.ts`

The heart of the project. Five exported functions drive every game event:

- **`initializeGame(playerNames, humanCount)`** — Shuffles the deck, deals 7 cards to each player, places the first card on the discard pile, and applies any action card effects that occur at game start. `humanCount` determines which player seats are human-controlled.
- **`playCardAction(state, cardId, chosenColor?)`** — Plays a card from the current player's hand, applies action card effects to the next player, checks for an UNO violation penalty, and checks for a win condition.
- **`drawCardAction(state)`** — Draws one card from the deck. If the drawn card is playable, the player keeps their turn. If not, the turn passes automatically.
- **`chooseColorAction(state, color)`** — Resolves a Wild card by setting the new active color and advancing the turn.
- **`yellUnoAction(state)`** — Marks that the current player has yelled UNO, protecting them from the 2-card penalty.

### AI — `ai.ts`

The bot uses a simple but reasonable strategy:
1. If choosing a Wild color → pick the color it has the most of in hand
2. If it has playable cards → prefer non-Wild cards to save Wilds for later
3. If nothing is playable → draw a card

### Sound Effects — `hooks/useSound.ts`

No MP3 files anywhere. The `useSound` hook generates all 8 sounds in real-time using the **Web Audio API** — oscillators set to different waveforms (sine, triangle, square, sawtooth), short noise buffers, and exponential gain ramps to shape each sound's decay. Sounds include: card play, draw, UNO yell, win jingle, invalid move, turn notification, color match, and button click.

---

## Getting Started

### Prerequisites

You need **Node.js** (v18 or higher) and **npm** installed.

```bash
node --version
npm --version
```

Download Node.js from [nodejs.org](https://nodejs.org/) if you don't have it.

---

### Install Dependencies

```bash
npm install
```

This reads `package.json` and installs everything into `node_modules/`.

---

### Run Locally

```bash
npm run dev
```

Open your browser at `http://localhost:5173`. The game loads instantly. File changes hot-reload automatically.

---

### Build for Production

```bash
npm run build
```

Outputs a fully optimized bundle to the `dist/` folder. Host it on any static file service — GitHub Pages, Netlify, Vercel, etc.

Preview the production build locally:
```bash
npm run preview
```

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| React | 18.2 | UI components and state management |
| TypeScript | 5.2 | Type safety across the entire codebase |
| Vite | 5.2 | Fast development server and production bundler |
| Web Audio API | Native browser | Real-time synthesized sound effects |
| Vanilla CSS | — | Full styling control, no framework overhead |

---

## UNO Rules — Quick Reference

- **Play a card** that matches the top of the discard pile by color, number, or symbol
- **Wild** — play on anything; you choose the new active color
- **Wild Draw 4** — play on anything; next player draws 4 cards and is skipped
- **Skip** — next player loses their turn
- **Reverse** — direction of play flips (acts as Skip in a 2-player game)
- **Draw 2** — next player draws 2 cards and is skipped
- **UNO rule** — when you have 2 cards left and it's your turn, tap the big **UNO!** button above your hand before playing, or draw 2 as penalty
- **Multiplayer** — pass the device to the next human player when the handoff screen appears
- **Winning** — first player to empty their hand wins the round

---

## License

Open source and free to use for personal and educational purposes.

---

*Built with React, TypeScript, and Vite.*
