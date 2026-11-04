# Escoba

Add up to 15 and sweep the table, against bots. Escoba de 15 with the Spanish deck and Chilean rules,
on your phone or computer.

No account and no backend. Everything runs on your device, and your match is saved after every move.

- **Players:** 2 or 3, or 4 in pairs
- **Deck:** Spanish deck, 40 cards
- **Live:** https://tletelieru.github.io/escoba/

## How to play

Each player gets 3 cards and 4 go face up on the table. Tap a card to raise it, tap the table cards
that add up to 15 with it and tap your card again to take them; with no table cards picked, your card
stays on the table. Clearing the table is an escoba. Values: 1 to 7 are worth their number, sota (10) 8,
caballo (11) 9, rey (12) 10.

Drop a card that could have made 15 and anyone else can **soplar** it: pick those cards and press
**Soplada!** before the others. A soplada never counts as an escoba.

| Points | For |
| --- | --- |
| 1 each | Escoba |
| 1 | Most cards |
| 1 | Most oros |
| 1 | 7 de velo, the 7 of oros |
| 1 / 2 | Primera / primera real, all four 7s |
| 3 | Real in hand: your 3 dealt cards add up to 15 |
| 4 | Real on the table: the 4 starting table cards add up to 15, for the dealer |

Reales are never hinted: call them with the **Real!** button or lose them. Ties give the point to
nobody. The match goes to 15 points. The full rules, with example cards, are inside the game.

## What you get

- **Three difficulties:** Easy grabs the biggest capture and lets many slip, Medium guards the table
  against escobas, and Hard counts cards and plays every option to the end of the hand. They miss
  captures on purpose (30%, 12% and never) and race you for every soplada. No bot ever sees your cards
- **Forgiving or strict:** on Easy a wrong sum or a missed 15 gets a warning; on Hard a wrong sum
  leaves your card on the table
- **2, 3 or 4 players:** with 4 you play in pairs with the bot across the table
- **Who deals?:** a quick draw picks the dealer at the start of every match
- **Info buttons:** an *i* next to Real! and Soplada!, on by default in Easy
- **My cards:** check what you (or your team) took this hand, with escobas, reales and sopladas
- **End of hand summary:** points per player with the cards behind them, then the race to 15
- **Match history** and **saved matches:** reload or close the tab and the match comes back
- **Chiptune music:** its own folk themes in 6/8, with a switch to mute them

Settings has larger text sizes, a regular font instead of the pixel one and a switch to turn off
animations. English and Spanish, light and dark mode. Install it as an app and it works offline.

## How strong are the bots?

Each row is one bot against a table of the other, with the seat rotating every match. With 4 players,
both bots of a pair are the same level.

| Bot | Against | Players | Matches | Wins | Even odds | Sopladas per match |
| --- | --- | --- | --- | --- | --- | --- |
| Medium | Easy | 2 | 1000 | 92.4% ±1.6 | 50% | 5.9 |
| Medium | Easy | 3 | 500 | 86.4% ±3.0 | 33.3% | 10.3 |
| Medium | Easy | 4 in pairs | 500 | 94.8% ±1.9 | 50% | 7.8 |
| Hard | Medium | 2 | 300 | 79.0% ±4.6 | 50% | 2.8 |
| Hard | Medium | 3 | 150 | 66.7% ±7.5 | 33.3% | 4.8 |
| Hard | Medium | 4 in pairs | 150 | 69.3% ±7.4 | 50% | 2.8 |

## Run it locally

Requires Node 24 and pnpm 9.

```sh
pnpm install
pnpm dev        # http://localhost:5173/escoba/
```

| Command | What it does |
| --- | --- |
| `pnpm test` | Runs the unit and property tests |
| `pnpm lint` | Runs ESLint |
| `pnpm typecheck` | Runs the type checks |
| `pnpm build` | Builds the app |
| `pnpm sim --hero hard --field medium --players 2 --matches 100` | Plays bots against each other |

## How it works

| Folder | What lives there |
| --- | --- |
| `packages/engine` | Rules, legal moves and scoring, with no UI code |
| `packages/bots` | Easy, Medium and Hard |
| `apps/client` | The game, built with React, Tailwind and Vite |
| `apps/sim` | Command line tool for bot matches |

The engine is pure and serializable, so saved matches, the bots and a future online server all share
it. Bots only receive what their seat can see. Random matches check that every capture adds up to 15,
that no card is lost or duplicated, that reales are detected exactly when they exist and that every
hand's points match the table.

All cards and icons are original. See [the development plan](docs/PLAN.md), in Spanish, for what comes
next.

## License

Copyright (c) 2026 tletelieru. All rights reserved. See [LICENSE](LICENSE).

---

Part of the games by [tletelieru](https://tletelieru.github.io/tletelieru/), alongside
[7 de Trébol](https://github.com/tletelieru/7-de-trebol).
