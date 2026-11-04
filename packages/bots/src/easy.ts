import { nextRandom } from '@escoba/engine'
import type { Action } from '@escoba/engine'
import { MISS_RATES, missedCapture } from './misses'
import { REFLEXES, reflexSoplar, turnOnly } from './soplada'
import type { Bot, Rng } from './types'

const MISSED_REAL_RATE = 0.4

export function createRng(seed: number): Rng {
  let state = seed
  return () => {
    const random = nextRandom(state)
    state = random.rng
    return random.value
  }
}

export const randomBot: Bot = {
  choose: (_view, legal, rng) => {
    const turn = turnOnly(legal)
    return turn[Math.floor(rng() * turn.length)]
  },
  soplar: () => null,
  claimRealTable: () => false,
}

function captureSize(action: Action): number {
  return action.type === 'play' ? action.capture.length : 0
}

export const easyBot: Bot = {
  soplar: reflexSoplar(REFLEXES.easy),
  claimRealTable: (_view, rng) => rng() >= MISSED_REAL_RATE,
  choose: (view, options, rng) => {
    const legal = turnOnly(options)
    const real = legal.find((action) => action.type === 'realHand')
    if (real && rng() >= MISSED_REAL_RATE) return real
    const missed = missedCapture(view, legal, MISS_RATES.easy, rng)
    if (missed) return missed
    const plays = legal.filter((action) => action.type === 'play')
    const biggest = Math.max(...plays.map(captureSize))
    const best = plays.filter((action) => captureSize(action) === biggest)
    return best[Math.floor(rng() * best.length)]
  },
}
