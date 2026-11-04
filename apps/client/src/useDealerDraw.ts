import { useContext, useEffect, useEffectEvent, useState } from 'react'
import type { Seat } from '@escoba/engine'
import { DRAW_SOUNDS, SoundContext } from './lib/sound'

const MIN_HOPS = 8
const BASE_HOP_MS = 60
const SLOWDOWN_MS = 360
const STOP_PAUSE_MS = 150
export const ANNOUNCE_MS = 800

export interface Hop {
  seat: Seat
  at: number
}

export function drawSchedule(players: number, dealer: Seat): Hop[] {
  const laps = Math.ceil(MIN_HOPS / players)
  const total = players * laps + dealer
  const hops: Hop[] = []
  let at = 0
  for (let index = 0; index <= total; index++) {
    hops.push({ seat: index % players, at })
    at += BASE_HOP_MS + SLOWDOWN_MS * (index / total) ** 2
  }
  return hops
}

export function drawDuration(players: number, dealer: Seat): number {
  const hops = drawSchedule(players, dealer)
  return hops[hops.length - 1].at + STOP_PAUSE_MS + ANNOUNCE_MS
}

function prefersStill(): boolean {
  if (document.documentElement.classList.contains('reduce-motion')) return true
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

interface Options {
  active: boolean
  players: number
  dealer: Seat
  onDone: () => void
}

export function useDealerDraw({ active, players, dealer, onDone }: Options) {
  const [spot, setSpot] = useState<Seat | null>(null)
  const [stopped, setStopped] = useState(false)
  const sound = useContext(SoundContext)
  const finish = useEffectEvent(onDone)

  // eslint-disable-next-line local/no-effect -- drives the dealer draw animation and its sounds with timers
  useEffect(() => {
    if (!active) return
    const hops = prefersStill() ? [] : drawSchedule(players, dealer)
    const stopAt = (hops.at(-1)?.at ?? 0) + STOP_PAUSE_MS
    const timers = hops.map(({ seat, at }) =>
      setTimeout(() => {
        setSpot(seat)
        sound?.play(DRAW_SOUNDS.hop)
      }, at),
    )
    timers.push(
      setTimeout(() => {
        setSpot(dealer)
        setStopped(true)
        sound?.play(DRAW_SOUNDS.stop)
      }, stopAt),
      setTimeout(() => finish(), stopAt + ANNOUNCE_MS),
    )
    return () => timers.forEach(clearTimeout)
  }, [active, players, dealer, sound])

  return { spot: active ? spot : null, stopped }
}
