export interface SongSet {
  id: string
  name: string
  description?: string
  songIds: string[]
  createdAt: Date
  updatedAt: Date
  shareToken?: string
}
