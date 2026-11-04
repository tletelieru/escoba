import type { Action, PlayerView } from '@escoba/engine'

export type Rng = () => number

export type Level = 'easy' | 'medium' | 'hard'

export interface SopladaClaim {
  action: Action
  delay: number
}

export interface Bot {
  choose(view: PlayerView, legal: Action[], rng: Rng): Action
  soplar(view: PlayerView, options: Action[], rng: Rng): SopladaClaim | null
  claimRealTable(view: PlayerView, rng: Rng): boolean
}
