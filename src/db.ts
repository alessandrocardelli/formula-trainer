import Dexie, { type EntityTable } from 'dexie'
import type { VariableMetadata } from './domain/variableMetadata'

export type PracticeMode = 'full-recall' | 'missing-term'
export type PracticeLogAction = 'check' | 'reveal'

export interface FormulaRecord {
  id: number
  name: string
  category: string
  latex: string
  explanation?: string
  expressionJson?: unknown
  variables?: string[]
  variableMetadata?: VariableMetadata[]
  parserVersion?: number
  createdAt: number
  updatedAt: number
}

export interface PracticeLogRecord {
  id: number
  formulaId: number
  mode: PracticeMode
  action: PracticeLogAction
  correct?: boolean
  responseTimeMs?: number
  createdAt: number
}

class FormulaTrainerDB extends Dexie {
  formulas!: EntityTable<FormulaRecord, 'id'>
  practiceLogs!: EntityTable<PracticeLogRecord, 'id'>

  constructor() {
    super('formula-trainer')

    this.version(1).stores({
      formulas: '++id, name, category, updatedAt',
    })

    this.version(2).stores({
      formulas: '++id, name, category, updatedAt',
      practiceLogs: '++id, formulaId, mode, action, createdAt, [formulaId+mode]',
    })
  }
}

export const db = new FormulaTrainerDB()
