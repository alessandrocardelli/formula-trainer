import { useEffect, useMemo, useState, type FormEvent } from 'react'
import type { FormulaRecord } from '../db'
import { compareExpressionAnswer } from '../math/compareExpression'
import { compareFormulaAnswer } from '../math/compareFormula'
import { hideMathKeyboard, openMathKeyboard } from '../math/mathKeyboard'
import { buildMissingTermGaps } from '../math/missingTerm'

type MathFieldElement = HTMLElement & {
  value: string
}

type PracticeResult = 'correct' | 'incorrect' | 'revealed' | null
type PracticeMode = 'full-recall' | 'missing-term'

interface FullRecallPracticeProps {
  formulas: FormulaRecord[]
  onAddFormula?: () => void
}

const modeTitles: Record<PracticeMode, string> = {
  'full-recall': 'Full recall',
  'missing-term': 'Missing term',
}

export function FullRecallPractice({ formulas, onAddFormula }: FullRecallPracticeProps) {
  const [mode, setMode] = useState<PracticeMode>('full-recall')
  const [currentFormulaId, setCurrentFormulaId] = useState<number | null>(null)
  const [gapIndex, setGapIndex] = useState(0)
  const [answerLatex, setAnswerLatex] = useState('')
  const [result, setResult] = useState<PracticeResult>(null)
  const [error, setError] = useState('')

  const currentFormula = useMemo(
    () => formulas.find((formula) => formula.id === currentFormulaId) ?? null,
    [formulas, currentFormulaId],
  )

  const missingTermGaps = useMemo(
    () => (currentFormula ? buildMissingTermGaps(currentFormula) : []),
    [currentFormula],
  )

  const currentGap =
    missingTermGaps.length > 0 ? missingTermGaps[gapIndex % missingTermGaps.length] : null

  useEffect(() => {
    if (formulas.length === 0) {
      setCurrentFormulaId(null)
      return
    }

    if (!currentFormulaId || !formulas.some((formula) => formula.id === currentFormulaId)) {
      setCurrentFormulaId(formulas[0].id)
    }
  }, [formulas, currentFormulaId])

  useEffect(() => {
    setGapIndex(0)
  }, [currentFormulaId])

  function resetAttempt() {
    setAnswerLatex('')
    setResult(null)
    setError('')
  }

  function switchMode(nextMode: PracticeMode) {
    hideMathKeyboard()
    setMode(nextMode)
    setGapIndex(0)
    resetAttempt()
  }

  function goToNextFormula() {
    if (!currentFormula || formulas.length === 0) {
      return
    }

    hideMathKeyboard()
    const currentIndex = formulas.findIndex((formula) => formula.id === currentFormula.id)
    const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % formulas.length
    setCurrentFormulaId(formulas[nextIndex].id)
    setGapIndex(0)
    resetAttempt()
  }

  function goToNextMissingChallenge() {
    hideMathKeyboard()

    if (missingTermGaps.length === 0) {
      goToNextFormula()
      return
    }

    const nextGapIndex = gapIndex + 1
    if (nextGapIndex < missingTermGaps.length) {
      setGapIndex(nextGapIndex)
      resetAttempt()
      return
    }

    if (formulas.length > 1) {
      goToNextFormula()
      return
    }

    setGapIndex(0)
    resetAttempt()
  }

  function checkFullRecallAnswer(event: FormEvent<HTMLFormElement>) {
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

  function checkMissingTermAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!currentGap) {
      return
    }

    const comparison = compareExpressionAnswer(currentGap.answerLatex, answerLatex)
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

  function handleAnswerInput(event: FormEvent<HTMLElement>) {
    setAnswerLatex((event.currentTarget as MathFieldElement).value)
    setError('')
    setResult(null)
  }

  function renderFullRecall() {
    if (!currentFormula) {
      return null
    }

    return (
      <div className="practice-card">
        <div className="practice-prompt">
          <span className="category-chip">{currentFormula.category}</span>
          <p>Write the formula for</p>
          <h3>{currentFormula.name}</h3>
        </div>

        <form className="practice-form" onSubmit={checkFullRecallAnswer}>
          <label>
            <span>Your answer</span>
            <math-field
              className="formula-editor practice-answer"
              value={answerLatex}
              math-virtual-keyboard-policy="manual"
              onClick={(event) => openMathKeyboard(event.currentTarget)}
              onInput={handleAnswerInput}
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
    )
  }

  function renderMissingTerm() {
    if (!currentFormula) {
      return null
    }

    if (!currentGap) {
      return (
        <div className="empty-state">
          <p>No useful gap could be generated for this formula yet.</p>
          <span>Missing term currently hides a variable that appears once on the right-hand side.</span>
          {formulas.length > 1 ? (
            <button className="button button-secondary empty-state-action" type="button" onClick={goToNextFormula}>
              Try next formula
            </button>
          ) : null}
        </div>
      )
    }

    return (
      <div className="practice-card">
        <div className="practice-prompt missing-term-prompt">
          <span className="category-chip">{currentFormula.category}</span>
          <p>Complete the formula for</p>
          <h3>{currentFormula.name}</h3>
          <math-field
            className="formula-preview missing-term-formula"
            value={currentGap.promptLatex}
            read-only
          />
        </div>

        <form className="practice-form" onSubmit={checkMissingTermAnswer}>
          <label>
            <span>Missing term</span>
            <math-field
              className="formula-editor practice-answer missing-term-answer"
              value={answerLatex}
              math-virtual-keyboard-policy="manual"
              onClick={(event) => openMathKeyboard(event.currentTarget)}
              onInput={handleAnswerInput}
              aria-label={`Missing term for ${currentFormula.name}`}
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

            {result !== 'correct' ? <p className="practice-solution-label">Missing term</p> : null}
            <math-field
              className="formula-preview practice-solution missing-term-solution"
              value={currentGap.answerLatex}
              read-only
            />

            <p className="practice-solution-label">Complete formula</p>
            <math-field
              className="formula-preview practice-solution"
              value={currentFormula.latex}
              read-only
            />

            <div className="practice-feedback-actions">
              <button className="button button-secondary" type="button" onClick={resetAttempt}>
                Try again
              </button>
              <button className="button button-secondary" type="button" onClick={goToNextMissingChallenge}>
                Next challenge
              </button>
            </div>
          </div>
        ) : null}

        {!result && (missingTermGaps.length > 1 || formulas.length > 1) ? (
          <button className="practice-next-link" type="button" onClick={goToNextMissingChallenge}>
            Skip to next challenge
          </button>
        ) : null}

        <details className="practice-info">
          <summary>How this mode works</summary>
          <p>
            One variable on the right-hand side is hidden. Enter only the missing term. Different
            gaps in the same formula are trained as separate challenges.
          </p>
        </details>
      </div>
    )
  }

  return (
    <section className="panel practice-panel" aria-labelledby="practice-mode-title">
      <div className="practice-mode-switch" role="tablist" aria-label="Practice mode">
        {(Object.keys(modeTitles) as PracticeMode[]).map((practiceMode) => (
          <button
            key={practiceMode}
            type="button"
            role="tab"
            aria-selected={mode === practiceMode}
            className={`practice-mode-button${mode === practiceMode ? ' practice-mode-button-active' : ''}`}
            onClick={() => switchMode(practiceMode)}
          >
            {modeTitles[practiceMode]}
          </button>
        ))}
      </div>

      <div className="section-heading compact-heading">
        <div>
          <p className="step-label">Practice mode</p>
          <h2 id="practice-mode-title">{modeTitles[mode]}</h2>
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
      ) : mode === 'full-recall' ? (
        renderFullRecall()
      ) : (
        renderMissingTerm()
      )}
    </section>
  )
}
