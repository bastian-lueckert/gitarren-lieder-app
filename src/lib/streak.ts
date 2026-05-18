const KEY = 'practiceDates'

export function recordPracticeToday(): void {
  const today = new Date().toISOString().slice(0, 10)
  const dates: string[] = JSON.parse(localStorage.getItem(KEY) ?? '[]')
  if (!dates.includes(today)) {
    dates.push(today)
    localStorage.setItem(KEY, JSON.stringify(dates))
  }
}

export function getStreak(): number {
  const dates: string[] = JSON.parse(localStorage.getItem(KEY) ?? '[]')
  if (dates.length === 0) return 0

  const unique = [...new Set(dates)].sort().reverse() // newest first
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)

  if (unique[0] !== today && unique[0] !== yesterday) return 0

  let streak = 1
  for (let i = 1; i < unique.length; i++) {
    const prev = new Date(unique[i - 1])
    prev.setDate(prev.getDate() - 1)
    if (unique[i] === prev.toISOString().slice(0, 10)) streak++
    else break
  }
  return streak
}
