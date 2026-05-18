import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Mic, MicOff } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const GUITAR_STRINGS = [
  { note: 'E', octave: 4, freq: 329.63 },
  { note: 'B', octave: 3, freq: 246.94 },
  { note: 'G', octave: 3, freq: 196.00 },
  { note: 'D', octave: 3, freq: 146.83 },
  { note: 'A', octave: 2, freq: 110.00 },
  { note: 'E', octave: 2, freq: 82.41  },
]

function autoCorrelate(buf: Float32Array, sampleRate: number): number {
  const SIZE = buf.length
  let rms = 0
  for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i]
  rms = Math.sqrt(rms / SIZE)
  if (rms < 0.015) return -1

  // Trim silent edges
  let r1 = 0, r2 = SIZE - 1
  for (let i = 0; i < SIZE / 2; i++) { if (Math.abs(buf[i]) >= 0.2) { r1 = i; break } }
  for (let i = 1; i < SIZE / 2; i++) { if (Math.abs(buf[SIZE - i]) >= 0.2) { r2 = SIZE - i; break } }
  const buf2 = buf.slice(r1, r2)
  const len = buf2.length

  // Autocorrelation
  const c = new Float32Array(len)
  for (let i = 0; i < len; i++)
    for (let j = 0; j < len - i; j++) c[i] += buf2[j] * buf2[j + i]

  let d = 0
  while (c[d] > c[d + 1]) d++
  let maxVal = -1, maxPos = -1
  for (let i = d; i < len; i++) { if (c[i] > maxVal) { maxVal = c[i]; maxPos = i } }
  if (maxPos < 1) return -1

  // Quadratic interpolation
  const x1 = c[maxPos - 1], x2 = c[maxPos], x3 = c[maxPos + 1]
  const period = maxPos + (x3 - x1) / (2 * (2 * x2 - x3 - x1))
  return sampleRate / period
}

function freqToNote(freq: number) {
  const midi = 12 * Math.log2(freq / 440) + 69
  const rounded = Math.round(midi)
  const cents = Math.round((midi - rounded) * 100)
  return {
    name: NOTE_NAMES[((rounded % 12) + 12) % 12],
    octave: Math.floor(rounded / 12) - 1,
    cents,
  }
}

interface TunerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TunerDialog({ open, onOpenChange }: TunerDialogProps) {
  const { t } = useTranslation()
  const [active, setActive] = useState(false)
  const [detected, setDetected] = useState<{ name: string; octave: number; cents: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)

  function tick() {
    const analyser = analyserRef.current
    if (!analyser) return
    const buf = new Float32Array(analyser.fftSize)
    analyser.getFloatTimeDomainData(buf)
    const freq = autoCorrelate(buf, audioCtxRef.current!.sampleRate)
    if (freq > 60 && freq < 1200) setDetected(freqToNote(freq))
    else setDetected(null)
    rafRef.current = requestAnimationFrame(tick)
  }

  async function start() {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      streamRef.current = stream
      const ctx = new AudioContext()
      audioCtxRef.current = ctx
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 2048
      analyserRef.current = analyser
      ctx.createMediaStreamSource(stream).connect(analyser)
      setActive(true)
      rafRef.current = requestAnimationFrame(tick)
    } catch {
      setError(t('tuner.micError'))
    }
  }

  function stop() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    audioCtxRef.current?.close()
    audioCtxRef.current = null
    analyserRef.current = null
    streamRef.current = null
    setActive(false)
    setDetected(null)
  }

  useEffect(() => {
    if (!open) stop()
    return () => { stop() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const cents = detected?.cents ?? 0
  const inTune = Math.abs(cents) <= 10
  const close = Math.abs(cents) <= 25

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-amber-400" />
            {t('tuner.title')}
          </DialogTitle>
        </DialogHeader>

        {/* Note display */}
        <div className="flex flex-col items-center gap-4 py-2">
          <div className={cn(
            'w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center transition-colors',
            !active ? 'border-zinc-700 text-zinc-600' :
            !detected ? 'border-zinc-700 text-zinc-600' :
            inTune ? 'border-green-500 text-green-400' :
            close ? 'border-amber-500 text-amber-400' :
            'border-red-500 text-red-400'
          )}>
            <span className="text-5xl font-bold leading-none">
              {active && detected ? detected.name : '—'}
            </span>
            {active && detected && (
              <span className="text-sm text-zinc-400">{detected.octave}</span>
            )}
          </div>

          {/* Cents needle */}
          <div className="w-full space-y-1">
            <div className="relative h-3 rounded-full bg-zinc-800 overflow-hidden">
              {/* Center mark */}
              <div className="absolute left-1/2 top-0 w-0.5 h-full bg-zinc-600 -translate-x-1/2" />
              {active && detected && (
                <div
                  className={cn(
                    'absolute top-1 h-1.5 w-3 rounded-full -translate-x-1/2 transition-all',
                    inTune ? 'bg-green-500' : close ? 'bg-amber-500' : 'bg-red-500'
                  )}
                  style={{ left: `${50 + (cents / 50) * 50}%` }}
                />
              )}
            </div>
            <div className="flex justify-between text-xs text-zinc-600">
              <span>−50</span>
              <span className={cn('font-mono', active && detected && (inTune ? 'text-green-400' : close ? 'text-amber-400' : 'text-red-400'))}>
                {active && detected ? `${cents > 0 ? '+' : ''}${cents}¢` : '0¢'}
              </span>
              <span>+50</span>
            </div>
          </div>

          {/* Start / Stop */}
          <button
            onClick={active ? stop : start}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors',
              active
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-amber-500 hover:bg-amber-400 text-zinc-950'
            )}
          >
            {active ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            {active ? t('tuner.stop') : t('tuner.start')}
          </button>

          {error && <p className="text-xs text-red-400 text-center">{error}</p>}
          {active && !detected && <p className="text-xs text-zinc-500">{t('tuner.listening')}</p>}
          {active && detected && inTune && <p className="text-xs text-green-400 font-medium">{t('tuner.inTune')}</p>}

          {/* Guitar string reference */}
          <div className="w-full border-t border-zinc-800 pt-3">
            <p className="text-xs text-zinc-500 text-center mb-2">{t('tuner.standardTuning')}</p>
            <div className="flex justify-center gap-2">
              {GUITAR_STRINGS.map((s, i) => {
                const isNearest = detected
                  ? GUITAR_STRINGS.reduce((best, cur) =>
                      Math.abs(cur.freq - Math.pow(2, (12 * Math.log2(440 * Math.pow(2, (detected ? 12 * Math.log2(freqToNote(s.freq).octave) : 0) / 12)) / 12) / 440) / 1) < 1
                        ? cur : best, GUITAR_STRINGS[0]).note === s.note
                  : false
                void isNearest
                return (
                  <div key={i} className="flex flex-col items-center gap-0.5">
                    <span className="text-xs font-bold text-zinc-300">{s.note}</span>
                    <span className="text-xs text-zinc-600">{s.octave}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
