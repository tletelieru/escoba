import type { Action, PlayerView, Seat } from '@escoba/engine'
import type { Bot, Level, Rng, SopladaClaim } from './types'

export const SOPLADA_WINDOW_MS = 2500

interface Reflex {
  notice: number
  min: number
  max: number
}

export const REFLEXES: Record<Level, Reflex> = {
  easy: { notice: 0.35, min: 1400, max: 2300 },
  medium: { notice: 0.7, min: 800, max: 1600 },
  hard: { notice: 0.97, min: 300, max: 900 },
}

function size(action: Action): number {
  return action.type === 'soplar' ? action.cards.length : 0
}

export function reflexSoplar({ notice, min, max }: Reflex) {
  return (_view: PlayerView, options: Action[], rng: Rng): SopladaClaim | null => {
    const blows = options.filter((action) => action.type === 'soplar')
    if (blows.length === 0 || rng() >= notice) return null
    const action = blows.reduce((best, item) => (size(item) > size(best) ? item : best))
    return { action, delay: min + rng() * (max - min) }
  }
}

export interface SopladaEntry {
  seat: Seat
  bot: Bot
  view: PlayerView
  options: Action[]
}

export function raceSoplada(entries: SopladaEntry[], rng: Rng): SopladaClaim | null {
  let first: SopladaClaim | null = null
  for (const { bot, view, options } of entries) {
    const claim = bot.soplar(view, options, rng)
    if (claim && (!first || claim.delay < first.delay)) first = claim
  }
  return first
}

export function turnOnly(legal: Action[]): Action[] {
  return legal.filter((action) => action.type !== 'soplar')
}
