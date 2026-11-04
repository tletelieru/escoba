import type { CSSProperties } from 'react'
import { sameCard } from '@escoba/engine'
import type { Card, Move, PlayerCount, Seat } from '@escoba/engine'
import { useMessages } from '../i18n/messages'
import { SEAT_VECTOR, cardKey, rankLabel, seatPosition } from '../lib/cards'
import { HUMAN } from '../useMatch'
import { FlipCard } from './FlipCard'
import { SpanishCard } from './SpanishCard'

interface Props {
  table: Card[]
  players: PlayerCount
  deckCount: number
  lastDeal?: boolean
  shown: Move | undefined
  names: string[]
  chosen: Card[]
  hidden?: boolean
  dealDelays?: number[]
  selectable: boolean
  flash: { id: number; cards: Card[] } | null
  dropFrom: Seat | null
  onToggle: (card: Card) => void
}

const ROOMY_TABLE = 6

type Shown = Extract<Move, { type: 'play' | 'realHand' | 'realTable' | 'leftover' | 'soplar' }>

function vectorStyle(seat: Seat, players: PlayerCount, prefix: 'from' | 'to'): CSSProperties {
  const vector = SEAT_VECTOR[seatPosition(seat, players)]
  return { [`--${prefix}-x`]: `${vector.x}px`, [`--${prefix}-y`]: `${vector.y}px` } as CSSProperties
}

function bannerFor(move: Shown, t: ReturnType<typeof useMessages>): string | null {
  if (move.type === 'play') return move.escoba ? t.escoba : null
  if (move.type === 'leftover') return null
  if (move.type === 'soplar') return t.soplada
  return t.real
}

function collected(move: Shown): Card[] {
  if (move.type === 'play') return move.captured
  return move.cards
}

export function TableArea({
  table,
  players,
  deckCount,
  lastDeal = false,
  shown,
  names,
  chosen,
  hidden = false,
  dealDelays,
  selectable,
  flash,
  dropFrom,
  onToggle,
}: Props) {
  const t = useMessages()
  const move = shown as Shown | undefined
  const taken = move ? collected(move) : []
  const collect = move ? vectorStyle(move.seat, players, 'to') : undefined
  const moveBanner = move ? bannerFor(move, t) : null
  const banner = moveBanner ?? (lastDeal ? t.lastDeal : null)
  const isIn = (cards: Card[], card: Card) => cards.some((item) => sameCard(item, card))
  const size = table.length + taken.length > ROOMY_TABLE ? 'mini' : 'large'

  return (
    <section aria-label={t.tableLabel} className="relative flex w-full flex-col items-center gap-1.5">
      <div className="flex w-full items-center justify-between gap-2 text-xs text-muted">
        <span className="flex shrink-0 items-center gap-1.5">
          <span
            aria-hidden="true"
            data-deck
            className={`block h-7 w-5 ${deckCount > 0 ? 'back-pattern' : 'border-2 border-dashed border-line bg-line'}`}
          />
          {t.deckLeft(deckCount)}
        </span>
        <p aria-live="polite" className="min-w-0 truncate text-gold">
          {move && t.moveText(move, names)}
        </p>
      </div>
      <div className="flex w-full flex-wrap content-center items-center justify-center gap-1">
        {table.map((card, index) => {
          const fromSeat = dropFrom !== null && sameCard(card, table[table.length - 1]) ? dropFrom : null
          const dealt = dealDelays ? ({ '--delay': `${dealDelays[index] ?? 0}ms` } as CSSProperties) : undefined
          const enter = fromSeat === null ? dealt : vectorStyle(fromSeat, players, 'from')
          const picked = isIn(chosen, card)
          return (
            <button
              key={cardKey(card)}
              type="button"
              style={enter}
              disabled={!selectable}
              aria-label={`${rankLabel(card.rank)} ${t.suits[card.suit]}`}
              aria-pressed={selectable ? picked : undefined}
              data-table-card={cardKey(card)}
              onClick={() => onToggle(card)}
              className={`${dealDelays ? 'deal-table' : 'table-enter'} table-card ${picked ? 'is-chosen' : ''}`}
            >
              <span
                key={flash?.id ?? 0}
                className={`block ${flash && isIn(flash.cards, card) ? 'wrong-flash' : ''}`}
              >
                <SpanishCard card={card} size={size} highlight={picked} />
              </span>
            </button>
          )
        })}
        {move?.type === 'play' && (
          <div style={vectorStyle(move.seat, players, 'from')} className="bot-enter">
            <div style={collect} className="capture-collect">
              {move.seat === HUMAN ? (
                <SpanishCard card={move.card} size={size} highlight />
              ) : (
                <FlipCard card={move.card} highlight />
              )}
            </div>
          </div>
        )}
        {taken.map((card) => (
          <div key={`taken-${cardKey(card)}`} style={collect} className="capture-collect">
            <span className="capture-glow block">
              <SpanishCard card={card} size={size} />
            </span>
          </div>
        ))}
        {!hidden && table.length === 0 && taken.length === 0 && (
          <p className="py-6 text-sm text-muted">{t.emptyTable}</p>
        )}
      </div>
      {banner && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <span className="escoba-pop pixel-box bg-accent px-4 py-2 font-pixel text-4xl leading-none text-on-accent">
            {banner}
          </span>
        </div>
      )}
    </section>
  )
}
