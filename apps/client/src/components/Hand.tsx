import type { CSSProperties, ReactNode } from 'react'
import { sameCard } from '@escoba/engine'
import type { Card } from '@escoba/engine'
import { useMessages } from '../i18n/messages'
import { cardKey, rankLabel, sortHand } from '../lib/cards'
import { SpanishCard } from './SpanishCard'

interface Props {
  header: ReactNode
  bar: ReactNode
  hand: Card[]
  playable: boolean
  selected: Card | null
  dealing: boolean
  landDelays: number[]
  onSelect: (card: Card | null) => void
  onPlay: () => void
}

export function Hand({ header, bar, hand, playable, selected, dealing, landDelays, onSelect, onPlay }: Props) {
  const t = useMessages()

  return (
    <section aria-label={t.yourHand} className="flex w-full flex-col items-center gap-2">
      <div className="flex flex-wrap items-stretch justify-center gap-2">{header}</div>
      {bar}
      <div className="flex min-h-25 w-full justify-center gap-2 pt-3">
        {sortHand(hand).map((card, index) => {
          const key = cardKey(card)
          const picked = selected !== null && sameCard(selected, card)
          const stagger = { '--delay': `${landDelays[index] ?? 0}ms` } as CSSProperties
          return (
            <button
              key={key}
              type="button"
              data-card={key}
              style={stagger}
              aria-disabled={!playable}
              aria-pressed={picked}
              aria-label={`${rankLabel(card.rank)} ${t.suits[card.suit]}`}
              onClick={() => {
                if (!playable) return
                if (picked) return onPlay()
                onSelect(card)
              }}
              className={`hand-card ${picked ? 'is-picked' : ''}`}
            >
              <span className={`block ${dealing ? 'deal-in' : ''}`}>
                <SpanishCard card={card} size="large" highlight={picked} />
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
