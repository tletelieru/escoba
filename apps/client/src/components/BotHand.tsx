const CARD_LONG = 1.875
const CARD_SHORT = 1.25
const MAX_SPACING = 0.75
const LINE_REM = { horizontal: 18, vertical: 9 }

interface Props {
  cards: number
  active: boolean
  vertical?: boolean
  delays?: number[]
}

export function BotHand({ cards, active, vertical = false, delays }: Props) {
  const room = (vertical ? LINE_REM.vertical : LINE_REM.horizontal) - CARD_SHORT
  const spacing = Math.min(cards > 1 ? room / (cards - 1) : 0, MAX_SPACING)
  const overlap = `${spacing - CARD_SHORT}rem`

  return (
    <div
      aria-hidden="true"
      className={`${delays ? '' : 'fan-in'} flex shrink-0 items-center justify-center ${vertical ? 'h-24 w-8' : 'h-8'}`}
    >
      <div
        className={`flex items-center justify-center ${vertical ? 'flex-col' : ''} ${
          active ? 'fan-active' : ''
        }`}
      >
        {Array.from({ length: cards }, (_, index) => (
          <span
            key={index}
            style={{
              width: `${vertical ? CARD_LONG : CARD_SHORT}rem`,
              height: `${vertical ? CARD_SHORT : CARD_LONG}rem`,
              ...(index > 0 && (vertical ? { marginTop: overlap } : { marginLeft: overlap })),
              ...(delays && { '--delay': `${delays[index] ?? 0}ms` }),
            }}
            className={`fan-card back-pattern ${delays ? 'deal-pop' : ''}`}
          />
        ))}
      </div>
    </div>
  )
}
