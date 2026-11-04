import { useState } from 'react'
import { useLocale, useMessages } from '../i18n/messages'
import { readHistory } from '../lib/history'
import type { MatchRecord } from '../lib/history'
import { sideNames } from './names'
import { Overlay } from './Overlay'
import { ScoreTable } from './ScoreTable'

const HUMAN_SIDE = 0

function outcome(record: MatchRecord): 'won' | 'tied' | 'lost' | 'abandoned' {
  if (record.abandoned) return 'abandoned'
  if (!record.winners.includes(HUMAN_SIDE)) return 'lost'
  return record.winners.length > 1 ? 'tied' : 'won'
}

const TONE = {
  won: 'bg-emerald-500/20',
  tied: 'bg-surface',
  lost: 'bg-rose-500/20',
  abandoned: 'bg-surface',
}

export function History({ onClose }: { onClose: () => void }) {
  const t = useMessages()
  const locale = useLocale()
  const [records] = useState(readHistory)
  const [openId, setOpenId] = useState<number | null>(null)
  const wins = records.filter((record) => outcome(record) === 'won').length

  return (
    <Overlay title={t.history} onClose={onClose}>
      {records.length === 0 && <p className="text-sm text-muted">{t.historyEmpty}</p>}
      {records.length > 0 && (
        <>
          <p className="text-sm text-muted">{t.historySummary(records.length, wins)}</p>
          <ol className="flex flex-col gap-1.5">
            {records.map((record) => {
              const result = outcome(record)
              return (
                <li key={record.id} className="flex flex-col gap-1">
                  <button
                    type="button"
                    aria-expanded={openId === record.id}
                    onClick={() => setOpenId(openId === record.id ? null : record.id)}
                    className="pixel-box flex items-center justify-between gap-2 bg-raised px-3 py-2 text-left"
                  >
                    <span className="min-w-0 leading-tight">
                      <span className="block text-sm">
                        {new Date(record.finishedAt).toLocaleDateString(locale)} ·{' '}
                        {t.levels[record.level]} · {t.playerCount(record.players)}
                      </span>
                      <span className="block text-xs text-muted">{t.outcomes[result]}</span>
                    </span>
                    <span className={`pixel-box px-2 py-1 tabular-nums ${TONE[result]}`}>
                      {record.totals.join(' - ')}
                    </span>
                  </button>
                  {openId === record.id && (
                    <ScoreTable
                      names={sideNames(t, record.players)}
                      rounds={record.rounds}
                    />
                  )}
                </li>
              )
            })}
          </ol>
        </>
      )}
      <button type="button" onClick={onClose} className="pixel-box bg-raised py-2">
        {t.close}
      </button>
    </Overlay>
  )
}
