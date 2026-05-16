import * as Tone from 'tone'
import type { DrumPattern, TimeSignature } from '@/types/song'

type StepGrid = boolean[][]

function makeGrid(steps: number): StepGrid {
  return Array.from({ length: steps }, () => [false, false, false, false])
}

const PATTERNS: Record<DrumPattern, { steps: number; grid: (steps: number) => StepGrid }> = {
  none: {
    steps: 16,
    grid: (steps) => {
      const g = makeGrid(steps)
      for (let i = 0; i < steps; i += 4) g[i][0] = true
      return g
    },
  },
  rock: {
    steps: 16,
    grid: (steps) => {
      const g = makeGrid(steps)
      for (let i = 0; i < steps; i++) {
        if (i === 0 || i === 8) g[i][0] = true
        if (i === 4 || i === 12) g[i][1] = true
        if (i % 2 === 0) g[i][2] = true
      }
      return g
    },
  },
  pop: {
    steps: 16,
    grid: (steps) => {
      const g = makeGrid(steps)
      for (let i = 0; i < steps; i++) {
        if (i === 0 || i === 6 || i === 10) g[i][0] = true
        if (i === 4 || i === 12) g[i][1] = true
        g[i][2] = true
      }
      return g
    },
  },
  folk: {
    steps: 16,
    grid: (steps) => {
      const g = makeGrid(steps)
      for (let i = 0; i < steps; i++) {
        if (i === 0 || i === 8) g[i][0] = true
        if (i === 4 || i === 12) g[i][1] = true
        if (i % 4 === 0) g[i][2] = true
      }
      return g
    },
  },
  waltz: {
    steps: 12,
    grid: (steps) => {
      const g = makeGrid(steps)
      for (let i = 0; i < steps; i++) {
        if (i === 0) g[i][0] = true
        if (i === 4 || i === 8) g[i][1] = true
        if (i % 2 === 0) g[i][2] = true
      }
      return g
    },
  },
  bossanova: {
    steps: 16,
    grid: (steps) => {
      const g = makeGrid(steps)
      const kicks = [0, 6, 10]
      const snares = [3, 7, 12, 15]
      for (let i = 0; i < steps; i++) {
        if (kicks.includes(i)) g[i][0] = true
        if (snares.includes(i)) g[i][1] = true
        if (i % 2 === 0) g[i][2] = true
        if (i % 3 === 0) g[i][3] = true
      }
      return g
    },
  },
  blues: {
    steps: 12,
    grid: (steps) => {
      const g = makeGrid(steps)
      for (let i = 0; i < steps; i++) {
        if (i === 0 || i === 6) g[i][0] = true
        if (i === 4 || i === 10) g[i][1] = true
        if (i % 3 === 0) g[i][2] = true
      }
      return g
    },
  },
  country: {
    steps: 16,
    grid: (steps) => {
      const g = makeGrid(steps)
      for (let i = 0; i < steps; i++) {
        if (i === 0 || i === 8) g[i][0] = true
        if (i === 4 || i === 12) g[i][1] = true
        if (i % 2 === 0) g[i][2] = true
      }
      return g
    },
  },
}

let sequence: Tone.Sequence | null = null
let kick: Tone.MembraneSynth | null = null
let snare: Tone.NoiseSynth | null = null
let hihat: Tone.MetalSynth | null = null
let clickSynth: Tone.Synth | null = null
let onBeatCb: ((beat: number, totalBeats: number) => void) | null = null

function buildSynths(drumVol: number, clickVol: number) {
  disposeSynths()
  const dv = Tone.gainToDb(drumVol / 100)
  const cv = Tone.gainToDb(clickVol / 100)

  kick = new Tone.MembraneSynth({
    pitchDecay: 0.05, octaves: 6,
    envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.1 },
    volume: dv,
  }).toDestination()

  snare = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.05 },
    volume: dv - 3,
  }).toDestination()

  hihat = new Tone.MetalSynth({
    envelope: { attack: 0.001, decay: 0.04, release: 0.01 },
    harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5,
    volume: dv - 10,
  }).toDestination()

  clickSynth = new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.01 },
    volume: cv,
  }).toDestination()
}

function disposeSynths() {
  sequence?.dispose(); sequence = null
  kick?.dispose(); kick = null
  snare?.dispose(); snare = null
  hihat?.dispose(); hihat = null
  clickSynth?.dispose(); clickSynth = null
}

export async function startMetronome(
  bpm: number,
  pattern: DrumPattern,
  timeSignature: TimeSignature,
  drumVolume: number,
  clickVolume: number,
  onBeat: (beat: number, totalBeats: number) => void
) {
  await Tone.start()
  Tone.getTransport().stop()
  Tone.getTransport().cancel()

  buildSynths(drumVolume, clickVolume)

  const patternDef = PATTERNS[pattern] ?? PATTERNS.rock
  const steps = patternDef.steps
  const grid = patternDef.grid(steps)

  const beatsPerBar = parseInt(timeSignature.split('/')[0])
  const stepsPerBeat = steps / beatsPerBar
  onBeatCb = onBeat

  Tone.getTransport().bpm.value = bpm

  sequence = new Tone.Sequence(
    (time, step: number) => {
      const row = grid[step]
      if (row[0]) kick?.triggerAttackRelease('C1', '8n', time)
      if (row[1]) snare?.triggerAttackRelease('8n', time)
      if (row[2]) hihat?.triggerAttackRelease('C6', '16n', time)
      if (row[3]) hihat?.triggerAttackRelease('C6', '32n', time)

      if (step === 0 && clickSynth) {
        clickSynth.triggerAttackRelease('C5', '16n', time)
      } else if (step % Math.round(stepsPerBeat) === 0 && clickSynth) {
        clickSynth.triggerAttackRelease('C4', '16n', time)
      }

      const beatNum = Math.floor(step / stepsPerBeat)
      const drawInstance = Tone.getDraw()
      drawInstance.schedule(() => {
        onBeatCb?.(beatNum, beatsPerBar)
      }, time)
    },
    Array.from({ length: steps }, (_, i) => i),
    '16n'
  )

  sequence.start(0)
  Tone.getTransport().start()
}

export function stopMetronome() {
  Tone.getTransport().stop()
  try { sequence?.stop(Math.max(0, Tone.now())) } catch { /* ignore float precision errors */ }
  disposeSynths()
}

export function setMetronomeBpm(bpm: number, _timeSignature: TimeSignature) {
  Tone.getTransport().bpm.value = bpm
}

export function setDrumVolume(vol: number) {
  const dv = Tone.gainToDb(vol / 100)
  if (kick) kick.volume.value = dv
  if (snare) snare.volume.value = dv - 3
  if (hihat) hihat.volume.value = dv - 10
}

export function setClickVolume(vol: number) {
  if (clickSynth) clickSynth.volume.value = Tone.gainToDb(vol / 100)
}
