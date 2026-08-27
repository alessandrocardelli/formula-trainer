import { db } from './db'

export interface LearningDataResetResult {
  practiceEvents: number
  reviewCards: number
}

export async function resetLearningData(): Promise<LearningDataResetResult> {
  return db.transaction('rw', db.practiceLogs, db.reviewCards, async () => {
    const [practiceEvents, reviewCards] = await Promise.all([
      db.practiceLogs.count(),
      db.reviewCards.count(),
    ])

    await Promise.all([
      db.practiceLogs.clear(),
      db.reviewCards.clear(),
    ])

    return { practiceEvents, reviewCards }
  })
}
