import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Play, Square, Hand } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  startMetronome, stopMetronome, setMetronomeBpm,
  setDrumVolume, setClickVolume,
} from '@/lib/metronome'
import type { DrumPattern, TimeSignature } from '@/types/song'
import { cn } from '@/lib/utils'

interface MetronomeProps {
  bpm: number
  drumPattern: DrumPattern
  timeSignature: TimeSignature
  onBpmChange?: (bpm: number) => void
  // Controlled mode: lift playing state to parent
  playing?: boolean
  onPlayingChange?: (v: boolean) => void
}

export function Metronome({
  bpm: initialBpm, drumPattern, timeSignature, onBpmChange,
  playing: externalPlaying, onPlayingChange,
}: MetronomeProps) {
  const { t } = useTranslation()
  const isControlled = externalPlaying !== undefined

  const [internalPlaying, setInternalPlaying] = useState(false)
  const isPlaying = isControlled ? externalPlaying! : internalPlaying

  const [bpm, setBpm] = useState(initialBpm)
  const [currentBeat, setCurrentBeat] = useState(-1)
  const [drumVol, setDrumVol] = useState(70)
  const [clickVol, setClickVol] = useState(80)
  const beatsPerBar = parseInt(timeSignature.split('/')[0])
  const tapTimes = useRef<number[]>([])

  const handleBeat = useCallback((beat: number) => setCurrentBeat(beat), [])

  // Route playing state writes to the right place
  function setPlaying(v: boolean) {
    if (isControlled) onPlayingChange?.(v)
    else setInternalPlaying(v)
  }

  // When controlled playing changes from outside, start/stop audio
  useEffect(() => {
    if (!isControlled) return
    if (externalPlaying) {
      startMetronome(bpm, drumPattern, timeSignature, drumVol, clickVol, handleBeat)
    } else {
      stopMetronome()
      setCurrentBeat(-1)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalPlaying, isControlled])

  async function toggle() {
    if (isPlaying) {
      stopMetronome()
      setCurrentBeat(-1)
      setPlaying(false)
    } else {
      await startMetronome(bpm, drumPattern, timeSignature, drumVol, clickVol, handleBeat)
      setPlaying(true)
    }
  }

  function handleBpmChange(newBpm: number) {
    setBpm(newBpm)
    onBpmChange?.(newBpm)
    if (isPlaying) setMetronomeBpm(newBpm, timeSignature)
  }

  function handleTap() {
    const now = Date.now()
    const taps = [...tapTimes.current, now].filter((t) => now - t < 3000)
    tapTimes.current = taps
    if (taps.length >= 2) {
      const intervals = taps.slice(1).map((t, i) => t - taps[i])
      const avg = intervals.reduce((a, b) => a + b) / intervals.length
      const newBpm = Math.round(60000 / avg)
      handleBpmChange(Math.max(20, Math.min(300, newBpm)))
    }
  }

  function handleDrumVol(v: number[]) { setDrumVol(v[0]); setDrumVolume(v[0]) }
  function handleClickVol(v: number[]) { setClickVol(v[0]); setClickVolume(v[0]) }

  // Restart if pattern/signature changes while playing
  useEffect(() => {
    if (isPlaying) {
      stopMetronome()
      startMetronome(bpm, drumPattern, timeSignature, drumVol, clickVol, handleBeat)
        .then(() => { if (!isControlled) setInternalPlaying(true) })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drumPattern, timeSignature])

  useEffect(() => {
    return () => { stopMetronome() }
  }, [])

  return (
    <div className="space-y-5">
      {/* Beat indicator */}
      <div className="flex justify-center gap-3">
        {Array.from({ length: beatsPerBar }, (_, i) => (
          <div
            key={i}
            className={cn(
              'w-10 h-10 rounded-full border-2 transition-all duration-75',
              currentBeat === i && isPlaying
                ? i === 0
                  ? 'bg-amber-500 border-amber-400 scale-110'
                  : 'bg-zinc-400 border-zinc-300 scale-105'
                : 'bg-transparent border-zinc-700'
            )}
          />
        ))}
      </div>

      {/* BPM control */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-300">{t('practice.bpmLabel')}</span>
          <div className="flex items-center gap-2">
            <button
              className="w-8 h-8 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono font-bold flex items-center justify-center"
              onClick={() => handleBpmChange(Math.max(20, bpm - 1))}
            >−</button>
            <span className="text-2xl font-mono font-bold text-amber-400 w-16 text-center">{bpm}</span>
            <button
              className="w-8 h-8 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono font-bold flex items-center justify-center"
              onClick={() => handleBpmChange(Math.min(300, bpm + 1))}
            >+</button>
          </div>
        </div>
        <Slider min={20} max={300} step={1} value={[bpm]} onValueChange={(v) => handleBpmChange(v[0])} />
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <Button onClick={toggle} size="lg" className="flex-1" variant={isPlaying ? 'destructive' : 'default'}>
          {isPlaying ? <Square className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          {isPlaying ? t('practice.stopMetronome') : t('practice.startMetronome')}
        </Button>
        <Button onClick={handleTap} variant="secondary" size="lg">
          <Hand className="h-5 w-5" />
          {t('practice.tapTempo')}
        </Button>
      </div>

      {/* Volume controls */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-zinc-500">
            <span>{t('practice.drumVolume')}</span><span>{drumVol}%</span>
          </div>
          <Slider min={0} max={100} step={1} value={[drumVol]} onValueChange={handleDrumVol} />
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-zinc-500">
            <span>{t('practice.clickVolume')}</span><span>{clickVol}%</span>
          </div>
          <Slider min={0} max={100} step={1} value={[clickVol]} onValueChange={handleClickVol} />
        </div>
      </div>
    </div>
  )
}
