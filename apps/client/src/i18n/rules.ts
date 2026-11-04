import type { Locale } from './locales'

export const RULE_IDS = [
  'deck',
  'deal',
  'values',
  'target',
  'capture',
  'choose',
  'drop',
  'escoba',
  'soplada',
  'sopladaNoEscoba',
  'leftover',
  'escobas',
  'cards',
  'primera',
  'primeraReal',
  'realHand',
  'realTable',
  'realOptional',
  'ties',
] as const

export type RuleId = (typeof RULE_IDS)[number]

interface RuleSection {
  tab: string
  rules: RuleId[]
}

interface RulesText {
  sections: RuleSection[]
  text: Record<RuleId, string>
}

const SECTIONS: RuleId[][] = [
  ['deck', 'deal', 'values', 'target'],
  ['capture', 'choose', 'drop', 'escoba', 'soplada', 'sopladaNoEscoba', 'leftover'],
  ['escobas', 'cards', 'primera', 'primeraReal', 'realHand', 'realTable', 'realOptional', 'ties'],
]

export const rulesText: Record<Locale, RulesText> = {
  en: {
    sections: ['Basics', 'Capture', 'Points'].map((tab, index) => ({ tab, rules: SECTIONS[index] })),
    text: {
      deck: 'Played with a 40-card Spanish deck: oros, copas, espadas and bastos. For 2 or 3 players, or 4 in pairs.',
      deal: 'Each player gets 3 cards and 4 go face up on the table. When the hands run out, everyone gets 3 more. The player after the dealer always plays first.',
      values: '1 to 7 are worth their number. Sota (10) is worth 8, caballo (11) 9 and rey (12) 10.',
      target: 'The match goes to 15 points, counted at the end of each hand. If the leaders are tied, another hand is played.',
      capture: 'Tap a card from your hand to raise it, tap the table cards that add up to 15 with it, then tap your card again. You take them all.',
      choose: 'If there are several ways to make 15, you choose which cards to take.',
      drop: 'Tap your raised card again without picking table cards and it stays on the table, even if it could take.',
      escoba: 'Clearing the table is an escoba.',
      soplada:
        'If a player drops a card that made 15 with the table, anyone else can soplar: pick those cards and tap Soplada! The fastest takes them.',
      sopladaNoEscoba: 'A soplada never counts as an escoba, even if it clears the table.',
      leftover: 'At the end of the hand, the cards left on the table go to the last player who captured.',
      escobas: 'Each escoba: 1 point. One card of each escoba stays face up in your pile.',
      cards: 'Most cards: 1 point. Most oros: 1. The 7 of oros, the 7 de velo: 1.',
      primera:
        'Primera: 1 point for the best card of each suit (7 > 6 > 1 > 5 > 4 > 3 > 2 > figures). You need all four suits.',
      primeraReal: 'Primera real, all four 7s: 2 points.',
      realHand:
        'Real in hand: your 3 dealt cards add up to 15. Call Real! on your first turn of that deal and they stay face up in your pile. 3 points.',
      realTable:
        'Real on the table: the 4 starting table cards add up to 15. Only the dealer can call it, with Real!, until the first card of the hand is played. 4 points.',
      realOptional: 'Reales are never hinted: if you miss one, it is lost. They do not count as escobas.',
      ties: 'Ties give the point to nobody.',
    },
  },
  es: {
    sections: ['Base', 'Captura', 'Puntos'].map((tab, index) => ({ tab, rules: SECTIONS[index] })),
    text: {
      deck: 'Se juega con naipe español de 40 cartas: oros, copas, espadas y bastos. Para 2 o 3 jugadores, o 4 en parejas.',
      deal: 'A cada jugador le tocan 3 cartas y se ponen 4 boca arriba en la mesa. Cuando se acaban las manos, se reparten 3 más. Siempre empieza el jugador que sigue al que reparte.',
      values: 'Del 1 al 7 valen su número. La sota (10) vale 8, el caballo (11) 9 y el rey (12) 10.',
      target: 'La partida es a 15 puntos, contados al final de cada mano. Si los que van primeros empatan, se juega otra mano.',
      capture: 'Toca una carta de tu mano para subirla, toca las cartas de la mesa que suman 15 con ella y vuelve a tocar tu carta. Te las llevas todas.',
      choose: 'Si hay varias formas de sumar 15, eliges cuáles te llevas.',
      drop: 'Si vuelves a tocar tu carta sin elegir cartas de la mesa, queda en la mesa, aunque pudiera llevar.',
      escoba: 'Dejar la mesa vacía es una escoba.',
      soplada:
        'Si alguien bota una carta que sumaba 15 con la mesa, cualquier otro puede soplar: elige esas cartas y toca ¡Soplada! Se las lleva el más rápido.',
      sopladaNoEscoba: 'La soplada nunca cuenta como escoba, aunque deje la mesa vacía.',
      leftover: 'Al final de la mano, lo que queda en la mesa es del último que se llevó cartas.',
      escobas: 'Cada escoba: 1 punto. Una carta de cada escoba queda a la vista en tu pozo.',
      cards: 'Más cartas: 1 punto. Más oros: 1. El 7 de oros, el 7 de velo: 1.',
      primera:
        'Primera: 1 punto por la mejor carta de cada pinta (7 > 6 > 1 > 5 > 4 > 3 > 2 > figuras). Hay que tener las cuatro pintas.',
      primeraReal: 'Primera real, los cuatro 7: 2 puntos.',
      realHand:
        'Real en mano: las 3 cartas que te reparten suman 15. Canta ¡Real! en tu primer turno de ese reparto y quedan a la vista en tu pozo. 3 puntos.',
      realTable:
        'Real en mesa: las 4 cartas iniciales de la mesa suman 15. Solo lo canta el que reparte, con ¡Real!, hasta que se juegue la primera carta de la mano. 4 puntos.',
      realOptional: 'Los reales no se avisan: si no lo ves, lo pierdes. No cuentan como escoba.',
      ties: 'Si hay empate, nadie se lleva el punto.',
    },
  },
}
