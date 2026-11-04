const LOOKAHEAD_SECONDS = 0.3
const TICK_MS = 100
const MASTER_VOLUME = 0.5

const REST = 0

export type TrackId = 'intro' | 'match'

export interface Track {
  bpm: number
  stepsPerChord: number
  bassEvery: number
  strumEvery: number
  strumOn: number
  melody: number[]
  chords: number[][]
}

const G = [43, 55, 59, 62]
const C = [48, 55, 60, 64]
const D = [50, 57, 62, 66]
const F = [41, 53, 57, 60]
const GLOW = [43, 55, 59, 65]

export const TRACKS: Record<TrackId, Track> = {
  intro: {
    bpm: 126,
    stepsPerChord: 12,
    bassEvery: 6,
    strumEvery: 3,
    strumOn: 2,
    melody: [
      67, REST, 71, 74, REST, 71, 72, REST, 71, 69, REST, REST,
      72, REST, 76, 79, REST, 76, 74, REST, 72, 71, REST, REST,
      74, REST, 78, 81, REST, 78, 79, REST, 78, 76, REST, 74,
      71, REST, 74, 79, REST, 74, 67, REST, REST, REST, REST, REST,
    ],
    chords: [G, C, D, G],
  },
  match: {
    bpm: 132,
    stepsPerChord: 12,
    bassEvery: 6,
    strumEvery: 3,
    strumOn: 2,
    melody: [
      76, 77, 79, REST, 79, REST, 81, 79, 77, 76, REST, REST,
      74, 76, 77, REST, 77, REST, 79, 77, 76, 74, REST, REST,
      72, 74, 76, REST, 79, REST, 84, REST, 81, 79, REST, 77,
      76, REST, 74, 72, REST, 74, 72, REST, REST, REST, REST, REST,
    ],
    chords: [C, GLOW, F, C],
  },
}

export const TRACK_IDS = Object.keys(TRACKS) as TrackId[]

function stepSeconds(track: Track): number {
  return 60 / track.bpm / 2
}

function frequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12)
}

function playTone(
  context: AudioContext,
  output: AudioNode,
  midi: number,
  time: number,
  length: number,
  type: OscillatorType,
  volume: number,
): void {
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.type = type
  oscillator.frequency.value = frequency(midi)
  gain.gain.setValueAtTime(volume, time)
  gain.gain.exponentialRampToValueAtTime(0.001, time + length)
  oscillator.connect(gain).connect(output)
  oscillator.start(time)
  oscillator.stop(time + length)
}

function scheduleStep(context: AudioContext, output: AudioNode, track: Track, step: number, time: number): void {
  const length = stepSeconds(track)
  const note = track.melody[step % track.melody.length]
  if (note !== REST) playTone(context, output, note, time, length * 1.6, 'square', 0.035)
  const position = step % (track.stepsPerChord * track.chords.length)
  const chord = track.chords[Math.floor(position / track.stepsPerChord)]
  const inChord = position % track.stepsPerChord
  if (inChord % track.bassEvery === 0) {
    playTone(context, output, chord[0], time, length * 2.6, 'triangle', 0.14)
  }
  if (inChord % track.strumEvery === track.strumOn) {
    const tone = chord[1 + (Math.floor(inChord / track.strumEvery) % 3)]
    playTone(context, output, tone, time, length, 'triangle', 0.05)
  }
}

export interface Music {
  play: () => void
  pause: () => void
  setTrack: (id: TrackId) => void
}

export function createMusic(initial: TrackId = 'intro'): Music | null {
  if (typeof AudioContext === 'undefined') return null
  let context: AudioContext | null = null
  let output: GainNode | null = null
  let timer: ReturnType<typeof setInterval> | null = null
  let step = 0
  let track = TRACKS[initial]
  let nextTime = 0

  const tick = () => {
    if (!context || !output) return
    while (nextTime < context.currentTime + LOOKAHEAD_SECONDS) {
      scheduleStep(context, output, track, step, nextTime)
      step += 1
      nextTime += stepSeconds(track)
    }
  }

  return {
    play() {
      if (!context) {
        context = new AudioContext()
        output = context.createGain()
        output.gain.value = MASTER_VOLUME
        output.connect(context.destination)
        nextTime = context.currentTime + 0.05
      }
      void context.resume()
      timer ??= setInterval(tick, TICK_MS)
    },
    pause() {
      if (timer !== null) clearInterval(timer)
      timer = null
      void context?.suspend()
    },
    setTrack(id) {
      if (track === TRACKS[id]) return
      track = TRACKS[id]
      step = 0
    },
  }
}
