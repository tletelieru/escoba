import { SUITS, isOros, isSeven, isSieteDeVelo, primeraValue } from './cards'
import type { Card, PlayerCount, Seat } from './cards'

export interface Pile {
  cards: Card[]
  escobas: Card[]
  realHand: Card[][]
  realTable: Card[][]
}

export interface Tally {
  cards: number
  oros: number
  velo: boolean
  sevens: number
  primera: number | null
  escobas: number
  realHand: number
  realTable: number
}

export interface Breakdown {
  escobas: number
  cards: number
  oros: number
  velo: number
  primera: number
  realHand: number
  realTable: number
}

export interface RoundScore {
  points: number[]
  breakdown: Breakdown[]
  tallies: Tally[]
}

export const POINTS = {
  escoba: 1,
  cards: 1,
  oros: 1,
  velo: 1,
  primera: 1,
  primeraReal: 2,
  realHand: 3,
  realTable: 4,
} as const

export function sideCount(players: PlayerCount): number {
  return players === 4 ? 2 : players
}

export function sideOf(seat: Seat, players: PlayerCount): number {
  return players === 4 ? seat % 2 : seat
}

export function emptyPile(): Pile {
  return { cards: [], escobas: [], realHand: [], realTable: [] }
}

export function primera(cards: Card[]): number | null {
  let total = 0
  for (const suit of SUITS) {
    const inSuit = cards.filter((card) => card.suit === suit)
    if (inSuit.length === 0) return null
    total += Math.max(...inSuit.map(primeraValue))
  }
  return total
}

export function tallyPiles(piles: Pile[], players: PlayerCount): Tally[] {
  return Array.from({ length: sideCount(players) }, (_, side) => {
    const owned = piles.filter((_, seat) => sideOf(seat, players) === side)
    const cards = owned.flatMap((pile) => pile.cards)
    return {
      cards: cards.length,
      oros: cards.filter(isOros).length,
      velo: cards.some(isSieteDeVelo),
      sevens: cards.filter(isSeven).length,
      primera: primera(cards),
      escobas: owned.reduce((sum, pile) => sum + pile.escobas.length, 0),
      realHand: owned.reduce((sum, pile) => sum + pile.realHand.length, 0),
      realTable: owned.reduce((sum, pile) => sum + pile.realTable.length, 0),
    }
  })
}

function uniqueBest(values: (number | null)[]): number | null {
  const present = values.filter((value): value is number => value !== null)
  if (present.length === 0) return null
  const best = Math.max(...present)
  const leaders = values.flatMap((value, index) => (value === best ? [index] : []))
  return leaders.length === 1 ? leaders[0] : null
}

function primeraPoints(tallies: Tally[], side: number, leader: number | null): number {
  if (tallies[side].sevens === 4) return POINTS.primeraReal
  if (tallies.some((tally) => tally.sevens === 4)) return 0
  return leader === side ? POINTS.primera : 0
}

export function scoreTallies(tallies: Tally[]): RoundScore {
  const mostCards = uniqueBest(tallies.map((tally) => tally.cards))
  const mostOros = uniqueBest(tallies.map((tally) => tally.oros))
  const bestPrimera = uniqueBest(tallies.map((tally) => tally.primera))
  const breakdown = tallies.map((tally, side) => ({
    escobas: tally.escobas * POINTS.escoba,
    cards: mostCards === side ? POINTS.cards : 0,
    oros: mostOros === side ? POINTS.oros : 0,
    velo: tally.velo ? POINTS.velo : 0,
    primera: primeraPoints(tallies, side, bestPrimera),
    realHand: tally.realHand * POINTS.realHand,
    realTable: tally.realTable * POINTS.realTable,
  }))
  const points = breakdown.map((item) =>
    Object.values(item).reduce((sum, value) => sum + value, 0),
  )
  return { points, breakdown, tallies }
}
