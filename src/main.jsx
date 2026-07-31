import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(<App />)

// ─────────────────────────────────────────────────────────────
// OTOMATİK GÜNCELLEME
// Yeni sürüm yayınlanınca (SW skipWaiting + clientsClaim ile hemen
// devreye girer) sayfa kendini bir kez yeniler. Böylece PWA'yı silip
// yeniden kurmaya gerek kalmaz; site ve PWA aynı şekilde davranır.
// ─────────────────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  // Sayfa açıldığında zaten bir SW kontrol ediyorsa (ilk kurulum değilse)
  // sonraki controllerchange gerçek bir güncelleme demektir → yenile.
  var _ilkKurulumDegil = !!navigator.serviceWorker.controller;
  var _yenileniyor = false;
  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (!_ilkKurulumDegil || _yenileniyor) return;
    _yenileniyor = true;
    window.location.reload();
  });

  function _guncellemeKontrol() {
    navigator.serviceWorker.ready
      .then(function (reg) { if (reg) reg.update().catch(function () {}); })
      .catch(function () {});
  }
  // Açılışta, uygulama öne geldiğinde ve periyodik olarak güncelleme ara
  window.addEventListener('load', _guncellemeKontrol);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') _guncellemeKontrol();
  });
  setInterval(_guncellemeKontrol, 30 * 60 * 1000);
}
