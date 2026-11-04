import { describe, expect, it } from 'vitest'
import { legalActions, viewFor } from '@escoba/engine'
import { easyBot } from './easy'
import { card, stateWith } from './fixtures'

describe('easyBot', () => {
  it('takes the biggest capture', () => {
    const state = stateWith(2, {
      hands: [[card(7, 'copas'), card(12, 'bastos')], [card(1, 'oros')]],
      table: [card(10, 'oros'), card(3, 'copas'), card(5, 'espadas')],
    })
    const action = easyBot.choose(viewFor(state, 0), legalActions(state, 0), () => 0.9)
    expect(action).toMatchObject({ type: 'play', card: card(7, 'copas') })
    if (action.type === 'play') expect(action.capture).toHaveLength(2)
  })

  it('sometimes misses a real en mano', () => {
    const state = stateWith(2, {
      hands: [[card(7, 'copas'), card(5, 'bastos'), card(3, 'oros')], [card(1, 'oros')]],
      table: [card(1, 'espadas')],
    })
    const legal = legalActions(state, 0)
    expect(easyBot.choose(viewFor(state, 0), legal, () => 0.9).type).toBe('realHand')
    expect(easyBot.choose(viewFor(state, 0), legal, () => 0.1).type).toBe('play')
  })

  it('sometimes misses a real en mesa when it deals', () => {
    const state = stateWith(2, {
      hands: [[card(2, 'copas')], [card(1, 'oros')]],
      table: [card(1, 'espadas'), card(2, 'oros'), card(5, 'copas'), card(7, 'bastos')],
      realTableOpen: true,
    })
    expect(easyBot.claimRealTable(viewFor(state, 1), () => 0.9)).toBe(true)
    expect(easyBot.claimRealTable(viewFor(state, 1), () => 0.1)).toBe(false)
  })
})
