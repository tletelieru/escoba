import { MATCH_POINTS } from '@escoba/engine'
import type { RoundScore } from '@escoba/engine'
import { useMessages } from '../i18n/messages'

interface Props {
  names: string[]
  rounds: RoundScore[]
  live?: RoundScore
}

function Cell({ value, live = false }: { value: number; live?: boolean }) {
  const tone = value > 0 ? 'bg-emerald-500/20' : 'bg-raised text-muted'
  return (
    <div
      className={`flex h-9 items-center justify-center pixel-box font-pixel text-xl leading-none tabular-nums ${tone} ${
        live ? 'score-live' : ''
      }`}
    >
      {value}
    </div>
  )
}

export function ScoreTable({ names, rounds, live }: Props) {
  const t = useMessages()
  const totals = names.map((_, side) => rounds.reduce((sum, round) => sum + round.points[side], 0))
  const best = Math.max(...totals)

  return (
    <table className="w-full table-fixed border-separate [border-spacing:0.25rem]">
      <thead>
        <tr>
          <th className="w-12 text-xs font-normal text-muted">{t.toTarget(MATCH_POINTS)}</th>
          {names.map((name, side) => {
            const leading = rounds.length > 0 && totals[side] === best
            return (
              <th
                key={name}
                scope="col"
                className={`pixel-box bg-raised px-1 py-1.5 font-normal ${
                  leading ? 'shadow-[inset_0_0_0_2px_var(--gold)]' : ''
                }`}
              >
                <span className="block truncate text-xs text-muted">{name}</span>
                <span className="block font-pixel text-3xl leading-none tabular-nums">
                  {totals[side]}
                </span>
              </th>
            )
          })}
        </tr>
      </thead>
      <tbody>
        {rounds.map((round, index) => (
          <tr key={index} className={index === rounds.length - 1 && !live ? 'score-pop' : ''}>
            <th scope="row" className="p-0 text-sm font-normal text-muted">
              {t.roundShort(index + 1)}
            </th>
            {names.map((name, side) => (
              <td key={name} className="p-0">
                <Cell value={round.points[side]} />
              </td>
            ))}
          </tr>
        ))}
        {live && (
          <tr>
            <th scope="row" className="p-0 text-sm font-normal text-muted">
              {t.roundShort(rounds.length + 1)}
            </th>
            {names.map((name, side) => (
              <td key={name} className="p-0">
                <Cell value={live.points[side]} live />
              </td>
            ))}
          </tr>
        )}
      </tbody>
    </table>
  )
}
