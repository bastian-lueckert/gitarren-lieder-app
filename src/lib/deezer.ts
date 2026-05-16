// /api/deezer/* is proxied to https://api.deezer.com/* in dev (Vite) and
// handled by api/deezer.ts serverless function in prod (Vercel).

interface DeezerSearchTrack {
  id: number
  title: string
  artist: { name: string }
}

interface DeezerSearchResult {
  data?: DeezerSearchTrack[]
}

interface DeezerTrack {
  id: number
  title: string
  bpm: number
  artist: { name: string }
}

async function searchTrack(q: string, limit = 5): Promise<DeezerSearchTrack[]> {
  const res = await fetch(`/api/deezer/search?q=${encodeURIComponent(q)}&limit=${limit}`)
  if (!res.ok) return []
  const data = await res.json() as DeezerSearchResult
  return data.data ?? []
}

async function getTrack(id: number): Promise<DeezerTrack | null> {
  const res = await fetch(`/api/deezer/track/${id}`)
  if (!res.ok) return null
  return await res.json() as DeezerTrack
}

export async function fetchBpmFromDeezer(artist: string, title: string): Promise<number | null> {
  try {
    // Precise search first, then broader fallback
    let tracks = await searchTrack(`artist:"${artist}" track:"${title}"`, 3)
    if (!tracks.length) {
      tracks = await searchTrack(`${artist} ${title}`, 5)
    }
    if (!tracks.length) return null

    // BPM is only available in the full track object, not in search results
    const track = await getTrack(tracks[0].id)
    if (!track) return null

    return track.bpm > 0 ? Math.round(track.bpm) : null
  } catch {
    return null
  }
}
