import React from 'react'

// Matches chord token names like Am, G, C#m7, Gsus4, F/C, A7(4)
const CHORD_TOKEN_RE = /^[A-G][#b]?(?:(?:m(?:aj)?|dim|aug|sus[24]?|add)?[0-9]*)(?:\/[A-G][#b]?)?(?:\([0-9]+\))?$/

function isChordToken(s: string): boolean {
  return s.length >= 1 && s.length <= 8 && CHORD_TOKEN_RE.test(s)
}

function isChordLine(line: string): boolean {
  const s = line.trim()
  if (!s || /^\[.+\]/.test(s)) return false
  const tokens = s.split(/\s+/)
  const n = tokens.filter(isChordToken).length
  return n > 0 && n / tokens.length >= 0.6
}

type Segment = { chord?: string; text: string }

function buildSegments(chordLine: string, lyricLine: string): Segment[] {
  const chords: { col: number; name: string }[] = []
  for (const m of chordLine.matchAll(/\S+/g)) {
    if (isChordToken(m[0])) chords.push({ col: m.index!, name: m[0] })
  }
  if (chords.length === 0) return [{ text: lyricLine }]

  // Word start positions in lyric line — round chord positions to nearest word boundary
  const wordStarts: number[] = [0]
  for (let j = 1; j < lyricLine.length; j++) {
    if (lyricLine[j - 1] === ' ' && lyricLine[j] !== ' ') wordStarts.push(j)
  }
  function nearestWord(col: number): number {
    if (col <= 0) return 0
    return wordStarts.find((b) => b >= col) ?? lyricLine.length
  }

  // Map chord columns to word boundaries, deduplicate
  const mapped: { pos: number; chord: string }[] = []
  for (const { col, name } of chords) {
    const pos = nearestWord(col)
    if (mapped.length === 0 || mapped[mapped.length - 1].pos !== pos) {
      mapped.push({ pos, chord: name })
    }
  }

  const segs: Segment[] = []
  if (mapped[0].pos > 0) segs.push({ text: lyricLine.slice(0, mapped[0].pos) })
  for (let i = 0; i < mapped.length; i++) {
    const from = mapped[i].pos
    const to = i + 1 < mapped.length ? mapped[i + 1].pos : lyricLine.length
    segs.push({ chord: mapped[i].chord, text: lyricLine.slice(from, to || undefined) })
  }
  return segs
}

interface ChordSheetProps {
  content: string
  fontSize?: number   // rem
  lineHeight?: number
  className?: string
}

export function ChordSheet({ content, fontSize = 0.875, lineHeight = 1.75, className }: ChordSheetProps) {
  const chordFontSize = `${fontSize * 0.78}rem`
  const chordMinHeight = `${fontSize * 1.1}rem`

  const lines = content.split('\n')
  const nodes: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Blank line → small gap
    if (!line.trim()) {
      nodes.push(<div key={`sp${i}`} style={{ height: `${fontSize * 0.7}rem` }} />)
      i++
      continue
    }

    // Section header: [Verse], [Chorus], [Intro] …
    if (/^\s*\[.+\]\s*$/.test(line)) {
      nodes.push(
        <div
          key={i}
          className="text-amber-500/80 font-bold uppercase tracking-wide"
          style={{ fontSize: `${fontSize * 0.72}rem`, marginTop: `${fontSize * 0.8}rem`, marginBottom: `${fontSize * 0.15}rem` }}
        >
          {line.trim()}
        </div>
      )
      i++
      continue
    }

    // Chord line + lyric line pair → inline rendering
    const next = lines[i + 1]
    if (
      isChordLine(line) &&
      next != null &&
      next.trim() &&
      !isChordLine(next) &&
      !/^\s*\[.+\]\s*$/.test(next)
    ) {
      const segs = buildSegments(line, next)
      nodes.push(
        <div key={i} className="flex flex-wrap" style={{ marginBottom: `${fontSize * 0.5}rem` }}>
          {segs.map((seg, j) => (
            <span key={j} className="inline-flex flex-col items-start">
              {/* Chord name row — always present to maintain consistent height */}
              <span
                className="font-bold text-amber-400 leading-none block"
                style={{ fontSize: chordFontSize, minHeight: chordMinHeight }}
              >
                {seg.chord ?? ''}
              </span>
              {/* Lyric text row */}
              <span className="text-zinc-200 whitespace-pre" style={{ lineHeight }}>
                {seg.text || ' '}
              </span>
            </span>
          ))}
        </div>
      )
      i += 2
      continue
    }

    // Chord-only line (no following lyric)
    if (isChordLine(line)) {
      nodes.push(
        <div
          key={i}
          className="text-amber-400 font-bold whitespace-pre-wrap"
          style={{ fontSize: `${fontSize}rem`, lineHeight, marginBottom: `${fontSize * 0.2}rem` }}
        >
          {line}
        </div>
      )
      i++
      continue
    }

    // Plain lyric / text line
    nodes.push(
      <div
        key={i}
        className="text-zinc-200 whitespace-pre-wrap"
        style={{ fontSize: `${fontSize}rem`, lineHeight }}
      >
        {line}
      </div>
    )
    i++
  }

  return (
    <div className={`font-mono select-text ${className ?? ''}`}>
      {nodes}
    </div>
  )
}
