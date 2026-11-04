import { createContext } from 'react'
import type { TrackId } from './music'
import type { Action } from '@escoba/engine'

export type SoundId = 'tick' | 'chime' | 'sweep' | 'happy' | 'sad'

export interface Sound {
  play: (id: SoundId) => void
}

export const SoundContext = createContext<Sound | null>(null)

export const ACTION_SOUNDS: Record<Action['type'], SoundId | null> = {
  play: null,
  realHand: 'chime',
  realTable: 'chime',
  soplar: 'sweep',
}

export const ROUND_SOUNDS = { won: 'happy', lost: 'sad' } as const satisfies Record<string, SoundId>

export const DRAW_SOUNDS = { hop: 'tick', stop: 'chime' } as const satisfies Record<string, SoundId>

interface Tone {
  frequency: number
  duration: number
  type: OscillatorType
  slide?: number
}

const TONES: Record<SoundId, Tone[]> = {
  tick: [{ frequency: 880, duration: 0.04, type: 'square' }],
  chime: [
    { frequency: 659, duration: 0.12, type: 'triangle' },
    { frequency: 988, duration: 0.25, type: 'triangle' },
  ],
  sweep: [{ frequency: 300, duration: 0.25, type: 'sawtooth', slide: 900 }],
  happy: [
    { frequency: 523, duration: 0.1, type: 'square' },
    { frequency: 659, duration: 0.1, type: 'square' },
    { frequency: 784, duration: 0.1, type: 'square' },
    { frequency: 1047, duration: 0.3, type: 'square' },
  ],
  sad: [
    { frequency: 392, duration: 0.22, type: 'triangle' },
    { frequency: 349, duration: 0.22, type: 'triangle' },
    { frequency: 311, duration: 0.45, type: 'triangle' },
  ],
}

const VOLUME = 0.08

export function createSound(): Sound | null {
  if (typeof window === 'undefined' || typeof AudioContext === 'undefined') return null
  let context: AudioContext | null = null
  return {
    play(id) {
      context ??= new AudioContext()
      const audio = context
      let start = audio.currentTime
      for (const tone of TONES[id]) {
        const oscillator = audio.createOscillator()
        const gain = audio.createGain()
        oscillator.type = tone.type
        oscillator.frequency.setValueAtTime(tone.frequency, start)
        if (tone.slide) oscillator.frequency.linearRampToValueAtTime(tone.slide, start + tone.duration)
        gain.gain.setValueAtTime(VOLUME, start)
        gain.gain.exponentialRampToValueAtTime(0.0001, start + tone.duration)
        oscillator.connect(gain).connect(audio.destination)
        oscillator.start(start)
        oscillator.stop(start + tone.duration)
        start += tone.duration
      }
    },
  }
}

export const SETUP_TRACKS = { home: 'intro', match: 'match' } as const satisfies Record<string, TrackId>

export function trackForSession(restored: boolean): TrackId {
  return restored ? SETUP_TRACKS.match : SETUP_TRACKS.home
}
