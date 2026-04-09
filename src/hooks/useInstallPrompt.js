import { useState, useEffect } from 'react'

export function useInstallPrompt() {
  const [prompt, setPrompt] = useState(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(function () {
    // Zaten yüklüyse (standalone modda çalışıyorsa) gizle
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    function handler(e) {
      e.preventDefault()
      setPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handler)

    window.addEventListener('appinstalled', function () {
      setIsInstalled(true)
      setPrompt(null)
    })

    return function () {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  function install() {
    if (!prompt) return
    prompt.prompt()
    prompt.userChoice.then(function (result) {
      if (result.outcome === 'accepted') {
        setIsInstalled(true)
      }
      setPrompt(null)
    })
  }

  return { canInstall: !!prompt && !isInstalled, install, isInstalled }
}
