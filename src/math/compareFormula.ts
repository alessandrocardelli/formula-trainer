import type { BoxedExpression } from '@cortex-js/compute-engine'
import { getComputeEngine } from './parseFormula'

export interface FormulaComparisonResult {
  ok: boolean
  equivalent?: boolean
  error?: string
}

function expressionsMatch(a: BoxedExpression, b: BoxedExpression) {
  const mathematicalEquality = a.canonical.isEqual(b.canonical)
  return mathematicalEquality === true || a.canonical.isSame(b.canonical)
}

export function compareFormulaAnswer(
  expectedLatex: string,
  answerLatex: string,
): FormulaComparisonResult {
  const cleanAnswer = answerLatex.trim()

  if (!cleanAnswer) {
    return { ok: false, error: 'Write an equation before checking your answer.' }
  }

  try {
    const ce = getComputeEngine()
    const expected = ce.parse(expectedLatex, { form: 'raw' })
    const answer = ce.parse(cleanAnswer, { form: 'raw' })

    if (!answer.isValid || !answer.canonical.isValid) {
      return { ok: false, error: 'The answer contains a syntax or semantic error.' }
    }

    if (answer.operator !== 'Equal') {
      return { ok: false, error: 'Enter a complete equation containing an equals sign.' }
    }

    if (expected.operator !== 'Equal') {
      return { ok: false, error: 'The saved formula is not a valid equation.' }
    }

    const direct =
      expressionsMatch(expected.op1, answer.op1) &&
      expressionsMatch(expected.op2, answer.op2)

    const reversed =
      expressionsMatch(expected.op1, answer.op2) &&
      expressionsMatch(expected.op2, answer.op1)

    return { ok: true, equivalent: direct || reversed }
  } catch {
    return { ok: false, error: 'The answer could not be compared.' }
  }
}
