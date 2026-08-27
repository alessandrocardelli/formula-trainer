import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import type { FormulaRecord, PracticeMode } from '../db'
import {
  getNextReview,
  getReviewQueueSummary,
  type ReviewQueueSummary,
} from '../fsrsScheduler'
import { compareExpressionAnswer } from '../math/compareExpression'
import { compareFormulaAnswer } from '../math/compareFormula'
import { hideMathKeyboard, openMathKeyboard } from '../math/mathKeyboard'
import { buildMissingTermGaps, type MissingTermGap } from '../math/missingTerm'
import {
  getPracticeStats,
  recordPracticeCheck,
  recordPracticeReveal,
  type PracticeStats,
} from '../practiceHistory'
import { PracticeExplanation } from './PracticeExplanation'

type MathFieldElement = HTMLElement & {
  value: string
}

type PracticeResult = 'correct' | 'incorrect' | 'revealed' | null

interface FullRecallPracticeProps {
  formulas: FormulaRecord[]
  onAddFormula?: () => void
}

const modeTitles: Record<PracticeMode, string> = {
  'full-recall': 'Full recall',
  'missing-term': 'Missing term',
}

function shuffleGaps(gaps: MissingTermGap[]) {
  const shuffled = [...gaps]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }

  return shuffled
}

function formatNextDue(timestamp: number) {
  const diffMs = timestamp - Date.now()
  const minutes = Math.max(1, Math.round(diffMs / 60_000))

  if (minutes < 60) {
    return `in ${minutes} min`
  }

  const hours = Math.round(minutes / 60)
  if (hours < 24) {
    return `in ${hours} h`
  }

  return new Date(timestamp).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  })
}

export function FullRecallPractice({ formulas, onAddFormula }: FullRecallPracticeProps) {
  const [mode, setMode] = useState<PracticeMode>('full-recall')
  const [currentFormulaId, setCurrentFormulaId] = useState<number | null>(null)
  const [gapIndex, setGapIndex] = useState(0)
  const [gapShuffleRevision, setGapShuffleRevision] = useState(0)
  const [answerLatex, setAnswerLatex] = useState('')
  const [result, setResult] = useState<PracticeResult>(null)
  const [error, setError] = useState('')
  const [stats, setStats] = useState<PracticeStats | null>(null)
  const [queueSummary, setQueueSummary] = useState<ReviewQueueSummary | null>(null)
  const [trackingError, setTrackingError] = useState('')
  const attemptStartedAtRef = useRef(Date.now())

  const currentFormula = useMemo(
    () => formulas.find((formula) => formula.id === currentFormulaId) ?? null,
    [formulas, currentFormulaId],
  )

  const missingTermGaps = useMemo(
    () => (currentFormula ? shuffleGaps(buildMissingTermGaps(currentFormula)) : []),
    [currentFormula, gapShuffleRevision],
  )

  const currentGap =
    missingTermGaps.length > 0 ? missingTermGaps[gapIndex % missingTermGaps.length] : null

  useEffect(() => {
    if (formulas.length === 0) {
      setCurrentFormulaId(null)
      setQueueSummary(null)
      return
    }

    let cancelled = false
    const formulaIds = formulas.map((formula) => formula.id)

    void getNextReview(formulaIds, mode)
      .then((nextReview) => {
        if (!cancelled && nextReview) {
          setCurrentFormulaId(nextReview.formulaId)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCurrentFormulaId(formulas[0].id)
          setTrackingError('The review queue could not be loaded.')
        }
      })

    return () => {
      cancelled = true
    }
  }, [formulas, mode])

  useEffect(() => {
    setGapIndex(0)
  }, [currentFormulaId])

  useEffect(() => {
    attemptStartedAtRef.current = Date.now()
  }, [currentFormulaId, mode, gapIndex, gapShuffleRevision])

  useEffect(() => {
    if (!currentFormula) {
      setStats(null)
      return
    }

    let cancelled = false
    void getPracticeStats(currentFormula.id, mode)
      .then((nextStats) => {
        if (!cancelled) {
          setStats(nextStats)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStats(null)
          setTrackingError('Practice history could not be loaded.')
        }
      })

    return () => {
      cancelled = true
    }
  }, [currentFormula, mode])

  useEffect(() => {
    if (formulas.length === 0) {
      setQueueSummary(null)
      return
    }

    let cancelled = false
    const formulaIds = formulas.map((formula) => formula.id)
    void getReviewQueueSummary(formulaIds, mode)
      .then((summary) => {
        if (!cancelled) {
          setQueueSummary(summary)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setQueueSummary(null)
          setTrackingError('The review queue could not be loaded.')
        }
      })

    return () => {
      cancelled = true
    }
  }, [formulas, mode])

  function responseTimeMs() {
    return Math.max(0, Date.now() - attemptStartedAtRef.current)
  }

  async function refreshStats(formulaId: number, practiceMode: PracticeMode) {
    const nextStats = await getPracticeStats(formulaId, practiceMode)
    if (currentFormulaId === formulaId && mode === practiceMode) {
      setStats(nextStats)
    }
  }

  async function refreshQueue(practiceMode: PracticeMode) {
    const summary = await getReviewQueueSummary(
      formulas.map((formula) => formula.id),
      practiceMode,
    )
    if (mode === practiceMode) {
      setQueueSummary(summary)
    }
  }

  function persistCheck(formulaId: number, practiceMode: PracticeMode, correct: boolean) {
    const elapsed = responseTimeMs()
    void recordPracticeCheck({
      formulaId,
      mode: practiceMode,
      correct,
      responseTimeMs: elapsed,
    })
      .then(() => Promise.all([
        refreshStats(formulaId, practiceMode),
        refreshQueue(practiceMode),
      ]))
      .then(() => setTrackingError(''))
      .catch(() => setTrackingError('This attempt could not be saved or scheduled.'))
  }

  function persistReveal(formulaId: number, practiceMode: PracticeMode) {
    const elapsed = responseTimeMs()
    void recordPracticeReveal({
      formulaId,
      mode: practiceMode,
      responseTimeMs: elapsed,
    })
      .then(() => Promise.all([
        refreshStats(formulaId, practiceMode),
        refreshQueue(practiceMode),
      ]))
      .then(() => setTrackingError(''))
      .catch(() => setTrackingError('This reveal could not be saved or scheduled.'))
  }

  function resetAttempt() {
    setAnswerLatex('')
    setResult(null)
    setError('')
    setTrackingError('')
    attemptStartedAtRef.current = Date.now()
  }

  function switchMode(nextMode: PracticeMode) {
    hideMathKeyboard()
    setMode(nextMode)
    setGapIndex(0)
    if (nextMode === 'missing-term') {
      setGapShuffleRevision((revision) => revision + 1)
    }
    resetAttempt()
  }

  async function goToNextFormula() {
    if (!currentFormula || formulas.length === 0) {
      return
    }

    hideMathKeyboard()

    try {
      const nextReview = await getNextReview(
        formulas.map((formula) => formula.id),
        mode,
        currentFormula.id,
      )

      if (nextReview) {
        setCurrentFormulaId(nextReview.formulaId)
      }
    } catch {
      const currentIndex = formulas.findIndex((formula) => formula.id === currentFormula.id)
      const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % formulas.length
      setCurrentFormulaId(formulas[nextIndex].id)
      setTrackingError('The review queue could not choose the next formula.')
    }

    setGapIndex(0)
    resetAttempt()
  }

  function goToNextMissingChallenge() {
    hideMathKeyboard()

    if (missingTermGaps.length === 0) {
      void goToNextFormula()
      return
    }

    if (formulas.length > 1) {
      void goToNextFormula()
      return
    }

    const nextGapIndex = gapIndex + 1
    if (nextGapIndex < missingTermGaps.length) {
      setGapIndex(nextGapIndex)
      resetAttempt()
      return
    }

    setGapIndex(0)
    setGapShuffleRevision((revision) => revision + 1)
    resetAttempt()
  }

  function checkFullRecallAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!currentFormula || result) {
      return
    }

    const comparison = compareFormulaAnswer(currentFormula.latex, answerLatex)
    if (!comparison.ok) {
      setError(comparison.error ?? 'The answer could not be checked.')
      setResult(null)
      return
    }

    const correct = comparison.equivalent === true
    hideMathKeyboard()
    setError('')
    setResult(correct ? 'correct' : 'incorrect')
    persistCheck(currentFormula.id, 'full-recall', correct)
  }

  function checkMissingTermAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!currentFormula || !currentGap || result) {
      return
    }

    const comparison = compareExpressionAnswer(currentGap.answerLatex, answerLatex)
    if (!comparison.ok) {
      setError(comparison.error ?? 'The answer could not be checked.')
      setResult(null)
      return
    }

    const correct = comparison.equivalent === true
    hideMathKeyboard()
    setError('')
    setResult(correct ? 'correct' : 'incorrect')
    persistCheck(currentFormula.id, 'missing-term', correct)
  }

  function revealAnswer() {
    if (!currentFormula || result) {
      return
    }

    hideMathKeyboard()
    setError('')
    setResult('revealed')
    persistReveal(currentFormula.id, mode)
  }

  function handleAnswerInput(event: FormEvent<HTMLElement>) {
    if (result) {
      return
    }

    setAnswerLatex((event.currentTarget as MathFieldElement).value)
    setError('')
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
            <button className="button button-primary" type="submit" disabled={result !== null}>
              Check answer
            </button>
            <button
              className="button button-secondary"
              type="button"
              onClick={revealAnswer}
              disabled={result !== null}
            >
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

            {result === 'incorrect' && answerLatex ? (
              <>
                <p className="practice-solution-label">Your answer</p>
                <math-field
                  className="formula-preview practice-user-answer"
                  value={answerLatex}
                  read-only
                />
              </>
            ) : null}

            {result !== 'correct' ? <p className="practice-solution-label">Expected formula</p> : null}
            <math-field
              className="formula-preview practice-solution"
              value={currentFormula.latex}
              read-only
            />

            <PracticeExplanation formula={currentFormula} expanded={result !== 'correct'} />

            <div className="practice-feedback-actions">
              <button className="button button-secondary" type="button" onClick={resetAttempt}>
                Try again
              </button>
              {formulas.length > 1 ? (
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={() => void goToNextFormula()}
                >
                  Next review
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {!result && formulas.length > 1 ? (
          <button className="practice-next-link" type="button" onClick={() => void goToNextFormula()}>
            Skip to next review
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
            <button
              className="button button-secondary empty-state-action"
              type="button"
              onClick={() => void goToNextFormula()}
            >
              Try next review
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
            <button className="button button-primary" type="submit" disabled={result !== null}>
              Check answer
            </button>
            <button
              className="button button-secondary"
              type="button"
              onClick={revealAnswer}
              disabled={result !== null}
            >
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

            {result === 'incorrect' && answerLatex ? (
              <>
                <p className="practice-solution-label">Your answer</p>
                <math-field
                  className="formula-preview practice-user-answer"
                  value={answerLatex}
                  read-only
                />
              </>
            ) : null}

            <p className="practice-solution-label">
              {result === 'revealed' ? 'Missing term' : 'Correct missing term'}
            </p>
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

            <PracticeExplanation
              formula={currentFormula}
              focusSymbol={currentGap.symbol}
              expanded={result !== 'correct'}
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
            One variable on the right-hand side is hidden. Enter only the missing term. Available
            gaps are shuffled so the same variable is not always asked first.
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

      {queueSummary ? (
        <div className="review-queue-summary" aria-label="FSRS review queue">
          <span className="review-queue-label">FSRS queue</span>
          <span><strong>{queueSummary.dueNow}</strong> due now</span>
          {queueSummary.dueNow === 0 && queueSummary.nextDue ? (
            <span>Next {formatNextDue(queueSummary.nextDue)}</span>
          ) : null}
        </div>
      ) : null}

      {currentFormula && stats && (stats.checks > 0 || stats.reveals > 0) ? (
        <div className="practice-history-summary" aria-label="Practice history for this formula and mode">
          <span><strong>{stats.checks}</strong> checks</span>
          <span><strong>{stats.correct}</strong> correct</span>
          <span><strong>{stats.incorrect}</strong> wrong</span>
          <span><strong>{stats.reveals}</strong> revealed</span>
          {stats.accuracy !== null ? (
            <span><strong>{Math.round(stats.accuracy * 100)}%</strong> accuracy</span>
          ) : null}
        </div>
      ) : null}

      {trackingError ? <p className="practice-error">{trackingError}</p> : null}

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
