import React, { useState, useMemo } from 'react'
import { ASIS_LOGO_B64 } from '../utils/makbuz.js'

/* ─────────────────────────────────────────────────────────────
   AYLIK ÖZET RAPORU (Finans → 📊 Rapor)
   Seçilen ayın tahsilat/hedef/bakım/ilçe/bakımcı/gider özeti;
   firma antetli A4 PDF veya yazdırma çıktısı.
   Veri App.jsx > ayRaporuHesapla ile hesaplanır (çift sayım korumalı).
   ───────────────────────────────────────────────────────────── */

var AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
function tl(n) { return (Number(n) || 0).toLocaleString('tr-TR') }
function firmaLogoSrc(firma) {
  if (firma && firma.logoUrl && String(firma.logoUrl).trim()) return String(firma.logoUrl).trim()
  if (firma && firma._isAsis) return ASIS_LOGO_B64
  return ''
}

function raporHtml(firma, r) {
  var logo = firmaLogoSrc(firma)
  function satirlar(list, ad1, sutun) {
    if (!list || list.length === 0) return '<tr><td colspan="3" style="color:#888;text-align:center;padding:10px;">Kayıt yok</td></tr>'
    return list.map(function (x) {
      return '<tr><td>' + (x[sutun] || x.ad || x.ilce || '') + '</td><td class="num">' + x.bakim + '</td><td class="num">' + tl(x.tahsilat) + ' ₺</td></tr>'
    }).join('')
  }
  return '<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><title>Aylık Rapor — ' + r.ayAd + ' ' + r.yil + '</title><style>' +
    '*{margin:0;padding:0;box-sizing:border-box}' +
    '@page{size:A4;margin:13mm}' +
    'body{font-family:Arial,sans-serif;color:#111;background:#fff}' +
    '.page{max-width:184mm;margin:0 auto}' +
    '.hdr{display:flex;align-items:center;gap:16px;border-bottom:3px solid #111;padding-bottom:10px;margin-bottom:12px}' +
    '.logo{height:50px;object-fit:contain}' +
    '.h-orta{flex:1}.firma{font-size:20px;font-weight:900}' +
    '.fbilgi{font-size:10px;color:#444;margin-top:3px;line-height:1.5}' +
    '.h-sag{text-align:right}.belge{font-size:15px;font-weight:900;letter-spacing:1px}' +
    '.donem{font-size:10.5px;color:#444;margin-top:3px}' +
    '.baslik{font-size:22px;font-weight:900;text-align:center;margin:6px 0 14px;letter-spacing:1px}' +
    '.kartlar{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}' +
    '.kart{border:1.5px solid #111;border-radius:8px;padding:12px;text-align:center}' +
    '.kart .v{font-size:22px;font-weight:900}.kart .l{font-size:10px;color:#555;text-transform:uppercase;margin-top:3px;letter-spacing:0.5px}' +
    '.bar{height:14px;background:#eee;border-radius:8px;overflow:hidden;margin:2px 0 14px}' +
    '.bar>div{height:100%;background:linear-gradient(90deg,#059669,#10b981)}' +
    '.bolum{font-size:12px;font-weight:900;text-transform:uppercase;background:#111;color:#fff;padding:6px 12px;letter-spacing:1px;margin-top:6px}' +
    'table{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:10px}' +
    'th{background:#f3f4f6;text-align:left;padding:6px 10px;font-size:10px;text-transform:uppercase;border-bottom:1.5px solid #111}' +
    'td{padding:5px 10px;border-bottom:1px solid #e5e7eb}' +
    '.num{text-align:right;font-weight:700;white-space:nowrap}' +
    '.dip{text-align:center;font-size:9px;color:#888;margin-top:12px}' +
    '@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}' +
    '</style></head><body><div class="page">' +
    '<div class="hdr">' + (logo ? '<img class="logo" src="' + logo + '">' : '') +
    '<div class="h-orta"><div class="firma">' + (firma.ad || 'Bakım Firması') + '</div>' +
    (firma.adres ? '<div class="fbilgi">' + firma.adres + '</div>' : '') +
    '<div class="fbilgi">' + [firma.tel, firma.tel2, firma.tel3].filter(Boolean).join(' · ') + '</div></div>' +
    '<div class="h-sag"><div class="belge">AYLIK ÖZET RAPORU</div><div class="donem">' + r.donem + '</div></div></div>' +
    '<div class="baslik">' + r.ayAd + ' ' + r.yil + '</div>' +
    '<div class="kartlar">' +
    '<div class="kart"><div class="v" style="color:#059669">' + tl(r.tahsilat) + ' ₺</div><div class="l">Tahsilat</div></div>' +
    '<div class="kart"><div class="v" style="color:#1d4ed8">' + tl(r.hedef) + ' ₺</div><div class="l">Aylık Hedef</div></div>' +
    '<div class="kart"><div class="v">' + r.oran + '%</div><div class="l">Hedef Karşılama</div></div>' +
    '</div>' +
    '<div class="bar"><div style="width:' + Math.min(100, r.oran) + '%"></div></div>' +
    '<div class="kartlar">' +
    '<div class="kart"><div class="v">' + r.bakimSayisi + '</div><div class="l">Yapılan Bakım</div></div>' +
    '<div class="kart"><div class="v" style="color:#b45309">' + tl(r.giderToplam) + ' ₺</div><div class="l">Gider</div></div>' +
    '<div class="kart"><div class="v" style="color:' + (r.netKazanc >= 0 ? '#059669' : '#b91c1c') + '">' + tl(r.netKazanc) + ' ₺</div><div class="l">Net (Tahsilat−Gider)</div></div>' +
    '</div>' +
    '<div class="bolum">İlçe Bazında Dağılım</div>' +
    '<table><thead><tr><th>İlçe</th><th class="num">Bakım</th><th class="num">Tahsilat</th></tr></thead><tbody>' + satirlar(r.ilceler, 'İlçe', 'ilce') + '</tbody></table>' +
    '<div class="bolum">Bakımcı Performansı</div>' +
    '<table><thead><tr><th>Bakımcı</th><th class="num">Bakım</th><th class="num">Tahsilat</th></tr></thead><tbody>' + satirlar(r.bakimcilar, 'Bakımcı', 'ad') + '</tbody></table>' +
    '<div class="bolum">En Yüksek Borçlu Binalar (Güncel)</div>' +
    '<table><thead><tr><th>Bina</th><th>İlçe</th><th class="num">Devir Bakiye</th></tr></thead><tbody>' +
    (r.enBorclu.length ? r.enBorclu.map(function (x) { return '<tr><td>' + (x.ad || '') + '</td><td>' + (x.ilce || '') + '</td><td class="num" style="color:#b91c1c">' + tl(x.bakiye) + ' ₺</td></tr>' }).join('') : '<tr><td colspan="3" style="color:#059669;text-align:center;padding:10px;">Borçlu bina yok 🎉</td></tr>') +
    '</tbody></table>' +
    '<div class="dip">Toplam açık alacak: ' + tl(r.toplamAlacak) + ' ₺ · Bu ay bakım yapılan ' + (r.odeyen + r.odemeyen) + ' binadan ' + r.odeyen + ' tanesinde tahsilat yapıldı, ' + r.odemeyen + ' tanesinde yapılmadı. · Rapor ' + new Date().toLocaleDateString('tr-TR') + ' tarihinde oluşturuldu · https://asisasansor.xyz</div>' +
    '</div></body></html>'
}

export default function AylikRapor({ firma, hesapla }) {
  var now = new Date()
  const [yil, setYil] = useState(now.getFullYear())
  const [ay, setAy] = useState(now.getMonth())
  const [isleniyor, setIsleniyor] = useState('')

  const r = useMemo(function () { return hesapla(yil, ay) }, [yil, ay, hesapla])

  function yazdir() {
    var w = window.open('', '_blank', 'width=820,height=900')
    w.document.write(raporHtml(firma || {}, r).replace('</body>', '<script>window.onload=function(){window.print();}<\/script></body>'))
    w.document.close()
  }
  async function pdfIndir() {
    setIsleniyor('pdf')
    try {
      var html = raporHtml(firma || {}, r)
      var iframe = document.createElement('iframe')
      iframe.setAttribute('aria-hidden', 'true')
      iframe.style.cssText = 'position:fixed;left:0;top:0;width:210mm;height:297mm;border:0;opacity:0;pointer-events:none;z-index:-9999;'
      document.body.appendChild(iframe)
      await new Promise(function (res) { iframe.addEventListener('load', res, { once: true }); iframe.srcdoc = html })
      var idoc = iframe.contentDocument
      await Promise.all(Array.prototype.map.call(idoc.images || [], function (img) { return img.complete ? Promise.resolve() : new Promise(function (r2) { img.onload = img.onerror = r2 }) }))
      var h2c = (await import('html2canvas')).default
      var jsPDF = (await import('jspdf')).jsPDF
      var pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true })
      var W = pdf.internal.pageSize.getWidth(), H = pdf.internal.pageSize.getHeight()
      var page = idoc.querySelector('.page')
      var canvas = await h2c(page, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false, windowWidth: page.scrollWidth })
      var imgH = canvas.height * W / canvas.width
      var img = canvas.toDataURL('image/jpeg', 0.92)
      // Uzun içerik birden fazla A4 sayfaya bölünür
      var pozisyon = 0
      if (imgH <= H) {
        pdf.addImage(img, 'JPEG', 0, 0, W, imgH, undefined, 'FAST')
      } else {
        var kalan = imgH
        while (kalan > 0) {
          pdf.addImage(img, 'JPEG', 0, pozisyon, W, imgH, undefined, 'FAST')
          kalan -= H
          if (kalan > 0) { pdf.addPage(); pozisyon -= H }
        }
      }
      document.body.removeChild(iframe)
      var url = URL.createObjectURL(pdf.output('blob'))
      var a = document.createElement('a')
      a.href = url; a.download = 'Aylik_Rapor_' + AYLAR[ay] + '_' + yil + '.pdf'
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
    } catch (e) { alert('PDF oluşturulamadı: ' + (e && e.message)) }
    setIsleniyor('')
  }

  var inp = { background: '#0d1321', border: '1px solid #2a3050', borderRadius: 8, padding: '9px 12px', color: '#e0e6f0', fontSize: 13, outline: 'none', cursor: 'pointer' }
  var kart = { background: '#1a1f2e', borderRadius: 12, padding: '12px 14px', textAlign: 'center', border: '1px solid #2a3050' }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 14 }}>📊 Aylık Özet Raporu</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Ay seçin, PDF olarak indirin veya yazdırın.</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={ay} onChange={function (e) { setAy(Number(e.target.value)) }} style={inp}>
            {AYLAR.map(function (a, i) { return <option key={i} value={i}>{a}</option> })}
          </select>
          <select value={yil} onChange={function (e) { setYil(Number(e.target.value)) }} style={inp}>
            {[now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2].map(function (y) { return <option key={y} value={y}>{y}</option> })}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 8 }}>
        <div style={kart}><div style={{ fontSize: 18, fontWeight: 900, color: '#10b981' }}>{tl(r.tahsilat)}₺</div><div style={{ fontSize: 10, color: '#64748b' }}>Tahsilat</div></div>
        <div style={kart}><div style={{ fontSize: 18, fontWeight: 900, color: '#3b82f6' }}>{tl(r.hedef)}₺</div><div style={{ fontSize: 10, color: '#64748b' }}>Hedef</div></div>
        <div style={kart}><div style={{ fontSize: 18, fontWeight: 900, color: '#e0e6f0' }}>{r.oran}%</div><div style={{ fontSize: 10, color: '#64748b' }}>Karşılama</div></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 12 }}>
        <div style={kart}><div style={{ fontSize: 18, fontWeight: 900, color: '#e0e6f0' }}>{r.bakimSayisi}</div><div style={{ fontSize: 10, color: '#64748b' }}>Bakım</div></div>
        <div style={kart}><div style={{ fontSize: 18, fontWeight: 900, color: '#f59e0b' }}>{tl(r.giderToplam)}₺</div><div style={{ fontSize: 10, color: '#64748b' }}>Gider</div></div>
        <div style={kart}><div style={{ fontSize: 18, fontWeight: 900, color: r.netKazanc >= 0 ? '#10b981' : '#ef4444' }}>{tl(r.netKazanc)}₺</div><div style={{ fontSize: 10, color: '#64748b' }}>Net</div></div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <button onClick={pdfIndir} disabled={!!isleniyor}
          style={{ flex: 1, padding: '12px', borderRadius: 10, background: 'linear-gradient(135deg,#ef4444,#b91c1c)', border: 'none', color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer', opacity: isleniyor === 'pdf' ? 0.6 : 1 }}>
          {isleniyor === 'pdf' ? '⏳ Hazırlanıyor...' : '📄 PDF İndir'}
        </button>
        <button onClick={yazdir} disabled={!!isleniyor}
          style={{ flex: 1, padding: '12px', borderRadius: 10, background: '#1e2640', border: '1px solid #3b82f644', color: '#3b82f6', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
          🖨️ Yazdır
        </button>
      </div>

      {/* Ekran önizleme: ilçe + bakımcı */}
      <div style={{ background: '#141824', borderRadius: 12, border: '1px solid #2a3050', overflow: 'hidden', marginBottom: 10 }}>
        <div style={{ padding: '10px 14px', fontWeight: 700, fontSize: 13, borderBottom: '1px solid #2a3050' }}>🗺️ İlçe Dağılımı</div>
        {r.ilceler.length === 0 ? <div style={{ padding: 12, color: '#64748b', fontSize: 12 }}>Bu ay bakım kaydı yok.</div>
          : r.ilceler.map(function (x, i) {
            return <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', borderTop: i ? '1px solid #1e2640' : 'none', fontSize: 12 }}>
              <span style={{ color: '#cbd5e1' }}>{x.ilce}</span>
              <span style={{ color: '#64748b' }}>{x.bakim} bakım · <b style={{ color: '#10b981' }}>{tl(x.tahsilat)}₺</b></span>
            </div>
          })}
      </div>
      <div style={{ background: '#141824', borderRadius: 12, border: '1px solid #2a3050', overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', fontWeight: 700, fontSize: 13, borderBottom: '1px solid #2a3050' }}>👷 Bakımcı Performansı</div>
        {r.bakimcilar.length === 0 ? <div style={{ padding: 12, color: '#64748b', fontSize: 12 }}>Bu ay bakım kaydı yok.</div>
          : r.bakimcilar.map(function (x, i) {
            return <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', borderTop: i ? '1px solid #1e2640' : 'none', fontSize: 12 }}>
              <span style={{ color: '#cbd5e1' }}>{x.ad}</span>
              <span style={{ color: '#64748b' }}>{x.bakim} bakım · <b style={{ color: '#10b981' }}>{tl(x.tahsilat)}₺</b></span>
            </div>
          })}
      </div>
    </div>
  )
}
