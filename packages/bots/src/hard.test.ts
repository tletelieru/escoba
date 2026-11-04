import { describe, expect, it } from 'vitest'
import { DECK_SIZE, cardId, createMatch, legalActions, viewFor } from '@escoba/engine'
import { createRng } from './easy'
import { createHardBot, sampleState } from './hard'
import { card, stateWith } from './fixtures'

describe('hardBot', () => {
  it('samples hidden hands without touching what it can see', () => {
    const state = createMatch({ players: 3 }, 9)
    const view = viewFor(state, 1)
    const sample = sampleState(view, createRng(4))
    expect(sample.round.hands[1]).toEqual(view.hand)
    expect(sample.round.table).toEqual(view.table)
    expect(sample.round.hands.map((hand) => hand.length)).toEqual(view.handCounts)
    const ids = [...sample.round.deck, ...sample.round.hands.flat(), ...sample.round.table].map(cardId)
    expect(new Set(ids).size).toBe(DECK_SIZE)
  })

  it('always takes a real en mesa when it deals', () => {
    const state = stateWith(2, {
      hands: [[card(2, 'copas')], [card(1, 'oros')]],
      table: [card(1, 'espadas'), card(2, 'bastos'), card(5, 'copas'), card(7, 'bastos')],
      realTableOpen: true,
    })
    const bot = createHardBot({ iterations: 4 })
    expect(bot.claimRealTable(viewFor(state, 1), createRng(1))).toBe(true)
  })

  it('sweeps the table when it can', () => {
    const state = stateWith(2, {
      hands: [[card(4, 'copas'), card(7, 'bastos')], [card(1, 'oros'), card(2, 'oros')]],
      table: [card(6, 'espadas'), card(2, 'copas')],
    })
    const bot = createHardBot({ iterations: 12 })
    const action = bot.choose(viewFor(state, 0), legalActions(state, 0), createRng(2))
    expect(action).toMatchObject({ type: 'play', card: card(7, 'bastos') })
  })
})
