import { db, type FormulaRecord } from './db'
import {
  buildVariableMetadata,
  type VariableMetadata,
} from './domain/variableMetadata'
import { FORMULA_PARSER_VERSION, parseFormula } from './math/parseFormula'

export interface FormulaTrainerBackup {
  app: 'formula-trainer'
  version: 1
  exportedAt: string
  formulas: FormulaRecord[]
}

export interface BackupImportResult {
  total: number
  added: number
  updated: number
  skipped: number
}

type PreparedFormula = Omit<FormulaRecord, 'id'>

type UnknownRecord = Record<string, unknown>

function backupFilename(date: Date) {
  return `formula-trainer-backup-${date.toISOString().slice(0, 10)}.json`
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function requireString(record: UnknownRecord, key: string, context: string) {
  const value = record[key]
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${context}: ${key} must be a non-empty string.`)
  }
  return value
}

function optionalString(record: UnknownRecord, key: string, context: string) {
  const value = record[key]
  if (value === undefined || value === null) {
    return undefined
  }
  if (typeof value !== 'string') {
    throw new Error(`${context}: ${key} must be text.`)
  }
  return value
}

function requireTimestamp(record: UnknownRecord, key: string, context: string) {
  const value = record[key]
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new Error(`${context}: ${key} must be a valid timestamp.`)
  }
  return value
}

function readVariableMetadata(value: unknown, context: string): VariableMetadata[] {
  if (value === undefined || value === null) {
    return []
  }
  if (!Array.isArray(value)) {
    throw new Error(`${context}: variableMetadata must be an array.`)
  }

  return value.map((item, index) => {
    const itemContext = `${context}, variable ${index + 1}`
    if (!isRecord(item)) {
      throw new Error(`${itemContext}: expected an object.`)
    }

    return {
      symbol: requireString(item, 'symbol', itemContext),
      name: optionalString(item, 'name', itemContext) ?? '',
      unit: optionalString(item, 'unit', itemContext) ?? '',
      definition: optionalString(item, 'definition', itemContext) ?? '',
    }
  })
}

function prepareFormula(value: unknown, index: number): PreparedFormula {
  const context = `Formula ${index + 1}`
  if (!isRecord(value)) {
    throw new Error(`${context}: expected an object.`)
  }

  const name = requireString(value, 'name', context).trim()
  const category = requireString(value, 'category', context).trim()
  const latex = requireString(value, 'latex', context).trim()
  const explanation = optionalString(value, 'explanation', context)?.trim()
  const createdAt = requireTimestamp(value, 'createdAt', context)
  const updatedAt = requireTimestamp(value, 'updatedAt', context)
  const importedMetadata = readVariableMetadata(value.variableMetadata, context)

  const parsed = parseFormula(latex)
  if (!parsed.ok || !parsed.parsed) {
    throw new Error(`${context}: the saved equation is no longer valid.`)
  }

  return {
    name,
    category,
    latex,
    explanation: explanation || undefined,
    expressionJson: parsed.parsed.expressionJson,
    variables: parsed.parsed.variables,
    variableMetadata: buildVariableMetadata(parsed.parsed.variables, importedMetadata),
    parserVersion: FORMULA_PARSER_VERSION,
    createdAt,
    updatedAt,
  }
}

function parseBackup(json: string): PreparedFormula[] {
  let value: unknown
  try {
    value = JSON.parse(json)
  } catch {
    throw new Error('This file is not valid JSON.')
  }

  if (!isRecord(value)) {
    throw new Error('This is not a Formula Trainer backup.')
  }
  if (value.app !== 'formula-trainer') {
    throw new Error('This is not a Formula Trainer backup.')
  }
  if (value.version !== 1) {
    throw new Error('This backup version is not supported by this app version.')
  }
  if (typeof value.exportedAt !== 'string' || Number.isNaN(Date.parse(value.exportedAt))) {
    throw new Error('The backup export timestamp is invalid.')
  }
  if (!Array.isArray(value.formulas)) {
    throw new Error('The backup does not contain a valid formula list.')
  }

  return value.formulas.map((formula, index) => prepareFormula(formula, index))
}

function formulaIdentity(formula: Pick<FormulaRecord, 'name' | 'category' | 'latex'>) {
  return [
    formula.name.trim().toLocaleLowerCase(),
    formula.category.trim().toLocaleLowerCase(),
    formula.latex.trim(),
  ].join('\u0000')
}

export async function downloadFormulaTrainerBackup() {
  const formulas = await db.formulas.toArray()
  const now = new Date()
  const backup: FormulaTrainerBackup = {
    app: 'formula-trainer',
    version: 1,
    exportedAt: now.toISOString(),
    formulas,
  }

  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: 'application/json;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = backupFilename(now)
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)

  return formulas.length
}

export async function importFormulaTrainerBackup(file: File): Promise<BackupImportResult> {
  if (file.size > 5_000_000) {
    throw new Error('The selected backup is unexpectedly large.')
  }

  const prepared = parseBackup(await file.text())
  const result: BackupImportResult = {
    total: prepared.length,
    added: 0,
    updated: 0,
    skipped: 0,
  }

  await db.transaction('rw', db.formulas, async () => {
    const existing = await db.formulas.toArray()
    const byIdentity = new Map(existing.map((formula) => [formulaIdentity(formula), formula]))

    for (const imported of prepared) {
      const identity = formulaIdentity(imported)
      const current = byIdentity.get(identity)

      if (!current) {
        const id = await db.formulas.add(imported)
        byIdentity.set(identity, { ...imported, id })
        result.added += 1
        continue
      }

      if (imported.updatedAt > current.updatedAt) {
        await db.formulas.update(current.id, imported)
        byIdentity.set(identity, { ...imported, id: current.id })
        result.updated += 1
        continue
      }

      result.skipped += 1
    }
  })

  return result
}
