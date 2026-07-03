import React, { useEffect } from 'react'

// Uygulama-içi bakım bildirimi toast'ı. Yönetici oturumunda, bakımcı bir
// bakımı tamamladığında sağ üstte beliren, kendiliğinden kapanan kart.
function ToastItem({ bildirim, onDismiss }) {
  useEffect(function () {
    var t = setTimeout(function () { onDismiss(bildirim.id) }, 9000)
    return function () { clearTimeout(t) }
  }, [bildirim.id])

  var saat = ''
  try { saat = new Date(bildirim.ts).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) } catch (e) {}
  var tutar = Number(bildirim.tutar) || 0

  return React.createElement('div', {
    onClick: function () { onDismiss(bildirim.id) },
    style: {
      background: 'linear-gradient(135deg,#0f2e1f,#10243b)',
      border: '1px solid #10b981',
      borderLeft: '4px solid #10b981',
      borderRadius: 12,
      padding: '12px 14px',
      marginBottom: 10,
      color: '#e6f4ec',
      boxShadow: '0 8px 28px rgba(0,0,0,0.45)',
      cursor: 'pointer',
      maxWidth: 340,
      animation: 'atbb-in 0.25s ease'
    }
  },
    React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 } },
      React.createElement('span', { style: { fontSize: 16 } }, '🔧'),
      React.createElement('span', { style: { fontWeight: 800, fontSize: 13, color: '#34d399' } }, 'Bakım Tamamlandı'),
      saat ? React.createElement('span', { style: { marginLeft: 'auto', fontSize: 11, color: '#9fb3c8' } }, saat) : null
    ),
    React.createElement('div', { style: { fontSize: 13, fontWeight: 700 } }, bildirim.elevAd || 'Asansör'),
    React.createElement('div', { style: { fontSize: 12, color: '#9fb3c8', marginTop: 2 } },
      (bildirim.bakimciAd ? bildirim.bakimciAd : 'Bakımcı') +
      (bildirim.ilce ? ' · ' + bildirim.ilce : '') +
      (tutar > 0 ? ' · ' + tutar.toLocaleString('tr-TR') + ' ₺' : ' · ödeme alınmadı')
    )
  )
}

export default function BakimBildirimToast({ bildirimler, onDismiss }) {
  if (!bildirimler || !bildirimler.length) return null
  return React.createElement(React.Fragment, null,
    React.createElement('style', null, '@keyframes atbb-in{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}'),
    React.createElement('div', {
      style: { position: 'fixed', top: 14, right: 14, zIndex: 10001, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', pointerEvents: 'auto' }
    },
      bildirimler.slice(-4).map(function (b) {
        return React.createElement(ToastItem, { key: b.id, bildirim: b, onDismiss: onDismiss })
      })
    )
  )
}
