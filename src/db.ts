import Dexie, { type EntityTable } from 'dexie'

export interface FormulaRecord {
  id: number
  name: string
  category: string
  latex: string
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
