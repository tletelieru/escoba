import { SUITS, isSieteDeVelo, primeraValue } from '@escoba/engine'
import type { Breakdown, Card, Pile, PlayerCount, RoundScore } from '@escoba/engine'
import { useMessages } from '../i18n/messages'
import type { Messages } from '../i18n/messages'
import { cardKey, seatsOfSide } from '../lib/cards'
import { SpanishCard } from './SpanishCard'

interface Props {
  names: string[]
  players: PlayerCount
  piles: Pile[]
  result: RoundScore
}

const CONCEPTS: (keyof Breakdown)[] = [
  'escobas',
  'realHand',
  'realTable',
  'cards',
  'oros',
  'velo',
  'primera',
]

function partLabel(t: Messages, concept: keyof Breakdown, item: Breakdown, escobas: number): string {
  if (concept === 'escobas') return `${t.concepts.escobas} ${escobas}`
  if (concept === 'primera' && item.primera > 1) return t.primeraReal
  return t.concepts[concept]
}

function bestPerSuit(cards: Card[]): Card[] {
  return SUITS.flatMap((suit) => {
    const inSuit = cards.filter((card) => card.suit === suit)
    if (inSuit.length === 0) return []
    return [inSuit.reduce((best, card) => (primeraValue(card) > primeraValue(best) ? card : best))]
  })
}

interface Group {
  key: string
  cards: Card[]
}

function groupsFor(piles: Pile[], item: Breakdown): Group[] {
  const cards = piles.flatMap((pile) => pile.cards)
  const groups: Group[] = [
    { key: 'escobas', cards: piles.flatMap((pile) => pile.escobas) },
    { key: 'reales', cards: piles.flatMap((pile) => [...pile.realHand, ...pile.realTable].flat()) },
    { key: 'velo', cards: cards.filter(isSieteDeVelo) },
    { key: 'primera', cards: item.primera > 0 ? bestPerSuit(cards) : [] },
  ]
  return groups.filter((group) => group.cards.length > 0)
}

export function RoundSummary({ names, players, piles, result }: Props) {
  const t = useMessages()

  return (
    <ul className="flex flex-col gap-2">
      {result.breakdown.map((item, side) => {
        const tally = result.tallies[side]
        const sidePiles = seatsOfSide(side, players).map((seat) => piles[seat])
        const parts = CONCEPTS.filter((concept) => item[concept] > 0).map((concept) =>
          partLabel(t, concept, item, tally.escobas),
        )
        return (
          <li key={names[side]} className="flex flex-col gap-1 pixel-box bg-raised p-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-pixel text-xl leading-none">{names[side]}</span>
              <span className="font-pixel text-2xl leading-none text-gold">+{result.points[side]}</span>
            </div>
            <p className="text-xs leading-tight text-muted">
              {parts.length === 0 ? t.noPoints : parts.join(' · ')}
            </p>
            <p className="text-xs leading-tight">{t.summaryCounts(tally.cards, tally.oros)}</p>
            <div className="flex flex-wrap gap-x-2 gap-y-1">
              {groupsFor(sidePiles, item).map((group) => (
                <span key={group.key} aria-label={t.summaryGroups[group.key]} className="flex">
                  {group.cards.map((card) => (
                    <span key={cardKey(card)} className="-mr-2 last:mr-0">
                      <SpanishCard card={card} size="tiny" />
                    </span>
                  ))}
                </span>
              ))}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
