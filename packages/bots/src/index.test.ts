import { describe, expect, it } from 'vitest'
import { applyAction, createMatch, sameAction, startNextRound, turnActions, viewFor } from '@escoba/engine'
import type { PlayerCount } from '@escoba/engine'
import { BOTS, createRng } from './index'
import type { Level } from './index'

describe('createRng', () => {
  it('repeats the same sequence for the same seed', () => {
    const first = createRng(7)
    const second = createRng(7)
    const a = [first(), first(), first()]
    const b = [second(), second(), second()]
    expect(a).toEqual(b)
    expect(a.every((value) => value >= 0 && value < 1)).toBe(true)
  })
})

describe('BOTS', () => {
  it.each<[Level, PlayerCount]>([
    ['easy', 2],
    ['medium', 3],
    ['medium', 4],
    ['hard', 2],
  ])('%s plays a whole match with %i players using only legal moves', (level, players) => {
    const rng = createRng(3)
    let state = createMatch({ players }, 21)
    while (state.status !== 'matchOver') {
      if (state.status === 'roundOver') {
        state = startNextRound(state)
        continue
      }
      const seat = state.round.turn
      const legal = turnActions(state, seat)
      const action = BOTS[level].choose(viewFor(state, seat), legal, rng)
      expect(legal.some((item) => sameAction(item, action))).toBe(true)
      state = applyAction(state, action)
    }
    expect(state.status).toBe('matchOver')
  }, 120000)
})
