import { describe, expect, it } from 'vitest'
import { TRACKS, TRACK_IDS } from './music'
import { SETUP_TRACKS, trackForSession } from './sound'

describe('music tracks', () => {
  it('keeps every track valid', () => {
    for (const track of Object.values(TRACKS)) {
      expect(track.melody).toHaveLength(track.stepsPerChord * track.chords.length)
      expect(track.bpm).toBeGreaterThanOrEqual(120)
      expect(track.bpm).toBeLessThanOrEqual(132)
      expect(track.stepsPerChord % track.bassEvery).toBe(0)
      expect(track.strumOn).toBeLessThan(track.strumEvery)
      for (const note of track.melody) expect(note === 0 || (note >= 48 && note <= 96)).toBe(true)
      for (const chord of track.chords) expect(chord).toHaveLength(4)
    }
  })

  it('gives every track its own melody', () => {
    const melodies = new Set(TRACK_IDS.map((id) => TRACKS[id].melody.join()))
    expect(melodies.size).toBe(TRACK_IDS.length)
  })

  it('maps each setup to a track', () => {
    expect(SETUP_TRACKS.home).toBe('intro')
    expect(SETUP_TRACKS.match).toBe('match')
    expect(trackForSession(true)).toBe('match')
    expect(trackForSession(false)).toBe('intro')
  })
})
