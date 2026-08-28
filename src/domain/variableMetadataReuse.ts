import type { VariableMetadata } from './variableMetadata'

type ReusableVariableMetadata = Partial<Pick<VariableMetadata, 'name' | 'unit' | 'definition'>>
type MetadataField = keyof ReusableVariableMetadata

const metadataByFormula = new Map<number, VariableMetadata[]>()

function normalizedValue(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase()
}

function uniqueFieldValue(entries: VariableMetadata[], field: MetadataField): string | undefined {
  const values = new Map<string, string>()

  for (const entry of entries) {
    const value = entry[field]?.trim()
    if (!value) {
      continue
    }

    const normalized = normalizedValue(value)
    if (!values.has(normalized)) {
      values.set(normalized, value)
    }
  }

  if (values.size !== 1) {
    return undefined
  }

  return values.values().next().value
}

export function rememberFormulaVariableMetadata(
  formulaId: number,
  metadata: VariableMetadata[] | undefined,
) {
  metadataByFormula.set(formulaId, metadata ?? [])
}

export function forgetFormulaVariableMetadata(formulaId: number) {
  metadataByFormula.delete(formulaId)
}

export function getReusableVariableMetadata(symbol: string): ReusableVariableMetadata {
  const entries = [...metadataByFormula.values()]
    .flat()
    .filter((entry) => entry.symbol === symbol)

  return {
    name: uniqueFieldValue(entries, 'name'),
    unit: uniqueFieldValue(entries, 'unit'),
    definition: uniqueFieldValue(entries, 'definition'),
  }
}
