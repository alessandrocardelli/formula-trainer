import { db, type FormulaRecord } from './db'

export interface FormulaTrainerBackup {
  app: 'formula-trainer'
  version: 1
  exportedAt: string
  formulas: FormulaRecord[]
}

function backupFilename(date: Date) {
  return `formula-trainer-backup-${date.toISOString().slice(0, 10)}.json`
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
