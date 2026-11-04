import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Level } from '@escoba/bots'
import { applyAction, createMatch } from '@escoba/engine'
import type { Card, MatchState } from '@escoba/engine'
import App from '../App'
import { savedMatchKey } from '../lib/savedMatch'
import { drawDuration } from '../useDealerDraw'

function button(name: string) {
  return screen.queryByRole('button', { name }) as HTMLButtonElement | null
}

function wait(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

const DRAW_AND_DEAL = 4000

function waitDeal() {
  wait(DRAW_AND_DEAL)
  wait(DRAW_AND_DEAL)
}

function takeTurn() {
  const next = button('Next hand')
  if (next) return fireEvent.click(next)
  const hand = screen.getByRole('region', { name: 'Your hand' })
  const raised = hand.querySelector('[data-card][aria-pressed="true"]')
  if (raised) return fireEvent.click(raised)
  const card = hand.querySelector('[data-card][aria-disabled="false"]')
  if (card) return fireEvent.click(card)
  wait(800)
}

function handCards() {
  return [...screen.getByRole('region', { name: 'Your hand' }).querySelectorAll('[data-card]')]
    .map((card) => card.getAttribute('data-card'))
    .sort()
}

function saveMatch(change: (state: MatchState) => MatchState, level: Level = 'medium') {
  const state = change(createMatch({ players: 2 }, 5))
  localStorage.setItem(savedMatchKey, JSON.stringify({ state, seed: 5, level }))
}

const card = (rank: Card['rank'], suit: Card['suit']): Card => ({ rank, suit })

function playState(state: MatchState, table: Card[], hand: Card[]): MatchState {
  return {
    ...state,
    round: {
      ...state.round,
      realTableOpen: false,
      turn: 0,
      fresh: [false, true],
      table,
      hands: [hand, state.round.hands[1]],
    },
  }
}

function captureTable(level: Level) {
  saveMatch(
    (state) =>
      playState(
        state,
        [card(10, 'espadas'), card(5, 'copas'), card(3, 'bastos'), card(12, 'oros')],
        [card(7, 'oros'), card(1, 'copas'), card(2, 'bastos')],
      ),
    level,
  )
  render(<App />)
  wait(2600)
  fireEvent.click(screen.getByRole('button', { name: '7 of coins' }))
}

function playRaised() {
  const hand = screen.getByRole('region', { name: 'Your hand' })
  const raised = hand.querySelector('[data-card][aria-pressed="true"]')
  if (!raised) throw new Error('No raised card')
  fireEvent.click(raised)
}

function tableCard(name: string) {
  return within(screen.getByRole('region', { name: 'Table' })).getByRole('button', { name })
}

function actionBox() {
  return ['Real!', 'Soplada!'].map((name) => {
    const element = button(name)
    if (!element) throw new Error(`Missing ${name}`)
    return element
  })
}

describe('Table', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
    localStorage.setItem('preferred-lang', 'en')
    document.documentElement.className = ''
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it.each(['2 players', '3 players', '4 players in pairs'])(
    'draws the dealer, then deals 3 cards and 4 to the table with %s',
    (label) => {
      render(<App />)
      fireEvent.click(screen.getByRole('button', { name: label }))
      expect(screen.getByText('Who deals?')).toBeTruthy()
      expect(handCards()).toHaveLength(0)
      const empty = screen.getByRole('region', { name: 'Table' })
      expect(empty.querySelectorAll('[data-table-card]')).toHaveLength(0)
      expect(screen.getAllByText(/^0 cards/).length).toBeGreaterThan(0)
      const dealing = screen.getByRole('region', { name: 'Table' })
      for (let step = 0; step < 40 && dealing.querySelectorAll('[data-table-card]').length === 0; step++) {
        wait(100)
      }
      expect(dealing.querySelectorAll('.deal-table')).toHaveLength(4)
      expect(handCards()).toHaveLength(3)
      wait(2400)
      expect(dealing.querySelectorAll('.deal-table')).toHaveLength(0)
    },
  )

  it('lands the draw on the dealer chosen by the engine', () => {
    vi.spyOn(Date, 'now').mockReturnValue(12345)
    const dealer = createMatch({ players: 3 }, 12345).dealer
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: '3 players' }))
    wait(drawDuration(3, dealer) - 700)
    const name = ['You', 'Bot 1', 'Bot 2'][dealer]
    expect(screen.getByText(`Dealer: ${name}`)).toBeTruthy()
    vi.mocked(Date.now).mockRestore()
  })

  it('keeps every action button in place and disabled when it is not your turn', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: '2 players' }))
    const buttons = actionBox()
    expect(buttons.every((item) => item.disabled)).toBe(true)
    waitDeal()
    expect(actionBox()).toEqual(buttons)
  })

  it('asks before leaving a match', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: '2 players' }))
    fireEvent.click(screen.getByRole('button', { name: 'Exit' }))
    fireEvent.click(screen.getByRole('button', { name: 'Keep playing' }))
    expect(screen.getByRole('region', { name: 'Your hand' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Exit' }))
    fireEvent.click(screen.getByRole('button', { name: 'Yes, exit' }))
    expect(screen.getByText('Points per hand')).toBeTruthy()
    expect(localStorage.getItem('match-history')).toBeNull()
  })

  it('comes back to the match after a reload without drawing again', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: '3 players' }))
    waitDeal()
    for (let step = 0; step < 8; step++) takeTurn()
    const before = handCards()
    cleanup()
    render(<App />)
    expect(screen.queryByText('Who deals?')).toBeNull()
    expect(handCards()).toEqual(before)
    fireEvent.click(screen.getByRole('button', { name: 'Exit' }))
    fireEvent.click(screen.getByRole('button', { name: 'Yes, exit' }))
    expect(localStorage.getItem(savedMatchKey)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'History' }))
    expect(screen.getByText('Abandoned')).toBeTruthy()
  })

  it('enables the real button on the first turn without saying if there is a real', () => {
    saveMatch((state) => ({
      ...playState(state, state.round.table, [card(1, 'oros'), card(2, 'copas'), card(3, 'bastos')]),
      round: {
        ...playState(state, state.round.table, [card(1, 'oros'), card(2, 'copas'), card(3, 'bastos')]).round,
        fresh: [true, true],
      },
    }))
    render(<App />)
    wait(2600)
    fireEvent.click(screen.getByRole('button', { name: 'Real!' }))
    expect(screen.getByText('Your cards do not add up to 15.')).toBeTruthy()
    expect(handCards()).toHaveLength(3)
  })

  it('lays a real en mano face up in the pile', () => {
    saveMatch((state) => {
      const ready = playState(
        state,
        [card(1, 'espadas'), card(2, 'espadas'), card(3, 'espadas'), card(4, 'espadas')],
        [card(7, 'oros'), card(5, 'copas'), card(3, 'bastos')],
      )
      return { ...ready, round: { ...ready.round, fresh: [true, true] } }
    })
    render(<App />)
    wait(2600)
    fireEvent.click(screen.getByRole('button', { name: 'Real!' }))
    expect(handCards()).toHaveLength(0)
    expect(screen.getByLabelText('0 escobas, 1 real')).toBeTruthy()
  })

  it('keeps table cards picked first when a hand card is chosen and plays the capture', () => {
    saveMatch((state) =>
      playState(
        state,
        [card(10, 'espadas'), card(5, 'copas'), card(3, 'bastos'), card(12, 'oros')],
        [card(7, 'oros'), card(1, 'copas'), card(2, 'bastos')],
      ),
    )
    render(<App />)
    wait(2600)
    fireEvent.click(tableCard('5 of cups'))
    fireEvent.click(tableCard('3 of clubs'))
    fireEvent.click(screen.getByRole('button', { name: '7 of coins' }))
    expect(tableCard('5 of cups').getAttribute('aria-pressed')).toBe('true')
    playRaised()
    expect(handCards()).toHaveLength(2)
  })

  it('selects table cards and shows their sum without hints', () => {
    captureTable('medium')
    expect(screen.queryByText(/could/)).toBeNull()
    fireEvent.click(tableCard('5 of cups'))
    expect(tableCard('5 of cups').getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByText('7 + 5 = 12')).toBeTruthy()
    fireEvent.click(tableCard('5 of cups'))
    expect(tableCard('5 of cups').getAttribute('aria-pressed')).toBe('false')
  })

  it('flashes a wrong sum on medium without a message and keeps the selection', () => {
    captureTable('medium')
    fireEvent.click(tableCard('5 of cups'))
    playRaised()
    expect(tableCard('5 of cups').querySelector('.wrong-flash')).not.toBeNull()
    expect(screen.queryByText("That's not 15.")).toBeNull()
    expect(handCards()).toHaveLength(3)
    expect(tableCard('5 of cups').getAttribute('aria-pressed')).toBe('true')
  })

  it('says a wrong sum is not 15 on easy', () => {
    captureTable('easy')
    fireEvent.click(tableCard('5 of cups'))
    playRaised()
    expect(screen.getByText("That's not 15.")).toBeTruthy()
    expect(handCards()).toHaveLength(3)
  })

  it('drops the card on a wrong sum on hard', () => {
    captureTable('hard')
    fireEvent.click(tableCard('5 of cups'))
    playRaised()
    expect(handCards()).toHaveLength(2)
    expect(tableCard('7 of coins')).toBeTruthy()
    expect(tableCard('5 of cups').querySelector('.wrong-flash')).not.toBeNull()
  })

  it('takes a selection that adds up to 15 and lists it in my cards', () => {
    captureTable('medium')
    fireEvent.click(tableCard('10 of swords'))
    playRaised()
    expect(handCards()).toHaveLength(2)
    const table = screen.getByRole('region', { name: 'Table' })
    expect(table.querySelector('[data-table-card="espadas-10"]')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'My cards (2)' }))
    const panel = screen.getByRole('dialog', { name: 'My cards (2)' })
    expect(within(panel).getByText('Cards')).toBeTruthy()
  })

  it('drops a card without warning on medium even when it could take', () => {
    captureTable('medium')
    playRaised()
    expect(handCards()).toHaveLength(2)
    expect(tableCard('7 of coins')).toBeTruthy()
  })

  it('warns once on easy before dropping a card that could take', () => {
    captureTable('easy')
    playRaised()
    expect(screen.getByText('You could make 15.')).toBeTruthy()
    expect(handCards()).toHaveLength(3)
    playRaised()
    expect(handCards()).toHaveLength(2)
  })

  it('lets you soplar a 15 a bot left on the table', () => {
    saveMatch((state) => {
      const ready = {
        ...state,
        round: {
          ...state.round,
          realTableOpen: false,
          turn: 1,
          fresh: [false, false],
          table: [card(12, 'espadas'), card(1, 'oros')],
          hands: [[card(2, 'copas')], [card(5, 'oros'), card(4, 'bastos')]],
        },
      }
      return applyAction(ready, { type: 'play', seat: 1, card: card(5, 'oros'), capture: [] })
    }, 'easy')
    render(<App />)
    const soplada = screen.getByRole('button', { name: 'Soplada!' }) as HTMLButtonElement
    expect(soplada.disabled).toBe(true)
    fireEvent.click(tableCard('5 of coins'))
    fireEvent.click(tableCard('12 of swords'))
    expect(soplada.disabled).toBe(false)
    fireEvent.click(soplada)
    expect(screen.getByRole('button', { name: 'My cards (2)' })).toBeTruthy()
  })

  it('lets a bot soplar a 15 you left on the table', () => {
    saveMatch((state) => {
      const ready = playState(state, [card(12, 'espadas'), card(1, 'oros')], [
        card(5, 'oros'),
        card(2, 'copas'),
      ])
      return { ...ready, round: { ...ready.round, hands: [ready.round.hands[0], [card(4, 'bastos')]] } }
    }, 'hard')
    render(<App />)
    wait(2600)
    fireEvent.click(screen.getByRole('button', { name: '5 of coins' }))
    playRaised()
    wait(1000)
    expect(screen.getAllByText(/Bot 1: soplada!/).length).toBeGreaterThan(0)
  })

  it('shows info buttons and how-to lines by default only on easy', () => {
    captureTable('easy')
    expect(button('About Real!')).not.toBeNull()
    expect(button('About Soplada!')).not.toBeNull()
    expect(screen.getByText('Tap table cards to take, then your card again. Alone, it stays on the table.')).toBeTruthy()
    cleanup()
    captureTable('medium')
    expect(button('About Real!')).toBeNull()
    expect(screen.queryByText('Tap table cards to take, then your card again. Alone, it stays on the table.')).toBeNull()
  })

  it('opens the soplada info without taking the turn', () => {
    captureTable('easy')
    fireEvent.click(screen.getByRole('button', { name: 'About Soplada!' }))
    const dialog = screen.getByRole('dialog', { name: 'Soplada!' })
    expect(within(dialog).getByText(/fastest player takes them/)).toBeTruthy()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }))
    expect(handCards()).toHaveLength(3)
  })

  it('keeps the info choice from settings on every level', () => {
    captureTable('hard')
    expect(button('About Real!')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }))
    fireEvent.click(screen.getByRole('checkbox', { name: /Show info buttons/ }))
    expect(localStorage.getItem('info-buttons')).toBe('on')
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(button('About Real!')).not.toBeNull()
    cleanup()
    captureTable('easy')
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }))
    fireEvent.click(screen.getByRole('checkbox', { name: /Show info buttons/ }))
    expect(localStorage.getItem('info-buttons')).toBe('off')
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(button('About Real!')).toBeNull()
  })

  it('sums up the hand per player when it ends', () => {
    saveMatch((state) => {
      const ready = playState(state, [card(2, 'copas')], [card(3, 'oros')])
      return {
        ...ready,
        round: {
          ...ready.round,
          deck: [],
          hands: [[card(3, 'oros')], []],
          lastCapturer: 1,
          piles: [
            { cards: [], escobas: [], realHand: [], realTable: [] },
            { cards: [card(7, 'oros'), card(12, 'oros')], escobas: [card(7, 'oros')], realHand: [], realTable: [] },
          ],
        },
      }
    })
    render(<App />)
    wait(2600)
    fireEvent.click(screen.getByRole('button', { name: '3 of coins' }))
    playRaised()
    wait(1400)
    const dialog = screen.getByRole('dialog', { name: 'Hand 1 finished' })
    expect(within(dialog).getByText('No points this hand')).toBeTruthy()
    expect(within(dialog).getByText(/Escobas 1/)).toBeTruthy()
    expect(within(dialog).getByLabelText('7 de velo')).toBeTruthy()
    expect(within(dialog).getByRole('button', { name: 'Next hand' })).toBeTruthy()
  })

  it('lets you claim a real en mesa as dealer while the next player is first', () => {
    saveMatch((state) => ({
      ...state,
      dealer: 0,
      round: {
        ...state.round,
        turn: 1,
        realTableOpen: true,
        table: [card(1, 'oros'), card(2, 'copas'), card(5, 'bastos'), card(7, 'espadas')],
        hands: [[card(4, 'copas'), card(6, 'oros'), card(3, 'oros')], [card(4, 'bastos'), card(6, 'copas'), card(10, 'oros')]],
      },
    }))
    render(<App />)
    const real = screen.getByRole('button', { name: 'Real!' }) as HTMLButtonElement
    expect(real.disabled).toBe(false)
    fireEvent.click(real)
    expect(screen.getByLabelText('0 escobas, 1 real')).toBeTruthy()
    expect(screen.getByRole('region', { name: 'Table' }).querySelectorAll('[data-table-card]')).toHaveLength(0)
  })

  it('tells the dealer when the table does not add up to 15', () => {
    saveMatch((state) => ({
      ...state,
      dealer: 0,
      round: {
        ...state.round,
        turn: 1,
        realTableOpen: true,
        table: [card(1, 'oros'), card(2, 'copas'), card(5, 'bastos'), card(6, 'espadas')],
        hands: [[card(4, 'copas'), card(7, 'oros'), card(3, 'oros')], [card(4, 'bastos'), card(6, 'copas'), card(10, 'oros')]],
      },
    }))
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Real!' }))
    expect(screen.getByText('The table does not add up to 15.')).toBeTruthy()
  })

  it('starts each hand with the player after the dealer, with no extra step', () => {
    vi.spyOn(Date, 'now').mockReturnValue(4242)
    const fresh = createMatch({ players: 2 }, 4242)
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: '2 players' }))
    vi.mocked(Date.now).mockRestore()
    waitDeal()
    const hand = screen.getByRole('region', { name: 'Your hand' })
    const playable = hand.querySelector('[data-card][aria-disabled="false"]') !== null
    expect(playable).toBe((fresh.dealer + 1) % 2 === 0)
    expect(fresh.round.turn).toBe((fresh.dealer + 1) % 2)
  })

  it('moves the raised card to another one and clears it on empty space', () => {
    captureTable('medium')
    fireEvent.click(screen.getByRole('button', { name: '1 of cups' }))
    expect(screen.getByRole('button', { name: '1 of cups' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: '7 of coins' }).getAttribute('aria-pressed')).toBe('false')
    fireEvent.click(screen.getByRole('main'))
    expect(screen.getByRole('button', { name: '1 of cups' }).getAttribute('aria-pressed')).toBe('false')
    expect(handCards()).toHaveLength(3)
  })

  it('opens my cards with an empty pile', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: '4 players in pairs' }))
    fireEvent.click(screen.getByRole('button', { name: 'My cards (0)' }))
    expect(screen.getByText('Your pile is still empty this hand.')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByText('Your pile is still empty this hand.')).toBeNull()
  })

  it('shows the score of the hand in progress', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: '2 players' }))
    fireEvent.click(screen.getByRole('button', { name: 'Score' }))
    expect(screen.getByRole('dialog', { name: 'Score' })).toBeTruthy()
    expect(screen.getByText(/in progress/)).toBeTruthy()
  })

  it.each(['2 players', '3 players', '4 players in pairs'])(
    'plays a whole match against bots with %s',
    { timeout: 180000 },
    (label) => {
      render(<App />)
      fireEvent.click(screen.getByRole('button', { name: label }))
      let guard = 0
      while (!screen.queryByText('Match finished') && guard < 12000) {
        takeTurn()
        guard += 1
      }
      expect(screen.getByText('Match finished')).toBeTruthy()
      fireEvent.click(screen.getByRole('button', { name: 'Back to start' }))
      expect(screen.getByText('Points per hand')).toBeTruthy()
      fireEvent.click(screen.getByRole('button', { name: 'History' }))
      expect(screen.getByText(/^1 played/)).toBeTruthy()
    },
  )
})
