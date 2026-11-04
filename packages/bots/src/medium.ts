import {
  TARGET_SUM,
  captureOptions,
  cardValue,
  createDeck,
  isOros,
  isSeven,
  isSieteDeVelo,
  sameCard,
  sideOf,
  sumValues,
  withoutCards,
} from '@escoba/engine'
import type { Action, Card, PlayerView } from '@escoba/engine'
import { MISS_RATES, missedCapture } from './misses'
import { REFLEXES, reflexSoplar, turnOnly } from './soplada'
import type { Bot, Rng } from './types'

const NOISE = 0.05
const REAL_SCORE = 1000
const ESCOBA_WEIGHT = 10
const CARD_WEIGHT = 0.5
const ORO_WEIGHT = 0.45
const SEVEN_WEIGHT = 0.9
const SIX_WEIGHT = 0.3
const VELO_WEIGHT = 4
const MAX_HAND = 3
const EXPOSURE_WEIGHT = 0.5
const SOPLADA_RISK = 3

export function unseenCards(view: PlayerView): Card[] {
  const seen = [...view.hand, ...view.table, ...view.piles.flatMap((pile) => pile.cards)]
  return withoutCards(createDeck(), seen)
}

export function cardWorth(card: Card): number {
  return (
    CARD_WEIGHT +
    (isOros(card) ? ORO_WEIGHT : 0) +
    (isSeven(card) ? SEVEN_WEIGHT : 0) +
    (card.rank === 6 ? SIX_WEIGHT : 0) +
    (isSieteDeVelo(card) ? VELO_WEIGHT : 0)
  )
}

function nextRivalCards(view: PlayerView): number {
  for (let offset = 1; offset < view.players; offset++) {
    const seat = (view.seat + offset) % view.players
    const cards = view.handCounts[seat]
    if (cards === 0) continue
    if (sideOf(seat, view.players) === sideOf(view.seat, view.players)) return 0
    return Math.min(MAX_HAND, cards)
  }
  return view.deckCount > 0 ? MAX_HAND : 0
}

export function sweepChance(table: Card[], unseen: Card[], holding: number): number {
  if (table.length === 0 || holding === 0 || unseen.length === 0) return 0
  const needed = TARGET_SUM - sumValues(table)
  if (needed < 1 || needed > 10) return 0
  const matching = unseen.filter((card) => cardValue(card) === needed).length
  const missing = Math.pow(1 - matching / unseen.length, holding)
  return 1 - missing
}

function exposure(table: Card[], unseen: Card[]): number {
  let risk = 0
  for (const card of table) {
    const needed = TARGET_SUM - cardValue(card)
    const partners = table.filter((item) => !sameCard(item, card))
    const direct = unseen.some((item) => cardValue(item) === needed)
    const paired = partners.some((item) =>
      unseen.some((other) => cardValue(other) === needed - cardValue(item)),
    )
    if (direct || paired) risk += cardWorth(card) - CARD_WEIGHT
  }
  return risk
}

export function scorePlay(view: PlayerView, action: Action, unseen: Card[]): number {
  if (action.type !== 'play') return REAL_SCORE
  const taken = [action.card, ...action.capture]
  const table =
    action.capture.length > 0
      ? withoutCards(view.table, action.capture)
      : [...view.table, action.card]
  const gained = action.capture.length > 0 ? taken.reduce((sum, card) => sum + cardWorth(card), 0) : 0
  const escoba = action.capture.length > 0 && table.length === 0 ? ESCOBA_WEIGHT : 0
  const holding = nextRivalCards(view)
  const danger = sweepChance(table, unseen, holding) * ESCOBA_WEIGHT
  const leftWorth = holding > 0 ? exposure(table, unseen) * EXPOSURE_WEIGHT : 0
  const kept = action.capture.length === 0 ? cardWorth(action.card) : 0
  const missed = action.capture.length === 0 && captureOptions(action.card, view.table).length > 0
  return gained + escoba - danger - leftWorth - kept - (missed ? SOPLADA_RISK : 0)
}

function choose(view: PlayerView, options: Action[], rng: Rng): Action {
  const legal = turnOnly(options)
  const missed = missedCapture(view, legal, MISS_RATES.medium, rng)
  if (missed) return missed
  const unseen = unseenCards(view)
  let best = legal[0]
  let bestScore = -Infinity
  for (const action of legal) {
    const value = scorePlay(view, action, unseen) + rng() * NOISE
    if (value > bestScore) {
      best = action
      bestScore = value
    }
  }
  return best
}

export const mediumBot: Bot = {
  choose,
  soplar: reflexSoplar(REFLEXES.medium),
  claimRealTable: () => true,
}
