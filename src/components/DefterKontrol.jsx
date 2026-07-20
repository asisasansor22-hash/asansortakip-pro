import React, { useState, useMemo } from 'react'
import { defterOku } from '../firebase.js'

/* ─────────────────────────────────────────────────────────────
   DEFTER KONTROLÜ (Finans → 📒 Defter)
   Çift kayıt aşamasının denetim ekranı: her bina için
   defter bakiyesi (açılış + olay toplamı) ile sistemdeki
   bakiyeDevir karşılaştırılır. Fark ≠ 0 → kırmızı satır.
   ───────────────────────────────────────────────────────────── */

function tl(n) { return (Number(n) || 0).toLocaleString('tr-TR') }
var TIP_ETIKET = {
  odeme: { l: 'Ödeme', c: '#10b981' },
  tahakkuk: { l: 'Tahakkuk', c: '#3b82f6' },
  ekstra: { l: 'Ekstra İş', c: '#f59e0b' },
  ekstra_pesin: { l: 'Ekstra (Peşin)', c: '#a78bfa' },
  manuel: { l: 'Manuel', c: '#f472b6' },
  iptal: { l: 'İptal/Geri Alma', c: '#ef4444' }
}

export default function DefterKontrol({ elevs }) {
  const [durum, setDurum] = useState('bos') // bos | yukleniyor | ok | hata
  const [veri, setVeri] = useState(null)    // {meta, olaylar}
  const [acikBina, setAcikBina] = useState(null)
  const [sadeceFarkli, setSadeceFarkli] = useState(true)

  async function yukle() {
    setDurum('yukleniyor')
    try {
      var r = await defterOku()
      setVeri(r)
      setDurum('ok')
    } catch (e) { setDurum('hata') }
  }

  const satirlar = useMemo(function () {
    if (!veri || !veri.meta) return []
    var acilis = (veri.meta && veri.meta.bakiyeler) || {}
    var toplamlar = {}
    ;(veri.olaylar || []).forEach(function (o) {
      var aid = String(o.aid)
      toplamlar[aid] = (toplamlar[aid] || 0) + (Number(o.delta) || 0)
    })
    return elevs.map(function (e) {
      var aid = String(e.id)
      var ac = Number(acilis[aid]) || 0
      var hareket = toplamlar[aid] || 0
      var defterBakiye = ac + hareket
      var sistem = Number(e.bakiyeDevir) || 0
      return {
        id: e.id, ad: e.ad || '?', ilce: e.ilce || '',
        acilis: ac, hareket: hareket, defter: defterBakiye,
        sistem: sistem, fark: sistem - defterBakiye,
        olaySayisi: (veri.olaylar || []).filter(function (o) { return String(o.aid) === aid }).length
      }
    }).sort(function (a, b) { return Math.abs(b.fark) - Math.abs(a.fark) })
  }, [veri, elevs])

  var farklilar = satirlar.filter(function (s) { return Math.abs(s.fark) >= 1 })
  var gosterilecek = sadeceFarkli && farklilar.length > 0 ? farklilar : satirlar

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 14 }}>📒 Ödeme Defteri Kontrolü</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
            Bakiyeyi değiştiren her işlem silinemez deftere yazılır; burada sistem bakiyesiyle karşılaştırılır.
          </div>
        </div>
        <button onClick={yukle} disabled={durum === 'yukleniyor'}
          style={{ padding: '9px 16px', borderRadius: 10, background: 'linear-gradient(135deg,#f472b6,#db2777)', border: 'none', color: '#fff', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
          {durum === 'yukleniyor' ? '⏳ Yükleniyor...' : durum === 'ok' ? '🔄 Yenile' : '📥 Defteri Yükle'}
        </button>
      </div>

      {durum === 'bos' && (
        <div style={{ background: '#1a1f2e', borderRadius: 12, border: '1px solid #2a3050', padding: 30, textAlign: 'center', color: '#64748b', fontSize: 12 }}>
          Kontrolü başlatmak için "📥 Defteri Yükle"ye basın.
        </div>
      )}
      {durum === 'hata' && (
        <div style={{ background: '#2a1215', borderRadius: 12, border: '1px solid #ef444455', padding: 20, textAlign: 'center', color: '#ef4444', fontSize: 12 }}>
          Defter okunamadı — bağlantıyı kontrol edip tekrar deneyin.
        </div>
      )}
      {durum === 'ok' && (!veri || !veri.meta) && (
        <div style={{ background: '#2a2410', borderRadius: 12, border: '1px solid #f59e0b55', padding: 20, color: '#fbbf24', fontSize: 12 }}>
          ⏳ Defter açılışı henüz yapılmamış. Açılış, yönetici uygulaması verileri sunucudan doğrulanmış şekilde
          yüklediğinde otomatik oluşur — sayfayı yenileyip 1-2 dakika sonra tekrar deneyin.
        </div>
      )}

      {durum === 'ok' && veri && veri.meta && (
        <div>
          {/* Özet */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 8, margin: '10px 0' }}>
            <div style={{ background: '#1a1f2e', borderRadius: 10, padding: '10px 12px', textAlign: 'center', border: '1px solid #2a3050' }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#94a3b8' }}>{String(veri.meta.acilisTs || '').slice(0, 10)}</div>
              <div style={{ fontSize: 10, color: '#64748b' }}>Defter Açılışı</div>
            </div>
            <div style={{ background: '#1a1f2e', borderRadius: 10, padding: '10px 12px', textAlign: 'center', border: '1px solid #2a3050' }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#3b82f6' }}>{(veri.olaylar || []).length}</div>
              <div style={{ fontSize: 10, color: '#64748b' }}>Kayıtlı Hareket</div>
            </div>
            <div style={{ background: '#1a1f2e', borderRadius: 10, padding: '10px 12px', textAlign: 'center', border: '1px solid ' + (farklilar.length ? '#ef444455' : '#10b98155') }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: farklilar.length ? '#ef4444' : '#10b981' }}>
                {farklilar.length ? farklilar.length + ' binada fark' : 'Tam uyum ✓'}
              </div>
              <div style={{ fontSize: 10, color: '#64748b' }}>Sistem ⇄ Defter</div>
            </div>
          </div>

          {farklilar.length > 0 && (
            <div style={{ fontSize: 11, color: '#fca5a5', background: '#2a1215', borderRadius: 10, padding: '8px 12px', marginBottom: 10 }}>
              ⚠️ Farklı binalar: sistem bakiyesi defterin dışında değişmiş demektir (defter yazımı başarısız olmuş
              ya da defter dışı bir değişiklik olmuş olabilir). Satıra tıklayıp hareket dökümünü inceleyin.
            </div>
          )}

          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <button onClick={function () { setSadeceFarkli(true) }}
              style={{ padding: '5px 12px', borderRadius: 16, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: sadeceFarkli ? '#ef444422' : '#141824', border: '1px solid ' + (sadeceFarkli ? '#ef444466' : '#2a3050'), color: sadeceFarkli ? '#ef4444' : '#64748b' }}>
              Sadece Farklılar ({farklilar.length})
            </button>
            <button onClick={function () { setSadeceFarkli(false) }}
              style={{ padding: '5px 12px', borderRadius: 16, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: !sadeceFarkli ? '#3b82f622' : '#141824', border: '1px solid ' + (!sadeceFarkli ? '#3b82f666' : '#2a3050'), color: !sadeceFarkli ? '#93c5fd' : '#64748b' }}>
              Tüm Binalar ({satirlar.length})
            </button>
          </div>

          {gosterilecek.length === 0 && (
            <div style={{ background: '#0f2e1f', borderRadius: 12, border: '1px solid #10b98155', padding: 24, textAlign: 'center', color: '#34d399', fontSize: 13, fontWeight: 700 }}>
              ✅ Tüm binalarda defter ile sistem bakiyesi uyumlu.
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {gosterilecek.slice(0, 60).map(function (s) {
              var uyumlu = Math.abs(s.fark) < 1
              var acik = acikBina === s.id
              var binaOlaylar = acik ? (veri.olaylar || []).filter(function (o) { return String(o.aid) === String(s.id) }).slice().reverse() : []
              return (
                <div key={s.id} style={{ background: '#141824', borderRadius: 10, border: '1px solid ' + (uyumlu ? '#2a3050' : '#ef444466'), overflow: 'hidden' }}>
                  <div onClick={function () { setAcikBina(acik ? null : s.id) }}
                    style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', gap: 8, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 140 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: uyumlu ? '#e0e6f0' : '#fca5a5' }}>{uyumlu ? '✅ ' : '⚠️ '}{s.ad}</div>
                      <div style={{ fontSize: 10, color: '#64748b', marginTop: 1 }}>{s.ilce} · {s.olaySayisi} hareket</div>
                    </div>
                    <div style={{ display: 'flex', gap: 14, alignItems: 'center', fontSize: 11 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#64748b', fontSize: 9 }}>DEFTER</div>
                        <div style={{ fontWeight: 800, color: '#94a3b8' }}>{tl(s.defter)}₺</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#64748b', fontSize: 9 }}>SİSTEM</div>
                        <div style={{ fontWeight: 800, color: '#e0e6f0' }}>{tl(s.sistem)}₺</div>
                      </div>
                      <div style={{ textAlign: 'right', minWidth: 64 }}>
                        <div style={{ color: '#64748b', fontSize: 9 }}>FARK</div>
                        <div style={{ fontWeight: 900, color: uyumlu ? '#10b981' : '#ef4444' }}>{s.fark > 0 ? '+' : ''}{tl(s.fark)}₺</div>
                      </div>
                    </div>
                  </div>
                  {acik && (
                    <div style={{ borderTop: '1px solid #2a3050', padding: '8px 14px', maxHeight: 260, overflowY: 'auto' }}>
                      <div style={{ fontSize: 10, color: '#64748b', padding: '4px 0' }}>
                        Açılış bakiyesi: <b style={{ color: '#94a3b8' }}>{tl(s.acilis)}₺</b> ({String(veri.meta.acilisTs || '').slice(0, 10)})
                      </div>
                      {binaOlaylar.length === 0
                        ? <div style={{ fontSize: 11, color: '#475569', padding: '6px 0' }}>Açılıştan beri hareket yok.</div>
                        : binaOlaylar.map(function (o) {
                            var t = TIP_ETIKET[o.tip] || { l: o.tip, c: '#64748b' }
                            var d = Number(o.delta) || 0
                            return (
                              <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '6px 0', borderTop: '1px solid #1e2640', fontSize: 11 }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 8, background: t.c + '22', color: t.c, fontWeight: 800, marginRight: 6 }}>{t.l}</span>
                                  <span style={{ color: '#94a3b8' }}>{o.aciklama || ''}</span>
                                  <div style={{ fontSize: 9, color: '#475569', marginTop: 1 }}>{String(o.ts || '').replace('T', ' ').slice(0, 16)}{o.yazan ? ' · ' + o.yazan : ''}</div>
                                </div>
                                <div style={{ fontWeight: 800, whiteSpace: 'nowrap', color: d < 0 ? '#10b981' : d > 0 ? '#ef4444' : '#64748b' }}>
                                  {d > 0 ? '+' : ''}{tl(d)}₺
                                </div>
                              </div>
                            )
                          })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          {gosterilecek.length > 60 && <div style={{ fontSize: 10, color: '#64748b', textAlign: 'center', marginTop: 8 }}>+{gosterilecek.length - 60} bina daha (en büyük farklar üstte)</div>}
        </div>
      )}
    </div>
  )
}
