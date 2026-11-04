import { createContext, useContext } from 'react'
import type { Level } from '@escoba/bots'
import type { Breakdown, Move, Suit } from '@escoba/engine'
import type { TextSize } from '../lib/textSize'
import { defaultLocale } from './locales'
import type { Locale } from './locales'

type ShownMove = Extract<Move, { type: 'play' | 'realHand' | 'realTable' | 'leftover' | 'soplar' }>

export interface Messages {
  appName: string
  tagline: string
  rules: string
  history: string
  historyEmpty: string
  historySummary: (played: number, won: number) => string
  playerCount: (n: number) => string
  outcomes: Record<'won' | 'tied' | 'lost' | 'abandoned', string>
  difficulty: string
  levels: Record<Level, string>
  levelHints: Record<Level, string>
  toTarget: (n: number) => string
  playWith: (players: number) => string
  playMode: (players: number) => string
  pointsTitle: string
  concepts: Record<keyof Breakdown, string>
  concept: string
  suits: Record<Suit, string>
  you: string
  partner: string
  bot: (n: number) => string
  us: string
  them: string
  yourHand: string
  yourTurn: string
  pickHint: string
  soplada: string
  infoAbout: (action: string) => string
  infoReal: string
  infoSoplada: string
  showInfo: string
  showInfoHint: string
  missedFifteen: string
  drawing: string
  dealerIs: (name: string) => string
  notFifteen: string
  myCards: (n: number) => string
  noCaptures: string
  captureTags: Record<'escoba' | 'real' | 'leftover' | 'soplada', string>
  counts: Record<'cards' | 'oros' | 'sevens' | 'velo' | 'escobas', string>
  real: string
  escoba: string
  lastDeal: string
  notReal: string
  tableNotReal: string
  dealer: string
  cardsLeft: (n: number) => string
  pile: (n: number) => string
  pileFaces: (escobas: number, reales: number) => string
  deckLeft: (n: number) => string
  tableLabel: string
  emptyTable: string
  moveText: (move: ShownMove, names: string[]) => string
  round: (n: number) => string
  roundShort: (n: number) => string
  roundTotal: string
  noPoints: string
  primeraReal: string
  summaryCounts: (cards: number, oros: number) => string
  summaryGroups: Record<string, string>
  roundFinished: (n: number) => string
  nextRound: string
  matchFinished: string
  winner: (name: string, points: number) => string
  youWon: (points: number, team: boolean) => string
  backHome: string
  scoreTitle: string
  liveScore: string
  exit: string
  exitTitle: string
  exitBody: string
  exitConfirm: string
  keepPlaying: string
  settings: string
  musicOff: string
  musicOnLabel: string
  textSize: string
  textSizes: Record<TextSize, string>
  plainFont: string
  plainFontHint: string
  reduceMotion: string
  reduceMotionHint: string
  close: string
  toLight: string
  toDark: string
  language: string
  install: string
  developedBy: string
  otherGames: string
  showOtherGames: string
  hideOtherGames: string
  showOtherGamesHint: string
}

function englishMove(move: ShownMove, names: string[]): string {
  const name = names[move.seat]
  if (move.type === 'realHand') return `${name}: real in hand`
  if (move.type === 'realTable') return `${name}: real on the table`
  if (move.type === 'leftover') return `The rest goes to ${name}`
  if (move.type === 'soplar') return `${name}: soplada!`
  if (move.escoba) return `${name}: escoba!`
  return `${name} takes ${move.captured.length + 1}`
}

function spanishMove(move: ShownMove, names: string[]): string {
  const name = names[move.seat]
  if (move.type === 'realHand') return `${name}: real en mano`
  if (move.type === 'realTable') return `${name}: real en mesa`
  if (move.type === 'leftover') return `Lo que queda es para ${name}`
  if (move.type === 'soplar') return `${name}: ¡soplada!`
  if (move.escoba) return `${name}: ¡escoba!`
  return `${name} se lleva ${move.captured.length + 1}`
}

export const messages: Record<Locale, Messages> = {
  en: {
    appName: 'Escoba',
    tagline: 'Add up to 15 and sweep the table, against bots.',
    rules: 'Rules',
    history: 'History',
    historyEmpty: 'Finished matches will appear here.',
    historySummary: (played, won) => `${played} played · ${won} won`,
    playerCount: (n) => (n === 4 ? '4 in pairs' : `${n} players`),
    outcomes: { won: 'You won', tied: 'Tie', lost: 'You lost', abandoned: 'Abandoned' },
    difficulty: 'Difficulty',
    levels: { easy: 'Easy', medium: 'Medium', hard: 'Hard' },
    levelHints: {
      easy: 'takes the biggest capture',
      medium: 'guards the table',
      hard: 'counts cards and plays ahead',
    },
    toTarget: (n) => `to ${n}`,
    playWith: (players) => (players === 4 ? '4 players in pairs' : `${players} players`),
    playMode: (players) => (players === 4 ? 'in pairs' : 'players'),
    pointsTitle: 'Points per hand',
    concepts: {
      escobas: 'Escobas',
      cards: 'Most cards',
      oros: 'Most oros',
      velo: '7 de velo',
      primera: 'Primera',
      realHand: 'Real in hand',
      realTable: 'Real on table',
    },
    concept: 'Concept',
    suits: { oros: 'of coins', copas: 'of cups', espadas: 'of swords', bastos: 'of clubs' },
    you: 'You',
    partner: 'Partner',
    bot: (n) => `Bot ${n}`,
    us: 'Us',
    them: 'Them',
    yourHand: 'Your hand',
    yourTurn: 'Your turn. Tap a card to raise it, tap it again to play it.',
    pickHint: 'Tap table cards to take, then your card again. Alone, it stays on the table.',
    soplada: 'Soplada!',
    infoAbout: (action) => `About ${action}`,
    infoReal:
      'Real in hand: your 3 dealt cards add up to 15. Real on the table: the 4 starting table cards add up to 15; the dealer can call it until the first card is played. Real in hand is called on your first turn. If you miss one, it is lost.',
    infoSoplada:
      'When someone drops a card that made 15 with the table, pick those cards and tap Soplada! The fastest player takes them.',
    showInfo: 'Show info buttons (i)',
    showInfoHint: 'Shows how-to lines and an i next to Real!, Play and Soplada! On by default in easy.',
    missedFifteen: 'You could make 15.',
    drawing: 'Who deals?',
    dealerIs: (name) => `Dealer: ${name}`,
    notFifteen: "That's not 15.",
    myCards: (n) => `My cards (${n})`,
    noCaptures: 'Your pile is still empty this hand.',
    captureTags: { escoba: 'Escoba', real: 'Real', leftover: 'Leftover', soplada: 'Soplada' },
    counts: { cards: 'Cards', oros: 'Oros', sevens: 'Sevens', velo: '7 de velo', escobas: 'Escobas' },
    real: 'Real!',
    escoba: 'Escoba!',
    lastDeal: 'Cartas!',
    notReal: 'Your cards do not add up to 15.',
    tableNotReal: 'The table does not add up to 15.',
    dealer: 'Dealer',
    cardsLeft: (n) => `${n} ${n === 1 ? 'card' : 'cards'}`,
    pile: (n) => `pile ${n}`,
    pileFaces: (escobas, reales) =>
      `${escobas} ${escobas === 1 ? 'escoba' : 'escobas'}, ${reales} ${reales === 1 ? 'real' : 'reales'}`,
    deckLeft: (n) => `Deck: ${n}`,
    tableLabel: 'Table',
    emptyTable: 'The table is empty.',
    moveText: englishMove,
    round: (n) => `Hand ${n}`,
    roundShort: (n) => `#${n}`,
    roundTotal: 'Total',
    noPoints: 'No points this hand',
    primeraReal: 'Primera real',
    summaryCounts: (cards, oros) => `${cards} cards · ${oros} oros`,
    summaryGroups: { escobas: 'Escobas', reales: 'Reales', velo: '7 de velo', primera: 'Primera' },
    roundFinished: (n) => `Hand ${n} finished`,
    nextRound: 'Next hand',
    matchFinished: 'Match finished',
    winner: (name, points) => `${name} wins with ${points}`,
    youWon: (points, team) => (team ? `Your team wins with ${points}!` : `You win with ${points}!`),
    backHome: 'Back to start',
    scoreTitle: 'Score',
    liveScore: 'The last row is the hand in progress, not added yet.',
    exit: 'Exit',
    exitTitle: 'Leave the match?',
    exitBody: 'The match will be lost.',
    exitConfirm: 'Yes, exit',
    keepPlaying: 'Keep playing',
    settings: 'Settings',
    musicOff: 'Turn music off',
    musicOnLabel: 'Turn music on',
    textSize: 'Text size',
    textSizes: { normal: 'Normal', large: 'Large', xlarge: 'Extra large' },
    plainFont: 'Plain font',
    plainFontHint: 'Uses a regular font instead of the pixel one.',
    reduceMotion: 'Turn off animations',
    reduceMotionHint: 'Windows and cards appear without moving.',
    close: 'Close',
    toLight: 'Switch to light mode',
    toDark: 'Switch to dark mode',
    language: 'Language',
    install: 'Install app',
    developedBy: 'Developed by',
    otherGames: 'Other games',
    showOtherGames: 'Show other games',
    hideOtherGames: 'Hide other games',
    showOtherGamesHint: 'A side column with the other card games on wide screens. The header button always opens them.',
  },
  es: {
    appName: 'Escoba',
    tagline: 'Suma 15 y barre la mesa, contra bots.',
    rules: 'Reglas',
    history: 'Historial',
    historyEmpty: 'Aquí aparecerán las partidas terminadas.',
    historySummary: (played, won) => `${played} jugadas · ${won} ganadas`,
    playerCount: (n) => (n === 4 ? '4 en parejas' : `${n} jugadores`),
    outcomes: { won: 'Ganaste', tied: 'Empate', lost: 'Perdiste', abandoned: 'Abandonada' },
    difficulty: 'Dificultad',
    levels: { easy: 'Fácil', medium: 'Medio', hard: 'Difícil' },
    levelHints: {
      easy: 'se lleva lo que más puede',
      medium: 'cuida la mesa',
      hard: 'cuenta cartas y piensa adelante',
    },
    toTarget: (n) => `a ${n}`,
    playWith: (players) => (players === 4 ? '4 jugadores en parejas' : `${players} jugadores`),
    playMode: (players) => (players === 4 ? 'en parejas' : 'jugadores'),
    pointsTitle: 'Puntos por mano',
    concepts: {
      escobas: 'Escobas',
      cards: 'Más cartas',
      oros: 'Más oros',
      velo: '7 de velo',
      primera: 'Primera',
      realHand: 'Real en mano',
      realTable: 'Real en mesa',
    },
    concept: 'Concepto',
    suits: { oros: 'de oros', copas: 'de copas', espadas: 'de espadas', bastos: 'de bastos' },
    you: 'Tú',
    partner: 'Compañero',
    bot: (n) => `Bot ${n}`,
    us: 'Nosotros',
    them: 'Ellos',
    yourHand: 'Tu mano',
    yourTurn: 'Tu turno. Toca una carta para subirla y otra vez para jugarla.',
    pickHint: 'Toca cartas de la mesa y otra vez tu carta. Sola, queda en la mesa.',
    soplada: '¡Soplada!',
    infoAbout: (action) => `Sobre ${action}`,
    infoReal:
      'Real en mano: las 3 cartas que te reparten suman 15. Real en mesa: las 4 cartas iniciales de la mesa suman 15; el que reparte puede cantarlo hasta que se juegue la primera carta. El real en mano se canta en tu primer turno. Si no lo ves, lo pierdes.',
    infoSoplada:
      'Cuando alguien bota una carta que sumaba 15 con la mesa, elige esas cartas y toca ¡Soplada! Se las lleva el más rápido.',
    showInfo: 'Mostrar botones de info (i)',
    showInfoHint: 'Muestra instrucciones y una i junto a ¡Real!, Jugar y ¡Soplada! Encendido por defecto en fácil.',
    missedFifteen: 'Podías sumar 15.',
    drawing: '¿Quién da?',
    dealerIs: (name) => `Da: ${name}`,
    notFifteen: 'No suman 15.',
    myCards: (n) => `Mis cartas (${n})`,
    noCaptures: 'Todavía no hay cartas en tu pozo esta mano.',
    captureTags: { escoba: 'Escoba', real: 'Real', leftover: 'Lo que quedó', soplada: 'Soplada' },
    counts: { cards: 'Cartas', oros: 'Oros', sevens: 'Sietes', velo: '7 de velo', escobas: 'Escobas' },
    real: '¡Real!',
    escoba: '¡Escoba!',
    lastDeal: '¡Cartas!',
    notReal: 'Tus cartas no suman 15.',
    tableNotReal: 'La mesa no suma 15.',
    dealer: 'Reparte',
    cardsLeft: (n) => `${n} ${n === 1 ? 'carta' : 'cartas'}`,
    pile: (n) => `pozo ${n}`,
    pileFaces: (escobas, reales) =>
      `${escobas} ${escobas === 1 ? 'escoba' : 'escobas'}, ${reales} ${reales === 1 ? 'real' : 'reales'}`,
    deckLeft: (n) => `Mazo: ${n}`,
    tableLabel: 'Mesa',
    emptyTable: 'La mesa está vacía.',
    moveText: spanishMove,
    round: (n) => `Mano ${n}`,
    roundShort: (n) => `#${n}`,
    roundTotal: 'Total',
    noPoints: 'Sin puntos en esta mano',
    primeraReal: 'Primera real',
    summaryCounts: (cards, oros) => `${cards} cartas · ${oros} oros`,
    summaryGroups: { escobas: 'Escobas', reales: 'Reales', velo: '7 de velo', primera: 'Primera' },
    roundFinished: (n) => `Fin de la mano ${n}`,
    nextRound: 'Siguiente mano',
    matchFinished: 'Partida terminada',
    winner: (name, points) => `Gana ${name} con ${points}`,
    youWon: (points, team) => (team ? `¡Ganamos con ${points}!` : `¡Ganaste con ${points}!`),
    backHome: 'Volver al inicio',
    scoreTitle: 'Puntaje',
    liveScore: 'La última fila es la mano en curso, todavía sin sumar.',
    exit: 'Salir',
    exitTitle: '¿Salir de la partida?',
    exitBody: 'La partida se perderá.',
    exitConfirm: 'Sí, salir',
    keepPlaying: 'Seguir jugando',
    settings: 'Ajustes',
    musicOff: 'Apagar música',
    musicOnLabel: 'Encender música',
    textSize: 'Tamaño del texto',
    textSizes: { normal: 'Normal', large: 'Grande', xlarge: 'Muy grande' },
    plainFont: 'Letra normal',
    plainFontHint: 'Usa una letra común en vez de la pixelada.',
    reduceMotion: 'Desactivar animaciones',
    reduceMotionHint: 'Las ventanas y cartas aparecen sin moverse.',
    close: 'Cerrar',
    toLight: 'Cambiar a modo claro',
    toDark: 'Cambiar a modo oscuro',
    language: 'Idioma',
    install: 'Instalar app',
    developedBy: 'Desarrollado por',
    otherGames: 'Otros juegos',
    showOtherGames: 'Mostrar otros juegos',
    hideOtherGames: 'Ocultar otros juegos',
    showOtherGamesHint: 'Una columna lateral con los otros juegos de naipes en pantallas anchas. El botón de la cabecera siempre los abre.',
  },
}

export const LocaleContext = createContext<Locale>(defaultLocale)

export function useLocale(): Locale {
  return useContext(LocaleContext)
}

export function useMessages(): Messages {
  return messages[useLocale()]
}
