import type { Level } from '@escoba/bots'
import { POINTS } from '@escoba/engine'
import type { Breakdown, Card, PlayerCount } from '@escoba/engine'
import { useMessages } from '../i18n/messages'
import { Figure } from './Figures'
import type { FigureId } from './Figures'
import { SpanishCard } from './SpanishCard'

interface Props {
  level: Level
  onLevel: (level: Level) => void
  onRules: () => void
  onHistory: () => void
  onStart: (players: PlayerCount) => void
}

const FAN: { card: Card; tilt: number; lift: number }[] = [
  { card: { suit: 'copas', rank: 1 }, tilt: -8, lift: 10 },
  { card: { suit: 'oros', rank: 7 }, tilt: 0, lift: 0 },
  { card: { suit: 'espadas', rank: 12 }, tilt: 8, lift: 10 },
]

const PLAYER_OPTIONS: PlayerCount[] = [2, 3, 4]

const LEVELS: Level[] = ['easy', 'medium', 'hard']

const POINT_ROWS: { concept: keyof Breakdown; points: string; figure: FigureId }[] = [
  { concept: 'escobas', points: `${POINTS.escoba}`, figure: 'broom' },
  { concept: 'cards', points: `${POINTS.cards}`, figure: 'stack' },
  { concept: 'oros', points: `${POINTS.oros}`, figure: 'coin' },
  { concept: 'velo', points: `${POINTS.velo}`, figure: 'velo' },
  { concept: 'primera', points: `${POINTS.primera}/${POINTS.primeraReal}`, figure: 'primera' },
  { concept: 'realHand', points: `${POINTS.realHand}`, figure: 'realHand' },
  { concept: 'realTable', points: `${POINTS.realTable}`, figure: 'realTable' },
]

export function Home({ level, onLevel, onRules, onHistory, onStart }: Props) {
  const t = useMessages()

  return (
    <main className="flex flex-col items-center gap-6">
      <div aria-hidden="true" className="flex justify-center pt-6">
        {FAN.map(({ card, tilt, lift }) => (
          <SpanishCard
            key={`${card.suit}-${card.rank}`}
            card={card}
            size="hero"
            tilt={tilt}
            lift={lift}
            front={tilt === 0}
          />
        ))}
      </div>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="font-pixel text-6xl leading-none">{t.appName}</h1>
        <p className="text-muted">{t.tagline}</p>
      </div>
      <div role="group" aria-label={t.difficulty} className="flex w-full flex-col gap-1">
        <span className="text-center text-sm text-muted">
          {t.difficulty}: {t.levelHints[level]}
        </span>
        <div className="grid grid-cols-3 gap-1 pixel-box bg-surface p-1">
          {LEVELS.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={level === option}
              onClick={() => onLevel(option)}
              className={`pixel-box py-1.5 text-sm font-medium ${
                level === option ? 'bg-raised' : 'text-muted'
              }`}
            >
              {t.levels[option]}
            </button>
          ))}
        </div>
      </div>
      <div className="grid w-full grid-cols-3 gap-2">
        {PLAYER_OPTIONS.map((players) => (
          <button
            key={players}
            type="button"
            aria-label={t.playWith(players)}
            onClick={() => onStart(players)}
            className="flex flex-col items-center gap-1 pixel-box bg-accent py-3 text-on-accent"
          >
            <span className="font-pixel text-4xl leading-none">{players}</span>
            <span className="text-xs leading-none">{t.playMode(players)}</span>
          </button>
        ))}
      </div>
      <section className="flex w-full flex-col gap-2 pixel-box bg-surface p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-pixel text-2xl leading-none">{t.pointsTitle}</h2>
          <div className="flex gap-1">
            {[
              { label: t.history, onClick: onHistory },
              { label: t.rules, onClick: onRules },
            ].map(({ label, onClick }) => (
              <button
                key={label}
                type="button"
                onClick={onClick}
                className="pixel-box bg-raised px-2 py-1 text-xs font-medium"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <ul className="grid auto-rows-fr grid-cols-2 gap-1.5">
          {POINT_ROWS.map(({ concept, points, figure }) => (
            <li
              key={concept}
              className="flex min-h-12 items-center gap-1.5 pixel-box bg-raised px-2 py-1.5 text-sm"
            >
              <span className="w-7 shrink-0 font-pixel text-xl leading-none text-gold">{points}</span>
              <span className="min-w-0 flex-1 leading-none">{t.concepts[concept]}</span>
              <span aria-hidden="true" className="flex shrink-0 items-center">
                <Figure id={figure} />
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
