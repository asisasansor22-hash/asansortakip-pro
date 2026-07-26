import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './index.css'
import { applyTheme, watchSystemTheme } from './utils/theme'

// Tema index.html'deki satır içi betikle zaten uygulandı (parlama olmasın diye).
// Burada bir kez daha uygulanır (betik engellenmişse yedek) ve "Sistem" seçiliyse
// telefonun gece moduna geçişi canlı izlenir.
applyTheme()
watchSystemTheme()

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary><App /></ErrorBoundary>
)

// PWA service worker — kurulabilirlik için (online-only, cache yok)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function () {})
  })
}
