import { TARGET_SUM, createDeck, sameCard, sumValues, withoutCards } from './cards'
import type { Card, PlayerCount, Seat } from './cards'
import { captureOptions } from './captures'
import { nextRandom, shuffle } from './rng'
import { emptyPile, scoreTallies, sideCount, tallyPiles } from './scoring'
import type { Pile, RoundScore } from './scoring'

export const MATCH_POINTS = 15

export const HAND_SIZE = 3

export const TABLE_SIZE = 4

export interface MatchConfig {
  players: PlayerCount
}

export type Move =
  | { type: 'play'; seat: Seat; card: Card; captured: Card[]; escoba: boolean }
  | { type: 'realHand'; seat: Seat; cards: Card[] }
  | { type: 'realTable'; seat: Seat; cards: Card[] }
  | { type: 'deal'; deal: number }
  | { type: 'leftover'; seat: Seat; cards: Card[] }
  | { type: 'soplar'; seat: Seat; from: Seat; cards: Card[] }

export interface SopladaWindow {
  seat: Seat
  card: Card
}

export interface RoundState {
  deck: Card[]
  hands: Card[][]
  table: Card[]
  piles: Pile[]
  turn: Seat
  realTableOpen: boolean
  deal: number
  fresh: boolean[]
  lastCapturer: Seat | null
  soplada: SopladaWindow | null
  moves: Move[]
}

export type MatchStatus = 'playing' | 'roundOver' | 'matchOver'

export interface MatchState {
  players: PlayerCount
  rng: number
  dealer: Seat
  roundIndex: number
  round: RoundState
  results: RoundScore[]
  status: MatchStatus
}

export type Action =
  | { type: 'play'; seat: Seat; card: Card; capture: Card[] }
  | { type: 'realHand'; seat: Seat }
  | { type: 'realTable'; seat: Seat }
  | { type: 'soplar'; seat: Seat; cards: Card[] }

export type TurnAction = Exclude<Action, { type: 'soplar' | 'realTable' }>

export interface Score {
  totals: number[]
  rounds: RoundScore[]
}

export function nextSeat(seat: Seat, players: PlayerCount): Seat {
  return (seat + 1) % players
}

function dealHands(deck: Card[], players: PlayerCount, dealer: Seat) {
  const hands: Card[][] = Array.from({ length: players }, () => [])
  for (let offset = 0; offset < players; offset++) {
    const seat = (dealer + 1 + offset) % players
    hands[seat] = deck.slice(offset * HAND_SIZE, (offset + 1) * HAND_SIZE)
  }
  return { hands, deck: deck.slice(players * HAND_SIZE) }
}

function startRound(players: PlayerCount, dealer: Seat, rng: number) {
  const { items, rng: next } = shuffle(createDeck(), rng)
  const { hands, deck } = dealHands(items, players, dealer)
  const round: RoundState = {
    deck: deck.slice(TABLE_SIZE),
    hands,
    table: deck.slice(0, TABLE_SIZE),
    piles: Array.from({ length: players }, emptyPile),
    turn: nextSeat(dealer, players),
    realTableOpen: true,
    deal: 1,
    fresh: hands.map(() => true),
    lastCapturer: null,
    soplada: null,
    moves: [{ type: 'deal', deal: 1 }],
  }
  return { round, rng: next }
}

export function createMatch(config: MatchConfig, seed: number): MatchState {
  const { players } = config
  const random = nextRandom(seed)
  const dealer = Math.floor(random.value * players)
  const { round, rng } = startRound(players, dealer, random.rng)
  return { players, rng, dealer, roundIndex: 0, round, results: [], status: 'playing' }
}

export function startNextRound(state: MatchState): MatchState {
  if (state.status !== 'roundOver') throw new Error('The current round has not finished')
  const dealer = nextSeat(state.dealer, state.players)
  const { round, rng } = startRound(state.players, dealer, state.rng)
  return { ...state, rng, dealer, roundIndex: state.roundIndex + 1, round, status: 'playing' }
}

export function hasRealHand(hand: Card[]): boolean {
  return hand.length === HAND_SIZE && sumValues(hand) === TARGET_SUM
}

export function hasRealTable(table: Card[]): boolean {
  return table.length === TABLE_SIZE && sumValues(table) === TARGET_SUM
}

export function canCallRealHand(state: MatchState, seat: Seat): boolean {
  const { round } = state
  return (
    state.status === 'playing' &&
    round.turn === seat &&
    round.fresh[seat] &&
    round.hands[seat].length === HAND_SIZE
  )
}

export function sopladaActions(state: MatchState, seat: Seat): Action[] {
  const { soplada, table } = state.round
  if (state.status !== 'playing' || !soplada || soplada.seat === seat) return []
  const rest = withoutCards(table, [soplada.card])
  return captureOptions(soplada.card, rest).map((cards) => ({
    type: 'soplar',
    seat,
    cards: [soplada.card, ...cards],
  }))
}

export function turnActions(state: MatchState, seat: Seat): TurnAction[] {
  const { round } = state
  if (state.status !== 'playing' || round.turn !== seat) return []
  const hand = round.hands[seat]
  const actions: TurnAction[] =
    canCallRealHand(state, seat) && hasRealHand(hand) ? [{ type: 'realHand', seat }] : []
  for (const card of hand) {
    actions.push({ type: 'play', seat, card, capture: [] })
    for (const capture of captureOptions(card, round.table)) {
      actions.push({ type: 'play', seat, card, capture })
    }
  }
  return actions
}

export function canClaimRealTable(state: MatchState, seat: Seat): boolean {
  return state.status === 'playing' && state.round.realTableOpen && state.dealer === seat
}

export function realTableActions(state: MatchState, seat: Seat): Action[] {
  if (!canClaimRealTable(state, seat) || !hasRealTable(state.round.table)) return []
  return [{ type: 'realTable', seat }]
}

export function legalActions(state: MatchState, seat: Seat): Action[] {
  return [...turnActions(state, seat), ...sopladaActions(state, seat), ...realTableActions(state, seat)]
}

function sameCards(a: Card[], b: Card[]): boolean {
  return a.length === b.length && a.every((card) => b.some((item) => sameCard(item, card)))
}

export function sameAction(a: Action, b: Action): boolean {
  if (a.type !== b.type || a.seat !== b.seat) return false
  if (a.type === 'soplar' && b.type === 'soplar') return sameCards(a.cards, b.cards)
  if (a.type !== 'play' || b.type !== 'play') return true
  return sameCard(a.card, b.card) && sameCards(a.capture, b.capture)
}

function updatePile(piles: Pile[], seat: Seat, change: (pile: Pile) => Pile): Pile[] {
  return piles.map((pile, index) => (index === seat ? change(pile) : pile))
}

function updateHand(hands: Card[][], seat: Seat, hand: Card[]): Card[][] {
  return hands.map((held, index) => (index === seat ? hand : held))
}

function finishRound(state: MatchState, round: RoundState): MatchState {
  let finished = round
  if (round.table.length > 0 && round.lastCapturer !== null) {
    const seat = round.lastCapturer
    const cards = round.table
    finished = {
      ...round,
      table: [],
      piles: updatePile(round.piles, seat, (pile) => ({ ...pile, cards: [...pile.cards, ...cards] })),
      moves: [...round.moves, { type: 'leftover', seat, cards }],
    }
  }
  const results = [...state.results, scoreTallies(tallyPiles(finished.piles, state.players))]
  const next = { ...state, round: finished, results }
  const totals = score(next).totals
  const best = Math.max(...totals)
  const leaders = totals.filter((total) => total === best).length
  const status = best >= MATCH_POINTS && leaders === 1 ? 'matchOver' : 'roundOver'
  return { ...next, status }
}

function advance(state: MatchState, round: RoundState, seat: Seat): MatchState {
  const { players } = state
  for (let offset = 1; offset <= players; offset++) {
    const candidate = (seat + offset) % players
    if (round.hands[candidate].length > 0) return { ...state, round: { ...round, turn: candidate } }
  }
  if (round.deck.length === 0) return finishRound(state, round)
  const dealt = dealHands(round.deck, players, state.dealer)
  const deal = round.deal + 1
  return {
    ...state,
    round: {
      ...round,
      deck: dealt.deck,
      hands: dealt.hands,
      deal,
      fresh: dealt.hands.map(() => true),
      turn: nextSeat(state.dealer, players),
      moves: [...round.moves, { type: 'deal', deal }],
    },
  }
}

function applyPlay(state: MatchState, seat: Seat, card: Card, capture: Card[]): MatchState {
  const { round } = state
  const hands = updateHand(round.hands, seat, withoutCards(round.hands[seat], [card]))
  const fresh = round.fresh.map((value, index) => (index === seat ? false : value))
  if (capture.length === 0) {
    const moves: Move[] = [...round.moves, { type: 'play', seat, card, captured: [], escoba: false }]
    const dropped = { ...round, hands, fresh, table: [...round.table, card], moves }
    const next = advance(state, dropped, seat)
    if (next.status !== 'playing') return next
    return { ...next, round: { ...next.round, soplada: { seat, card } } }
  }
  const table = withoutCards(round.table, capture)
  const escoba = table.length === 0
  const piles = updatePile(round.piles, seat, (pile) => ({
    ...pile,
    cards: [...pile.cards, card, ...capture],
    escobas: escoba ? [...pile.escobas, card] : pile.escobas,
  }))
  const moves: Move[] = [...round.moves, { type: 'play', seat, card, captured: capture, escoba }]
  return advance(state, { ...round, hands, fresh, table, piles, moves, lastCapturer: seat }, seat)
}


function applySoplar(state: MatchState, seat: Seat, cards: Card[]): MatchState {
  const { round } = state
  const from = round.soplada?.seat ?? seat
  const piles = updatePile(round.piles, seat, (pile) => ({ ...pile, cards: [...pile.cards, ...cards] }))
  const moves: Move[] = [...round.moves, { type: 'soplar', seat, from, cards }]
  const table = withoutCards(round.table, cards)
  return { ...state, round: { ...round, table, piles, moves, lastCapturer: seat, soplada: null } }
}

function applyRealTable(state: MatchState, seat: Seat): MatchState {
  const { round } = state
  const cards = round.table
  const piles = updatePile(round.piles, seat, (pile) => ({
    ...pile,
    cards: [...pile.cards, ...cards],
    realTable: [...pile.realTable, cards],
  }))
  const moves: Move[] = [...round.moves, { type: 'realTable', seat, cards }]
  return {
    ...state,
    round: { ...round, table: [], piles, moves, lastCapturer: seat, realTableOpen: false },
  }
}

function applyTurn(state: MatchState, action: TurnAction): MatchState {
  const { round } = state
  const { seat } = action
  if (action.type === 'realHand') {
    const cards = round.hands[seat]
    const piles = updatePile(round.piles, seat, (pile) => ({
      ...pile,
      cards: [...pile.cards, ...cards],
      realHand: [...pile.realHand, cards],
    }))
    const hands = updateHand(round.hands, seat, [])
    const fresh = round.fresh.map((value, index) => (index === seat ? false : value))
    const moves: Move[] = [...round.moves, { type: 'realHand', seat, cards }]
    return advance(state, { ...round, hands, fresh, piles, moves }, seat)
  }
  return applyPlay(state, seat, action.card, action.capture)
}

export function applyAction(state: MatchState, action: Action): MatchState {
  if (!legalActions(state, action.seat).some((legal) => sameAction(legal, action))) {
    throw new Error('Illegal action')
  }
  if (action.type === 'soplar') return applySoplar(state, action.seat, action.cards)
  if (action.type === 'realTable') return applyRealTable(state, action.seat)
  const realTableOpen = state.round.realTableOpen && action.type !== 'play'
  return applyTurn({ ...state, round: { ...state.round, soplada: null, realTableOpen } }, action)
}

export function scoreRound(state: MatchState): RoundScore {
  return scoreTallies(tallyPiles(state.round.piles, state.players))
}

export function score(state: MatchState): Score {
  const totals = Array.from({ length: sideCount(state.players) }, (_, side) =>
    state.results.reduce((sum, result) => sum + result.points[side], 0),
  )
  return { totals, rounds: state.results }
}

export function matchWinners(state: MatchState): number[] {
  const { totals } = score(state)
  const best = Math.max(...totals)
  return totals.flatMap((total, side) => (total === best ? [side] : []))
}
