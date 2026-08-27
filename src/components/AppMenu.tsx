import { useEffect, useState } from 'react'
import { resetLearningData } from '../learningData'

interface AppMenuProps {
  open: boolean
  onClose: () => void
  onOpenLibrary: () => void
  onLearningDataReset: () => void
}

export function AppMenu({
  open,
  onClose,
  onOpenLibrary,
  onLearningDataReset,
}: AppMenuProps) {
  const [confirmReset, setConfirmReset] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) {
      setConfirmReset(false)
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) {
    return null
  }

  async function confirmLearningDataReset() {
    setResetting(true)
    setError('')
    setStatus('')

    try {
      const result = await resetLearningData()
      setConfirmReset(false)
      setStatus(
        `Reset complete. Removed ${result.practiceEventsRemoved} practice event${result.practiceEventsRemoved === 1 ? '' : 's'} and ${result.reviewCardsRemoved} review card${result.reviewCardsRemoved === 1 ? '' : 's'}. Your formulas were kept.`,
      )
      onLearningDataReset()
    } catch {
      setError('Learning data could not be reset. No formula was deleted.')
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="app-menu-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="app-menu-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-menu-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="app-menu-handle" aria-hidden="true" />
        <header className="app-menu-heading">
          <div>
            <p className="step-label">Formula Trainer</p>
            <h2 id="app-menu-title">Settings & data</h2>
          </div>
          <button className="app-menu-close" type="button" onClick={onClose} aria-label="Close menu">
            ×
          </button>
        </header>

        <div className="app-menu-section">
          <div>
            <h3>Storage & backup</h3>
            <p>
              Formulas, practice history and scheduling data are stored locally in this browser.
              Backup import and export are available in Library.
            </p>
          </div>
          <button
            className="button button-secondary"
            type="button"
            onClick={() => {
              onOpenLibrary()
              onClose()
            }}
          >
            Open Library
          </button>
        </div>

        <div className="app-menu-section app-menu-danger-section">
          <div>
            <h3>Learning data</h3>
            <p>
              Reset practice history, statistics and FSRS scheduling while keeping every saved formula,
              variable definition and explanation.
            </p>
          </div>

          {!confirmReset ? (
            <button
              className="button button-danger"
              type="button"
              onClick={() => {
                setStatus('')
                setError('')
                setConfirmReset(true)
              }}
            >
              Reset learning data
            </button>
          ) : (
            <div className="app-menu-confirm" role="alert">
              <strong>Reset all learning progress?</strong>
              <p>
                This removes practice attempts, statistics and review scheduling. Your formula library is not touched.
              </p>
              <div className="app-menu-confirm-actions">
                <button
                  className="button button-secondary"
                  type="button"
                  disabled={resetting}
                  onClick={() => setConfirmReset(false)}
                >
                  Cancel
                </button>
                <button
                  className="button button-danger button-danger-solid"
                  type="button"
                  disabled={resetting}
                  onClick={() => void confirmLearningDataReset()}
                >
                  {resetting ? 'Resetting…' : 'Reset now'}
                </button>
              </div>
            </div>
          )}

          {status ? <p className="app-menu-status" aria-live="polite">{status}</p> : null}
          {error ? <p className="app-menu-status app-menu-status-error" aria-live="polite">{error}</p> : null}
        </div>

        <p className="app-menu-footnote">
          Selective reset by formula or exercise mode can be added later without changing this data model.
        </p>
      </section>
    </div>
  )
}
