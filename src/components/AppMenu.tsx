import { useState } from 'react'
import { resetLearningData } from '../dataManagement'
import { hideMathKeyboard } from '../math/mathKeyboard'

export function AppMenu() {
  const [open, setOpen] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [error, setError] = useState('')

  function openMenu() {
    hideMathKeyboard()
    setError('')
    setOpen(true)
  }

  function closeMenu() {
    if (resetting) {
      return
    }

    setOpen(false)
    setConfirmReset(false)
    setError('')
  }

  async function confirmLearningReset() {
    setResetting(true)
    setError('')

    try {
      await resetLearningData()
      window.location.reload()
    } catch {
      setResetting(false)
      setError('Learning data could not be reset. Your formulas were not changed.')
    }
  }

  return (
    <>
      <button
        className="app-menu-trigger"
        type="button"
        aria-label="Open app menu"
        aria-expanded={open}
        onClick={openMenu}
      >
        <span aria-hidden="true">•••</span>
      </button>

      {open ? (
        <div className="app-menu-overlay" role="presentation" onMouseDown={closeMenu}>
          <section
            className="app-menu-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="app-settings-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="app-menu-heading">
              <div>
                <p className="eyebrow">Formula Trainer</p>
                <h2 id="app-settings-title">Settings</h2>
              </div>
              <button
                className="app-menu-close"
                type="button"
                aria-label="Close settings"
                onClick={closeMenu}
                disabled={resetting}
              >
                ×
              </button>
            </div>

            <div className="settings-section">
              <div>
                <p className="settings-section-label">Learning data</p>
                <h3>Reset progress</h3>
                <p className="settings-copy">
                  Clear practice history, statistics and the FSRS review schedule while keeping every
                  saved formula, variable definition and explanation.
                </p>
              </div>

              {!confirmReset ? (
                <button
                  className="button settings-danger-button"
                  type="button"
                  onClick={() => setConfirmReset(true)}
                >
                  Reset learning data
                </button>
              ) : (
                <div className="settings-confirmation" role="alert">
                  <strong>Reset all learning progress?</strong>
                  <p>
                    This cannot be undone unless you previously exported a backup. Your formula library
                    will not be deleted. The app will reload after the reset.
                  </p>
                  <div className="settings-confirm-actions">
                    <button
                      className="button button-secondary"
                      type="button"
                      onClick={() => setConfirmReset(false)}
                      disabled={resetting}
                    >
                      Cancel
                    </button>
                    <button
                      className="button settings-danger-button"
                      type="button"
                      onClick={() => void confirmLearningReset()}
                      disabled={resetting}
                    >
                      {resetting ? 'Resetting…' : 'Yes, reset progress'}
                    </button>
                  </div>
                </div>
              )}

              {error ? <p className="settings-error" aria-live="polite">{error}</p> : null}
            </div>

            <p className="settings-note">
              More preferences, including the electronics-focused math keyboard, will live here.
            </p>
          </section>
        </div>
      ) : null}
    </>
  )
}
