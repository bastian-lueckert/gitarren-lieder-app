const MB_BASE = 'https://musicbrainz.org/ws/2'
const UA = 'GuitarSongsApp/1.0 (bastian.lueckert@googlemail.com)'

export interface MBRecording {
  id: string
  title: string
  length?: number
  'artist-credit'?: Array<{ name: string; artist: { id: string; name: string } }>
  releases?: Array<{ id: string; title: string; date?: string }>
}

export async function searchMusicBrainz(query: string): Promise<MBRecording[]> {
  const params = new URLSearchParams({
    query,
    fmt: 'json',
    limit: '20',
  })
  const res = await fetch(`${MB_BASE}/recording?${params}`, {
    headers: { 'User-Agent': UA },
  })
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
  }
}
