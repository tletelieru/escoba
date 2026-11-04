import type { Card } from '@escoba/engine'
import { cardKey } from '../lib/cards'
import { BROOM } from '../lib/pixelArt'
import { PixelIcon } from './PixelIcon'
import { SpanishCard } from './SpanishCard'
import { SpanishSuitIcon } from './SpanishSuitIcon'

export type FigureId =
  | 'broom'
  | 'stack'
  | 'coin'
  | 'velo'
  | 'primera'
  | 'realHand'
  | 'realTable'
  | 'suits'
  | 'faces'


const card = (rank: Card['rank'], suit: Card['suit']): Card => ({ rank, suit })

const FIGURE_CARDS: Partial<Record<FigureId, Card[]>> = {
  velo: [card(7, 'oros')],
  primera: [card(7, 'oros'), card(7, 'copas'), card(7, 'espadas'), card(7, 'bastos')],
  realHand: [card(7, 'copas'), card(5, 'bastos'), card(3, 'oros')],
  realTable: [card(6, 'espadas'), card(4, 'oros'), card(3, 'copas'), card(2, 'bastos')],
  suits: [card(1, 'oros'), card(1, 'copas'), card(1, 'espadas'), card(1, 'bastos')],
  faces: [card(10, 'espadas'), card(11, 'copas'), card(12, 'oros')],
}

const STACK = [0, 1, 2]

export function MiniFan({ cards, size = 'tiny' }: { cards: Card[]; size?: 'tiny' | 'compact' }) {
  const overlap = size === 'tiny' ? '-ml-2' : '-ml-3'
  return (
    <span className="flex shrink-0">
      {cards.map((item, index) => (
        <span key={cardKey(item)} className={index > 0 ? overlap : ''}>
          <SpanishCard card={item} size={size} />
        </span>
      ))}
    </span>
  )
}

export function Figure({ id }: { id: FigureId }) {
  if (id === 'broom') return <PixelIcon rows={BROOM} className="size-7 shrink-0 text-accent" />
  if (id === 'coin') {
    return <SpanishSuitIcon suit="oros" className="size-7 shrink-0 text-card-oros" />
  }
  if (id === 'stack') {
    return (
      <span aria-hidden="true" className="relative block h-8 w-8 shrink-0">
        {STACK.map((offset) => (
          <span
            key={offset}
            style={{ left: `${offset * 5}px`, top: `${(2 - offset) * 2}px` }}
            className="absolute block h-7 w-5 back-pattern"
          />
        ))}
      </span>
    )
  }
  return <MiniFan cards={FIGURE_CARDS[id] ?? []} />
}
