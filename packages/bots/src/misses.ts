import { captureOptions } from '@escoba/engine'
import type { Action, PlayerView } from '@escoba/engine'
import type { Level, Rng } from './types'

export const MISS_RATES: Record<Level, number> = {
  easy: 0.3,
  medium: 0.12,
  hard: 0,
}

export function missedCapture(view: PlayerView, legal: Action[], rate: number, rng: Rng): Action | null {
  const blind = legal.filter(
    (action) =>
      action.type === 'play' &&
      action.capture.length === 0 &&
      captureOptions(action.card, view.table).length > 0,
  )
  if (blind.length === 0 || rng() >= rate) return null
  return blind[Math.floor(rng() * blind.length)]
}
