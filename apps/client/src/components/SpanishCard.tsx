import type { CSSProperties } from 'react'
import type { Card, Rank } from '@escoba/engine'
import { SUIT_ON_CARD, isFigure, rankLabel } from '../lib/cards'
import { PixelIcon } from './PixelIcon'
import { SpanishSuitIcon } from './SpanishSuitIcon'

export type CardSize = 'hero' | 'large' | 'mini' | 'compact' | 'tiny'

interface Props {
  card: Card
  size?: CardSize
  highlight?: boolean
  tilt?: number
  lift?: number
  front?: boolean
}

const FIGURE_ART: Partial<Record<Rank, string[]>> = {
  10: ['..###..', '..###..', '...#...', '.#####.', '..#.#..'],
  11: ['..##.#.', '.#####.', '##.###.', '...###.', '..####.'],
  12: ['.......', '#..#..#', '#.###.#', '#######', '#######'],
}

function FigureArt({ card, className }: { card: Card; className: string }) {
  const rows = FIGURE_ART[card.rank]
  if (!rows) return null
  return <PixelIcon rows={rows} className={`text-accent ${className}`} />
}

function HeroCard({ card, tilt = 0, lift = 0, front = false }: Props) {
  const style = { '--tilt': `${tilt}deg`, '--lift': `${lift}px` } as CSSProperties
  const label = rankLabel(card.rank)

  return (
    <div style={style} className={`playing-card relative -mx-1 ${front ? 'z-10' : ''}`}>
      <div
        className={`card-face hero-card relative h-36 w-24 border-4 border-card-ink font-pixel sm:h-44 sm:w-30 ${
          SUIT_ON_CARD[card.suit]
        }`}
      >
        <span className="absolute inset-1.5 border-2 border-accent/50" />
        <span className="absolute top-2 left-3 flex flex-col items-center gap-0.5">
          <span className="text-3xl leading-none">{label}</span>
          <SpanishSuitIcon suit={card.suit} className="size-3.5" />
        </span>
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <FigureArt card={card} className="h-4 w-5.5" />
          <SpanishSuitIcon suit={card.suit} className="size-10 sm:size-12" />
        </span>
        <span className="absolute right-3 bottom-2 flex rotate-180 flex-col items-center gap-0.5">
          <span className="text-3xl leading-none">{label}</span>
          <SpanishSuitIcon suit={card.suit} className="size-3.5" />
        </span>
      </div>
    </div>
  )
}

function CompactCard({ card, highlight = false }: Props) {
  const edge = highlight ? 'border-gold' : 'border-card-ink'
  return (
    <span className="card-shadow block">
      <span
        className={`card-face flex h-11 w-7 flex-col items-center justify-center gap-0.5 border-2 font-pixel text-lg leading-none ${edge} ${
          SUIT_ON_CARD[card.suit]
        }`}
      >
        {rankLabel(card.rank)}
        <SpanishSuitIcon suit={card.suit} className="size-3.5" />
      </span>
    </span>
  )
}

const MINI = {
  box: 'h-16 w-11',
  label: 'text-lg',
  figure: 'h-2.5 w-3.5',
  suit: 'size-6',
  ace: 'size-7',
}

const LARGE = {
  box: 'h-22 w-15',
  label: 'text-2xl',
  figure: 'h-3.5 w-5',
  suit: 'size-8',
  ace: 'size-10',
}

function MiniCard({ card, highlight = false, size }: Props) {
  const edge = highlight ? 'border-gold' : 'border-card-ink'
  const label = rankLabel(card.rank)
  const figure = isFigure(card)
  const scale = size === 'large' ? LARGE : MINI

  return (
    <span className="card-shadow block">
      <span
        className={`card-face relative block border-2 font-pixel leading-none ${scale.box} ${edge} ${
          SUIT_ON_CARD[card.suit]
        }`}
      >
        {figure && <span className="absolute inset-1 border border-accent/60 bg-accent/10" />}
        <span className={`absolute top-0.5 left-1 leading-none ${scale.label}`}>{label}</span>
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 pt-1">
          <FigureArt card={card} className={scale.figure} />
          <SpanishSuitIcon suit={card.suit} className={card.rank === 1 ? scale.ace : scale.suit} />
        </span>
        <span className={`absolute right-1 bottom-0.5 rotate-180 leading-none ${scale.label}`}>
          {label}
        </span>
      </span>
    </span>
  )
}

function TinyCard({ card }: Props) {
  return (
    <span className="block drop-shadow-[0_2px_0_rgba(0,0,0,0.3)]">
      <span
        className={`card-face flex h-8 w-5.5 flex-col items-center justify-center border border-card-ink font-pixel text-sm leading-none ${
          SUIT_ON_CARD[card.suit]
        }`}
      >
        {rankLabel(card.rank)}
        <SpanishSuitIcon suit={card.suit} className="size-2.5" />
      </span>
    </span>
  )
}

export function SpanishCard(props: Props) {
  const { size = 'mini' } = props
  if (size === 'hero') return <HeroCard {...props} />
  if (size === 'compact') return <CompactCard {...props} />
  if (size === 'tiny') return <TinyCard {...props} />
  return <MiniCard {...props} />
}

export function CardBack({ className = '' }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`card-shadow block ${className}`}>
      <span className="block h-16 w-11 back-pattern" />
    </span>
  )
}
