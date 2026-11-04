import type { CSSProperties } from 'react'
import { HAND_SIZE } from '@escoba/engine'
import type { PlayerCount } from '@escoba/engine'
import { SEAT_VECTOR, seatPosition } from '../lib/cards'
import { flightDelay } from '../lib/dealTiming'

function startAtDeck(container: HTMLDivElement | null) {
  const deck = container?.ownerDocument.querySelector('[data-deck]')
  if (!container || !deck) return
  const rect = deck.getBoundingClientRect()
  const x = rect.left + rect.width / 2
  const y = rect.top + rect.height / 2
  container.style.left = `${x}px`
  container.style.top = `${y}px`
  container.style.setProperty('--shift-x', `${window.innerWidth / 2 - x}px`)
  container.style.setProperty('--shift-y', `${window.innerHeight / 2 - y}px`)
}

export function DealAnimation({ players, dealer }: { players: PlayerCount; dealer: number }) {
  const seats = Array.from({ length: players }, (_, offset) => (dealer + 1 + offset) % players)

  return (
    <div ref={startAtDeck} aria-hidden="true" className="pointer-events-none fixed top-1/2 left-1/2 z-10">
      {Array.from({ length: HAND_SIZE }, (_, round) =>
        seats.map((seat) => {
          const vector = SEAT_VECTOR[seatPosition(seat, players)]
          const style = {
            '--to-x': `${vector.x}px`,
            '--to-y': `${vector.y}px`,
            '--delay': `${flightDelay(seat, dealer, players, round)}ms`,
          } as CSSProperties
          return <span key={`${round}-${seat}`} style={style} className="deal-flight card-back" />
        }),
      )}
    </div>
  )
}
