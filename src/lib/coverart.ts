export async function fetchCoverArt(artist: string, title: string): Promise<string | null> {
  try {
    const q = encodeURIComponent(`${artist} ${title}`)
    const res = await fetch(
      `https://itunes.apple.com/search?term=${q}&media=music&entity=song&limit=5`
    )
    if (!res.ok) return null
    const data = await res.json() as { results?: Array<{ artworkUrl100?: string }> }
    const url = data.results?.[0]?.artworkUrl100
    if (!url) return null
    return url.replace('100x100bb', '300x300bb')
  } catch {
    return null
  }
}
