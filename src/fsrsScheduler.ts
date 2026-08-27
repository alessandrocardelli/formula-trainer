import { createEmptyCard, fsrs, Rating, type Card } from 'ts-fsrs'
import {
  db,
  type PracticeLogRecord,
  type PracticeMode,
  type ReviewCardRecord,
} from './db'

const scheduler = fsrs()
const practiceModes: PracticeMode[] = ['full-recall', 'missing-term']

export interface ReviewQueueSummary {
  total: number
  dueNow: number
  nextDue?: number
}

export interface NextReview {
  formulaId: number
  due: number
  dueNow: boolean
}

function ratingForLog(log: PracticeLogRecord) {
  if (log.action === 'check' && log.correct === true) {
    return Rating.Good
  }

  return Rating.Again
}

function cardToRecord(
  formulaId: number,
  mode: PracticeMode,
  card: Card,
): Omit<ReviewCardRecord, 'id'> {
  return {
    formulaId,
    mode,
    due: card.due.getTime(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    learning_steps: card.learning_steps,
    state: Number(card.state),
    last_review: card.last_review?.getTime(),
    updatedAt: Date.now(),
  }
}

async function persistCard(formulaId: number, mode: PracticeMode, card: Card) {
  const existing = await db.reviewCards
    .where('[formulaId+mode]')
    .equals([formulaId, mode])
    .first()
  const record = cardToRecord(formulaId, mode, card)

  if (existing) {
    await db.reviewCards.update(existing.id, record)
    return existing.id
  }

  return db.reviewCards.add(record)
}

export async function rebuildReviewCardFromHistory(
  formulaId: number,
  mode: PracticeMode,
) {
  const logs = await db.practiceLogs
    .where('[formulaId+mode]')
    .equals([formulaId, mode])
    .sortBy('createdAt')

  const firstReviewAt = logs[0]?.createdAt ?? Date.now()
  let card = createEmptyCard(new Date(firstReviewAt))

  for (const log of logs) {
    card = scheduler.next(card, new Date(log.createdAt), ratingForLog(log)).card
  }

  await persistCard(formulaId, mode, card)
  return card
}

export async function ensureReviewCard(formulaId: number, mode: PracticeMode) {
  const existing = await db.reviewCards
    .where('[formulaId+mode]')
    .equals([formulaId, mode])
    .first()

  if (existing) {
    return existing
  }

  await rebuildReviewCardFromHistory(formulaId, mode)
  return db.reviewCards
    .where('[formulaId+mode]')
    .equals([formulaId, mode])
    .first()
}

export async function ensureReviewCards(formulaIds: number[]) {
  for (const formulaId of formulaIds) {
    for (const mode of practiceModes) {
      await ensureReviewCard(formulaId, mode)
    }
  }
}

export async function rebuildAllReviewCards() {
  const formulas = await db.formulas.toArray()
  const activeFormulaIds = new Set(formulas.map((formula) => formula.id))

  await db.reviewCards
    .filter((card) => !activeFormulaIds.has(card.formulaId))
    .delete()

  for (const formula of formulas) {
    for (const mode of practiceModes) {
      await rebuildReviewCardFromHistory(formula.id, mode)
    }
  }
}

export async function getReviewQueueSummary(
  formulaIds: number[],
  mode?: PracticeMode,
  now = Date.now(),
): Promise<ReviewQueueSummary> {
  if (formulaIds.length === 0) {
    return { total: 0, dueNow: 0 }
  }

  await ensureReviewCards(formulaIds)
  const allowed = new Set(formulaIds)
  const cards = (await db.reviewCards.toArray()).filter(
    (card) => allowed.has(card.formulaId) && (!mode || card.mode === mode),
  )
  const futureDue = cards
    .filter((card) => card.due > now)
    .map((card) => card.due)
    .sort((a, b) => a - b)

  return {
    total: cards.length,
    dueNow: cards.filter((card) => card.due <= now).length,
    nextDue: futureDue[0],
  }
}

export async function getNextReview(
  formulaIds: number[],
  mode: PracticeMode,
  excludeFormulaId?: number,
  now = Date.now(),
): Promise<NextReview | null> {
  if (formulaIds.length === 0) {
    return null
  }

  await ensureReviewCards(formulaIds)
  const allowed = new Set(formulaIds)
  const cards = (await db.reviewCards.where('mode').equals(mode).toArray())
    .filter((card) => allowed.has(card.formulaId))
    .sort((a, b) => a.due - b.due)

  if (cards.length === 0) {
    return null
  }

  const dueCards = cards.filter((card) => card.due <= now)
  const pool = dueCards.length > 0 ? dueCards : cards
  const card = pool.find((candidate) => candidate.formulaId !== excludeFormulaId) ?? pool[0]

  return {
    formulaId: card.formulaId,
    due: card.due,
    dueNow: card.due <= now,
  }
}

export async function removeReviewDataForFormula(formulaId: number) {
  await db.reviewCards.where('formulaId').equals(formulaId).delete()
}
