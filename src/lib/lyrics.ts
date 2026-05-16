export async function fetchLyrics(artist: string, title: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`
    )
    if (!res.ok) return null
    const data = await res.json() as { lyrics?: string; error?: string }
    if (data.error || !data.lyrics) return null
    return data.lyrics.trim()
  } catch {
    return null
  }
}
