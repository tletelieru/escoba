import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { DECK_SIZE, TARGET_SUM, cardId, cardValue, createDeck, sumValues } from './cards'
import type { Card, PlayerCount, Rank, Suit } from './cards'
import { captureOptions } from './captures'
import {
  MATCH_POINTS,
  applyAction,
  createMatch,
  hasRealHand,
  hasRealTable,
  legalActions,
  matchWinners,
  realTableActions,
  sopladaActions,
  turnActions,
  score,
  startNextRound,
} from './match'
import type { Action, MatchState, RoundState } from './match'
import { nextRandom } from './rng'
import { POINTS, emptyPile, primera, scoreTallies, sideCount, tallyPiles } from './scoring'
import { viewFor } from './view'

const seeds = fc.integer({ min: 0, max: 2 ** 31 - 1 })
const playerCounts = fc.constantFrom<PlayerCount>(2, 3, 4)

const card = (rank: Rank, suit: Suit): Card => ({ rank, suit })

function step(state: MatchState, rng: number): { state: MatchState; rng: number } {
  const roll = nextRandom(rng)
  const blowers = Array.from({ length: state.players }, (_, seat) => [
    ...sopladaActions(state, seat),
    ...realTableActions(state, seat),
  ]).flat()
  if (blowers.length > 0 && roll.value < 0.5) {
    const pick = nextRandom(roll.rng)
    const action = blowers[Math.floor(pick.value * blowers.length)]
    return { state: applyAction(state, action), rng: pick.rng }
  }
  const legal = turnActions(state, state.round.turn)
  const random = nextRandom(roll.rng)
  const action = legal[Math.floor(random.value * legal.length)]
  return { state: applyAction(state, action), rng: random.rng }
}

function playRound(start: MatchState, seed: number, visit?: (state: MatchState) => void) {
  let state = start
  let rng = seed
  while (state.status === 'playing') {
    visit?.(state)
    ;({ state, rng } = step(state, rng))
  }
  return { state, rng }
}

function playMatch(players: PlayerCount, seed: number, visit?: (state: MatchState) => void) {
  let state = createMatch({ players }, seed)
  let rng = seed
  const ends: MatchState[] = []
  for (let guard = 0; guard < 100; guard++) {
    ;({ state, rng } = playRound(state, rng, visit))
    ends.push(state)
    if (state.status === 'matchOver') return { state, ends }
    state = startNextRound(state)
  }
  throw new Error('Match did not end')
}

function cardsInRound(round: RoundState): Card[] {
  return [
    ...round.deck,
    ...round.hands.flat(),
    ...round.table,
    ...round.piles.flatMap((pile) => pile.cards),
  ]
}

function roundState(players: PlayerCount, round: Partial<RoundState>): MatchState {
  return {
    players,
    rng: 1,
    dealer: 0,
    roundIndex: 0,
    round: {
      deck: [],
      hands: Array.from({ length: players }, () => []),
      table: [],
      piles: Array.from({ length: players }, emptyPile),
      turn: 1 % players,
      realTableOpen: false,
      deal: 1,
      fresh: Array.from({ length: players }, () => true),
      lastCapturer: null,
      soplada: null,
      moves: [],
      ...round,
    },
    results: [],
    status: 'playing',
  }
}

describe('match properties', () => {
  it('only allows captures that add up to 15', () => {
    fc.assert(
      fc.property(playerCounts, seeds, (players, seed) => {
        playMatch(players, seed, (state) => {
          for (const action of legalActions(state, state.round.turn)) {
            if (action.type !== 'play') continue
            if (action.capture.length > 0) {
              expect(cardValue(action.card) + sumValues(action.capture)).toBe(TARGET_SUM)
            }
          }
        })
      }),
      { numRuns: 100 },
    )
  })

  it('never loses or duplicates a card', () => {
    fc.assert(
      fc.property(playerCounts, seeds, (players, seed) => {
        playMatch(players, seed, (state) => {
          const ids = cardsInRound(state.round).map(cardId)
          expect(ids).toHaveLength(DECK_SIZE)
          expect(new Set(ids).size).toBe(DECK_SIZE)
        })
      }),
      { numRuns: 100 },
    )
  })

  it('gives every round points that match the table', () => {
    fc.assert(
      fc.property(playerCounts, seeds, (players, seed) => {
        const { state, ends } = playMatch(players, seed)
        ends.forEach((end, index) => {
          const { round } = end
          const result = end.results[index]
          expect(round.table).toHaveLength(0)
          expect(round.piles.flatMap((pile) => pile.cards)).toHaveLength(DECK_SIZE)
          const sum = (key: keyof (typeof result.breakdown)[number]) =>
            result.breakdown.reduce((total, item) => total + item[key], 0)
          const count = (type: string) => round.moves.filter((move) => move.type === type).length
          const escobas = round.moves.filter((move) => move.type === 'play' && move.escoba).length
          expect(sum('escobas')).toBe(escobas * POINTS.escoba)
          expect(sum('realHand')).toBe(count('realHand') * POINTS.realHand)
          expect(sum('realTable')).toBe(count('realTable') * POINTS.realTable)
          expect(sum('velo')).toBe(POINTS.velo)
          expect(sum('cards')).toBeLessThanOrEqual(POINTS.cards)
          expect(sum('oros')).toBeLessThanOrEqual(POINTS.oros)
          expect([0, POINTS.primera, POINTS.primeraReal]).toContain(sum('primera'))
          result.points.forEach((points, side) => {
            const item = result.breakdown[side]
            const expected =
              item.escobas + item.cards + item.oros + item.velo + item.primera + item.realHand + item.realTable
            expect(points).toBe(expected)
          })
          expect(result.points).toHaveLength(sideCount(players))
        })
        const { totals } = score(state)
        expect(Math.max(...totals)).toBeGreaterThanOrEqual(MATCH_POINTS)
        expect(matchWinners(state)).toHaveLength(1)
      }),
      { numRuns: 100 },
    )
  })

  it('detects reales exactly when the cards add up to 15', () => {
    fc.assert(
      fc.property(playerCounts, seeds, (players, seed) => {
        playMatch(players, seed, (state) => {
          const { round } = state
          const seat = round.turn
          const legal = legalActions(state, seat)
          const realHand = legal.some((action) => action.type === 'realHand')
          const realTable = legalActions(state, state.dealer).some((action) => action.type === 'realTable')
          const handReal =
            round.fresh[seat] &&
            round.hands[seat].length === 3 &&
            sumValues(round.hands[seat]) === TARGET_SUM
          expect(realHand).toBe(handReal)
          expect(realTable).toBe(round.realTableOpen && round.table.length === 4 && sumValues(round.table) === TARGET_SUM)
          for (let other = 0; other < players; other++) {
            if (other === state.dealer) continue
            expect(legalActions(state, other).some((action) => action.type === 'realTable')).toBe(false)
          }
        })
      }),
      { numRuns: 100 },
    )
  })

  it('never shows hidden hands or the deck to a seat', () => {
    fc.assert(
      fc.property(playerCounts, seeds, (players, seed) => {
        const state = createMatch({ players }, seed)
        const view = viewFor(state, 0)
        expect(view.hand).toEqual(state.round.hands[0])
        expect(JSON.stringify(view)).not.toContain('"deck"')
        for (let seat = 1; seat < players; seat++) {
          for (const held of state.round.hands[seat]) {
            expect(view.table.concat(view.hand).some((item) => cardId(item) === cardId(held))).toBe(false)
          }
        }
      }),
    )
  })
})

describe('soplada', () => {
  it('opens only after a drop, never for the dropper, and always for a 15 with the dropped card', () => {
    fc.assert(
      fc.property(playerCounts, seeds, (players, seed) => {
        playMatch(players, seed, (state) => {
          const { soplada, table, moves } = state.round
          const last = moves.filter((move) => move.type !== 'deal').at(-1)
          const dropped = last?.type === 'play' && last.captured.length === 0
          expect(soplada !== null).toBe(dropped)
          for (let seat = 0; seat < players; seat++) {
            const options = sopladaActions(state, seat)
            if (!soplada || soplada.seat === seat) {
              expect(options).toHaveLength(0)
              continue
            }
            for (const option of options) {
              if (option.type !== 'soplar') throw new Error('Expected a soplada')
              expect(sumValues(option.cards)).toBe(TARGET_SUM)
              expect(option.cards.some((item) => cardId(item) === cardId(soplada.card))).toBe(true)
              expect(option.cards.every((item) => table.some((held) => cardId(held) === cardId(item)))).toBe(true)
            }
          }
        })
      }),
      { numRuns: 100 },
    )
  })

  it('lets another player take a missed 15 without an escoba, and closes the window', () => {
    const state = roundState(3, {
      hands: [[card(1, 'copas')], [card(5, 'oros'), card(1, 'oros')], [card(2, 'bastos')]],
      table: [card(12, 'espadas')],
    })
    const dropped = applyAction(state, { type: 'play', seat: 1, card: card(5, 'oros'), capture: [] })
    expect(dropped.round.soplada).toEqual({ seat: 1, card: card(5, 'oros') })
    expect(sopladaActions(dropped, 1)).toHaveLength(0)
    expect(sopladaActions(dropped, 0)).toHaveLength(1)
    const blown = applyAction(dropped, { type: 'soplar', seat: 0, cards: [card(5, 'oros'), card(12, 'espadas')] })
    expect(blown.round.table).toHaveLength(0)
    expect(blown.round.piles[0].cards).toHaveLength(2)
    expect(blown.round.piles[0].escobas).toHaveLength(0)
    expect(blown.round.soplada).toBeNull()
    expect(blown.round.turn).toBe(2)
    expect(blown.round.lastCapturer).toBe(0)
  })

  it('closes the window when the next player acts', () => {
    const state = roundState(2, {
      hands: [[card(1, 'copas'), card(2, 'copas')], [card(5, 'oros'), card(1, 'oros')]],
      table: [card(12, 'espadas')],
    })
    const dropped = applyAction(state, { type: 'play', seat: 1, card: card(5, 'oros'), capture: [] })
    const next = applyAction(dropped, { type: 'play', seat: 0, card: card(1, 'copas'), capture: [] })
    expect(next.round.soplada).toEqual({ seat: 0, card: card(1, 'copas') })
    expect(() =>
      applyAction(next, { type: 'soplar', seat: 0, cards: [card(5, 'oros'), card(12, 'espadas')] }),
    ).toThrow()
  })
})

describe('deal', () => {
  it.each<[PlayerCount, number]>([
    [2, 6],
    [3, 4],
    [4, 3],
  ])('deals 3 cards each and 4 to the table with %i players, %i deals per round', (players, deals) => {
    const state = createMatch({ players }, 7)
    expect(state.round.hands.every((hand) => hand.length === 3)).toBe(true)
    expect(state.round.table).toHaveLength(4)
    expect(state.round.realTableOpen).toBe(true)
    expect(state.round.turn).toBe((state.dealer + 1) % players)
    const { state: end } = playRound(state, 3)
    expect(end.round.moves.filter((move) => move.type === 'deal')).toHaveLength(deals)
  })

  it('rotates the dealer every round', () => {
    const { state } = playRound(createMatch({ players: 3 }, 11), 5)
    expect(startNextRound(state).dealer).toBe((state.dealer + 1) % 3)
  })

})

describe('captures', () => {
  it('lists every combination that makes 15', () => {
    const table = [card(5, 'oros'), card(3, 'copas'), card(2, 'bastos'), card(10, 'espadas')]
    const options = captureOptions(card(7, 'oros'), table).map((option) => option.map(cardId).sort())
    expect(options).toEqual(
      expect.arrayContaining([
        ['10-espadas'],
        ['3-copas', '5-oros'],
      ]),
    )
    expect(options).toHaveLength(2)
  })

  it('lets the player choose the combination', () => {
    const state = roundState(2, {
      hands: [[card(1, 'copas')], [card(7, 'oros'), card(2, 'copas')]],
      table: [card(5, 'oros'), card(3, 'copas'), card(10, 'espadas'), card(2, 'bastos')],
    })
    const choices = legalActions(state, 1).filter(
      (action) => action.type === 'play' && action.card.rank === 7 && action.capture.length > 0,
    )
    expect(choices).toHaveLength(2)
    const next = applyAction(state, {
      type: 'play',
      seat: 1,
      card: card(7, 'oros'),
      capture: [card(10, 'espadas')],
    })
    expect(next.round.table.map(cardId).sort()).toEqual(['2-bastos', '3-copas', '5-oros'])
    expect(next.round.piles[1].cards).toHaveLength(2)
  })

  it('lets a card be dropped on the table even when it could capture', () => {
    const state = roundState(2, {
      hands: [[card(1, 'copas')], [card(5, 'oros'), card(1, 'oros')]],
      table: [card(12, 'espadas')],
    })
    const drop: Action = { type: 'play', seat: 1, card: card(5, 'oros'), capture: [] }
    const next = applyAction(state, drop)
    expect(next.round.table.map(cardId)).toEqual(['12-espadas', '5-oros'])
    expect(next.round.piles[1].cards).toHaveLength(0)
  })

  it('rejects a capture that does not add up to 15', () => {
    const state = roundState(2, {
      hands: [[card(1, 'copas')], [card(5, 'oros'), card(1, 'oros')]],
      table: [card(12, 'espadas'), card(3, 'copas')],
    })
    const wrong: Action = { type: 'play', seat: 1, card: card(5, 'oros'), capture: [card(3, 'copas')] }
    expect(() => applyAction(state, wrong)).toThrow()
  })

  it('marks an escoba and keeps its card face up', () => {
    const state = roundState(2, {
      hands: [[card(1, 'copas')], [card(5, 'oros'), card(1, 'oros')]],
      table: [card(12, 'espadas')],
    })
    const next = applyAction(state, {
      type: 'play',
      seat: 1,
      card: card(5, 'oros'),
      capture: [card(12, 'espadas')],
    })
    expect(next.round.piles[1].escobas).toEqual([card(5, 'oros')])
    expect(next.round.moves.at(-1)).toMatchObject({ type: 'play', escoba: true })
  })

  it('gives the leftover table cards to the last player who captured', () => {
    const state = roundState(2, {
      hands: [[card(1, 'copas')], []],
      table: [card(4, 'oros')],
      turn: 0,
      lastCapturer: 1,
    })
    const next = applyAction(state, { type: 'play', seat: 0, card: card(1, 'copas'), capture: [] })
    expect(next.status).toBe('roundOver')
    expect(next.round.piles[1].cards.map(cardId).sort()).toEqual(['1-copas', '4-oros'])
    expect(next.round.moves.at(-1)).toMatchObject({ type: 'leftover', seat: 1 })
  })
})

describe('reales', () => {
  it('lays a real en mano face up and skips the seat for that deal', () => {
    const state = roundState(3, {
      hands: [[card(3, 'copas')], [card(7, 'oros'), card(5, 'bastos'), card(3, 'oros')], [card(1, 'oros')]],
      table: [card(2, 'espadas')],
    })
    expect(hasRealHand(state.round.hands[1])).toBe(true)
    const next = applyAction(state, { type: 'realHand', seat: 1 })
    expect(next.round.hands[1]).toHaveLength(0)
    expect(next.round.piles[1].realHand).toHaveLength(1)
    expect(next.round.turn).toBe(2)
    expect(next.round.piles[1].escobas).toHaveLength(0)
  })

  it('only allows a real en mano on the first turn of the deal', () => {
    const hand = [card(7, 'oros'), card(5, 'bastos'), card(3, 'oros')]
    const state = roundState(2, {
      hands: [[card(1, 'copas')], hand],
      fresh: [true, false],
    })
    expect(legalActions(state, 1).some((action) => action.type === 'realHand')).toBe(false)
    expect(viewFor(state, 1).canCallReal).toBe(false)
  })

  it('starts every hand with the player after the dealer', () => {
    for (let seed = 0; seed < 20; seed++) {
      const state = createMatch({ players: 3 }, seed)
      expect(state.round.turn).toBe((state.dealer + 1) % 3)
    }
  })

  it('lets the dealer take a real en mesa during the first turn, out of turn', () => {
    const table = [card(1, 'oros'), card(2, 'copas'), card(5, 'bastos'), card(7, 'espadas')]
    expect(hasRealTable(table)).toBe(true)
    const state = roundState(2, {
      hands: [[card(1, 'copas'), card(2, 'oros'), card(3, 'oros')], [card(4, 'copas'), card(5, 'oros'), card(6, 'oros')]],
      table,
      realTableOpen: true,
      turn: 1,
    })
    expect(legalActions(state, 0).map((action) => action.type)).toEqual(['realTable'])
    expect(legalActions(state, 1).some((action) => action.type === 'realTable')).toBe(false)
    const next = applyAction(state, { type: 'realTable', seat: 0 })
    expect(next.round.table).toHaveLength(0)
    expect(next.round.piles[0].realTable).toHaveLength(1)
    expect(next.round.hands[0]).toHaveLength(3)
    expect(next.round.turn).toBe(1)
    expect(next.round.realTableOpen).toBe(false)
  })

  it('closes the real en mesa once the first card is played', () => {
    const table = [card(1, 'oros'), card(2, 'copas'), card(5, 'bastos'), card(7, 'espadas')]
    const state = roundState(2, {
      hands: [[card(1, 'copas'), card(2, 'oros')], [card(12, 'copas'), card(5, 'oros')]],
      table,
      realTableOpen: true,
      turn: 1,
    })
    const next = applyAction(state, { type: 'play', seat: 1, card: card(12, 'copas'), capture: [] })
    expect(next.round.realTableOpen).toBe(false)
    expect(legalActions(next, 0).some((action) => action.type === 'realTable')).toBe(false)
  })

  it('never offers a real en mesa when the table does not add up to 15', () => {
    const state = roundState(2, {
      hands: [[card(1, 'copas')], [card(4, 'copas')]],
      table: [card(1, 'oros'), card(2, 'copas'), card(5, 'bastos'), card(6, 'espadas')],
      realTableOpen: true,
      turn: 1,
    })
    expect(legalActions(state, 0)).toEqual([])
  })
})

describe('scoring', () => {
  const pile = (cards: Card[], escobas = 0) => ({
    ...emptyPile(),
    cards,
    escobas: cards.slice(0, escobas),
  })

  it('computes the primera only with all four suits', () => {
    expect(primera([card(7, 'oros'), card(6, 'copas'), card(1, 'espadas'), card(12, 'bastos')])).toBe(65)
    expect(primera([card(7, 'oros'), card(6, 'copas'), card(1, 'espadas')])).toBeNull()
  })

  it('splits the points and gives ties to nobody', () => {
    const deck = createDeck()
    const first = deck.filter((_, index) => index % 2 === 0)
    const second = deck.filter((_, index) => index % 2 === 1)
    const result = scoreTallies(tallyPiles([pile(first, 2), pile(second)], 2))
    expect(result.breakdown[0].cards).toBe(0)
    expect(result.breakdown[1].cards).toBe(0)
    expect(result.breakdown[0].oros + result.breakdown[1].oros).toBe(0)
    expect(result.breakdown[0].escobas).toBe(2)
  })

  it('gives 2 points for the primera real', () => {
    const sevens = createDeck().filter((item) => item.rank === 7)
    const rest = createDeck().filter((item) => item.rank !== 7)
    const result = scoreTallies(tallyPiles([pile(sevens), pile(rest)], 2))
    expect(result.breakdown[0].primera).toBe(POINTS.primeraReal)
    expect(result.breakdown[1].primera).toBe(0)
    expect(result.breakdown[0].velo).toBe(1)
    expect(result.breakdown[1].cards).toBe(1)
  })

  it('scores partners together with 4 players', () => {
    const deck = createDeck()
    const piles = [pile(deck.slice(0, 15)), pile(deck.slice(15, 20)), pile(deck.slice(20, 30)), pile(deck.slice(30))]
    const result = scoreTallies(tallyPiles(piles, 4))
    expect(result.points).toHaveLength(2)
    expect(result.tallies[0].cards).toBe(25)
    expect(result.breakdown[0].cards).toBe(1)
    expect(result.breakdown[0].oros).toBe(1)
  })
})
