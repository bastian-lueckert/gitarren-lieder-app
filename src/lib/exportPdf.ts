import { jsPDF } from 'jspdf'
import type { SongSet } from '@/types/set'
import type { Song } from '@/types/song'
import { formatDurationSec, formatTotalDuration } from '@/lib/utils'

export function exportSongPdf(song: Song): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = 210
  const pageH = 297
  const mL = 15
  const mR = 15
  const mT = 18
  const mB = 15
  const contentW = pageW - mL - mR

  // ── Header ────────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(30, 30, 30)
  doc.text(song.title, mL, mT)
  let y = mT + 8

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  doc.setTextColor(90, 90, 90)
  doc.text(song.artist, mL, y)
  y += 7

  const meta: string[] = []
  if (song.bpm) meta.push(`${song.bpm} BPM`)
  if (song.musicalKey) meta.push(`Key: ${song.musicalKey}`)
  if (song.capo && song.capo > 0) meta.push(`Capo ${song.capo}`)
  if (song.timeSignature) meta.push(song.timeSignature)
  if (song.durationSec) meta.push(formatDurationSec(song.durationSec))
  if (meta.length > 0) {
    doc.setFontSize(9)
    doc.setTextColor(140, 140, 140)
    doc.text(meta.join('   ·   '), mL, y)
    y += 6
  }

  doc.setDrawColor(210, 210, 210)
  doc.setLineWidth(0.3)
  doc.line(mL, y, pageW - mR, y)
  y += 6

  const contentH = pageH - mB - y

  // ── Content ───────────────────────────────────────────────────────────────
  const hasChords = !!song.chords?.trim()
  const hasLyrics = !!song.lyrics?.trim()
  const SIZES = [9, 8, 7, 6.5, 6]
  const LH_FACTOR = 0.352778 * 1.45 // pt → mm × line-height

  if (hasChords && hasLyrics) {
    const colGap = 6
    const chordColW = 82
    const lyricColW = contentW - chordColW - colGap

    let sz = SIZES[0]
    let chordLines: string[] = []
    let lyricLines: string[] = []
    for (const s of SIZES) {
      doc.setFontSize(s)
      chordLines = doc.splitTextToSize(song.chords!, chordColW) as string[]
      lyricLines = doc.splitTextToSize(song.lyrics!, lyricColW) as string[]
      sz = s
      if (Math.max(chordLines.length, lyricLines.length) * s * LH_FACTOR <= contentH) break
    }
    const lh = sz * LH_FACTOR
    doc.setFontSize(sz)
    doc.setFont('courier', 'normal')
    doc.setTextColor(40, 40, 40)
    doc.text(chordLines, mL, y, { lineHeightFactor: 1.45 })
    doc.setFont('helvetica', 'normal')
    doc.text(lyricLines, mL + chordColW + colGap, y, { lineHeightFactor: 1.45 })
    void lh
  } else if (hasChords || hasLyrics) {
    const text = hasChords ? song.chords! : song.lyrics!
    let sz = SIZES[0]
    let lines: string[] = []
    for (const s of SIZES) {
      doc.setFontSize(s)
      lines = doc.splitTextToSize(text, contentW) as string[]
      sz = s
      if (lines.length * s * LH_FACTOR <= contentH) break
    }
    doc.setFontSize(sz)
    doc.setFont(hasChords ? 'courier' : 'helvetica', 'normal')
    doc.setTextColor(40, 40, 40)
    doc.text(lines, mL, y, { lineHeightFactor: 1.45 })
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  const dateStr = new Date().toLocaleDateString('de-DE', { dateStyle: 'medium' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(190, 190, 190)
  doc.text(`Gitarren-Lieder  ·  ${dateStr}`, mL, pageH - 7)

  doc.save(`${song.artist} - ${song.title}.pdf`)
}

export function exportSetPdf(set: SongSet, songs: Song[]): void {
  const orderedSongs = set.songIds
    .map((id) => songs.find((s) => s.id === id))
    .filter((s): s is Song => s != null)

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = 210
  const pageH = 297
  const marginL = 20
  const marginR = 20
  const textW = pageW - marginL - marginR

  // Header
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.text(set.name, marginL, 24)

  let headerY = 32
  if (set.description) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(100, 100, 100)
    doc.text(set.description, marginL, headerY)
    headerY += 7
  }

  // Total duration
  const totalSec = orderedSongs.reduce((sum, s) => sum + (s.durationSec ?? 0), 0)
  const knownCount = orderedSongs.filter((s) => s.durationSec).length
  const durationStr = totalSec > 0
    ? `${formatTotalDuration(totalSec)}${knownCount < orderedSongs.length ? '+' : ''}`
    : null

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(130, 130, 130)
  const meta = [`${orderedSongs.length} Songs`]
  if (durationStr) meta.push(durationStr)
  doc.text(meta.join('  ·  '), marginL, headerY)
  headerY += 6

  // Separator line
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.4)
  doc.line(marginL, headerY, pageW - marginR, headerY)

  let y = headerY + 8
  const lineH = 6
  const blockGap = 10

  orderedSongs.forEach((song, i) => {
    const blockH = 24
    if (y + blockH > pageH - 20) {
      doc.addPage()
      y = 20
    }

    // Number badge area
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(180, 120, 0)
    doc.text(`${i + 1}.`, marginL, y + 5)

    const indentX = marginL + 10

    // Title
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(30, 30, 30)
    const titleLines = doc.splitTextToSize(song.title, textW - 10) as string[]
    doc.text(titleLines, indentX, y + 5)
    y += Math.max(lineH + 1, titleLines.length * 6)

    // Artist
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(80, 80, 80)
    doc.text(song.artist, indentX, y + 1)
    y += lineH

    // Meta chips
    const chips: string[] = []
    if (song.bpm) chips.push(`${song.bpm} BPM`)
    if (song.musicalKey) chips.push(`Key: ${song.musicalKey}`)
    if (song.capo && song.capo > 0) chips.push(`Capo ${song.capo}`)
    if (song.durationSec) chips.push(formatDurationSec(song.durationSec))
    if (chips.length > 0) {
      doc.setFontSize(9)
      doc.setTextColor(130, 130, 130)
      doc.text(chips.join('   '), indentX, y + 1)
      y += lineH - 1
    }

    y += blockGap
  })

  // Footer
  const dateStr = new Date().toLocaleDateString('de-DE', { dateStyle: 'medium' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(180, 180, 180)
  doc.text(`Gitarren-Lieder  ·  ${dateStr}`, marginL, pageH - 10)

  doc.save(`${set.name}.pdf`)
}
