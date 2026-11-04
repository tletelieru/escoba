import { sideCount } from '@escoba/engine'
import type { PlayerCount } from '@escoba/engine'
import type { Messages } from '../i18n/messages'

const HUMAN = 0
const PARTNER = 2

export function seatName(t: Messages, seat: number, players: PlayerCount): string {
  if (seat === HUMAN) return t.you
  if (players === 4 && seat === PARTNER) return t.partner
  return t.bot(seat)
}

export function sideNames(t: Messages, players: PlayerCount): string[] {
  if (players === 4) return [t.us, t.them]
  return Array.from({ length: sideCount(players) }, (_, seat) => seatName(t, seat, players))
}
