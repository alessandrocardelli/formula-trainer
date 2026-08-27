import { db } from './db'

export interface LearningDataResetResult {
  practiceEventsRemoved: number
  reviewCardsRemoved: number
}

export async function resetLearningData(): Promise<LearningDataResetResult> {
  return db.transaction('rw', db.practiceLogs, db.reviewCards, async () => {
    const [practiceEventsRemoved, reviewCardsRemoved] = await Promise.all([
      db.practiceLogs.count(),
      db.reviewCards.count(),
    ])

    await Promise.all([
      db.practiceLogs.clear(),
      db.reviewCards.clear(),
    ])

    return {
      practiceEventsRemoved,
      reviewCardsRemoved,
    }
  })
}
