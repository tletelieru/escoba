import { emptyPile, viewFor } from '@escoba/engine'
import type { Card, MatchState, PlayerCount, PlayerView, Rank, RoundState, Suit } from '@escoba/engine'

export const card = (rank: Rank, suit: Suit): Card => ({ rank, suit })

export function stateWith(players: PlayerCount, round: Partial<RoundState>): MatchState {
  return {
    players,
    rng: 1,
    dealer: players - 1,
    roundIndex: 0,
    round: {
      deck: [],
      hands: Array.from({ length: players }, () => []),
      table: [],
      piles: Array.from({ length: players }, emptyPile),
      turn: 0,
      realTableOpen: false,
      deal: 1,
      fresh: Array.from({ length: players }, () => true),
      lastCapturer: null,
      soplada: null,
      moves: [],
      ...round,
    },
    results: [],
    status: 'playing',
  }
}

export function viewWith(players: PlayerCount, round: Partial<RoundState>): PlayerView {
  return viewFor(stateWith(players, round), 0)
}
