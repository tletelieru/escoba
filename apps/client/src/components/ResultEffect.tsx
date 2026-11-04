import type { CSSProperties } from 'react'

const PIECES = 36

const WIN_TONES = ['bg-gold', 'bg-accent', 'bg-card']

export function ResultEffect({ won }: { won: boolean }) {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
      {Array.from({ length: PIECES }, (_, index) => {
        const style = {
          left: `${(index * 37) % 100}%`,
          '--delay': `${(index * 83) % 1400}ms`,
          '--fall': `${1600 + ((index * 53) % 1200)}ms`,
        } as CSSProperties
        const tone = won ? WIN_TONES[index % WIN_TONES.length] : 'bg-muted'
        return (
          <span
            key={index}
            style={style}
            className={`absolute top-0 ${won ? 'confetti size-2.5' : 'rain h-3 w-0.5'} ${tone}`}
          />
        )
      })}
    </div>
  )
}
