// Spotify audio-features endpoint is disabled for new apps since Nov 2024.
// BPM is determined via Tap Tempo in the import dialog or practice mode.
export function isSpotifyConfigured() {
  return false
}

export async function fetchTrackBpm(_artist: string, _title: string): Promise<number | null> {
  return null
}
