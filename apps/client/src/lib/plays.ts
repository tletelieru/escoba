import { cardValue, sameCard } from '@escoba/engine'
import type { Action, Card, Move } from '@escoba/engine'

export type PlayAction = Extract<Action, { type: 'play' }>

export function playsFor(legal: Action[], card: Card): PlayAction[] {
  return legal.filter(
    (action): action is PlayAction => action.type === 'play' && sameCard(action.card, card),
  )
}

export function sumLine(cards: Card[]): string {
  const values = cards.map(cardValue)
  return `${values.join(' + ')} = ${values.reduce((sum, value) => sum + value, 0)}`
}

export type Capture = Extract<
  Move,
  { type: 'play' | 'realHand' | 'realTable' | 'leftover' | 'soplar' }
>

export function isCapture(move: Move): move is Capture {
  if (move.type === 'play') return move.captured.length > 0
  return move.type !== 'deal'
}
