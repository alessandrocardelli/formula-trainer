import { ComputeEngine } from '@cortex-js/compute-engine'

const computeEngine = new ComputeEngine()

export interface ParsedFormula {
  expressionJson: unknown
  variables: string[]
}

export interface FormulaParseResult {
  ok: boolean
  parsed?: ParsedFormula
  error?: string
}

function looksLikeLeibnizDifferential(latex: string) {
  const compact = latex.replace(/\s+/g, '')

  return (
    (compact.includes('\\frac{d') && compact.includes('}{d')) ||
    (compact.includes('\\frac{\\mathrm{d}') && compact.includes('}{\\mathrm{d}'))
  )
}

export function parseFormula(latex: string): FormulaParseResult {
  const cleanLatex = latex.trim()

  if (!cleanLatex) {
    return { ok: false, error: 'Enter a formula first.' }
  }

  try {
    // Keep a non-canonical MathJSON tree close to the original notation.
    // This matters for inputs such as dq/dt, which must not be reduced as
    // ordinary algebra before we add dedicated derivative normalization.
    const expression = computeEngine.parse(cleanLatex, { canonical: false })
    const canonical = expression.canonical

    if (!expression.isValid || !canonical.isValid) {
      return { ok: false, error: 'The formula contains a syntax or semantic error.' }
    }

    if (expression.operator !== 'Equal') {
      return { ok: false, error: 'Enter a complete equation containing an equals sign.' }
    }

    const leibnizDifferential = looksLikeLeibnizDifferential(cleanLatex)
    const variables = [...expression.symbols]
      .filter((symbol) => !computeEngine.box(symbol).isConstant)
      .filter((symbol) => !(leibnizDifferential && symbol === 'd'))
      .sort((a, b) => a.localeCompare(b))

    if (variables.length === 0) {
      return { ok: false, error: 'No variables were detected in this equation.' }
    }

    return {
      ok: true,
      parsed: {
        expressionJson: expression.json,
        variables,
      },
    }
  } catch {
    return { ok: false, error: 'The formula could not be parsed.' }
  }
}
