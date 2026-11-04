export const SUITS = ['oros', 'copas', 'espadas', 'bastos'] as const

export type Suit = (typeof SUITS)[number]

export const RANKS = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12] as const

export type Rank = (typeof RANKS)[number]

export interface Card {
  suit: Suit
  rank: Rank
}

export type PlayerCount = 2 | 3 | 4

export type Seat = number

export const DECK_SIZE = 40

export const TARGET_SUM = 15

const VALUES: Record<Rank, number> = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 10: 8, 11: 9, 12: 10 }

const PRIMERA: Record<Rank, number> = {
  7: 21,
  6: 18,
  1: 16,
  5: 15,
  4: 14,
  3: 13,
  2: 12,
  10: 10,
  11: 10,
  12: 10,
}

export function cardId(card: Card): string {
  return `${card.rank}-${card.suit}`
}

export function createDeck(): Card[] {
  return SUITS.flatMap((suit) => RANKS.map((rank) => ({ suit, rank })))
}

export function sameCard(a: Card, b: Card): boolean {
  return a.suit === b.suit && a.rank === b.rank
}

export function cardValue(card: Card): number {
  return VALUES[card.rank]
}

export function sumValues(cards: Card[]): number {
  return cards.reduce((sum, card) => sum + cardValue(card), 0)
}

export function primeraValue(card: Card): number {
  return PRIMERA[card.rank]
}

export function isOros(card: Card): boolean {
  return card.suit === 'oros'
}

export function isSieteDeVelo(card: Card): boolean {
  return card.suit === 'oros' && card.rank === 7
}

export function isSeven(card: Card): boolean {
  return card.rank === 7
}

export function withoutCards(cards: Card[], removed: Card[]): Card[] {
  return cards.filter((card) => !removed.some((item) => sameCard(item, card)))
}
