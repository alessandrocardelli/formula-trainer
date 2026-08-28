import Dexie, { type EntityTable } from 'dexie'
import type { VariableMetadata } from './domain/variableMetadata'
import {
  forgetFormulaVariableMetadata,
  rememberFormulaVariableMetadata,
} from './domain/variableMetadataReuse'

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

export interface ReviewCardRecord {
  id: number
  formulaId: number
  mode: PracticeMode
  due: number
  stability: number
  difficulty: number
  elapsed_days: number
  scheduled_days: number
  reps: number
  lapses: number
  learning_steps: number
  state: number
  last_review?: number
  updatedAt: number
}

class FormulaTrainerDB extends Dexie {
  formulas!: EntityTable<FormulaRecord, 'id'>
  practiceLogs!: EntityTable<PracticeLogRecord, 'id'>
  reviewCards!: EntityTable<ReviewCardRecord, 'id'>

  constructor() {
    super('formula-trainer')

    this.version(1).stores({
      formulas: '++id, name, category, updatedAt',
    })

    this.version(2).stores({
      formulas: '++id, name, category, updatedAt',
      practiceLogs: '++id, formulaId, mode, action, createdAt, [formulaId+mode]',
    })

    this.version(3).stores({
      formulas: '++id, name, category, updatedAt',
      practiceLogs: '++id, formulaId, mode, action, createdAt, [formulaId+mode]',
      reviewCards: '++id, &[formulaId+mode], formulaId, mode, due, updatedAt',
    })

    this.formulas.hook('reading', (formula) => {
      if (formula) {
        rememberFormulaVariableMetadata(formula.id, formula.variableMetadata)
      }

      return formula
    })

    this.formulas.hook('deleting', (formulaId) => {
      forgetFormulaVariableMetadata(formulaId)
    })
  }
}

export const db = new FormulaTrainerDB()
