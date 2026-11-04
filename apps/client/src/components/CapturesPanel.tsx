import type { Tally } from '@escoba/engine'
import { useMessages } from '../i18n/messages'
import { cardKey } from '../lib/cards'
import type { Capture } from '../lib/plays'
import { SpanishCard } from './SpanishCard'


interface Props {
  captures: Capture[]
  names: string[]
  showWho: boolean
  tally: Tally
}

function tagOf(capture: Capture): 'escoba' | 'real' | 'leftover' | 'soplada' | null {
  if (capture.type === 'leftover') return 'leftover'
  if (capture.type === 'soplar') return 'soplada'
  if (capture.type === 'play') return capture.escoba ? 'escoba' : null
  return 'real'
}

function cardsOf(capture: Capture) {
  if (capture.type === 'play') {
    return [{ card: capture.card, played: true }, ...capture.captured.map((card) => ({ card, played: false }))]
  }
  const faceUp = capture.type === 'realHand' || capture.type === 'realTable'
  return capture.cards.map((card) => ({ card, played: faceUp }))
}

export function CapturesPanel({ captures, names, showWho, tally }: Props) {
  const t = useMessages()
  const counts = [
    { key: 'cards', value: tally.cards },
    { key: 'oros', value: tally.oros },
    { key: 'sevens', value: tally.sevens },
    { key: 'velo', value: tally.velo ? 1 : 0 },
    { key: 'escobas', value: tally.escobas },
  ] as const

  return (
    <>
      <dl className="grid grid-cols-5 gap-1 text-center">
        {counts.map(({ key, value }) => (
          <div key={key} className="flex flex-col items-center pixel-box bg-raised px-0.5 py-1">
            <dt className="truncate text-xs leading-tight text-muted">{t.counts[key]}</dt>
            <dd className="font-pixel text-2xl leading-none">{value}</dd>
          </div>
        ))}
      </dl>
      {captures.length === 0 && <p className="text-sm text-muted">{t.noCaptures}</p>}
      {captures.length > 0 && (
        <ol className="flex flex-col gap-1.5">
          {captures.map((capture, index) => {
            const tag = tagOf(capture)
            const cards = cardsOf(capture)
            return (
              <li key={`${index}-${cardKey(cards[0].card)}`} className="flex items-center gap-1.5">
                <span className="w-5 shrink-0 text-center font-pixel text-lg leading-none text-gold">
                  {index + 1}
                </span>
                <div className="flex flex-wrap gap-0.5">
                  {cards.map(({ card, played }) => (
                    <SpanishCard key={cardKey(card)} card={card} size="compact" highlight={played} />
                  ))}
                </div>
                <span className="ml-auto flex flex-col items-end text-xs leading-tight">
                  {showWho && <span className="text-muted">{names[capture.seat]}</span>}
                  {tag && <span className="font-medium text-gold">{t.captureTags[tag]}</span>}
                </span>
              </li>
            )
          })}
        </ol>
      )}
    </>
  )
}
