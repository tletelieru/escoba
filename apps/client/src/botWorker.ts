import { BOTS, createRng, raceSoplada } from '@escoba/bots'
import type { Level } from '@escoba/bots'
import type { Action, PlayerView, Seat } from '@escoba/engine'

export interface SopladaRequestEntry {
  seat: Seat
  view: PlayerView
  options: Action[]
}

export type BotRequest =
  | { id: number; kind: 'turn'; level: Level; view: PlayerView; legal: Action[]; seed: number }
  | { id: number; kind: 'soplada'; level: Level; entries: SopladaRequestEntry[]; seed: number }

export interface BotReply {
  id: number
  action: Action | null
  delay: number
}

export function answer(request: BotRequest): BotReply {
  const rng = createRng(request.seed)
  const bot = BOTS[request.level]
  if (request.kind === 'turn') {
    return { id: request.id, action: bot.choose(request.view, request.legal, rng), delay: 0 }
  }
  const claim = raceSoplada(
    request.entries.map((entry) => ({ ...entry, bot })),
    rng,
  )
  return { id: request.id, action: claim?.action ?? null, delay: claim?.delay ?? 0 }
}

self.onmessage = (event: MessageEvent<BotRequest>) => {
  self.postMessage(answer(event.data))
}
