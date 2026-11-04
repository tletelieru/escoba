import type { Level } from '@escoba/bots'

export interface CaptureRules {
  wrongMessage: boolean
  wrongDrops: boolean
  warnMissed: boolean
  sopladaRetry: boolean
}

export const CAPTURE_RULES: Record<Level, CaptureRules> = {
  easy: { wrongMessage: true, wrongDrops: false, warnMissed: true, sopladaRetry: true },
  medium: { wrongMessage: false, wrongDrops: false, warnMissed: false, sopladaRetry: false },
  hard: { wrongMessage: false, wrongDrops: true, warnMissed: false, sopladaRetry: false },
}
