import { useEffect, useState, type FormEvent } from 'react'
import { db, type FormulaRecord } from './db'
import {
  buildVariableMetadata,
  type VariableMetadata,
} from './domain/variableMetadata'
import { FORMULA_PARSER_VERSION, parseFormula } from './math/parseFormula'

type MathFieldElement = HTMLElement & {
  value: string
}

type VariableMetadataField = 'name' | 'unit'

const exampleFormula = String.raw`X_C=\frac{1}{2\pi fC}`

function metadataMatches(a?: VariableMetadata[], b?: VariableMetadata[]) {
  return JSON.stringify(a ?? []) === JSON.stringify(b ?? [])
}

export default function App() {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [latex, setLatex] = useState('')
  const [formulas, setFormulas] = useState<FormulaRecord[]>([])
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'normal' | 'error'>('normal')

  async function refreshFormulas() {
    const records = await db.formulas.orderBy('updatedAt').reverse().toArray()

    const parsedRecords = await Promise.all(
      records.map(async (record) => {
        let updated = record
        let shouldPersist = false

        if (
          !record.expressionJson ||
          !record.variables ||
          record.parserVersion !== FORMULA_PARSER_VERSION
        ) {
          const result = parseFormula(record.latex)
          if (!result.ok || !result.parsed) {
            return record
          }

          updated = {
            ...updated,
            expressionJson: result.parsed.expressionJson,
            variables: result.parsed.variables,
            parserVersion: FORMULA_PARSER_VERSION,
          }
          shouldPersist = true
        }

        const variableMetadata = buildVariableMetadata(
          updated.variables ?? [],
          updated.variableMetadata,
        )

        if (!metadataMatches(variableMetadata, updated.variableMetadata)) {
          updated = { ...updated, variableMetadata }
          shouldPersist = true
        }

        if (shouldPersist) {
          await db.formulas.update(record.id, {
            expressionJson: updated.expressionJson,
            variables: updated.variables,
            variableMetadata: updated.variableMetadata,
            parserVersion: updated.parserVersion,
          })
        }

        return updated
      }),
    )

    setFormulas(parsedRecords)
  }

  useEffect(() => {
    void refreshFormulas()
  }, [])

  async function saveFormula(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const cleanName = name.trim()
    const cleanCategory = category.trim()
    const cleanLatex = latex.trim()

    if (!cleanName || !cleanLatex) {
      setMessageType('error')
      setMessage('Add a name and a formula before saving.')
      return
    }

    const result = parseFormula(cleanLatex)
    if (!result.ok || !result.parsed) {
      setMessageType('error')
      setMessage(result.error ?? 'The formula could not be parsed.')
      return
    }

    const now = Date.now()
    await db.formulas.add({
      name: cleanName,
      category: cleanCategory || 'Uncategorized',
      latex: cleanLatex,
      expressionJson: result.parsed.expressionJson,
      variables: result.parsed.variables,
      variableMetadata: buildVariableMetadata(result.parsed.variables),
      parserVersion: FORMULA_PARSER_VERSION,
      createdAt: now,
      updatedAt: now,
    })

    setName('')
    setCategory('')
    setLatex('')
    setMessageType('normal')
    setMessage(`Saved. Detected variables: ${result.parsed.variables.join(', ')}.`)
    await refreshFormulas()
  }

  function updateVariableMetadata(
    formulaId: number,
    symbol: string,
    field: VariableMetadataField,
    value: string,
  ) {
    setFormulas((current) =>
      current.map((formula) => {
        if (formula.id !== formulaId) {
          return formula
        }

        const metadata = buildVariableMetadata(formula.variables ?? [], formula.variableMetadata).map(
          (entry) => (entry.symbol === symbol ? { ...entry, [field]: value } : entry),
        )

        return { ...formula, variableMetadata: metadata }
      }),
    )
  }

  async function saveVariableMetadata(formula: FormulaRecord) {
    const variableMetadata = buildVariableMetadata(
      formula.variables ?? [],
      formula.variableMetadata,
    )
    const now = Date.now()

    await db.formulas.update(formula.id, {
      variableMetadata,
      updatedAt: now,
    })

    setMessageType('normal')
    setMessage(`Variable details saved for ${formula.name}.`)
    await refreshFormulas()
  }

  async function deleteFormula(id: number) {
    await db.formulas.delete(id)
    setMessageType('normal')
    setMessage('Formula deleted.')
    await refreshFormulas()
  }

  function loadExample() {
    setName('Capacitive reactance')
    setCategory('Electronics')
    setLatex(exampleFormula)
    setMessageType('normal')
    setMessage('Example loaded. Edit it or save it.')
  }

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Local-first · offline-ready</p>
          <h1>Formula Trainer</h1>
          <p className="hero-copy">
            Build your own formula library first. Active recall, generated exercises and spaced
            repetition come next.
          </p>
        </div>
      </header>

      <section className="panel" aria-labelledby="add-formula-title">
        <div className="section-heading">
          <div>
            <p className="step-label">Step 1</p>
            <h2 id="add-formula-title">Add a formula</h2>
          </div>
          <button className="button button-secondary" type="button" onClick={loadExample}>
            Load example
          </button>
        </div>

        <form onSubmit={saveFormula} className="formula-form">
          <label>
            <span>Name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Capacitive reactance"
              autoComplete="off"
            />
          </label>

          <label>
            <span>Category</span>
            <input
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="e.g. Electronics"
              autoComplete="off"
            />
          </label>

          <label>
            <span>Formula</span>
            <math-field
              className="formula-editor"
              value={latex}
              virtual-keyboard-mode="onfocus"
              onInput={(event) => setLatex((event.currentTarget as MathFieldElement).value)}
              aria-label="Formula editor"
            />
          </label>

          <div className="form-actions">
            <button className="button button-primary" type="submit">
              Save formula
            </button>
            <span
              className={`status-message${messageType === 'error' ? ' status-message-error' : ''}`}
              aria-live="polite"
            >
              {message}
            </span>
          </div>
        </form>
      </section>

      <section className="panel" aria-labelledby="library-title">
        <div className="section-heading">
          <div>
            <p className="step-label">Library</p>
            <h2 id="library-title">Your formulas</h2>
          </div>
          <span className="count-badge">{formulas.length}</span>
        </div>

        {formulas.length === 0 ? (
          <div className="empty-state">
            <p>No formulas yet.</p>
            <span>Add one above or load the example to test the editor.</span>
          </div>
        ) : (
          <div className="formula-list">
            {formulas.map((formula) => {
              const metadata = buildVariableMetadata(
                formula.variables ?? [],
                formula.variableMetadata,
              )

              return (
                <article className="formula-card" key={formula.id}>
                  <div className="formula-card-copy">
                    <span className="category-chip">{formula.category}</span>
                    <h3>{formula.name}</h3>
                    <math-field className="formula-preview" value={formula.latex} read-only />

                    {metadata.length > 0 ? (
                      <div className="variable-summary-list" aria-label="Variable details">
                        {metadata.map((entry) => (
                          <div className="variable-summary-row" key={entry.symbol}>
                            <span className="variable-chip">{entry.symbol}</span>
                            <span className="variable-description">
                              {entry.name || 'No description'}
                              {entry.unit ? <span className="variable-unit"> · {entry.unit}</span> : null}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {metadata.length > 0 ? (
                      <details className="variable-details">
                        <summary>Edit variable details</summary>
                        <div className="variable-editor-list">
                          {metadata.map((entry) => (
                            <div className="variable-editor-row" key={entry.symbol}>
                              <div className="variable-editor-symbol">{entry.symbol}</div>
                              <label>
                                <span>Name</span>
                                <input
                                  value={entry.name}
                                  onChange={(event) =>
                                    updateVariableMetadata(
                                      formula.id,
                                      entry.symbol,
                                      'name',
                                      event.target.value,
                                    )
                                  }
                                  placeholder="e.g. Electric current"
                                />
                              </label>
                              <label>
                                <span>Unit</span>
                                <input
                                  value={entry.unit}
                                  onChange={(event) =>
                                    updateVariableMetadata(
                                      formula.id,
                                      entry.symbol,
                                      'unit',
                                      event.target.value,
                                    )
                                  }
                                  placeholder="e.g. A"
                                />
                              </label>
                            </div>
                          ))}

                          <button
                            type="button"
                            className="button button-secondary variable-save-button"
                            onClick={() => void saveVariableMetadata(formula)}
                          >
                            Save variable details
                          </button>
                        </div>
                      </details>
                    ) : null}

                    {formula.variables?.some((variable) => /^d[A-Za-z]$/.test(variable)) ? (
                      <details>
                        <summary>Parser debug</summary>
                        <p>LaTeX: {formula.latex}</p>
                        <pre>{JSON.stringify(formula.expressionJson)}</pre>
                      </details>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    className="delete-button"
                    onClick={() => void deleteFormula(formula.id)}
                    aria-label={`Delete ${formula.name}`}
                  >
                    Delete
                  </button>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}
