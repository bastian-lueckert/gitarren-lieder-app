const MB_BASE = 'https://musicbrainz.org/ws/2'

export interface MBRecording {
  id: string
  title: string
  length?: number
  'artist-credit'?: Array<{ name: string; artist: { id: string; name: string } }>
  releases?: Array<{ id: string; title: string; date?: string }>
}

export async function searchMusicBrainz(artist: string, title: string): Promise<MBRecording[]> {
  // Lucene query: filter by both artist and recording title to avoid covers
  const parts: string[] = []
  if (artist.trim()) parts.push(`artist:"${artist.trim()}"`)
  if (title.trim()) parts.push(`recording:"${title.trim()}"`)
  const query = parts.join(' AND ')

  const params = new URLSearchParams({ query, fmt: 'json', limit: '20' })
  const res = await fetch(`${MB_BASE}/recording?${params}`)
  if (!res.ok) throw new Error('MusicBrainz request failed')
  const data = await res.json() as { recordings: MBRecording[] }
  return data.recordings ?? []
}

export function mbRecordingToSongData(rec: MBRecording) {
  const artist = rec['artist-credit']?.[0]?.name ?? 'Unknown'
  return {
    title: rec.title,
    artist,
    mbid: rec.id,
    durationSec: rec.length ? Math.round(rec.length / 1000) : undefined,
  }
}
