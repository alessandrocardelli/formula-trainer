import { useEffect, useMemo, useState, type FormEvent } from 'react'
import type { FormulaRecord } from '../db'
import { compareFormulaAnswer } from '../math/compareFormula'
import { hideMathKeyboard, openMathKeyboard } from '../math/mathKeyboard'

type MathFieldElement = HTMLElement & {
  value: string
}

type PracticeResult = 'correct' | 'incorrect' | 'revealed' | null

interface FullRecallPracticeProps {
  formulas: FormulaRecord[]
  onAddFormula?: () => void
}

export function FullRecallPractice({ formulas, onAddFormula }: FullRecallPracticeProps) {
  const [currentFormulaId, setCurrentFormulaId] = useState<number | null>(null)
  const [answerLatex, setAnswerLatex] = useState('')
  const [result, setResult] = useState<PracticeResult>(null)
  const [error, setError] = useState('')

  const currentFormula = useMemo(
    () => formulas.find((formula) => formula.id === currentFormulaId) ?? null,
    [formulas, currentFormulaId],
  )

  useEffect(() => {
    if (formulas.length === 0) {
      setCurrentFormulaId(null)
      return
    }

    if (!currentFormulaId || !formulas.some((formula) => formula.id === currentFormulaId)) {
      setCurrentFormulaId(formulas[0].id)
    }
  }, [formulas, currentFormulaId])

  function resetAttempt() {
    setAnswerLatex('')
    setResult(null)
    setError('')
  }

  function goToNextFormula() {
    if (!currentFormula || formulas.length === 0) {
      return
    }

    hideMathKeyboard()
    const currentIndex = formulas.findIndex((formula) => formula.id === currentFormula.id)
    const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % formulas.length
    setCurrentFormulaId(formulas[nextIndex].id)
    resetAttempt()
  }

  function checkAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!currentFormula) {
      return
    }

    const comparison = compareFormulaAnswer(currentFormula.latex, answerLatex)
    if (!comparison.ok) {
      setError(comparison.error ?? 'The answer could not be checked.')
      setResult(null)
      return
    }

    hideMathKeyboard()
    setError('')
    setResult(comparison.equivalent ? 'correct' : 'incorrect')
  }

  function revealAnswer() {
    if (!currentFormula) {
      return
    }

    hideMathKeyboard()
    setError('')
    setResult('revealed')
  }

  return (
    <section className="panel practice-panel" aria-labelledby="full-recall-title">
      <div className="section-heading compact-heading">
        <div>
          <p className="step-label">Practice mode</p>
          <h2 id="full-recall-title">Full recall</h2>
        </div>
        {formulas.length > 0 ? <span className="count-badge">{formulas.length}</span> : null}
      </div>

      {!currentFormula ? (
        <div className="empty-state">
          <p>No formula to practise yet.</p>
          <span>Add your first formula, then practise it here.</span>
          {onAddFormula ? (
            <button className="button button-primary empty-state-action" type="button" onClick={onAddFormula}>
              Add formula
            </button>
          ) : null}
        </div>
      ) : (
        <div className="practice-card">
          <div className="practice-prompt">
            <span className="category-chip">{currentFormula.category}</span>
            <p>Write the formula for</p>
            <h3>{currentFormula.name}</h3>
          </div>

          <form className="practice-form" onSubmit={checkAnswer}>
            <label>
              <span>Your answer</span>
              <math-field
                className="formula-editor practice-answer"
                value={answerLatex}
                math-virtual-keyboard-policy="manual"
                onClick={(event) => openMathKeyboard(event.currentTarget)}
                onInput={(event) => {
                  setAnswerLatex((event.currentTarget as MathFieldElement).value)
                  setError('')
                  setResult(null)
                }}
                aria-label={`Answer for ${currentFormula.name}`}
              />
            </label>

            <div className="practice-actions">
              <button className="button button-primary" type="submit">
                Check answer
              </button>
              <button className="button button-secondary" type="button" onClick={revealAnswer}>
                Show answer
              </button>
            </div>
          </form>

          {error ? <p className="practice-error">{error}</p> : null}

          {result ? (
            <div className={`practice-feedback practice-feedback-${result}`} aria-live="polite">
              <p className="practice-feedback-title">
                {result === 'correct'
                  ? 'Correct.'
                  : result === 'incorrect'
                    ? 'Not quite.'
                    : 'Answer revealed.'}
              </p>

              {result !== 'correct' ? <p className="practice-solution-label">Expected formula</p> : null}
              <math-field
                className="formula-preview practice-solution"
                value={currentFormula.latex}
                read-only
              />

              <div className="practice-feedback-actions">
                <button className="button button-secondary" type="button" onClick={resetAttempt}>
                  Try again
                </button>
                {formulas.length > 1 ? (
                  <button className="button button-secondary" type="button" onClick={goToNextFormula}>
                    Next formula
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          {!result && formulas.length > 1 ? (
            <button className="practice-next-link" type="button" onClick={goToNextFormula}>
              Skip to next formula
            </button>
          ) : null}

          <details className="practice-info">
            <summary>How answers are checked</summary>
            <p>
              Equivalent expressions and swapped equation sides are accepted. Solving for a different
              variable will be trained separately.
            </p>
          </details>
        </div>
      )}
    </section>
  )
}
