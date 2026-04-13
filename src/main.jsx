import React from 'react'
import ReactDOM from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App.jsx'
import './index.css'

let reloadingForUpdate = false

registerSW({
  immediate: true,
  onNeedRefresh() {
    if (reloadingForUpdate) return
    reloadingForUpdate = true
    window.location.reload()
  },
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return
    registration.update()
    window.setInterval(function () {
      registration.update()
    }, 60 * 1000)
  },
})

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (reloadingForUpdate) return
    reloadingForUpdate = true
    window.location.reload()
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
