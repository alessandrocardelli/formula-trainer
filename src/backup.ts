import {
  db,
  type FormulaRecord,
  type PracticeLogAction,
  type PracticeLogRecord,
  type PracticeMode,
} from './db'
import {
  buildVariableMetadata,
  type VariableMetadata,
} from './domain/variableMetadata'
import { FORMULA_PARSER_VERSION, parseFormula } from './math/parseFormula'

export interface FormulaTrainerBackup {
  app: 'formula-trainer'
  version: 2
  exportedAt: string
  formulas: FormulaRecord[]
  practiceLogs: PracticeLogRecord[]
}

export interface BackupImportResult {
  total: number
  added: number
  updated: number
  skipped: number
  practiceLogsAdded?: number
  practiceLogsSkipped?: number
}

type PreparedFormulaRecord = Omit<FormulaRecord, 'id'>

interface PreparedFormula {
  sourceId?: number
  record: PreparedFormulaRecord
}

interface PreparedPracticeLog {
  sourceFormulaId: number
  mode: PracticeMode
  action: PracticeLogAction
  correct?: boolean
  responseTimeMs?: number
  createdAt: number
}

interface ParsedBackup {
  formulas: PreparedFormula[]
  practiceLogs: PreparedPracticeLog[]
}

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

function optionalPositiveInteger(record: UnknownRecord, key: string, context: string) {
  const value = record[key]
  if (value === undefined || value === null) {
    return undefined
  }
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new Error(`${context}: ${key} must be a positive integer.`)
  }
  return value
}

function requirePositiveInteger(record: UnknownRecord, key: string, context: string) {
  const value = optionalPositiveInteger(record, key, context)
  if (value === undefined) {
    throw new Error(`${context}: ${key} is required.`)
  }
  return value
}

function optionalNonNegativeNumber(record: UnknownRecord, key: string, context: string) {
  const value = record[key]
  if (value === undefined || value === null) {
    return undefined
  }
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new Error(`${context}: ${key} must be a non-negative number.`)
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

  const sourceId = optionalPositiveInteger(value, 'id', context)
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
    sourceId,
    record: {
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
    },
  }
}

function preparePracticeLog(value: unknown, index: number): PreparedPracticeLog {
  const context = `Practice event ${index + 1}`
  if (!isRecord(value)) {
    throw new Error(`${context}: expected an object.`)
  }

  const sourceFormulaId = requirePositiveInteger(value, 'formulaId', context)
  const mode = requireString(value, 'mode', context)
  if (mode !== 'full-recall' && mode !== 'missing-term') {
    throw new Error(`${context}: unsupported practice mode.`)
  }

  const action = requireString(value, 'action', context)
  if (action !== 'check' && action !== 'reveal') {
    throw new Error(`${context}: unsupported practice action.`)
  }

  let correct: boolean | undefined
  if (action === 'check') {
    if (typeof value.correct !== 'boolean') {
      throw new Error(`${context}: check events must include a boolean correct value.`)
    }
    correct = value.correct
  } else if (value.correct !== undefined && typeof value.correct !== 'boolean') {
    throw new Error(`${context}: correct must be boolean when present.`)
  }

  return {
    sourceFormulaId,
    mode,
    action,
    correct,
    responseTimeMs: optionalNonNegativeNumber(value, 'responseTimeMs', context),
    createdAt: requireTimestamp(value, 'createdAt', context),
  }
}

function parseBackup(json: string): ParsedBackup {
  let value: unknown
  try {
    value = JSON.parse(json)
  } catch {
    throw new Error('This file is not valid JSON.')
  }

  if (!isRecord(value) || value.app !== 'formula-trainer') {
    throw new Error('This is not a Formula Trainer backup.')
  }
  if (value.version !== 1 && value.version !== 2) {
    throw new Error('This backup version is not supported by this app version.')
  }
  if (typeof value.exportedAt !== 'string' || Number.isNaN(Date.parse(value.exportedAt))) {
    throw new Error('The backup export timestamp is invalid.')
  }
  if (!Array.isArray(value.formulas)) {
    throw new Error('The backup does not contain a valid formula list.')
  }

  const formulas = value.formulas.map((formula, index) => prepareFormula(formula, index))
  const practiceLogs =
    value.version === 2
      ? (() => {
          if (!Array.isArray(value.practiceLogs)) {
            throw new Error('The backup does not contain a valid practice history.')
          }
          return value.practiceLogs.map((log, index) => preparePracticeLog(log, index))
        })()
      : []

  const sourceFormulaIds = new Set(
    formulas.flatMap((formula) => (formula.sourceId === undefined ? [] : [formula.sourceId])),
  )
  for (const log of practiceLogs) {
    if (!sourceFormulaIds.has(log.sourceFormulaId)) {
      throw new Error('The backup contains a practice event for an unknown formula.')
    }
  }

  return { formulas, practiceLogs }
}

function formulaIdentity(formula: Pick<FormulaRecord, 'name' | 'category' | 'latex'>) {
  return [
    formula.name.trim().toLocaleLowerCase(),
    formula.category.trim().toLocaleLowerCase(),
    formula.latex.trim(),
  ].join('\u0000')
}

function practiceLogIdentity(log: Omit<PracticeLogRecord, 'id'>) {
  return [
    log.formulaId,
    log.mode,
    log.action,
    log.correct === undefined ? '' : String(log.correct),
    log.responseTimeMs === undefined ? '' : String(log.responseTimeMs),
    log.createdAt,
  ].join('\u0000')
}

export async function downloadFormulaTrainerBackup() {
  const [formulas, practiceLogs] = await Promise.all([
    db.formulas.toArray(),
    db.practiceLogs.toArray(),
  ])
  const now = new Date()
  const backup: FormulaTrainerBackup = {
    app: 'formula-trainer',
    version: 2,
    exportedAt: now.toISOString(),
    formulas,
    practiceLogs,
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
    total: prepared.formulas.length,
    added: 0,
    updated: 0,
    skipped: 0,
    practiceLogsAdded: 0,
    practiceLogsSkipped: 0,
  }

  await db.transaction('rw', db.formulas, db.practiceLogs, async () => {
    const existing = await db.formulas.toArray()
    const byIdentity = new Map(existing.map((formula) => [formulaIdentity(formula), formula]))
    const localIdBySourceId = new Map<number, number>()

    for (const imported of prepared.formulas) {
      const identity = formulaIdentity(imported.record)
      const current = byIdentity.get(identity)
      let localId: number

      if (!current) {
        localId = await db.formulas.add(imported.record)
        byIdentity.set(identity, { ...imported.record, id: localId })
        result.added += 1
      } else {
        localId = current.id
        if (imported.record.updatedAt > current.updatedAt) {
          await db.formulas.update(current.id, imported.record)
          byIdentity.set(identity, { ...imported.record, id: current.id })
          result.updated += 1
        } else {
          result.skipped += 1
        }
      }

      if (imported.sourceId !== undefined) {
        localIdBySourceId.set(imported.sourceId, localId)
      }
    }

    const existingLogs = await db.practiceLogs.toArray()
    const knownLogs = new Set(
      existingLogs.map((log) =>
        practiceLogIdentity({
          formulaId: log.formulaId,
          mode: log.mode,
          action: log.action,
          correct: log.correct,
          responseTimeMs: log.responseTimeMs,
          createdAt: log.createdAt,
        }),
      ),
    )

    for (const importedLog of prepared.practiceLogs) {
      const localFormulaId = localIdBySourceId.get(importedLog.sourceFormulaId)
      if (localFormulaId === undefined) {
        throw new Error('The backup practice history could not be matched to its formula.')
      }

      const record: Omit<PracticeLogRecord, 'id'> = {
        formulaId: localFormulaId,
        mode: importedLog.mode,
        action: importedLog.action,
        correct: importedLog.correct,
        responseTimeMs: importedLog.responseTimeMs,
        createdAt: importedLog.createdAt,
      }
      const identity = practiceLogIdentity(record)

      if (knownLogs.has(identity)) {
        result.practiceLogsSkipped = (result.practiceLogsSkipped ?? 0) + 1
        continue
      }

      await db.practiceLogs.add(record)
      knownLogs.add(identity)
      result.practiceLogsAdded = (result.practiceLogsAdded ?? 0) + 1
    }
  })

  return result
}
