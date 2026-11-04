import type { Level } from '@escoba/bots'

export const plainFontKey = 'plain-font'

export function readPlainFont(): boolean {
  return localStorage.getItem(plainFontKey) === 'on'
}

export const reduceMotionKey = 'reduce-motion'

export function readReduceMotion(): boolean {
  return localStorage.getItem(reduceMotionKey) === 'on'
}

export const levelKey = 'bot-level'

export function readLevel(): Level {
  const saved = localStorage.getItem(levelKey)
  if (saved === 'easy' || saved === 'hard') return saved
  return 'medium'
}


export const infoKey = 'info-buttons'

export function readInfoChoice(): boolean | null {
  const saved = localStorage.getItem(infoKey)
  if (saved === 'on') return true
  if (saved === 'off') return false
  return null
}

export function showInfoFor(choice: boolean | null, level: Level): boolean {
  return choice ?? level === 'easy'
}

export const musicKey = 'music'

export function readMusic(): boolean {
  return localStorage.getItem(musicKey) !== 'off'
}
