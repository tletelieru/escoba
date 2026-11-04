import { describe, expect, it } from 'vitest'
import { applyAction, sopladaActions, turnActions, viewFor } from '@escoba/engine'
import { createRng, easyBot } from './easy'
import { createHardBot } from './hard'
import { mediumBot } from './medium'
import { MISS_RATES } from './misses'
import { REFLEXES, SOPLADA_WINDOW_MS, raceSoplada } from './soplada'
import { card, stateWith } from './fixtures'

function droppedState() {
  const state = stateWith(3, {
    turn: 1,
    hands: [[card(1, 'copas')], [card(5, 'oros'), card(1, 'oros')], [card(2, 'bastos')]],
    table: [card(12, 'espadas')],
  })
  return applyAction(state, { type: 'play', seat: 1, card: card(5, 'oros'), capture: [] })
}

describe('soplada', () => {
  it('reacts inside the window, faster on harder levels', () => {
    for (const level of ['easy', 'medium', 'hard'] as const) {
      expect(REFLEXES[level].max).toBeLessThan(SOPLADA_WINDOW_MS)
    }
    expect(REFLEXES.hard.max).toBeLessThan(REFLEXES.easy.min)
    expect(REFLEXES.hard.notice).toBeGreaterThan(REFLEXES.medium.notice)
    expect(REFLEXES.medium.notice).toBeGreaterThan(REFLEXES.easy.notice)
  })

  it('claims a missed 15 when it notices it', () => {
    const state = droppedState()
    const claim = mediumBot.soplar(viewFor(state, 0), sopladaActions(state, 0), () => 0)
    expect(claim?.action).toMatchObject({ type: 'soplar', seat: 0 })
    expect(easyBot.soplar(viewFor(state, 0), sopladaActions(state, 0), () => 0.99)).toBeNull()
  })

  it('lets the fastest bot win the race', () => {
    const state = droppedState()
    const hard = createHardBot({ iterations: 1 })
    const claim = raceSoplada(
      [
        { seat: 0, bot: easyBot, view: viewFor(state, 0), options: sopladaActions(state, 0) },
        { seat: 2, bot: hard, view: viewFor(state, 2), options: sopladaActions(state, 2) },
      ],
      () => 0,
    )
    expect(claim?.action).toMatchObject({ seat: 2 })
  })

  it('never drops a card that leaves a 15 on hard when it has another move', () => {
    const state = stateWith(2, {
      hands: [[card(5, 'oros'), card(1, 'copas')], [card(1, 'oros')]],
      table: [card(12, 'espadas'), card(3, 'copas')],
    })
    const bot = createHardBot({ iterations: 4 })
    const legal = sopladaActions(state, 0).concat(
      [{ type: 'play', seat: 0, card: card(5, 'oros'), capture: [] }],
      [{ type: 'play', seat: 0, card: card(1, 'copas'), capture: [] }],
    )
    const action = bot.choose(viewFor(state, 0), legal, () => 0.5)
    expect(action).toMatchObject({ card: card(1, 'copas') })
  })
})

describe('missed captures', () => {
  it('misses about as often as each level says', () => {
    const state = stateWith(2, {
      hands: [[card(5, 'oros'), card(1, 'copas'), card(2, 'copas')], [card(1, 'oros')]],
      table: [card(12, 'espadas')],
    })
    const view = viewFor(state, 0)
    const legal = turnActions(state, 0)
    for (const [level, bot] of [['easy', easyBot], ['medium', mediumBot]] as const) {
      const rng = createRng(11)
      let misses = 0
      const runs = 2000
      for (let run = 0; run < runs; run++) {
        const action = bot.choose(view, legal, rng)
        if (action.type === 'play' && action.capture.length === 0 && action.card.rank === 5) misses += 1
      }
      expect(Math.abs(misses / runs - MISS_RATES[level])).toBeLessThan(0.04)
    }
    expect(MISS_RATES.hard).toBe(0)
  })

  it('lets another bot soplar a missed capture', () => {
    const state = stateWith(3, {
      hands: [[card(5, 'oros'), card(1, 'copas')], [card(4, 'bastos')], [card(2, 'bastos')]],
      table: [card(12, 'espadas')],
    })
    const rng = createRng(5)
    let blown = 0
    for (let run = 0; run < 400; run++) {
      const action = easyBot.choose(viewFor(state, 0), turnActions(state, 0), rng)
      if (action.type !== 'play' || action.capture.length > 0 || action.card.rank !== 5) continue
      const dropped = applyAction(state, action)
      const claim = raceSoplada(
        [1, 2].map((seat) => ({
          seat,
          bot: createHardBot({ iterations: 1 }),
          view: viewFor(dropped, seat),
          options: sopladaActions(dropped, seat),
        })),
        rng,
      )
      if (!claim) continue
      const after = applyAction(dropped, claim.action)
      expect(after.round.table).toHaveLength(0)
      blown += 1
    }
    expect(blown).toBeGreaterThan(50)
  })
})
