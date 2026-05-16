import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | undefined, locale: string): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(
    date instanceof Date ? date : new Date(date)
  )
}

export function formatDuration(ms: number): string {
  const totalSec = Math.round(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `${min}:${sec.toString().padStart(2, '0')}`
}

export function formatDurationSec(sec: number | undefined): string {
  if (sec == null || sec <= 0) return '—'
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function formatTotalDuration(totalSec: number): string {
  if (totalSec <= 0) return '0:00'
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function parseDurationInput(input: string): number | undefined {
  const mmss = input.match(/^(\d+):([0-5]?\d)$/)
  if (mmss) return parseInt(mmss[1]) * 60 + parseInt(mmss[2])
  const secs = parseInt(input)
  return !isNaN(secs) && secs > 0 ? secs : undefined
}
