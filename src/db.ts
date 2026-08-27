import Dexie, { type EntityTable } from 'dexie'
import type { VariableMetadata } from './domain/variableMetadata'

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

class FormulaTrainerDB extends Dexie {
  formulas!: EntityTable<FormulaRecord, 'id'>

  constructor() {
    super('formula-trainer')

    this.version(1).stores({
      formulas: '++id, name, category, updatedAt',
    })
  }
}

export const db = new FormulaTrainerDB()
