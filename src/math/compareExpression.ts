import { getComputeEngine } from './parseFormula'

export interface ExpressionComparisonResult {
  ok: boolean
  equivalent?: boolean
  error?: string
}

export function compareExpressionAnswer(
  expectedLatex: string,
  answerLatex: string,
): ExpressionComparisonResult {
  const cleanAnswer = answerLatex.trim()

  if (!cleanAnswer) {
    return { ok: false, error: 'Write the missing term before checking your answer.' }
  }

  try {
    const ce = getComputeEngine()
    const expected = ce.parse(expectedLatex, { form: 'raw' })
    const answer = ce.parse(cleanAnswer, { form: 'raw' })

    if (!answer.isValid || !answer.canonical.isValid) {
      return { ok: false, error: 'The answer contains a syntax or semantic error.' }
    }

    if (answer.operator === 'Equal') {
      return { ok: false, error: 'Enter only the missing term, not a complete equation.' }
    }

    if (!expected.isValid || !expected.canonical.isValid) {
      return { ok: false, error: 'The expected term could not be parsed.' }
    }

    const mathematicalEquality = expected.canonical.isEqual(answer.canonical)
    const equivalent =
      mathematicalEquality === true || expected.canonical.isSame(answer.canonical)

    return { ok: true, equivalent }
  } catch {
    return { ok: false, error: 'The answer could not be compared.' }
  }
}
