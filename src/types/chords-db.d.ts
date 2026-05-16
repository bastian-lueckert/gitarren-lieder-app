declare module '@tombatossals/chords-db/lib/guitar.json' {
  export interface ChordPosition {
    frets: number[]
    fingers: number[]
    baseFret: number
    barres: number[]
    capo?: boolean
    midi?: number[]
  }
  export interface ChordDef {
    key: string
    suffix: string
    positions: ChordPosition[]
  }
  interface GuitarDb {
    main: { strings: number; fretsOnChord: number; name: string; numberOfChords: number }
    tunings: { standard: string[] }
    keys: string[]
    suffixes: string[]
    chords: Record<string, ChordDef[]>
  }
  const data: GuitarDb
  export default data
}
