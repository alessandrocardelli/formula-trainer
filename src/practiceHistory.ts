import { db, type PracticeMode } from './db'

export interface PracticeStats {
  checks: number
  correct: number
  incorrect: number
  reveals: number
  accuracy: number | null
}

interface RecordPracticeCheckInput {
  formulaId: number
  mode: PracticeMode
  correct: boolean
  responseTimeMs?: number
}

interface RecordPracticeRevealInput {
  formulaId: number
  mode: PracticeMode
  responseTimeMs?: number
}

function cleanResponseTime(responseTimeMs?: number) {
  if (responseTimeMs === undefined || !Number.isFinite(responseTimeMs)) {
    return undefined
  }

  return Math.max(0, Math.round(responseTimeMs))
}

export async function recordPracticeCheck(input: RecordPracticeCheckInput) {
  await db.practiceLogs.add({
    formulaId: input.formulaId,
    mode: input.mode,
    action: 'check',
    correct: input.correct,
    responseTimeMs: cleanResponseTime(input.responseTimeMs),
    createdAt: Date.now(),
  })
}

export async function recordPracticeReveal(input: RecordPracticeRevealInput) {
  await db.practiceLogs.add({
    formulaId: input.formulaId,
    mode: input.mode,
    action: 'reveal',
    responseTimeMs: cleanResponseTime(input.responseTimeMs),
    createdAt: Date.now(),
  })
}

export async function getPracticeStats(
  formulaId: number,
  mode: PracticeMode,
): Promise<PracticeStats> {
  const logs = await db.practiceLogs.where('[formulaId+mode]').equals([formulaId, mode]).toArray()
  const checks = logs.filter((log) => log.action === 'check')
  const correct = checks.filter((log) => log.correct === true).length
  const incorrect = checks.filter((log) => log.correct === false).length
  const reveals = logs.filter((log) => log.action === 'reveal').length

  return {
    checks: checks.length,
    correct,
    incorrect,
    reveals,
    accuracy: checks.length > 0 ? correct / checks.length : null,
  }
}
