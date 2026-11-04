import type { Card, PlayerCount, Seat } from './cards'
import { canCallRealHand } from './match'
import type { MatchState, MatchStatus, Move, SopladaWindow } from './match'
import type { Pile, RoundScore } from './scoring'

export interface PlayerView {
  seat: Seat
  players: PlayerCount
  dealer: Seat
  roundIndex: number
  turn: Seat
  realTableOpen: boolean
  deal: number
  hand: Card[]
  handCounts: number[]
  deckCount: number
  table: Card[]
  piles: Pile[]
  lastCapturer: Seat | null
  soplada: SopladaWindow | null
  canCallReal: boolean
  moves: Move[]
  results: RoundScore[]
  status: MatchStatus
}

export function viewFor(state: MatchState, seat: Seat): PlayerView {
  const { round } = state
  return {
    seat,
    players: state.players,
    dealer: state.dealer,
    roundIndex: state.roundIndex,
    turn: round.turn,
    realTableOpen: round.realTableOpen,
    deal: round.deal,
    hand: round.hands[seat],
    handCounts: round.hands.map((hand) => hand.length),
    deckCount: round.deck.length,
    table: round.table,
    piles: round.piles,
    lastCapturer: round.lastCapturer,
    soplada: round.soplada,
    canCallReal: canCallRealHand(state, seat),
    moves: round.moves,
    results: state.results,
    status: state.status,
  }
}
