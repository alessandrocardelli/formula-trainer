import type { BoxedExpression } from '@cortex-js/compute-engine'
import { getComputeEngine } from './parseFormula'

export interface FormulaComparisonResult {
  ok: boolean
  equivalent?: boolean
  error?: string
}

interface EquationOperands {
  op1: BoxedExpression
  op2: BoxedExpression
}

function asEquationOperands(expression: unknown): EquationOperands | null {
  const candidate = expression as Partial<EquationOperands>
  return candidate.op1 && candidate.op2
    ? { op1: candidate.op1, op2: candidate.op2 }
    : null
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

    const expectedSides = asEquationOperands(expected)
    const answerSides = asEquationOperands(answer)
    if (!expectedSides || !answerSides) {
      return { ok: false, error: 'The equation sides could not be read.' }
    }

    const direct =
      expressionsMatch(expectedSides.op1, answerSides.op1) &&
      expressionsMatch(expectedSides.op2, answerSides.op2)

    const reversed =
      expressionsMatch(expectedSides.op1, answerSides.op2) &&
      expressionsMatch(expectedSides.op2, answerSides.op1)

    return { ok: true, equivalent: direct || reversed }
  } catch {
    return { ok: false, error: 'The answer could not be compared.' }
  }
}
