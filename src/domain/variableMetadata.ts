import { getReusableVariableMetadata } from './variableMetadataReuse'

export interface VariableMetadata {
  symbol: string
  name: string
  unit: string
  definition: string
}

const commonVariableMetadata: Record<string, Pick<VariableMetadata, 'name' | 'unit'>> = {
  I: { name: 'Electric current', unit: 'A' },
  i: { name: 'Electric current', unit: 'A' },
  q: { name: 'Electric charge', unit: 'C' },
  Q: { name: 'Electric charge', unit: 'C' },
  t: { name: 'Time', unit: 's' },
  V: { name: 'Voltage', unit: 'V' },
  v: { name: 'Voltage', unit: 'V' },
  R: { name: 'Resistance', unit: 'Ω' },
  C: { name: 'Capacitance', unit: 'F' },
  L: { name: 'Inductance', unit: 'H' },
  f: { name: 'Frequency', unit: 'Hz' },
  P: { name: 'Power', unit: 'W' },
  p: { name: 'Power', unit: 'W' },
  E: { name: 'Energy', unit: 'J' },
  Z: { name: 'Impedance', unit: 'Ω' },
  X_C: { name: 'Capacitive reactance', unit: 'Ω' },
  X_L: { name: 'Inductive reactance', unit: 'Ω' },
}

export function buildVariableMetadata(
  variables: string[],
  existing: VariableMetadata[] = [],
): VariableMetadata[] {
  const existingBySymbol = new Map(existing.map((entry) => [entry.symbol, entry]))

  return variables.map((symbol) => {
    const saved = existingBySymbol.get(symbol)
    const suggested = commonVariableMetadata[symbol]
    const reusable = saved ? undefined : getReusableVariableMetadata(symbol)

    return {
      symbol,
      name: saved?.name ?? reusable?.name ?? suggested?.name ?? '',
      unit: saved?.unit ?? reusable?.unit ?? suggested?.unit ?? '',
      definition: saved?.definition ?? reusable?.definition ?? '',
    }
  })
}
