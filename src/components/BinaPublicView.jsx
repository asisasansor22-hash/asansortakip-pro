import React, { useState, useEffect } from 'react'

/* ─────────────────────────────────────────────────────────────
   BİNA YÖNETİCİSİ SELF-SERVİS SAYFASI (girişsiz, salt-okunur)
   URL: /?f={firmaKodu}&bina={token}
   Veri, binaOzet Cloud Function'ından gelir; token yönetici
   uygulamasından üretilir. Sadece o binanın sınırlı verisi görünür.
   ───────────────────────────────────────────────────────────── */

var BINA_OZET_URL = 'https://europe-west1-asansortakipv3.cloudfunctions.net/binaOzet'

function tl(n) { return (Number(n) || 0).toLocaleString('tr-TR') }
function kisaTarih(raw) {
  var s = String(raw || '').trim()
  var m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return m[3] + '.' + m[2] + '.' + m[1]
  return s.split(' ')[0] || s
}

export default function BinaPublicView({ firmaKodu, token }) {
  const [durum, setDurum] = useState('yukleniyor') // yukleniyor | ok | hata
  const [veri, setVeri] = useState(null)

  useEffect(function () {
    var iptal = false
    fetch(BINA_OZET_URL + '?f=' + encodeURIComponent(firmaKodu) + '&t=' + encodeURIComponent(token))
      .then(function (r) { if (!r.ok) throw new Error('http-' + r.status); return r.json() })
      .then(function (d) { if (!iptal) { setVeri(d); setDurum('ok') } })
      .catch(function () { if (!iptal) setDurum('hata') })
    return function () { iptal = true }
  }, [firmaKodu, token])

  var kart = { background: '#141824', borderRadius: 16, border: '1px solid #2a3050', overflow: 'hidden', marginBottom: 12 }
  var kartBaslik = { padding: '12px 16px 8px', fontWeight: 800, fontSize: 14, color: '#e0e6f0', borderBottom: '1px solid #1e2d40' }

  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', color: '#e0e6f0', fontFamily: '-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif' }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '20px 16px 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={{ fontSize: 34 }}>🛗</div>
          <div style={{ fontWeight: 900, fontSize: 18 }}>AsansörTakip</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Bina Yöneticisi Bilgi Sayfası</div>
        </div>

        {durum === 'yukleniyor' && (
          <div style={{ textAlign: 'center', padding: 50, color: '#64748b' }}>⏳ Yükleniyor...</div>
        )}
        {durum === 'hata' && (
          <div style={{ textAlign: 'center', padding: 40, background: '#141824', borderRadius: 16, border: '1px solid #2a3050' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🔒</div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Sayfa görüntülenemedi</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>Link geçersiz veya kaldırılmış olabilir. Lütfen bakım firmanızla iletişime geçin.</div>
          </div>
        )}

        {durum === 'ok' && veri && (
          <div>
            {/* Bina başlığı + bakiye */}
            <div style={{ background: 'linear-gradient(135deg,#1e3a8a,#1d4ed8)', borderRadius: 16, padding: '18px 16px', marginBottom: 12 }}>
              <div style={{ fontWeight: 900, fontSize: 18 }}>{veri.binaAd}</div>
              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>{[veri.semt, veri.ilce].filter(Boolean).join(', ')}</div>
              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: veri.bakiye > 0 ? '#fca5a5' : '#86efac' }}>{tl(veri.bakiye)} ₺</div>
                  <div style={{ fontSize: 10, opacity: 0.85, marginTop: 1 }}>{veri.bakiye > 0 ? 'Güncel Borç' : veri.bakiye < 0 ? 'Alacağınız' : 'Bakiye (kapalı)'}</div>
                </div>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 900 }}>{tl(veri.aylikUcret)} ₺</div>
                  <div style={{ fontSize: 10, opacity: 0.85, marginTop: 1 }}>Aylık Bakım Ücreti</div>
                </div>
              </div>
            </div>

            {/* Muayene */}
            {veri.muayene && (
              <div style={{ background: '#1a2236', borderRadius: 12, padding: '10px 14px', marginBottom: 12, fontSize: 12, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                <span style={{ color: '#94a3b8' }}>🔍 Son muayene: <b style={{ color: '#e0e6f0' }}>{kisaTarih(veri.muayene.tarih)}</b>{veri.muayene.sonuc ? ' (' + veri.muayene.sonuc + ')' : ''}</span>
                {veri.muayene.sonraki && <span style={{ color: '#94a3b8' }}>Sonraki: <b style={{ color: '#f59e0b' }}>{kisaTarih(veri.muayene.sonraki)}</b></span>}
              </div>
            )}

            {/* Son bakımlar */}
            <div style={kart}>
              <div style={kartBaslik}>🔧 Son Bakımlar</div>
              {(!veri.bakimlar || veri.bakimlar.length === 0)
                ? <div style={{ padding: 14, fontSize: 12, color: '#64748b' }}>Kayıt yok.</div>
                : veri.bakimlar.map(function (b, i) {
                    return (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 16px', borderBottom: '1px solid #1e2d40', fontSize: 12 }}>
                        <span style={{ color: '#94a3b8' }}>✅ {kisaTarih(b.tarih)}</span>
                        {b.alinan > 0
                          ? <span style={{ fontWeight: 800, color: '#10b981' }}>+{tl(b.alinan)} ₺ ödendi</span>
                          : <span style={{ fontSize: 11, color: '#64748b' }}>ödeme yapılmadı</span>}
                      </div>
                    )
                  })}
            </div>

            {/* Son ödemeler */}
            <div style={kart}>
              <div style={kartBaslik}>💰 Son Ödemeleriniz</div>
              {(!veri.odemeler || veri.odemeler.length === 0)
                ? <div style={{ padding: 14, fontSize: 12, color: '#64748b' }}>Kayıt yok.</div>
                : veri.odemeler.map(function (o, i) {
                    return (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 16px', borderBottom: '1px solid #1e2d40', fontSize: 12 }}>
                        <span style={{ color: '#94a3b8' }}>📅 {kisaTarih(o.tarih)}{o.saat ? ' · ' + o.saat : ''}</span>
                        <span style={{ fontWeight: 800, color: '#10b981' }}>+{tl(o.tutar)} ₺</span>
                      </div>
                    )
                  })}
            </div>

            <div style={{ textAlign: 'center', fontSize: 10, color: '#475569', marginTop: 16 }}>
              Bu sayfa bilgi amaçlıdır ve bakım firmanız tarafından sizinle paylaşılmıştır.<br />
              Sorularınız için lütfen bakım firmanızı arayınız.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
