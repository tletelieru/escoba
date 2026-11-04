import { useContext, useEffect, useEffectEvent, useState } from 'react'
import { BOTS, SOPLADA_WINDOW_MS, createRng } from '@escoba/bots'
import type { Level } from '@escoba/bots'
import {
  applyAction,
  createMatch,
  legalActions,
  realTableActions,
  sopladaActions,
  matchWinners,
  score,
  sideOf,
  startNextRound,
  turnActions,
  viewFor,
} from '@escoba/engine'
import type { Action, MatchState, Move, PlayerCount } from '@escoba/engine'
import { answer } from './botWorker'
import type { BotReply, BotRequest } from './botWorker'
import { dealDuration } from './lib/dealTiming'
import { saveRecord } from './lib/history'
import { clearSavedMatch, writeSavedMatch } from './lib/savedMatch'
import { ACTION_SOUNDS, ROUND_SOUNDS, SoundContext } from './lib/sound'

export const HUMAN = 0

let worker: Worker | null = null
let requestId = 0

function botWorker(): Worker | null {
  if (typeof Worker === 'undefined') return null
  worker ??= new Worker(new URL('./botWorker.ts', import.meta.url), { type: 'module' })
  return worker
}

const BOT_DELAY = 750
const CAPTURE_HOLD = 1300

export function lastMove(state: MatchState): Move | undefined {
  return state.round.moves.at(-1)
}

export function shownMove(state: MatchState): Move | undefined {
  const { moves } = state.round
  const index = moves.at(-1)?.type === 'deal' ? moves.length - 2 : moves.length - 1
  const move = moves[index]
  if (!move || move.type === 'deal') return undefined
  if (move.type === 'play' && move.captured.length === 0) return undefined
  return move
}

function holdTime(state: MatchState): number | null {
  if (state.round.soplada && state.status === 'playing' && sopladaEntries(state).length > 0) {
    return SOPLADA_WINDOW_MS
  }
  const move = lastMove(state)
  const shown = shownMove(state)
  if (move?.type === 'deal') {
    if (move.deal === 1) return dealDuration(state.players, true)
    return Math.max(shown ? CAPTURE_HOLD : 0, dealDuration(state.players, false))
  }
  return shown ? CAPTURE_HOLD : null
}

export function humanScored(state: MatchState): boolean {
  const points = state.results[state.results.length - 1].points
  const mine = points[sideOf(HUMAN, state.players)]
  const rivals = points.filter((_, side) => side !== sideOf(HUMAN, state.players))
  return mine >= Math.max(...rivals)
}

function holdKey(state: MatchState): string {
  return `${state.roundIndex}:${state.round.moves.length}`
}

function botRequest(request: BotRequest, onReply: (reply: BotReply) => void): () => void {
  const worker = botWorker()
  if (!worker) {
    onReply(answer(request))
    return () => {}
  }
  const listen = (event: MessageEvent<BotReply>) => {
    if (event.data.id !== request.id) return
    worker.removeEventListener('message', listen)
    onReply(event.data)
  }
  worker.addEventListener('message', listen)
  worker.postMessage(request)
  return () => worker.removeEventListener('message', listen)
}

function sopladaEntries(state: MatchState) {
  return Array.from({ length: state.players }, (_, seat) => seat)
    .filter((seat) => seat !== HUMAN)
    .map((seat) => ({ seat, view: viewFor(state, seat), options: sopladaActions(state, seat) }))
    .filter((entry) => entry.options.length > 0)
}

export function useMatch(
  players: PlayerCount,
  seed: number,
  level: Level,
  restored: MatchState | null,
) {
  const [state, setState] = useState(() => restored ?? createMatch({ players }, seed))
  const [rng] = useState(() => createRng(seed))
  const [heldKey, setHeldKey] = useState<string | null>(null)
  const [drawing, setDrawing] = useState(restored === null)
  const [decidedRound, setDecidedRound] = useState(-1)
  const sound = useContext(SoundContext)
  const key = holdKey(state)
  const hold = holdTime(state)
  const holding = hold !== null && key !== heldKey

  function act(action: Action) {
    const next = applyAction(state, action)
    const effect = ACTION_SOUNDS[action.type]
    if (effect) sound?.play(effect)
    if (next.status !== 'playing') {
      const jingle = ROUND_SOUNDS[humanScored(next) ? 'won' : 'lost']
      setTimeout(() => sound?.play(jingle), holdTime(next) ?? 0)
    }
    if (next.status === 'matchOver') {
      saveRecord({
        id: seed,
        finishedAt: Date.now(),
        players,
        level,
        rounds: next.results,
        totals: score(next).totals,
        winners: matchWinners(next),
      })
    }
    setState(next)
  }

  const actFromBot = useEffectEvent(act)

  // eslint-disable-next-line local/no-effect -- persists the match in progress to localStorage
  useEffect(() => {
    if (state.status === 'matchOver') clearSavedMatch()
    else writeSavedMatch({ state, seed, level })
  }, [state, seed, level])

  // eslint-disable-next-line local/no-effect -- runs bot turns, sopladas and holds with timers and the bot Web Worker
  useEffect(() => {
    if (drawing) return
    const timers: ReturnType<typeof setTimeout>[] = []
    const stops: (() => void)[] = []
    const later = (run: () => void, ms: number) => timers.push(setTimeout(run, ms))
    const cleanup = () => {
      timers.forEach(clearTimeout)
      stops.forEach((stop) => stop())
    }
    if (holding) {
      later(() => setHeldKey(key), hold)
      const entries = state.round.soplada ? sopladaEntries(state) : []
      if (entries.length === 0) return cleanup
      const started = Date.now()
      const id = (requestId += 1)
      const seedNow = Math.floor(rng() * 2 ** 31)
      const request: BotRequest = { id, kind: 'soplada', level, entries, seed: seedNow }
      stops.push(
        botRequest(request, (reply) => {
          const action = reply.action
          if (!action) return
          later(() => actFromBot(action), Math.max(0, reply.delay - (Date.now() - started)))
        }),
      )
      return cleanup
    }
    const dealer = state.dealer
    const dealerDecides =
      dealer !== HUMAN && decidedRound !== state.roundIndex && realTableActions(state, dealer).length > 0
    if (dealerDecides) {
      later(() => {
        setDecidedRound(state.roundIndex)
        if (BOTS[level].claimRealTable(viewFor(state, dealer), rng)) {
          actFromBot({ type: 'realTable', seat: dealer })
        }
      }, 0)
      return cleanup
    }
    const seat = state.round.turn
    if (state.status !== 'playing' || seat === HUMAN) return cleanup
    const id = (requestId += 1)
    const request: BotRequest = {
      id,
      kind: 'turn',
      level,
      view: viewFor(state, seat),
      legal: turnActions(state, seat),
      seed: Math.floor(rng() * 2 ** 31),
    }
    let delayed = false
    let reply: Action | null = null
    const commit = () => {
      if (delayed && reply) actFromBot(reply)
    }
    later(() => {
      delayed = true
      commit()
    }, BOT_DELAY)
    stops.push(
      botRequest(request, (answered) => {
        reply = answered.action
        commit()
      }),
    )
    return cleanup
  }, [state, drawing, holding, hold, key, rng, level, decidedRound])

  const legal: Action[] = holding ? [] : legalActions(state, HUMAN)
  const move = lastMove(state)

  return {
    state,
    holding,
    dealing: !drawing && holding && move?.type === 'deal',
    drawing,
    finishDraw: () => setDrawing(false),
    sopladaOpen:
      !drawing &&
      state.status === 'playing' &&
      state.round.soplada !== null &&
      state.round.soplada.seat !== HUMAN &&
      sopladaActions(state, HUMAN).length > 0,
    legal,
    act,
    next: () => setState(startNextRound(state)),
  }
}
