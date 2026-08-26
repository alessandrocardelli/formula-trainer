import type { ComputeEngine as ComputeEngineInstance } from '@cortex-js/compute-engine'

export const FORMULA_PARSER_VERSION = 2

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

interface LeibnizDifferential {
  dependent: string
  independent: string
  compositeSymbols: string[]
}

function extractLeibnizDifferential(latex: string): LeibnizDifferential | undefined {
  const compact = latex
    .replace(/\s+/g, '')
    .replace(/\\mathrm\{d\}/g, 'd')
    .replace(/\\operatorname\{d\}/g, 'd')

  // MathLive commonly serializes dq/dt as \frac{dq}{dt}. The Compute Engine
  // can then interpret "dq" and "dt" as whole identifiers, so normalize this
  // simple Leibniz form before exposing variables to the rest of the app.
  const match = compact.match(/\\frac\{d([A-Za-z])\}\{d([A-Za-z])\}/)
  if (!match) {
    return undefined
  }

  const dependent = match[1]
  const independent = match[2]

  return {
    dependent,
    independent,
    compositeSymbols: [`d${dependent}`, `d${independent}`, 'd'],
  }
}

export function parseFormula(latex: string): FormulaParseResult {
  const cleanLatex = latex.trim()

  if (!cleanLatex) {
    return { ok: false, error: 'Enter a formula first.' }
  }

  try {
    const ce = getComputeEngine()

    // Keep a raw MathJSON tree close to the original notation.
    // This matters for inputs such as dq/dt, which must not be reduced as
    // ordinary algebra before we add dedicated derivative normalization.
    const expression = ce.parse(cleanLatex, { form: 'raw' })
    const canonical = expression.canonical

    if (!expression.isValid || !canonical.isValid) {
      return { ok: false, error: 'The formula contains a syntax or semantic error.' }
    }

    if (expression.operator !== 'Equal') {
      return { ok: false, error: 'Enter a complete equation containing an equals sign.' }
    }

    const leibniz = extractLeibnizDifferential(cleanLatex)
    const variables = [...expression.symbols]
      .filter((symbol) => !ce.box(symbol).isConstant)
      .filter((symbol) => !leibniz?.compositeSymbols.includes(symbol))

    if (leibniz) {
      variables.push(leibniz.dependent, leibniz.independent)
    }

    const uniqueVariables = [...new Set(variables)].sort((a, b) => a.localeCompare(b))

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
