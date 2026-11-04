import type { Pile } from '@escoba/engine'
import { useMessages } from '../i18n/messages'
import { BROOM, CROWN } from '../lib/pixelArt'
import { PixelIcon } from './PixelIcon'

interface Props {
  name: string
  cards: number
  pile: Pile
  dealer: boolean
  active: boolean
  spotlight?: boolean
}

export function PileFaces({ pile }: { pile: Pile }) {
  const t = useMessages()
  const reales = pile.realHand.length + pile.realTable.length
  const marks = [
    { key: 'escoba', rows: BROOM, count: pile.escobas.length, title: t.escoba, tone: 'text-accent', size: 'size-3.5' },
    { key: 'real', rows: CROWN, count: reales, title: t.real, tone: 'text-gold', size: 'h-2.5 w-4' },
  ].filter((mark) => mark.count > 0)

  return (
    <span
      aria-label={marks.length > 0 ? t.pileFaces(pile.escobas.length, reales) : undefined}
      className="flex h-4 items-center justify-center gap-2 leading-none"
    >
      {marks.map((mark) => (
        <span key={mark.key} title={mark.title} className="score-pop flex items-center gap-0.5">
          <PixelIcon rows={mark.rows} className={`${mark.size} ${mark.tone}`} />
          <span className="font-pixel text-base leading-none">{mark.count}</span>
        </span>
      ))}
    </span>
  )
}

export function PlayerBadge({ name, cards, pile, dealer, active, spotlight = false }: Props) {
  const t = useMessages()

  return (
    <div
      aria-current={active ? 'true' : undefined}
      className={`relative flex w-28 flex-col items-center whitespace-nowrap pixel-box border-2 bg-surface px-1 py-0.5 text-xs leading-tight ${
        active ? 'turn-glow border-gold' : 'border-transparent'
      } ${spotlight ? 'draw-spot' : ''}`}
    >
      <span className="flex items-center gap-1 font-pixel text-lg leading-none">
        {name}
        {dealer && (
          <span title={t.dealer} aria-label={t.dealer} className="text-gold">
            ●
          </span>
        )}
      </span>
      <span className="text-muted">
        {t.cardsLeft(cards)} · {t.pile(pile.cards.length)}
      </span>
      <PileFaces pile={pile} />
    </div>
  )
}
