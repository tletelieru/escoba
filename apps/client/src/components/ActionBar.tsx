import { useState } from 'react'
import { useMessages } from '../i18n/messages'
import { Overlay } from './Overlay'
import { RuleExample } from './RuleExample'
import { RULE_EXAMPLES } from './ruleExamples'
import type { ExamplePart } from './ruleExamples'

interface Props {
  status: string
  sum: string
  noticeKey: string | null
  canReal: boolean
  canSoplar: boolean
  onReal: () => void
  onSoplar: () => void
  showInfo: boolean
}

type InfoId = 'real' | 'soplada'

const EMPTY = ' '

interface BarAction {
  id: InfoId
  label: string
  enabled: boolean
  onClick: () => void
}

export function ActionBar({
  status,
  sum,
  noticeKey,
  canReal,
  canSoplar,
  onReal,
  onSoplar,
  showInfo,
}: Props) {
  const t = useMessages()
  const [info, setInfo] = useState<InfoId | null>(null)
  const infos: Record<InfoId, { title: string; text: string; example: ExamplePart[] }> = {
    real: { title: t.real, text: t.infoReal, example: RULE_EXAMPLES.realHand },
    soplada: { title: t.soplada, text: t.infoSoplada, example: RULE_EXAMPLES.soplada },
  }
  const open = info ? infos[info] : null
  const actions: BarAction[] = [
    { id: 'real', label: t.real, enabled: canReal, onClick: onReal },
    { id: 'soplada', label: t.soplada, enabled: canSoplar, onClick: onSoplar },
  ]

  const action = ({ id, label, enabled, onClick }: BarAction) => (
    <div key={id} className="flex min-w-0 gap-1">
      <button
        type="button"
        disabled={!enabled}
        onClick={onClick}
        className="min-w-0 flex-1 pixel-box bg-raised py-2 font-pixel text-xl leading-none disabled:opacity-40 disabled:saturate-0"
      >
        {label}
      </button>
      {showInfo && (
        <button
          type="button"
          aria-label={t.infoAbout(label)}
          onClick={() => setInfo(id)}
          className="w-6 shrink-0 pixel-box bg-surface font-pixel text-lg leading-none text-gold"
        >
          i
        </button>
      )}
      {!showInfo && <span aria-hidden="true" className="w-6 shrink-0" />}
    </div>
  )

  return (
    <div className="flex w-full flex-col gap-1">
      <p
        key={noticeKey ?? 'status'}
        aria-live="polite"
        className={`h-5 truncate text-center text-sm leading-5 font-medium text-gold ${
          noticeKey ? 'shake' : ''
        }`}
      >
        {status || EMPTY}
      </p>
      <div className="grid h-9 grid-cols-[1fr_auto_1fr] items-center gap-2">
        {action(actions[0])}
        <p className="min-w-16 text-center text-sm leading-tight tabular-nums text-muted">
          {sum || EMPTY}
        </p>
        {action(actions[1])}
      </div>
      {open && (
        <Overlay title={open.title} translucent onClose={() => setInfo(null)}>
          <p className="text-sm leading-tight">{open.text}</p>
          <RuleExample parts={open.example} />
          <button
            type="button"
            onClick={() => setInfo(null)}
            className="pixel-box bg-raised py-2 font-medium"
          >
            {t.close}
          </button>
        </Overlay>
      )}
    </div>
  )
}
