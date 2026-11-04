import type { Card } from '@escoba/engine'
import { SpanishCard } from './SpanishCard'

interface Props {
  card: Card
  highlight?: boolean
}

export function FlipCard({ card, highlight = false }: Props) {
  return (
    <div className="card-flip">
      <div className="flip-face">
        <SpanishCard card={card} size="large" highlight={highlight} />
      </div>
      <span className="flip-back back-pattern" />
    </div>
  )
}
