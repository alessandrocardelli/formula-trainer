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

function collectDifferentialSymbols(node: unknown, symbols: string[]) {
  if (typeof node === 'string') {
    if (/^d[A-Za-z]$/.test(node)) {
      symbols.push(node)
    }
    return
  }

  if (Array.isArray(node)) {
    for (const child of node.slice(1)) {
      collectDifferentialSymbols(child, symbols)
    }
    return
  }

  if (node && typeof node === 'object') {
    const symbol = (node as { sym?: unknown }).sym
    if (typeof symbol === 'string' && /^d[A-Za-z]$/.test(symbol)) {
      symbols.push(symbol)
    }

    const fn = (node as { fn?: unknown }).fn
    if (Array.isArray(fn)) {
      collectDifferentialSymbols(fn, symbols)
    }
  }
}

function singleDifferentialSymbol(node: unknown): string | undefined {
  const symbols: string[] = []
  collectDifferentialSymbols(node, symbols)
  const unique = [...new Set(symbols)]
  return unique.length === 1 ? unique[0] : undefined
}

function collectDifferentialPairs(node: unknown, pairs: DifferentialPair[]) {
  if (Array.isArray(node)) {
    if (node[0] === 'Divide' && node.length >= 3) {
      const numerator = singleDifferentialSymbol(node[1])
      const denominator = singleDifferentialSymbol(node[2])

      if (numerator && denominator) {
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
