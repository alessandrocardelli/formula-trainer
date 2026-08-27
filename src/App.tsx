import { useEffect, useState, type FormEvent } from 'react'
import { downloadFormulaTrainerBackup } from './backup'
import { FullRecallPractice } from './components/FullRecallPractice'
import { db, type FormulaRecord } from './db'
import {
  buildVariableMetadata,
  type VariableMetadata,
} from './domain/variableMetadata'
import { hideMathKeyboard, openMathKeyboard } from './math/mathKeyboard'
import { FORMULA_PARSER_VERSION, parseFormula } from './math/parseFormula'

type MathFieldElement = HTMLElement & {
  value: string
}

type VariableMetadataField = 'name' | 'unit' | 'definition'
type AppView = 'practice' | 'library' | 'add'

const exampleFormula = String.raw`X_C=\frac{1}{2\pi fC}`

const viewTitles: Record<AppView, string> = {
  practice: 'Practice',
  library: 'Library',
  add: 'Add formula',
}

function metadataMatches(a?: VariableMetadata[], b?: VariableMetadata[]) {
  return JSON.stringify(a ?? []) === JSON.stringify(b ?? [])
}

export default function App() {
  const [activeView, setActiveView] = useState<AppView>('practice')
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [latex, setLatex] = useState('')
  const [explanation, setExplanation] = useState('')
  const [draftVariableMetadata, setDraftVariableMetadata] = useState<VariableMetadata[]>([])
  const [formulas, setFormulas] = useState<FormulaRecord[]>([])
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'normal' | 'error'>('normal')

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editLatex, setEditLatex] = useState('')
  const [editExplanation, setEditExplanation] = useState('')

  function switchView(view: AppView) {
    hideMathKeyboard()
    setActiveView(view)
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
  }

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

  useEffect(() => {
    const cleanLatex = latex.trim()

    if (!cleanLatex) {
      setDraftVariableMetadata([])
      return
    }

    const timer = window.setTimeout(() => {
      const result = parseFormula(cleanLatex)

      if (!result.ok || !result.parsed) {
        setDraftVariableMetadata([])
        return
      }

      setDraftVariableMetadata((current) =>
        buildVariableMetadata(result.parsed!.variables, current),
      )
    }, 250)

    return () => window.clearTimeout(timer)
  }, [latex])

  function updateDraftVariableMetadata(
    symbol: string,
    field: VariableMetadataField,
    value: string,
  ) {
    setDraftVariableMetadata((current) =>
      current.map((entry) => (entry.symbol === symbol ? { ...entry, [field]: value } : entry)),
    )
  }

  async function saveFormula(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const cleanName = name.trim()
    const cleanCategory = category.trim()
    const cleanLatex = latex.trim()
    const cleanExplanation = explanation.trim()

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

    const variableMetadata = buildVariableMetadata(
      result.parsed.variables,
      draftVariableMetadata,
    )
    const now = Date.now()

    await db.formulas.add({
      name: cleanName,
      category: cleanCategory || 'Uncategorized',
      latex: cleanLatex,
      explanation: cleanExplanation || undefined,
      expressionJson: result.parsed.expressionJson,
      variables: result.parsed.variables,
      variableMetadata,
      parserVersion: FORMULA_PARSER_VERSION,
      createdAt: now,
      updatedAt: now,
    })

    hideMathKeyboard()
    setName('')
    setCategory('')
    setLatex('')
    setExplanation('')
    setDraftVariableMetadata([])
    setMessageType('normal')
    setMessage(`Saved. Detected variables: ${result.parsed.variables.join(', ')}.`)
    await refreshFormulas()
  }

  function startEditing(formula: FormulaRecord) {
    setEditingId(formula.id)
    setEditName(formula.name)
    setEditCategory(formula.category)
    setEditLatex(formula.latex)
    setEditExplanation(formula.explanation ?? '')
    setMessageType('normal')
    setMessage('')
  }

  function cancelEditing() {
    hideMathKeyboard()
    setEditingId(null)
    setEditName('')
    setEditCategory('')
    setEditLatex('')
    setEditExplanation('')
  }

  async function saveEditedFormula(event: FormEvent<HTMLFormElement>, formula: FormulaRecord) {
    event.preventDefault()

    const cleanName = editName.trim()
    const cleanCategory = editCategory.trim()
    const cleanLatex = editLatex.trim()
    const cleanExplanation = editExplanation.trim()

    if (!cleanName || !cleanLatex) {
      setMessageType('error')
      setMessage('The edited formula needs a name and an equation.')
      return
    }

    const result = parseFormula(cleanLatex)
    if (!result.ok || !result.parsed) {
      setMessageType('error')
      setMessage(result.error ?? 'The edited formula could not be parsed.')
      return
    }

    const variableMetadata = buildVariableMetadata(
      result.parsed.variables,
      formula.variableMetadata,
    )
    const now = Date.now()

    await db.formulas.update(formula.id, {
      name: cleanName,
      category: cleanCategory || 'Uncategorized',
      latex: cleanLatex,
      explanation: cleanExplanation || undefined,
      expressionJson: result.parsed.expressionJson,
      variables: result.parsed.variables,
      variableMetadata,
      parserVersion: FORMULA_PARSER_VERSION,
      updatedAt: now,
    })

    cancelEditing()
    setMessageType('normal')
    setMessage(`Updated ${cleanName}. Detected variables: ${result.parsed.variables.join(', ')}.`)
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
    if (editingId === id) {
      cancelEditing()
    }

    await db.formulas.delete(id)
    setMessageType('normal')
    setMessage('Formula deleted.')
    await refreshFormulas()
  }

  async function exportBackup() {
    try {
      const count = await downloadFormulaTrainerBackup()
      setMessageType('normal')
      setMessage(`Backup exported with ${count} formula${count === 1 ? '' : 's'}.`)
    } catch {
      setMessageType('error')
      setMessage('The backup could not be exported.')
    }
  }

  function loadExample() {
    setName('Capacitive reactance')
    setCategory('Electronics')
    setLatex(exampleFormula)
    setExplanation('')
    setMessageType('normal')
    setMessage('Example loaded. Complete the optional details or save it.')
  }

  return (
    <>
      <main className="app-shell">
        <header className="app-header">
          <p className="eyebrow">Formula Trainer</p>
          <h1>{viewTitles[activeView]}</h1>
        </header>

        {activeView === 'practice' ? (
          <div className="screen-content">
            <FullRecallPractice formulas={formulas} onAddFormula={() => switchView('add')} />
          </div>
        ) : null}

        {activeView === 'add' ? (
          <section className="panel screen-content" aria-labelledby="add-formula-title">
            <div className="section-heading compact-heading">
              <div>
                <p className="step-label">Formula library</p>
                <h2 id="add-formula-title">New formula</h2>
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
                  math-virtual-keyboard-policy="manual"
                  onClick={(event) => openMathKeyboard(event.currentTarget)}
                  onInput={(event) => setLatex((event.currentTarget as MathFieldElement).value)}
                  aria-label="Formula editor"
                />
              </label>

              {draftVariableMetadata.length > 0 ? (
                <section className="detected-variable-panel" aria-labelledby="detected-variables-title">
                  <div className="detected-variable-heading">
                    <div>
                      <p className="step-label">Detected automatically</p>
                      <h3 id="detected-variables-title">Variables</h3>
                    </div>
                    <span className="count-badge">{draftVariableMetadata.length}</span>
                  </div>

                  <p className="metadata-help">
                    Name and unit may be suggested when the symbol is familiar. Check them before saving.
                    Definitions are optional and are kept as your authoritative explanation.
                  </p>

                  <div className="draft-variable-list">
                    {draftVariableMetadata.map((entry) => (
                      <div className="draft-variable-card" key={entry.symbol}>
                        <div className="draft-variable-symbol">{entry.symbol}</div>
                        <div className="draft-variable-fields">
                          <label>
                            <span>Name</span>
                            <input
                              value={entry.name}
                              onChange={(event) =>
                                updateDraftVariableMetadata(entry.symbol, 'name', event.target.value)
                              }
                              placeholder="e.g. Electric current"
                            />
                          </label>
                          <label>
                            <span>Unit</span>
                            <input
                              value={entry.unit}
                              onChange={(event) =>
                                updateDraftVariableMetadata(entry.symbol, 'unit', event.target.value)
                              }
                              placeholder="e.g. A"
                            />
                          </label>
                          <label className="draft-definition-field">
                            <span>Definition <small>optional</small></span>
                            <textarea
                              value={entry.definition}
                              onChange={(event) =>
                                updateDraftVariableMetadata(
                                  entry.symbol,
                                  'definition',
                                  event.target.value,
                                )
                              }
                              placeholder="What does this variable represent?"
                              rows={2}
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              <label className="formula-explanation-field">
                <span>Formula explanation <small>optional</small></span>
                <textarea
                  value={explanation}
                  onChange={(event) => setExplanation(event.target.value)}
                  placeholder="In your own words, what does this formula express?"
                  rows={3}
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
        ) : null}

        {activeView === 'library' ? (
          <section className="panel screen-content" aria-labelledby="library-title">
            <div className="section-heading compact-heading">
              <div>
                <p className="step-label">Formula library</p>
                <h2 id="library-title">Your formulas</h2>
              </div>
              <div className="formula-card-actions">
                <span className="count-badge">{formulas.length}</span>
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={() => void exportBackup()}
                  disabled={formulas.length === 0}
                >
                  Export backup
                </button>
              </div>
            </div>

            {message ? (
              <p
                className={`library-status${messageType === 'error' ? ' status-message-error' : ''}`}
                aria-live="polite"
              >
                {message}
              </p>
            ) : null}

            {formulas.length === 0 ? (
              <div className="empty-state">
                <p>No formulas yet.</p>
                <span>Add one to start building your library.</span>
                <button
                  className="button button-primary empty-state-action"
                  type="button"
                  onClick={() => switchView('add')}
                >
                  Add formula
                </button>
              </div>
            ) : (
              <div className="formula-list">
                {formulas.map((formula) => {
                  const metadata = buildVariableMetadata(
                    formula.variables ?? [],
                    formula.variableMetadata,
                  )
                  const isEditing = editingId === formula.id

                  return (
                    <article
                      className={`formula-card${isEditing ? ' formula-card-editing' : ''}`}
                      key={formula.id}
                    >
                      {isEditing ? (
                        <form
                          className="formula-edit-form"
                          onSubmit={(event) => void saveEditedFormula(event, formula)}
                        >
                          <div className="formula-edit-grid">
                            <label>
                              <span>Name</span>
                              <input
                                value={editName}
                                onChange={(event) => setEditName(event.target.value)}
                                autoComplete="off"
                              />
                            </label>

                            <label>
                              <span>Category</span>
                              <input
                                value={editCategory}
                                onChange={(event) => setEditCategory(event.target.value)}
                                autoComplete="off"
                              />
                            </label>
                          </div>

                          <label>
                            <span>Formula</span>
                            <math-field
                              className="formula-editor formula-edit-math"
                              value={editLatex}
                              math-virtual-keyboard-policy="manual"
                              onClick={(event) => openMathKeyboard(event.currentTarget)}
                              onInput={(event) =>
                                setEditLatex((event.currentTarget as MathFieldElement).value)
                              }
                              aria-label={`Edit formula for ${formula.name}`}
                            />
                          </label>

                          <label>
                            <span>Formula explanation <small>optional</small></span>
                            <textarea
                              value={editExplanation}
                              onChange={(event) => setEditExplanation(event.target.value)}
                              placeholder="What does this formula express?"
                              rows={3}
                            />
                          </label>

                          <p className="edit-help">
                            Existing variable metadata is kept when the same symbols remain.
                          </p>

                          <div className="formula-edit-actions">
                            <button className="button button-primary" type="submit">
                              Save changes
                            </button>
                            <button
                              className="button button-secondary"
                              type="button"
                              onClick={cancelEditing}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="formula-card-header">
                            <div className="formula-card-copy">
                              <span className="category-chip">{formula.category}</span>
                              <h3>{formula.name}</h3>
                              <math-field className="formula-preview" value={formula.latex} read-only />
                            </div>

                            <div className="formula-card-actions">
                              <button
                                type="button"
                                className="edit-button"
                                onClick={() => startEditing(formula)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="delete-button"
                                onClick={() => void deleteFormula(formula.id)}
                                aria-label={`Delete ${formula.name}`}
                              >
                                Delete
                              </button>
                            </div>
                          </div>

                          <details className="formula-more">
                            <summary>Details & variables</summary>

                            {formula.explanation ? (
                              <div className="formula-explanation-summary">
                                <strong>Explanation</strong>
                                <p>{formula.explanation}</p>
                              </div>
                            ) : null}

                            {metadata.length > 0 ? (
                              <div className="variable-summary-list" aria-label="Variable details">
                                {metadata.map((entry) => (
                                  <div className="variable-summary-row" key={entry.symbol}>
                                    <span className="variable-chip">{entry.symbol}</span>
                                    <span className="variable-description">
                                      {entry.name || 'No description'}
                                      {entry.unit ? (
                                        <span className="variable-unit"> · {entry.unit}</span>
                                      ) : null}
                                      {entry.definition ? (
                                        <span className="variable-definition-summary">{entry.definition}</span>
                                      ) : null}
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
                                    <div className="variable-editor-row variable-editor-row-rich" key={entry.symbol}>
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
                                      <label className="variable-definition-editor">
                                        <span>Definition <small>optional</small></span>
                                        <textarea
                                          value={entry.definition}
                                          onChange={(event) =>
                                            updateVariableMetadata(
                                              formula.id,
                                              entry.symbol,
                                              'definition',
                                              event.target.value,
                                            )
                                          }
                                          placeholder="What does this variable represent?"
                                          rows={2}
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
                          </details>
                        </>
                      )}
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        ) : null}
      </main>

      <nav className="bottom-nav" aria-label="Main navigation">
        <button
          type="button"
          className={`bottom-nav-item${activeView === 'practice' ? ' bottom-nav-item-active' : ''}`}
          aria-current={activeView === 'practice' ? 'page' : undefined}
          onClick={() => switchView('practice')}
        >
          <span className="bottom-nav-icon" aria-hidden="true">▶</span>
          <span>Practice</span>
        </button>
        <button
          type="button"
          className={`bottom-nav-item${activeView === 'library' ? ' bottom-nav-item-active' : ''}`}
          aria-current={activeView === 'library' ? 'page' : undefined}
          onClick={() => switchView('library')}
        >
          <span className="bottom-nav-icon" aria-hidden="true">≡</span>
          <span>Library</span>
        </button>
        <button
          type="button"
          className={`bottom-nav-item${activeView === 'add' ? ' bottom-nav-item-active' : ''}`}
          aria-current={activeView === 'add' ? 'page' : undefined}
          onClick={() => switchView('add')}
        >
          <span className="bottom-nav-icon" aria-hidden="true">＋</span>
          <span>Add</span>
        </button>
      </nav>
    </>
  )
}
