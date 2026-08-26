import type { ComputeEngine as ComputeEngineInstance } from '@cortex-js/compute-engine'

export const FORMULA_PARSER_VERSION = 4

let computeEngine: ComputeEngineInstance | undefined

function getComputeEngine() {
  if (computeEngine) {
    return computeEngine
  }

  const ComputeEngineConstructor = window.ComputeEngine?.ComputeEngine
  if (!ComputeEngineConstructor) {
    throw new Error('Compute Engine runtime is not available.')
  }

  computeEngine = new ComputeEngineConstructor()
  return computeEngine
}

export interface ParsedFormula {
  expressionJson: unknown
  variables: string[]
}

export interface FormulaParseResult {
  ok: boolean
  parsed?: ParsedFormula
  error?: string
}

function normalizeDifferentialVariables(latex: string, variables: string[]) {
  const compact = latex.replace(/\s+/g, '')

  // Compute Engine can expose simple Leibniz differentials as composite
  // symbols such as "dq" and "dt". Do not rely on MathLive's exact LaTeX
  // serialization here: if an equation contains a fraction and at least two
  // two-character d-prefixed symbols, treat those tokens as differentials.
  const differentialSymbols = variables.filter((symbol) => /^d[A-Za-z]$/.test(symbol))

  if (!compact.includes('\\frac') || differentialSymbols.length < 2) {
    return variables
  }

  const differentialSet = new Set(differentialSymbols)
  return [
    ...variables.filter((symbol) => !differentialSet.has(symbol)),
    ...differentialSymbols.map((symbol) => symbol.slice(1)),
  ]
}

export function parseFormula(latex: string): FormulaParseResult {
  const cleanLatex = latex.trim()

  if (!cleanLatex) {
    return { ok: false, error: 'Enter a formula first.' }
  }

  try {
    const ce = getComputeEngine()
    const expression = ce.parse(cleanLatex, { form: 'raw' })
    const canonical = expression.canonical

    if (!expression.isValid || !canonical.isValid) {
      return { ok: false, error: 'The formula contains a syntax or semantic error.' }
    }

    if (expression.operator !== 'Equal') {
      return { ok: false, error: 'Enter a complete equation containing an equals sign.' }
    }

    const detectedVariables = [...expression.symbols].filter(
      (symbol) => !ce.box(symbol).isConstant,
    )
    const normalizedVariables = normalizeDifferentialVariables(cleanLatex, detectedVariables)
    const uniqueVariables = [...new Set(normalizedVariables)].sort((a, b) =>
      a.localeCompare(b),
    )

    if (uniqueVariables.length === 0) {
      return { ok: false, error: 'No variables were detected in this equation.' }
    }

    return {
      ok: true,
      parsed: {
        expressionJson: expression.json,
        variables: uniqueVariables,
      },
    }
  } catch {
    return { ok: false, error: 'The formula could not be parsed.' }
  }
}
