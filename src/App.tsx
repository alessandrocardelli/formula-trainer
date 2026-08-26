import { useEffect, useState, type FormEvent } from 'react'
import { db, type FormulaRecord } from './db'

type MathFieldElement = HTMLElement & {
  value: string
}

const exampleFormula = String.raw`X_C=\frac{1}{2\pi fC}`

export default function App() {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [latex, setLatex] = useState('')
  const [formulas, setFormulas] = useState<FormulaRecord[]>([])
  const [message, setMessage] = useState('')

  async function refreshFormulas() {
    const records = await db.formulas.orderBy('updatedAt').reverse().toArray()
    setFormulas(records)
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
      setMessage('Add a name and a formula before saving.')
      return
    }

    const now = Date.now()
    await db.formulas.add({
      name: cleanName,
      category: cleanCategory || 'Uncategorized',
      latex: cleanLatex,
      createdAt: now,
      updatedAt: now,
    })

    setName('')
    setCategory('')
    setLatex('')
    setMessage('Formula saved locally on this device.')
    await refreshFormulas()
  }

  async function deleteFormula(id: number) {
    await db.formulas.delete(id)
    setMessage('Formula deleted.')
    await refreshFormulas()
  }

  function loadExample() {
    setName('Capacitive reactance')
    setCategory('Electronics')
    setLatex(exampleFormula)
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
            <span className="status-message" aria-live="polite">
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
            {formulas.map((formula) => (
              <article className="formula-card" key={formula.id}>
                <div className="formula-card-copy">
                  <span className="category-chip">{formula.category}</span>
                  <h3>{formula.name}</h3>
                  <math-field className="formula-preview" value={formula.latex} read-only />
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
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
