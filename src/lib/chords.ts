import guitarDb from '@tombatossals/chords-db/lib/guitar.json'
import type { ChordPosition } from '@tombatossals/chords-db/lib/guitar.json'

export type { ChordPosition }

const ROOT_MAP: Record<string, string> = {
  C: 'C', 'C#': 'Csharp', Db: 'Db', D: 'D', 'D#': 'Eb', Eb: 'Eb',
  E: 'E', F: 'F', 'F#': 'Fsharp', Gb: 'Fsharp', G: 'G',
  'G#': 'Ab', Ab: 'Ab', A: 'A', 'A#': 'Bb', Bb: 'Bb', B: 'B',
}

const SUFFIX_MAP: Record<string, string> = {
  '': 'major',
  m: 'minor', min: 'minor',
  M: 'major', maj: 'major',
  '7': '7',
  m7: 'minor7', M7: 'maj7', maj7: 'maj7',
  dim: 'dim', dim7: 'dim7',
  aug: 'aug',
  sus: 'sus4', sus2: 'sus2', sus4: 'sus4',
  add9: 'add9', add2: 'add9',
  '5': '5', '6': '6', '9': '9', '11': '11', '13': '13',
  m9: 'minor9', maj9: 'maj9',
  '6/9': '69', '69': '69',
  mmaj7: 'mmaj7',
}

// Matches chord names like Am, G, Cmaj7, F#m, Bb, D/F#, Dsus4, Cadd9
const CHORD_RE = /^([A-G][#b]?)(m(?:aj[679]?|in)?[0-9]*|maj[679]?|dim[0-9]*|aug|sus[24]?|add[29]?|[679]|11|13|M[79]?)?(\/[A-G][#b]?)?$/

export function extractChordsFromText(text: string): string[] {
  if (!text) return []
  const seen = new Set<string>()
  const result: string[] = []
  const tokens = text
    .replace(/\[[^\]]*\]/g, ' ')  // strip [Verse], [Chorus] etc.
    .split(/[\s|,]+/)
  for (const token of tokens) {
    const clean = token.replace(/[()]/g, '')
    if (!clean || seen.has(clean)) continue
    if (CHORD_RE.test(clean)) {
      seen.add(clean)
      result.push(clean)
    }
  }
  return result
}

export function lookupChord(chordName: string): ChordPosition | null {
  const m = chordName.match(CHORD_RE)
  if (!m) return null
  const root = m[1]
  const rawSuffix = m[2] ?? ''
  const dbKey = ROOT_MAP[root]
  if (!dbKey) return null
  const dbSuffix = SUFFIX_MAP[rawSuffix] ?? 'major'
  const defs = (guitarDb.chords as Record<string, import('@tombatossals/chords-db/lib/guitar.json').ChordDef[]>)[dbKey] ?? []
  const def = defs.find((c) => c.suffix === dbSuffix) ?? defs[0]
  return def?.positions[0] ?? null
}
