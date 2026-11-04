import { parseArgs } from 'node:util'
import { createHardBot, createRng, easyBot, mediumBot, raceSoplada, randomBot } from '@escoba/bots'
import type { Bot } from '@escoba/bots'
import {
  applyAction,
  createMatch,
  matchWinners,
  realTableActions,
  score,
  sideOf,
  sopladaActions,
  startNextRound,
  turnActions,
  viewFor,
} from '@escoba/engine'
import { MATCH_POINTS } from '@escoba/engine'
import type { MatchState, PlayerCount } from '@escoba/engine'

const { values } = parseArgs({
  options: {
    matches: { type: 'string', default: '200' },
    players: { type: 'string', default: '2' },
    seed: { type: 'string', default: '1' },
    hero: { type: 'string', default: 'medium' },
    field: { type: 'string', default: 'easy' },
    iterations: { type: 'string', default: '24' },
  },
})

const CATALOG: Record<string, Bot> = {
  random: randomBot,
  easy: easyBot,
  medium: mediumBot,
  hard: createHardBot({ iterations: Number(values.iterations) }),
}

const matches = Number(values.matches)
const players = Number(values.players) as PlayerCount
const firstSeed = Number(values.seed)
const hero = CATALOG[values.hero]
const field = CATALOG[values.field]

const validPlayers = players === 2 || players === 3 || players === 4
if (!Number.isInteger(matches) || matches < 1 || !validPlayers || !hero || !field) {
  console.error(
    'Usage: pnpm sim --matches <n> --players <2|3|4> --hero <bot> --field <bot>',
  )
  process.exit(1)
}

function playMatch(seed: number, heroSide: number): MatchState {
  const rng = createRng(seed)
  let state = createMatch({ players }, seed)
  let decidedRound = -1
  while (state.status !== 'matchOver') {
    if (state.status === 'roundOver') {
      state = startNextRound(state)
      continue
    }
    const botAt = (seat: number) => (sideOf(seat, players) === heroSide ? hero : field)
    if (state.round.soplada) {
      const current = state
      const entries = Array.from({ length: players }, (_, seat) => ({
        seat,
        bot: botAt(seat),
        view: viewFor(current, seat),
        options: sopladaActions(current, seat),
      })).filter((entry) => entry.options.length > 0)
      const claim = raceSoplada(entries, rng)
      if (claim) {
        state = applyAction(state, claim.action)
        sopladas += 1
      }
    }
    const dealer = state.dealer
    if (decidedRound !== state.roundIndex && realTableActions(state, dealer).length > 0) {
      decidedRound = state.roundIndex
      if (botAt(dealer).claimRealTable(viewFor(state, dealer), rng)) {
        state = applyAction(state, { type: 'realTable', seat: dealer })
      }
    }
    const seat = state.round.turn
    const action = botAt(seat).choose(viewFor(state, seat), turnActions(state, seat), rng)
    state = applyAction(state, action)
  }
  return state
}

const sides = players === 4 ? 2 : players
let wins = 0
let sopladas = 0
let points = 0
let fieldPoints = 0
const started = performance.now()

for (let index = 0; index < matches; index++) {
  const heroSide = index % sides
  const state = playMatch(firstSeed + index, heroSide)
  if (matchWinners(state).includes(heroSide)) wins += 1
  score(state).totals.forEach((total, side) => {
    if (side === heroSide) points += total
    else fieldPoints += total
  })
}

const rate = wins / matches
const margin = 1.96 * Math.sqrt((rate * (1 - rate)) / matches)
const elapsed = performance.now() - started
const mode = players === 4 ? '4 players in pairs' : `${players} players`

console.log(`${values.hero} vs ${values.field}, ${mode}, to ${MATCH_POINTS}, ${matches} matches`)
console.log(`${(elapsed / matches).toFixed(2)} ms/match`)
console.log(
  `wins: ${(rate * 100).toFixed(1)}% ±${(margin * 100).toFixed(1)} (even: ${(100 / sides).toFixed(1)}%)`,
)
console.log(`avg points: ${(points / matches).toFixed(1)}`)
console.log(`sopladas per match: ${(sopladas / matches).toFixed(2)}`)
console.log(`field avg points: ${(fieldPoints / matches / (sides - 1)).toFixed(1)}`)
