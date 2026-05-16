export interface PracticePlan {
  id: string
  date: string           // YYYY-MM-DD
  songIds: string[]      // planned songs in random order
  completedIds: string[] // subset marked as practiced
  createdAt: Date
  updatedAt: Date
}
