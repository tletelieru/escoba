import type { Locale } from './locales'

interface RuleSection {
  tab: string
  rules: string[]
}

interface RulesText {
  sections: RuleSection[]
}

export const rulesText: Record<Locale, RulesText> = {
  en: {
    sections: [
      {
        tab: "Basics",
        rules: [
          "Played with a 40-card Spanish deck, for 2 or 3 players, or 4 in pairs.",
          "Each player gets 3 cards and 4 go face up on the table.",
          "Values: 1 to 7 are worth their number, jack 8, knight 9, king 10.",
        ],
      },
      {
        tab: "Capture",
        rules: [
          "Play one card. If it adds up to 15 with one or more table cards, take them all.",
          "If there are several ways to make 15, you choose which cards to take.",
          "Clearing the table is an escoba.",
          "At the end of the hand, the cards left on the table go to the last player who captured.",
        ],
      },
      {
        tab: "Points",
        rules: [
          "Each escoba: 1 point.",
          "Most cards: 1. Most oros: 1. The 7 of oros, the 7 de velo: 1.",
          "Primera: 1 point for the best card of each suit (7 > 6 > Ace > 5 > 4 > 3 > 2 > face cards).",
          "Primera real, all four 7s: 2 points.",
          "Real in hand: 3 points. Real on the table: 4 points.",
          "Ties give the point to nobody.",
        ],
      },
    ],
  },
  es: {
    sections: [
      {
        tab: "Base",
        rules: [
          "Se juega con naipe español de 40 cartas, para 2 o 3 jugadores, o 4 en parejas.",
          "A cada jugador le tocan 3 cartas y se ponen 4 boca arriba en la mesa.",
          "Valores: del 1 al 7 valen su número, sota 8, caballo 9, rey 10.",
        ],
      },
      {
        tab: "Captura",
        rules: [
          "Juegas una carta. Si suma 15 con una o más cartas de la mesa, te las llevas todas.",
          "Si hay varias formas de sumar 15, eliges cuáles te llevas.",
          "Dejar la mesa vacía es una escoba.",
          "Al final de la mano, lo que queda en la mesa es del último que capturó.",
        ],
      },
      {
        tab: "Puntos",
        rules: [
          "Cada escoba: 1 punto.",
          "Más cartas: 1. Más oros: 1. El 7 de oros, el 7 de velo: 1.",
          "Primera: 1 punto por la mejor carta de cada pinta (7 > 6 > As > 5 > 4 > 3 > 2 > figuras).",
          "Primera real, los cuatro 7: 2 puntos.",
          "Real en mano: 3 puntos. Real en mesa: 4 puntos.",
          "Si hay empate, nadie se lleva el punto.",
        ],
      },
    ],
  },
}
