import { easyBot } from './easy'
import { hardBot } from './hard'
import { mediumBot } from './medium'
import type { Bot, Level } from './types'

export { createRng, easyBot, randomBot } from './easy'
export { createHardBot, hardBot, sampleState } from './hard'
export { cardWorth, mediumBot, scorePlay, sweepChance, unseenCards } from './medium'
export { MISS_RATES, missedCapture } from './misses'
export { REFLEXES, SOPLADA_WINDOW_MS, raceSoplada, turnOnly } from './soplada'
export type { SopladaEntry } from './soplada'
export type { Bot, Level, Rng, SopladaClaim } from './types'

export const BOTS: Record<Level, Bot> = {
  easy: easyBot,
  medium: mediumBot,
  hard: hardBot,
}
