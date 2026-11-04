import { HAND_SIZE, TABLE_SIZE } from '@escoba/engine'
import type { Seat } from '@escoba/engine'

const FLIGHT_GAP_MS = 90
export const FLIGHT_MS = 420
const TABLE_GAP_MS = 150
const SETTLE_MS = 300

function offset(seat: Seat, dealer: Seat, players: number): number {
  return (seat - dealer - 1 + players) % players
}

export function landAt(seat: Seat, dealer: Seat, players: number, card: number): number {
  return (card * players + offset(seat, dealer, players)) * FLIGHT_GAP_MS + FLIGHT_MS
}

export function tableAt(players: number, card: number): number {
  return HAND_SIZE * players * FLIGHT_GAP_MS + FLIGHT_MS + card * TABLE_GAP_MS
}

export function dealDuration(players: number, withTable: boolean): number {
  const hands = (HAND_SIZE * players - 1) * FLIGHT_GAP_MS + FLIGHT_MS
  if (!withTable) return hands + SETTLE_MS
  return tableAt(players, TABLE_SIZE - 1) + SETTLE_MS
}

export function flightDelay(seat: Seat, dealer: Seat, players: number, card: number): number {
  return landAt(seat, dealer, players, card) - FLIGHT_MS
}
