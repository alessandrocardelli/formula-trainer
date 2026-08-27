import type { FormulaRecord } from '../db'

export interface MissingTermGap {
  promptLatex: string
  answerLatex: string
  symbol: string
}

function symbolVariants(symbol: string) {
  const variants = new Set<string>([symbol])
  const subscript = symbol.match(/^([A-Za-z])_([A-Za-z0-9]+)$/)

  if (subscript) {
    variants.add(`${subscript[1]}_{${subscript[2]}}`)
  }

  return [...variants].sort((a, b) => b.length - a.length)
}

function isInsideLatexCommand(text: string, index: number) {
  let start = index
  while (start > 0 && /[A-Za-z]/.test(text[start - 1])) {
    start -= 1
  }

  return start > 0 && text[start - 1] === '\\'
}

function findOccurrences(text: string, needle: string) {
  const positions: number[] = []
  let from = 0

  while (from <= text.length - needle.length) {
    const index = text.indexOf(needle, from)
    if (index < 0) {
      break
    }

    if (!isInsideLatexCommand(text, index)) {
      positions.push(index)
    }

    from = index + Math.max(1, needle.length)
  }

  return positions
}

function createGap(fullLatex: string, rhsOffset: number, rhs: string, symbol: string) {
  for (const variant of symbolVariants(symbol)) {
    const positions = findOccurrences(rhs, variant)

    // If the same visible symbol occurs several times, leaving another copy in
    // the prompt would make the exercise trivial. More advanced multi-gap
    // handling can be added later.
    if (positions.length !== 1) {
      continue
    }

    const absoluteIndex = rhsOffset + positions[0]
    const blank = String.raw`\boxed{\phantom{${variant}}}`

    return {
      promptLatex:
        fullLatex.slice(0, absoluteIndex) + blank + fullLatex.slice(absoluteIndex + variant.length),
      answerLatex: symbol,
      symbol,
    } satisfies MissingTermGap
  }

  return null
}

export function buildMissingTermGaps(formula: FormulaRecord): MissingTermGap[] {
  const equalsIndex = formula.latex.indexOf('=')
  if (equalsIndex < 0) {
    return []
  }

  const rhsOffset = equalsIndex + 1
  const rhs = formula.latex.slice(rhsOffset)
  const gaps = (formula.variables ?? [])
    .map((symbol) => createGap(formula.latex, rhsOffset, rhs, symbol))
    .filter((gap): gap is MissingTermGap => gap !== null)

  const unique = new Map<string, MissingTermGap>()
  for (const gap of gaps) {
    unique.set(`${gap.symbol}:${gap.promptLatex}`, gap)
  }

  return [...unique.values()]
}
