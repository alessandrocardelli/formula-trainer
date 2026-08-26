import type { ComputeEngine as ComputeEngineInstance } from '@cortex-js/compute-engine'

export const FORMULA_PARSER_VERSION = 5

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

interface DifferentialPair {
  numerator: string
  denominator: string
}

function directSymbol(node: unknown): string | undefined {
  if (typeof node === 'string') {
    return node
  }

  if (node && typeof node === 'object' && !Array.isArray(node)) {
    const symbol = (node as { sym?: unknown }).sym
    return typeof symbol === 'string' ? symbol : undefined
  }

  return undefined
}

function collectDifferentialPairs(node: unknown, pairs: DifferentialPair[]) {
  if (Array.isArray(node)) {
    if (node[0] === 'Divide' && node.length >= 3) {
      const numerator = directSymbol(node[1])
      const denominator = directSymbol(node[2])

      if (
        numerator &&
        denominator &&
        /^d[A-Za-z]$/.test(numerator) &&
        /^d[A-Za-z]$/.test(denominator)
      ) {
        pairs.push({ numerator, denominator })
      }
    }

    for (const child of node.slice(1)) {
      collectDifferentialPairs(child, pairs)
    }
    return
  }

  if (node && typeof node === 'object') {
    const fn = (node as { fn?: unknown }).fn
    if (Array.isArray(fn)) {
      collectDifferentialPairs(fn, pairs)
    }
  }
}

function normalizeDifferentialVariables(expressionJson: unknown, variables: string[]) {
  const pairs: DifferentialPair[] = []
  collectDifferentialPairs(expressionJson, pairs)

  if (pairs.length === 0) {
    return variables
  }

  const differentialSymbols = new Set(
    pairs.flatMap(({ numerator, denominator }) => [numerator, denominator]),
  )

  return [
    ...variables.filter((symbol) => !differentialSymbols.has(symbol)),
    ...[...differentialSymbols].map((symbol) => symbol.slice(1)),
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
    const expressionJson = expression.json
    const normalizedVariables = normalizeDifferentialVariables(
      expressionJson,
      detectedVariables,
    )
    const uniqueVariables = [...new Set(normalizedVariables)].sort((a, b) =>
      a.localeCompare(b),
    )

    if (uniqueVariables.length === 0) {
      return { ok: false, error: 'No variables were detected in this equation.' }
    }

    return {
      ok: true,
      parsed: {
        expressionJson,
        variables: uniqueVariables,
      },
    }
  } catch {
    return { ok: false, error: 'The formula could not be parsed.' }
  }
}
