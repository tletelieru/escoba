# Plan de desarrollo — Escoba

Escoba de 15 con naipe español contra bots, para 2, 3 o 4 jugadores en parejas.

## Stack

Igual que 7 de Trébol: **web en TypeScript**, PWA instalable, sin backend.

| Área | Elección |
| --- | --- |
| Monorepo | pnpm workspaces |
| Lenguaje | TypeScript estricto |
| Mesa, menús, puntaje | React 19 + Tailwind 4 |
| Build | Vite + vite-plugin-pwa |
| Tests | Vitest + fast-check |
| Bots | Web Worker, mismo contrato que 7 de Trébol |
| Online | Node + WebSockets, servidor autoritativo (fase futura) |

## Estructura

```
apps/
  client/        PWA: mesa, menús, audio
  sim/           CLI de self-play bot contra bot
packages/
  engine/        estado, acciones legales, puntaje. Puro, sin dependencias de UI
  bots/          fácil, medio, difícil
```

## Contrato del motor

```ts
createMatch(config: MatchConfig, seed: number): MatchState
legalActions(state: MatchState, seat: Seat): Action[]
applyAction(state: MatchState, action: Action): MatchState
viewFor(state: MatchState, seat: Seat): PlayerView
score(state: MatchState): Score
```

```ts
interface Bot {
  choose(view: PlayerView, legal: Action[], rng: Rng): Action
}
```

- Estado inmutable y serializable: sirve para guardar partida y para el servidor.
- RNG con semilla: toda partida se puede reproducir.
- Los bots reciben `PlayerView`, nunca `MatchState`. Así no pueden hacer trampa.

## Paleta

Ocre / mostaza: el color de la paja de la escoba. Como el acento ya es dorado, `--gold` lleva un verde azulado para resaltar.

| Var | Claro | Oscuro |
| --- | --- | --- |
| `--bg` | `#f3ebc8` | `#1f1a0b` |
| `--surface` | `#fbf7e8` | `#2c2511` |
| `--raised` | `#e4dab8` | `#3d3418` |
| `--ink` | `#2a2412` | `#f6f0dc` |
| `--muted` | `#665c40` | `#c2b48c` |
| `--accent` | `#8a6a00` | `#e5b62e` |
| `--on-accent` | `#ffffff` | `#1c1604` |
| `--gold` | `#0f766e` | `#5eead4` |

## Fases

### 0. Base del repo
- Workspace pnpm, TS, ESLint, Vitest y CI (lint, typecheck, test, build) sobre PRs y pushes a `dev` y `main`. Pages se publica desde `main`.
- Cliente con el baseline ox: EN/ES, claro/oscuro, ícono, footer, ajustes de accesibilidad y la paleta de arriba.
- Mazo definido en `packages/engine/src/cards.ts` con test de cantidad y unicidad.
- En `ox-proxy/projects.json`: `"escoba": { "port": 5189, "base": "/escoba" }`.

Listo cuando: el link de `ox-test` abre el cliente y CI pasa.

### 1. Motor
- Naipe español de 40 cartas, reutilizado de Brisca. Valores: 1–7 su número, sota 8, caballo 9, rey 10.
- Reparto de 3 cartas por jugador y 4 a la mesa; se reparte de nuevo cuando se acaban las manos.
- Captura: la carta jugada más una o más de la mesa suman 15. Si hay varias combinaciones, el jugador elige.
- Lo que queda en la mesa al final es del último que capturó.
- Puntaje por mano:

| Puntos | Concepto |
| --- | --- |
| 1 c/u | Escoba |
| 1 | Más cartas |
| 1 | Más oros |
| 1 | 7 de velo (7 de oros) |
| 1 / 2 | Primera / primera real (los cuatro 7) |
| 3 | Real en mano: las 3 cartas repartidas suman 15 |
| 4 | Real en mesa: las 4 cartas iniciales de la mesa suman 15 (para el que reparte) |

- Primera: mejor carta de cada pinta con la escala 7 (21), 6 (18), As (16), 5 (15), 4 (14), 3 (13), 2 (12), figuras (10). Hay que tener las cuatro pintas.
- Real en mano: se canta con un botón solo en el primer turno del jugador; las 3 cartas quedan a la vista en su pozo y no se juegan.
- Real en mesa: el que reparte se lleva las 4 cartas a la vista y no juega ese turno.
- Los reales son opcionales y no se avisan: si el jugador no lo canta, lo pierde. No cuentan como escoba.
- Cada escoba deja una carta a la vista en el pozo del jugador, tapada con el resto de la captura.
- Empate en cartas, oros o primera: nadie se lleva el punto.
- Partida a 15 o 21, configurable.

Listo cuando, con tests de propiedades:
- Toda captura legal suma 15 y ninguna carta se pierde.
- Los puntos repartidos en cada mano cuadran con la tabla.

### 2. Bots y simulador
- Fácil: la captura más grande. A veces no ve un real.
- Medio: valora oros, sietes y el 7 de velo, y evita dejar en mesa una suma que dé escoba al siguiente.
- Difícil: cuenta cartas y Monte Carlo.

Listo cuando: `pnpm sim` muestra difícil > medio > fácil en N partidas.

### 3. Mesa
- Inicio: dificultad y cantidad de jugadores. Mesa, resultados, reglas, historial, guardar y retomar partida.
- Bots en Web Worker.

Listo cuando: se juega una partida completa en el celular.

### 4. Pulido
- Animaciones de reparto y movimiento de cartas, música chiptune, efectos, texto grande, letra normal, sin animaciones.

### 5. Publicación
- Pages desde `main`. En tletelieru pasa de `soon` a `live` en la sección Juegos.

## UI propia

- `SpanishCard` copiado de Brisca.
- Al tocar una carta se iluminan las combinaciones posibles para elegir. Animación de "¡Escoba!" al limpiar la mesa.
- Botón "¡Real!" en el primer turno, sin aviso de que hay real. Reales y escobas quedan a la vista en el pozo de cada jugador.

## Pendiente

- Confirmar que con real en mesa el que reparte no juega ese turno.
