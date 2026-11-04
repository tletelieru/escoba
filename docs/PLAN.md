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

### 0. Base del repo — hecho
- Workspace pnpm, TS, ESLint, Vitest y CI (lint, typecheck, test, build) sobre PRs y pushes a `dev` y `main`. Pages se publica desde `main`.
- Cliente con el baseline ox: EN/ES, claro/oscuro, ícono, footer, ajustes de accesibilidad y la paleta de arriba.
- Mazo definido en `packages/engine/src/cards.ts` con test de cantidad y unicidad.
- En `ox-proxy/projects.json`: `"escoba": { "port": 5189, "base": "/escoba" }`.

Listo cuando: el link de `ox-test` abre el cliente y CI pasa.

### 1. Motor — hecho
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
- Partida siempre a 15 puntos.

Listo cuando, con tests de propiedades:
- Toda captura legal suma 15 y ninguna carta se pierde.
- Los puntos repartidos en cada mano cuadran con la tabla.

### 2. Bots y simulador — hecho
- Fácil: la captura más grande. A veces no ve un real.
- Medio: valora oros, sietes y el 7 de velo, y evita dejar en mesa una suma que dé escoba al siguiente.
- Difícil: cuenta cartas y Monte Carlo.

Listo cuando: `pnpm sim` muestra difícil > medio > fácil en N partidas.

### 3. Mesa — hecho
- Inicio: dificultad y cantidad de jugadores. Mesa, resultados, reglas, historial, guardar y retomar partida.
- Bots en Web Worker.

Listo cuando: se juega una partida completa en el celular.

### 4. Pulido
- Animaciones de reparto y movimiento de cartas, música chiptune, efectos, texto grande, letra normal, sin animaciones.

### 5. Publicación
- Pages desde `main`. En tletelieru pasa de `soon` a `live` en la sección Juegos.

## UI propia

- `SpanishCard` y `SpanishSuitIcon` (pixel art 11×11), misma especificación que Brisca.
- Al tocar una carta se iluminan las combinaciones posibles para elegir. Animación de "¡Escoba!" al limpiar la mesa.
- Botón "¡Real!" en el primer turno, sin aviso de que hay real. Reales y escobas quedan a la vista en el pozo de cada jugador.

## Decisiones (fases 1–3)

### Reglas
- Partida siempre a 15 puntos (`MATCH_POINTS`). Los puntos se suman al final de cada mano; gana el primero que llega sin empate arriba; si empatan, se juega otra mano.
- Al empezar una partida nueva se sortea quién da: el motor elige al que reparte al azar con la semilla y la animación se detiene en ese asiento. Las partidas retomadas no sortean.
- La primera jugada de cada mano siempre es del jugador que sigue al que reparte, nunca del que reparte. No hay paso previo.
- Real en mesa: desde el reparto hasta que se juega la primera carta de la mano, el que reparte tiene "¡Real!" habilitado en todas las manos, sume o no la mesa, para no dar pistas. Si la mesa suma 15 y lo canta, se lleva las 4 cartas a la vista (4 puntos) y el juego sigue con el jugador de turno. Los bots que reparten deciden en esa misma ventana (fácil lo ve el 60 % de las veces, medio y difícil siempre).
- Real en mano: "¡Real!" se habilita en el primer turno de cada jugador en cada reparto, haya o no real. Si las cartas no suman 15 avisa "Tus cartas no suman 15" y no pasa nada más.
- La captura no es obligatoria: se puede botar una carta a la mesa aunque pudiera llevar.
- Soplada: después de botar una carta, se abre una ventana constante de 2,5 s (haya o no soplada posible, para no filtrar información). Cualquier otro jugador, humano o bot, puede soplar: llevarse la carta botada más las de la mesa que suman 15 con ella. Gana el primero que la reclama. La soplada nunca cuenta como escoba, aunque deje la mesa vacía; el que sopla se queda esas cartas como captura normal y pasa a ser el último que llevó. El turno sigue con normalidad.
- Las cartas de los reales cuentan para cartas, oros, 7 de velo y primera.
- La última captura que deja la mesa vacía cuenta como escoba, aunque sea la última jugada de la mano.
- La primera real (los cuatro 7) da 2 puntos y nadie más se lleva la primera.
- Con 4 jugadores, las parejas son 0–2 y 1–3 y suman todo junto.

### Turno del jugador
- Jugar con dos toques, como en Tele: tocar una carta de la mano la sube; tocar otra la cambia; tocar un espacio vacío la baja. Las cartas de la mesa se eligen y desmarcan tocándolas, con la suma en vivo. Al tocar otra vez la carta subida: con cartas de la mesa elegidas intenta llevar; sin ninguna, la carta queda en la mesa.
- "¡Real!" y "¡Soplada!" están siempre en el mismo lugar de la barra y se deshabilitan cuando no se pueden usar; entre ellos va la suma de la selección. La línea de estado tiene el alto reservado: nada cambia de tamaño entre turnos.
- Comportamiento por dificultad (`CAPTURE_RULES`):

| | Suma distinta de 15 | Botar pudiendo llevar | Soplada equivocada |
| --- | --- | --- | --- |
| Fácil | marca en rojo y avisa "No suman 15" | avisa "Podías sumar 15" una vez | avisa y deja corregir |
| Medio | marca en rojo, sin aviso | sin aviso | pierde la soplada de esa ventana |
| Difícil | marca en rojo y la carta queda en la mesa | sin aviso | pierde la soplada de esa ventana |

- Botones de info (i) junto a ¡Real! y ¡Soplada!, y líneas de instrucción: encendidos por defecto en fácil, apagados en medio y difícil. Si el jugador cambia el ajuste, su elección se guarda y vale para todas las dificultades.
- "Mis cartas (n)" muestra las capturas propias (o de la pareja, con quién la hizo) de la mano en curso, con escobas, reales y sopladas marcadas, y los conteos de cartas, oros, sietes, 7 de velo y escobas.

### Bots
- Fácil: reales al 60 %, la captura más grande. Medio: valora cartas, oros, sietes, seises y 7 de velo, y castiga dejar escoba al siguiente rival, cartas valiosas a tiro o una soplada. Difícil: reparte al azar las cartas que no vio, juega cada opción hasta el final de la mano con Medio (24 muestras), elige la de mejor diferencia y nunca bota una carta que deje soplada si tiene otra jugada.
- Capturas que se dejan pasar a propósito (`MISS_RATES`): fácil 30 %, medio 12 %, difícil 0 %.
- Reflejos para soplar (`REFLEXES`), cada bot por su cuenta: fácil la ve el 35 % de las veces y tarda 1,4–2,3 s; medio 70 % y 0,8–1,6 s; difícil 97 % y 0,3–0,9 s. Gana el reclamo más temprano, sea de un bot o del humano.
- Todos los bots, incluidas las sopladas, corren en un Web Worker; en los tests, sin Worker, juegan en el hilo principal.

### Mesa y sonido
- Reparto animado: la mesa empieza vacía durante el sorteo y el reparto. Cada carta aparece al llegar: primero las manos, una por una en orden de reparto, y después las 4 de la mesa. Sin animaciones se ve el resultado directo.
- Cartas con índice numérico como el naipe real: sota 10, caballo 11, rey 12. Cada figura tiene su dibujo: sota de pie, caballo con cabeza de caballo, rey con corona.
- Música propia en el motor chiptune de 7 de Trébol: tema de inicio y tema de partida en 6/8 con aire de cueca (126 y 132 bpm). La pista se elige al empezar o salir de una partida (`SETUP_TRACKS`); los sonidos de acción van en `ACTION_SOUNDS` y los del sorteo en `DRAW_SOUNDS`. Interruptor de música en Ajustes.
- Reglas y "Puntos por mano" con figuras y cartas de ejemplo para cada regla.

## Pendiente

- Confirmar que el real en mano vale en todos los repartos (hoy: sí, en el primer turno de cada reparto).
- Confirmar si la escoba de la última jugada cuenta (hoy: sí).
- Confirmar el desempate al llegar a la meta (hoy: otra mano).
- Soplada: hoy solo vale la suma que incluye la carta botada; la ventana se abre solo después de botar, no después de una captura.
- Difícil todavía no coordina con el compañero en parejas (gana 69,3 % ±7,4 contra Medio).
