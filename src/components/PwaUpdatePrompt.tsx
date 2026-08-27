import { useRegisterSW } from 'virtual:pwa-register/react'

export function PwaUpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return

      const checkForUpdate = () => {
        if (document.visibilityState === 'visible' && navigator.onLine) {
          void registration.update()
        }
      }

      window.addEventListener('focus', checkForUpdate)
      document.addEventListener('visibilitychange', checkForUpdate)
    },
  })

  if (!needRefresh) {
    return null
  }

  return (
    <aside className="pwa-update-prompt" role="status" aria-live="polite">
      <div>
        <strong>Update available</strong>
        <span>A newer Formula Trainer version is ready.</span>
      </div>
      <button
        className="button button-primary"
        type="button"
        onClick={() => void updateServiceWorker(true)}
      >
        Reload
      </button>
    </aside>
  )
}
