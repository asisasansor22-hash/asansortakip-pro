import React, { useState } from 'react'
import { useInstallPrompt } from '../hooks/useInstallPrompt.js'

export default function InstallBanner() {
  const { canInstall, install } = useInstallPrompt()
  const [dismissed, setDismissed] = useState(false)

  // iOS kontrolü — Safari'de beforeinstallprompt olmuyor, manuel yönlendirme göster
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
  const isInStandalone = window.matchMedia('(display-mode: standalone)').matches
  const [iosGoster, setIosGoster] = useState(
    isIOS && !isInStandalone && !sessionStorage.getItem('ios_banner_dismissed')
  )

  if (dismissed && !iosGoster) return null
  if (!canInstall && !iosGoster) return null

  function kapat() {
    setDismissed(true)
    setIosGoster(false)
    sessionStorage.setItem('ios_banner_dismissed', '1')
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      background: 'linear-gradient(135deg, #1e1b4b 0%, #0f1117 100%)',
      borderTop: '1px solid #6366f1',
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      boxShadow: '0 -4px 24px rgba(99,102,241,0.18)',
    }}>
      {/* İkon */}
      <div style={{
        width: 44,
        height: 44,
        borderRadius: 10,
        background: '#6366f1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontSize: 22,
      }}>
        🏢
      </div>

      {/* Metin */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, lineHeight: 1.3 }}>
          Ana Ekrana Ekle
        </div>
        {iosGoster ? (
          <div style={{ color: '#a5b4fc', fontSize: 12, marginTop: 2, lineHeight: 1.4 }}>
            Paylaş{' '}
            <span style={{ background: '#6366f1', borderRadius: 4, padding: '1px 5px', fontSize: 11 }}>⎙</span>
            {' '}→ Ana Ekrana Ekle'ye dokun
          </div>
        ) : (
          <div style={{ color: '#a5b4fc', fontSize: 12, marginTop: 2 }}>
            Uygulamayı telefona yükle, internet olmadan da çalışır
          </div>
        )}
      </div>

      {/* Butonlar */}
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        {!iosGoster && (
          <button
            onClick={install}
            style={{
              background: '#6366f1',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 14px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Yükle
          </button>
        )}
        <button
          onClick={kapat}
          style={{
            background: 'transparent',
            color: '#6b7280',
            border: '1px solid #374151',
            borderRadius: 8,
            padding: '8px 10px',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          ✕
        </button>
      </div>
    </div>
  )
}
