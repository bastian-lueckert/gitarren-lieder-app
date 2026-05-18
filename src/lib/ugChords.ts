export async function fetchUGChords(artist: string, title: string): Promise<string | null> {
  try {
    const url = `/api/ug-chords?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(title)}`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json() as { chords?: string }
    return data.chords ?? null
  } catch {
    return null
  }
}
