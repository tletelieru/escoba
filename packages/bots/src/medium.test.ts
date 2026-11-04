import { describe, expect, it } from 'vitest'
import { legalActions, viewFor } from '@escoba/engine'
import { mediumBot, sweepChance, unseenCards } from './medium'
import { card, stateWith } from './fixtures'

describe('mediumBot', () => {
  it('always calls a real', () => {
    const state = stateWith(2, {
      hands: [[card(7, 'copas'), card(5, 'bastos'), card(3, 'oros')], [card(1, 'oros')]],
      table: [card(1, 'espadas')],
    })
    expect(mediumBot.choose(viewFor(state, 0), legalActions(state, 0), () => 0.5).type).toBe('realHand')
  })

  it('sweeps the table when it can', () => {
    const state = stateWith(2, {
      hands: [[card(4, 'copas'), card(7, 'bastos')], [card(1, 'oros'), card(2, 'oros')]],
      table: [card(6, 'espadas'), card(2, 'copas')],
    })
    const action = mediumBot.choose(viewFor(state, 0), legalActions(state, 0), () => 0.5)
    expect(action).toMatchObject({ type: 'play', card: card(7, 'bastos') })
  })

  it('takes the 7 de velo over a plain capture', () => {
    const state = stateWith(2, {
      hands: [[card(1, 'copas'), card(5, 'bastos')], [card(1, 'oros'), card(2, 'oros')]],
      table: [card(7, 'oros'), card(12, 'espadas'), card(3, 'copas'), card(2, 'bastos'), card(4, 'bastos')],
    })
    const action = mediumBot.choose(viewFor(state, 0), legalActions(state, 0), () => 0.5)
    expect(action.type).toBe('play')
    if (action.type === 'play') {
      expect([action.card, ...action.capture]).toContainEqual(card(7, 'oros'))
    }
  })

  it('avoids leaving a table the next rival can sweep', () => {
    const state = stateWith(2, {
      hands: [[card(1, 'copas'), card(12, 'copas')], [card(1, 'oros'), card(2, 'oros'), card(3, 'oros')]],
      table: [card(10, 'espadas')],
    })
    const action = mediumBot.choose(viewFor(state, 0), legalActions(state, 0), () => 0.5)
    expect(action).toMatchObject({ type: 'play', card: card(12, 'copas') })
  })

  it('counts the cards it has not seen', () => {
    const state = stateWith(2, {
      hands: [[card(1, 'copas')], [card(1, 'oros')]],
      table: [card(4, 'espadas')],
    })
    const unseen = unseenCards(viewFor(state, 0))
    expect(unseen).toHaveLength(38)
    expect(sweepChance([card(5, 'oros')], unseen, 3)).toBeGreaterThan(0)
    expect(sweepChance([card(12, 'oros'), card(12, 'copas')], unseen, 3)).toBe(0)
  })
})
