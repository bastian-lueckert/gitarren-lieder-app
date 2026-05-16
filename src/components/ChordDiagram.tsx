import type { ChordPosition } from '@/lib/chords'

const STRINGS = 6
const FRETS_SHOWN = 4
const LEFT_X = 14
const TOP_Y = 24
const STR_SPACING = 16
const FRET_SPACING = 24
const RIGHT_X = LEFT_X + (STRINGS - 1) * STR_SPACING   // 94
const BOT_Y = TOP_Y + FRETS_SHOWN * FRET_SPACING        // 120
const DOT_R = 7
const MARKER_Y = TOP_Y - 11   // 13 — space for open/muted markers above nut
const VIEW_W = RIGHT_X + 14   // 108
const VIEW_H = BOT_Y + 10     // 130

function sx(i: number) { return LEFT_X + i * STR_SPACING }
function dy(p: number) { return TOP_Y + (p - 0.5) * FRET_SPACING }  // center of fret gap p (1-indexed)

interface Props {
  name: string
  position: ChordPosition | null
}

export function ChordDiagram({ name, position }: Props) {
  if (!position) {
    return (
      <div className="flex flex-col items-center gap-1.5">
        <div
          style={{ width: VIEW_W, height: VIEW_H }}
          className="flex items-center justify-center bg-zinc-900 rounded-lg border border-zinc-800 text-zinc-600 text-xs"
        >
          ?
        </div>
        <span className="text-xs font-mono text-zinc-500">{name}</span>
      </div>
    )
  }

  const { frets, fingers, baseFret, barres } = position
  const isNut = baseFret === 1

  // Barre: for each barre fret value, find string index range
  const barreData = barres.flatMap((b) => {
    const idxs = frets.reduce<number[]>((acc, f, i) => (f === b ? [...acc, i] : acc), [])
    if (idxs.length < 2) return []
    return [{ fret: b, min: Math.min(...idxs), max: Math.max(...idxs) }]
  })
  const barreSet = new Set(barres)

  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} width={VIEW_W} height={VIEW_H} className="block">
        {/* Nut (thick rect) or baseFret label */}
        {isNut ? (
          <rect x={LEFT_X} y={TOP_Y - 4} width={RIGHT_X - LEFT_X} height={4} fill="#a1a1aa" rx={1} />
        ) : (
          <text
            x={4} y={dy(1)}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={8} fill="#71717a"
          >
            {baseFret}
          </text>
        )}

        {/* Fret lines */}
        {Array.from({ length: FRETS_SHOWN + 1 }, (_, j) => (
          <line
            key={j}
            x1={LEFT_X} y1={TOP_Y + j * FRET_SPACING}
            x2={RIGHT_X} y2={TOP_Y + j * FRET_SPACING}
            stroke="#3f3f46" strokeWidth={1}
          />
        ))}

        {/* String lines */}
        {Array.from({ length: STRINGS }, (_, i) => (
          <line
            key={i}
            x1={sx(i)} y1={TOP_Y}
            x2={sx(i)} y2={BOT_Y}
            stroke="#3f3f46" strokeWidth={1}
          />
        ))}

        {/* Open / muted markers above nut */}
        {frets.map((f, i) => {
          if (f === -1) {
            const r = 4
            return (
              <g key={i}>
                <line x1={sx(i) - r} y1={MARKER_Y - r} x2={sx(i) + r} y2={MARKER_Y + r}
                  stroke="#71717a" strokeWidth={1.5} strokeLinecap="round" />
                <line x1={sx(i) + r} y1={MARKER_Y - r} x2={sx(i) - r} y2={MARKER_Y + r}
                  stroke="#71717a" strokeWidth={1.5} strokeLinecap="round" />
              </g>
            )
          }
          if (f === 0) {
            return (
              <circle key={i} cx={sx(i)} cy={MARKER_Y} r={4.5}
                fill="none" stroke="#71717a" strokeWidth={1.5} />
            )
          }
          return null
        })}

        {/* Barre bars */}
        {barreData.map(({ fret, min, max }) => (
          <rect
            key={fret}
            x={sx(min) - DOT_R} y={dy(fret) - DOT_R}
            width={sx(max) - sx(min) + DOT_R * 2} height={DOT_R * 2}
            rx={DOT_R} fill="#f59e0b"
          />
        ))}

        {/* Individual finger dots */}
        {frets.map((f, i) => {
          if (f <= 0 || barreSet.has(f)) return null
          return (
            <g key={i}>
              <circle cx={sx(i)} cy={dy(f)} r={DOT_R} fill="#f59e0b" />
              {fingers[i] > 0 && (
                <text
                  x={sx(i)} y={dy(f)}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={8} fill="#000" fontWeight="bold"
                >
                  {fingers[i]}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      <span className="text-xs font-mono text-zinc-300 font-semibold">{name}</span>
    </div>
  )
}
