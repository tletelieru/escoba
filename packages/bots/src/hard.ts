import { applyAction, captureOptions, sideOf, turnActions, viewFor } from '@escoba/engine'
import type { Action, Card, MatchState, PlayerView } from '@escoba/engine'
import { mediumBot, unseenCards } from './medium'
import { REFLEXES, reflexSoplar, turnOnly } from './soplada'
import type { Bot, Rng } from './types'

const DEFAULT_ITERATIONS = 24

interface HardOptions {
  iterations?: number
}

function shuffled(cards: Card[], rng: Rng): Card[] {
  const result = [...cards]
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(rng() * (index + 1))
    ;[result[index], result[other]] = [result[other], result[index]]
  }
  return result
}

function freshSeats(view: PlayerView): boolean[] {
  const lastDeal = view.moves.findLastIndex((move) => move.type === 'deal')
  const acted = new Set(
    view.moves.slice(lastDeal + 1).flatMap((move) => {
      if (move.type === 'play' || move.type === 'realHand') return [move.seat]
      return []
    }),
  )
  return view.handCounts.map((_, seat) => !acted.has(seat))
}

export function sampleState(view: PlayerView, rng: Rng): MatchState {
  const hidden = shuffled(unseenCards(view), rng)
  let cursor = 0
  const hands = view.handCounts.map((count, seat) => {
    if (seat === view.seat) return view.hand
    const hand = hidden.slice(cursor, cursor + count)
    cursor += count
    return hand
  })
  return {
    players: view.players,
    rng: 1,
    dealer: view.dealer,
    roundIndex: view.roundIndex,
    round: {
      deck: hidden.slice(cursor),
      hands,
      table: view.table,
      piles: view.piles,
      turn: view.turn,
      realTableOpen: false,
      deal: view.deal,
      fresh: freshSeats(view),
      lastCapturer: view.lastCapturer,
      soplada: null,
      moves: [],
    },
    results: [],
    status: 'playing',
  }
}

function rollout(start: MatchState, rng: Rng): number[] {
  let state = start
  while (state.status === 'playing') {
    const seat = state.round.turn
    const action = mediumBot.choose(viewFor(state, seat), turnActions(state, seat), rng)
    state = applyAction(state, action)
  }
  return state.results[state.results.length - 1].points
}

function margin(points: number[], side: number): number {
  const rivals = points.filter((_, index) => index !== side)
  return points[side] - Math.max(...rivals)
}

function leavesSoplada(view: PlayerView, action: Action): boolean {
  if (action.type !== 'play' || action.capture.length > 0) return false
  return captureOptions(action.card, view.table).length > 0
}

export function createHardBot({ iterations = DEFAULT_ITERATIONS }: HardOptions = {}): Bot {
  return {
    soplar: reflexSoplar(REFLEXES.hard),
    claimRealTable: () => true,
    choose(view, options, rng) {
      const turn = turnOnly(options)
      const safe = turn.filter((action) => !leavesSoplada(view, action))
      const legal = safe.length > 0 ? safe : turn
      const real = legal.find((action) => action.type === 'realHand')
      if (real) return real
      if (legal.length === 1) return legal[0]
      const side = sideOf(view.seat, view.players)
      const totals = legal.map(() => 0)
      for (let iteration = 0; iteration < iterations; iteration++) {
        const sample = sampleState(view, rng)
        legal.forEach((action: Action, index) => {
          totals[index] += margin(rollout(applyAction(sample, action), rng), side)
        })
      }
      let best = 0
      totals.forEach((total, index) => {
        if (total > totals[best]) best = index
      })
      return legal[best]
    },
  }
}

export const hardBot = createHardBot()
