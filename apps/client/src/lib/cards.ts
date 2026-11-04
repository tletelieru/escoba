import { sideOf } from '@escoba/engine'
import type { Card, PlayerCount, Rank, Seat, Suit } from '@escoba/engine'

export type SeatPosition = 'bottom' | 'right' | 'top' | 'left'

const HAND_SUITS: Suit[] = ['oros', 'copas', 'espadas', 'bastos']

const POSITIONS: Record<PlayerCount, SeatPosition[]> = {
  2: ['bottom', 'top'],
  3: ['bottom', 'right', 'left'],
  4: ['bottom', 'right', 'top', 'left'],
}

export const SEAT_VECTOR: Record<SeatPosition, { x: number; y: number }> = {
  bottom: { x: 0, y: 260 },
  right: { x: 150, y: 0 },
  top: { x: 0, y: -200 },
  left: { x: -150, y: 0 },
}

export const SUIT_ON_CARD: Record<Suit, string> = {
  oros: 'text-card-oros',
  copas: 'text-card-copas',
  espadas: 'text-card-espadas',
  bastos: 'text-card-bastos',
}

export const SUIT_ON_TABLE: Record<Suit, string> = {
  oros: 'text-table-oros',
  copas: 'text-table-copas',
  espadas: 'text-table-espadas',
  bastos: 'text-table-bastos',
}

export function cardKey(card: Card): string {
  return `${card.suit}-${card.rank}`
}

export function rankLabel(rank: Rank): string {
  return String(rank)
}

export function isFigure(card: Card): boolean {
  return card.rank >= 10
}

export function seatPosition(seat: Seat, players: PlayerCount): SeatPosition {
  return POSITIONS[players][seat]
}

export function sortHand(hand: Card[]): Card[] {
  return [...hand].sort(
    (a, b) => a.rank - b.rank || HAND_SUITS.indexOf(a.suit) - HAND_SUITS.indexOf(b.suit),
  )
}

export function seatsOfSide(side: number, players: PlayerCount): Seat[] {
  return Array.from({ length: players }, (_, seat) => seat).filter(
    (seat) => sideOf(seat, players) === side,
  )
}
