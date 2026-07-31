import React, { useState, useMemo } from 'react'
import { ASIS_LOGO_B64 } from '../utils/makbuz.js'

/* ─────────────────────────────────────────────────────────────
   CARİ HESAP EKSTRESİ (Finans → Ekstre alt sekmesi)
   Bina bazlı işlem dökümü: bakım tahakkukları (borç), ekstra işler
   (borç; peşin ödendiyse aynı satırda alacak), ödemeler (alacak).
   Dışa aktarım: Yazdır / PDF / Word (.docx).
   ───────────────────────────────────────────────────────────── */

function pTarih(raw) {
  if (raw == null || raw === '') return null
  var s = String(raw).trim()
  var m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (m) { var d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0); return isNaN(d.getTime()) ? null : d }
  m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/)
  if (m) { var d2 = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), 12, 0, 0); return isNaN(d2.getTime()) ? null : d2 }
  var d3 = new Date(s)
  return isNaN(d3.getTime()) ? null : d3
}
function trTarih(d) {
  if (!d) return ''
  return String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + d.getFullYear()
}
function tl(n) { return (Number(n) || 0).toLocaleString('tr-TR') }
function inputTarih(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}
function dosyaAdiTemiz(s) {
  return String(s || 'Bina').replace(/[şŞ]/g, 's').replace(/[çÇ]/g, 'c').replace(/[ğĞ]/g, 'g')
    .replace(/[ıİ]/g, 'i').replace(/[öÖ]/g, 'o').replace(/[üÜ]/g, 'u').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}
/* Firma logosu: tenant config'teki logoUrl, yoksa Asis için gömülü logo */
function firmaLogoSrc(firma) {
  if (firma && firma.logoUrl && String(firma.logoUrl).trim()) return String(firma.logoUrl).trim()
  if (firma && firma._isAsis) return ASIS_LOGO_B64
  return ''
}
function dataUrlBytes(dataUrl) {
  try {
    var b64 = String(dataUrl).split(',')[1] || ''
    var bin = atob(b64)
    var arr = new Uint8Array(bin.length)
    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
    return arr
  } catch (e) { return null }
}

/* Bina + dönem için işlem satırları */
function ekstreSatirlari(elev, maints, sonOdemeler, ekstraIsler, bas, bit) {
  var rows = []
  var id = Number(elev.id)
  var maintFiili = function (m) { return pTarih(m.yapildiSaat) || pTarih(m.tarih) }

  maints.forEach(function (m) {
    if (Number(m.asansorId) !== id || !m.yapildi) return
    var d = maintFiili(m)
    if (!d || d < bas || d > bit) return
    var tutar = Number(m.tutar) || Number(elev.aylikUcret) || 0
    rows.push({ d: d, tip: 'Bakım', aciklama: 'Aylık bakım ücreti' + (m.tahsilatBakimciAd ? ' · ' + m.tahsilatBakimciAd : ''), borc: tutar, alacak: 0 })
  })

  ;(ekstraIsler || []).forEach(function (k) {
    if (Number(k.binaId) !== id) return
    var d = pTarih(k.tarih)
    if (!d || d < bas || d > bit) return
    var tutar = Number(k.tutar) || 0
    var ekstraAciklama = (k.isAdi || 'Ekstra iş')
      + (k.not ? ' — ' + k.not : '')
      + (k.odendi ? ' (peşin tahsil)' : '')
    rows.push({ d: d, tip: 'Ekstra İş', aciklama: ekstraAciklama, borc: tutar, alacak: k.odendi ? tutar : 0 })
  })

  ;(sonOdemeler || []).forEach(function (o) {
    if (Number(o.aid) !== id || o.iptal) return
    var d = pTarih(o.tarih)
    if (!d || d < bas || d > bit) return
    var tutar = Number(o.alinanTutar) || 0
    if (tutar <= 0) return
    rows.push({ d: d, tip: 'Ödeme', aciklama: (o.not || 'Tahsilat') + (o.tahsilatYapan ? ' · ' + o.tahsilatYapan : ''), borc: 0, alacak: tutar, saat: o.saat || '' })
  })

  rows.sort(function (a, b) { return a.d - b.d })
  return rows
}

/* Yazdırma/PDF için A4 sayfalı HTML (.page bölmeleri) */
function ekstreHtml(firma, elev, rows, bas, bit, guncelDevir) {
  var SATIR_PER_SAYFA = 24
  var toplamBorc = rows.reduce(function (s, r) { return s + r.borc }, 0)
  var toplamAlacak = rows.reduce(function (s, r) { return s + r.alacak }, 0)
  var fark = toplamBorc - toplamAlacak

  var chunks = []
  for (var i = 0; i < rows.length; i += SATIR_PER_SAYFA) chunks.push(rows.slice(i, i + SATIR_PER_SAYFA))
  if (chunks.length === 0) chunks.push([])

  function tabloSatirlar(list) {
    return list.map(function (r) {
      return '<tr>' +
        '<td>' + trTarih(r.d) + '</td>' +
        '<td><span class="tip tip-' + (r.tip === 'Ödeme' ? 'o' : r.tip === 'Bakım' ? 'b' : 'e') + '">' + r.tip + '</span></td>' +
        '<td class="ac">' + r.aciklama + '</td>' +
        '<td class="num">' + (r.borc > 0 ? tl(r.borc) + ' ₺' : '—') + '</td>' +
        '<td class="num alc">' + (r.alacak > 0 ? tl(r.alacak) + ' ₺' : '—') + '</td>' +
        '</tr>'
    }).join('')
  }

  var pages = chunks.map(function (chunk, idx) {
    var ilk = idx === 0
    var son = idx === chunks.length - 1
    return '<div class="page">' +
      (ilk
        ? '<div class="hdr">' +
          '<div class="hdr-sol">' +
          (firmaLogoSrc(firma) ? '<img class="logo" src="' + firmaLogoSrc(firma) + '" alt="logo">' : '') +
          '<div class="firma">' + (firma.ad || 'Bakım Firması') + '</div>' +
          (firma.adres ? '<div class="fbilgi">' + firma.adres + '</div>' : '') +
          '<div class="fbilgi">' + [firma.tel, firma.tel2, firma.tel3].filter(Boolean).join(' · ') + '</div>' +
          '<div class="fbilgi">' + [firma.email, firma.email2].filter(Boolean).join(' · ') + '</div>' +
          '</div>' +
          '<div class="hdr-sag"><div class="belge">CARİ HESAP EKSTRESİ</div>' +
          '<div class="donem">Dönem: ' + trTarih(bas) + ' — ' + trTarih(bit) + '</div>' +
          '<div class="donem">Düzenleme: ' + trTarih(new Date()) + '</div></div>' +
          '</div>' +
          '<div class="bina">' +
          '<div class="bina-ad">' + (elev.ad || '') + '</div>' +
          '<div class="bina-alt">' + [(elev.semt ? elev.semt + ' Mah.' : ''), elev.adres, elev.ilce].filter(Boolean).join(', ') + '</div>' +
          (elev.yonetici ? '<div class="bina-alt">Yönetici: ' + elev.yonetici + (elev.tel ? ' · ' + elev.tel : '') + '</div>' : '') +
          '</div>'
        : '<div class="devam">' + (elev.ad || '') + ' — Cari Hesap Ekstresi (devam, sayfa ' + (idx + 1) + ')</div>') +
      '<table><thead><tr><th style="width:60px">Tarih</th><th style="width:62px">İşlem</th><th>Açıklama</th><th style="width:78px" class="num">Borç</th><th style="width:78px" class="num">Alacak</th></tr></thead>' +
      '<tbody>' + tabloSatirlar(chunk) + '</tbody></table>' +
      (son
        ? '<div class="ozet">' +
          '<div class="oz"><span>Dönem Toplam Borç</span><b>' + tl(toplamBorc) + ' ₺</b></div>' +
          '<div class="oz"><span>Dönem Toplam Alacak (Ödenen)</span><b class="alc">' + tl(toplamAlacak) + ' ₺</b></div>' +
          '<div class="oz"><span>Dönem Farkı</span><b style="color:' + (fark > 0 ? '#b91c1c' : '#047857') + '">' + tl(fark) + ' ₺</b></div>' +
          '<div class="oz buyuk"><span>GÜNCEL DEVİR BAKİYESİ</span><b style="color:' + (guncelDevir > 0 ? '#b91c1c' : '#047857') + '">' + tl(guncelDevir) + ' ₺</b></div>' +
          '</div>' +
          '<div class="dip">' + (guncelDevir > 0 ? 'Bakiye borcunuzu ifade eder.' : guncelDevir < 0 ? 'Bakiye lehinize alacak ifade eder.' : 'Hesabınız güncel olarak kapanmıştır.') + ' Bu ekstre bilgi amaçlıdır. · https://asisasansor.xyz</div>'
        : '<div class="dip">Devamı sonraki sayfada…</div>') +
      '</div>'
  }).join('')

  return '<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><title>Cari Ekstre — ' + (elev.ad || '') + '</title><style>' +
    '*{margin:0;padding:0;box-sizing:border-box}' +
    'body{font-family:Arial,sans-serif;color:#111;background:#fff}' +
    '.page{width:210mm;min-height:297mm;padding:14mm 14mm 12mm;margin:0 auto;background:#fff;page-break-after:always;display:flex;flex-direction:column}' +
    '.page:last-child{page-break-after:auto}' +
    '.hdr{display:flex;justify-content:space-between;gap:16px;border-bottom:3px solid #111;padding-bottom:10px;margin-bottom:10px}' +
    '.logo{height:46px;object-fit:contain;display:block;margin-bottom:6px}' +
    '.firma{font-size:19px;font-weight:900}' +
    '.fbilgi{font-size:10px;color:#444;margin-top:2px;line-height:1.5}' +
    '.hdr-sag{text-align:right}' +
    '.belge{font-size:15px;font-weight:900;letter-spacing:1px}' +
    '.donem{font-size:10.5px;color:#444;margin-top:3px}' +
    '.bina{background:#f3f4f6;border:1px solid #d1d5db;border-radius:6px;padding:9px 12px;margin-bottom:10px}' +
    '.bina-ad{font-size:14px;font-weight:900}' +
    '.bina-alt{font-size:10.5px;color:#444;margin-top:2px}' +
    '.devam{font-size:11px;font-weight:700;color:#555;border-bottom:2px solid #111;padding-bottom:6px;margin-bottom:8px}' +
    'table{width:100%;border-collapse:collapse;font-size:10.5px}' +
    'th{background:#111;color:#fff;text-align:left;padding:6px 8px;font-size:9.5px;text-transform:uppercase;letter-spacing:0.5px}' +
    'td{padding:5.5px 8px;border-bottom:1px solid #e5e7eb;vertical-align:top}' +
    'tr:nth-child(even) td{background:#fafafa}' +
    '.num{text-align:right;white-space:nowrap;font-weight:700}' +
    '.alc{color:#047857}' +
    '.ac{color:#333}' +
    '.tip{font-size:8.5px;font-weight:800;padding:1px 6px;border-radius:8px;white-space:nowrap}' +
    '.tip-b{background:#dbeafe;color:#1d4ed8}.tip-e{background:#fef3c7;color:#b45309}.tip-o{background:#d1fae5;color:#047857}' +
    '.ozet{margin-top:auto;border-top:2px solid #111;padding-top:8px}' +
    '.oz{display:flex;justify-content:space-between;font-size:11.5px;padding:3.5px 0}' +
    '.oz.buyuk{border-top:1.5px solid #999;margin-top:4px;padding-top:7px;font-size:14px;font-weight:900}' +
    '.dip{text-align:center;font-size:9px;color:#888;margin-top:8px}' +
    '@media print{@page{size:A4;margin:0}.page{margin:0}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}' +
    '</style></head><body>' + pages + '</body></html>'
}

async function ekstrePdfBlob(firma, elev, rows, bas, bit, guncelDevir) {
  var dosyaAdi = 'Ekstre_' + dosyaAdiTemiz(elev.ad) + '_' + inputTarih(bas) + '_' + inputTarih(bit) + '.pdf'
  var html = ekstreHtml(firma, elev, rows, bas, bit, guncelDevir)
  var iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.style.cssText = 'position:fixed;left:0;top:0;width:210mm;height:297mm;border:0;opacity:0;pointer-events:none;z-index:-9999;'
  document.body.appendChild(iframe)
  try {
    await new Promise(function (resolve) { iframe.addEventListener('load', resolve, { once: true }); iframe.srcdoc = html })
    var idoc = iframe.contentDocument
    if (!idoc) throw new Error('PDF hazırlanamadı')
    if (idoc.fonts && idoc.fonts.ready) { try { await idoc.fonts.ready } catch (_) {} }
    // Logo/görsellerin yüklenmesini bekle
    await Promise.all(Array.prototype.map.call(idoc.images || [], function (img) {
      return img.complete ? Promise.resolve() : new Promise(function (r) { img.onload = img.onerror = r })
    }))
    var html2canvasMod = await import('html2canvas')
    var html2canvas = html2canvasMod.default || html2canvasMod
    var jspdfMod = await import('jspdf')
    var jsPDF = jspdfMod.jsPDF
    var pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true })
    var w = pdf.internal.pageSize.getWidth()
    var h = pdf.internal.pageSize.getHeight()
    var pages = idoc.querySelectorAll('.page')
    for (var i = 0; i < pages.length; i += 1) {
      var canvas = await html2canvas(pages[i], { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false, windowWidth: pages[i].scrollWidth, windowHeight: pages[i].scrollHeight })
      if (i > 0) pdf.addPage()
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, w, h, undefined, 'FAST')
    }
    return { blob: pdf.output('blob'), dosyaAdi: dosyaAdi }
  } finally {
    document.body.removeChild(iframe)
  }
}

function blobIndir(blob, dosyaAdi) {
  var url = URL.createObjectURL(blob)
  var a = document.createElement('a')
  a.href = url
  a.download = dosyaAdi
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

async function ekstreWordIndir(firma, elev, rows, bas, bit, guncelDevir) {
  var docx = await import('docx')
  var toplamBorc = rows.reduce(function (s, r) { return s + r.borc }, 0)
  var toplamAlacak = rows.reduce(function (s, r) { return s + r.alacak }, 0)

  function P(text, opts) {
    opts = opts || {}
    return new docx.Paragraph({
      alignment: opts.align || docx.AlignmentType.LEFT,
      spacing: { after: opts.after != null ? opts.after : 60 },
      children: [new docx.TextRun({ text: text, bold: !!opts.bold, size: (opts.size || 20), color: opts.color || '111111' })]
    })
  }
  function hucre(text, opts) {
    opts = opts || {}
    return new docx.TableCell({
      shading: opts.bg ? { fill: opts.bg } : undefined,
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
      children: [new docx.Paragraph({
        alignment: opts.right ? docx.AlignmentType.RIGHT : docx.AlignmentType.LEFT,
        children: [new docx.TextRun({ text: String(text), bold: !!opts.bold, size: 18, color: opts.color || '111111' })]
      })]
    })
  }

  var headRow = new docx.TableRow({
    tableHeader: true,
    children: ['Tarih', 'İşlem', 'Açıklama', 'Borç (₺)', 'Alacak (₺)'].map(function (h, i) {
      return hucre(h, { bold: true, bg: '111111', color: 'FFFFFF', right: i >= 3 })
    })
  })
  var dataRows = rows.map(function (r) {
    return new docx.TableRow({
      children: [
        hucre(trTarih(r.d)),
        hucre(r.tip),
        hucre(r.aciklama),
        hucre(r.borc > 0 ? tl(r.borc) : '—', { right: true }),
        hucre(r.alacak > 0 ? tl(r.alacak) : '—', { right: true, color: '047857' })
      ]
    })
  })
  var toplamRow = new docx.TableRow({
    children: [
      hucre('', { bg: 'F3F4F6' }), hucre('', { bg: 'F3F4F6' }),
      hucre('DÖNEM TOPLAMI', { bold: true, bg: 'F3F4F6' }),
      hucre(tl(toplamBorc), { bold: true, right: true, bg: 'F3F4F6' }),
      hucre(tl(toplamAlacak), { bold: true, right: true, bg: 'F3F4F6', color: '047857' })
    ]
  })

  // Logo (data URL ise Word'e gömülür; Asis logosu 400x111 oranında)
  var logoParagraflar = []
  var logoSrc = firmaLogoSrc(firma)
  if (logoSrc && logoSrc.indexOf('data:image/') === 0) {
    var logoBytes = dataUrlBytes(logoSrc)
    if (logoBytes) {
      logoParagraflar.push(new docx.Paragraph({
        spacing: { after: 60 },
        children: [new docx.ImageRun({ type: 'png', data: logoBytes, transformation: { width: 150, height: 42 } })]
      }))
    }
  }

  var doc = new docx.Document({
    sections: [{
      properties: { page: { margin: { top: 720, bottom: 720, left: 850, right: 850 } } },
      children: logoParagraflar.concat([
        P(firma.ad || 'Bakım Firması', { bold: true, size: 32, after: 40 }),
        P([firma.adres, [firma.tel, firma.tel2, firma.tel3].filter(Boolean).join(' · ')].filter(Boolean).join('  |  '), { size: 16, color: '444444', after: 160 }),
        P('CARİ HESAP EKSTRESİ', { bold: true, size: 26, align: docx.AlignmentType.CENTER, after: 60 }),
        P('Dönem: ' + trTarih(bas) + ' — ' + trTarih(bit) + '   ·   Düzenleme: ' + trTarih(new Date()), { size: 18, align: docx.AlignmentType.CENTER, color: '444444', after: 160 }),
        P('Bina: ' + (elev.ad || ''), { bold: true, size: 24, after: 30 }),
        P([(elev.semt ? elev.semt + ' Mah.' : ''), elev.adres, elev.ilce].filter(Boolean).join(', '), { size: 18, color: '444444', after: 30 }),
        P(elev.yonetici ? 'Yönetici: ' + elev.yonetici + (elev.tel ? ' · ' + elev.tel : '') : '', { size: 18, color: '444444', after: 160 }),
        new docx.Table({
          width: { size: 100, type: docx.WidthType.PERCENTAGE },
          rows: [headRow].concat(dataRows).concat([toplamRow])
        }),
        P('', { after: 120 }),
        P('GÜNCEL DEVİR BAKİYESİ: ' + tl(guncelDevir) + ' ₺', { bold: true, size: 26, color: guncelDevir > 0 ? 'B91C1C' : '047857' }),
        P(guncelDevir > 0 ? 'Bakiye borcunuzu ifade eder.' : guncelDevir < 0 ? 'Bakiye lehinize alacak ifade eder.' : 'Hesabınız güncel olarak kapanmıştır.', { size: 16, color: '888888' })
      ])
    }]
  })
  var blob = await docx.Packer.toBlob(doc)
  blobIndir(blob, 'Ekstre_' + dosyaAdiTemiz(elev.ad) + '_' + inputTarih(bas) + '_' + inputTarih(bit) + '.docx')
}

export default function CariEkstre({ elevs, maints, sonOdemeler, ekstraIsler, firma }) {
  var yilBasi = new Date(new Date().getFullYear(), 0, 1)
  const [seciliId, setSeciliId] = useState(null)
  const [arama, setArama] = useState('')
  const [ilce, setIlce] = useState('Tümü')
  const [basStr, setBasStr] = useState(inputTarih(yilBasi))
  const [bitStr, setBitStr] = useState(inputTarih(new Date()))
  const [isleniyor, setIsleniyor] = useState('')

  const ilceler = useMemo(function () { return [...new Set(elevs.map(function (e) { return e.ilce }))].sort() }, [elevs])
  const filtreli = useMemo(function () {
    var l = elevs
    if (ilce !== 'Tümü') l = l.filter(function (e) { return e.ilce === ilce })
    if (arama.trim()) {
      var q = arama.toLowerCase()
      l = l.filter(function (e) { return (e.ad || '').toLowerCase().includes(q) || (e.yonetici || '').toLowerCase().includes(q) })
    }
    return l
  }, [elevs, ilce, arama])

  var secili = elevs.find(function (e) { return e.id === seciliId })
  var bas = pTarih(basStr) || yilBasi; bas.setHours(0, 0, 0, 0)
  var bit = pTarih(bitStr) || new Date(); bit.setHours(23, 59, 59, 999)

  const rows = useMemo(function () {
    if (!secili) return []
    return ekstreSatirlari(secili, maints, sonOdemeler, ekstraIsler, bas, bit)
  }, [secili, maints, sonOdemeler, ekstraIsler, basStr, bitStr])

  var toplamBorc = rows.reduce(function (s, r) { return s + r.borc }, 0)
  var toplamAlacak = rows.reduce(function (s, r) { return s + r.alacak }, 0)
  var guncelDevir = secili ? (Number(secili.bakiyeDevir) || 0) : 0

  function yazdir() {
    var html = ekstreHtml(firma || {}, secili, rows, bas, bit, guncelDevir)
    var w = window.open('', '_blank', 'width=800,height=900')
    w.document.write(html.replace('</body>', '<script>window.onload=function(){window.print();}<\/script></body>'))
    w.document.close()
  }
  async function pdfIndir() {
    setIsleniyor('pdf')
    try {
      var r = await ekstrePdfBlob(firma || {}, secili, rows, bas, bit, guncelDevir)
      blobIndir(r.blob, r.dosyaAdi)
    } catch (e) { alert('PDF oluşturulamadı: ' + (e && e.message)) }
    setIsleniyor('')
  }
  async function pdfPaylas() {
    setIsleniyor('paylas')
    try {
      var r = await ekstrePdfBlob(firma || {}, secili, rows, bas, bit, guncelDevir)
      var file = null
      try { file = new File([r.blob], r.dosyaAdi, { type: 'application/pdf' }) } catch (e) {}
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], title: r.dosyaAdi }) } catch (e) {}
      } else {
        blobIndir(r.blob, r.dosyaAdi)
      }
    } catch (e) { alert('Paylaşım hazırlanamadı: ' + (e && e.message)) }
    setIsleniyor('')
  }
  async function wordIndir() {
    setIsleniyor('word')
    try { await ekstreWordIndir(firma || {}, secili, rows, bas, bit, guncelDevir) }
    catch (e) { alert('Word dosyası oluşturulamadı: ' + (e && e.message)) }
    setIsleniyor('')
  }

  var inp = { background: '#0d1321', border: '1px solid #2a3050', borderRadius: 8, padding: '9px 12px', color: '#e0e6f0', fontSize: 13, outline: 'none' }

  if (!secili) {
    return (
      <div>
        <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>📑 Cari Hesap Ekstresi</div>
        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 12 }}>Bina seçin — dönem içi bakım, ekstra iş ve ödemelerin dökümü PDF/Word olarak dışa aktarılır.</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <input value={arama} onChange={function (e) { setArama(e.target.value) }} placeholder="🔍 Bina veya yönetici ara..." style={Object.assign({}, inp, { flex: 1, minWidth: 160 })} />
          <select value={ilce} onChange={function (e) { setIlce(e.target.value) }} style={Object.assign({}, inp, { cursor: 'pointer' })}>
            <option value="Tümü">Tüm İlçeler</option>
            {ilceler.map(function (i) { return <option key={i} value={i}>{i}</option> })}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 8, maxHeight: 420, overflowY: 'auto' }}>
          {filtreli.map(function (e) {
            var bakiye = Number(e.bakiyeDevir) || 0
            return (
              <button key={e.id} onClick={function () { setSeciliId(e.id) }}
                style={{ background: '#141824', borderRadius: 12, padding: 12, border: '1px solid #2a3050', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#e0e6f0' }}>{e.ad}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>📍 {e.ilce}{e.semt ? ' · ' + e.semt : ''}</div>
                <div style={{ fontSize: 11, marginTop: 4, fontWeight: 800, color: bakiye > 0 ? '#ef4444' : bakiye < 0 ? '#f59e0b' : '#10b981' }}>
                  Devir: {tl(bakiye)} ₺
                </div>
              </button>
            )
          })}
        </div>
        {filtreli.length === 0 && <div style={{ textAlign: 'center', padding: 30, color: '#64748b', fontSize: 13 }}>Sonuç bulunamadı.</div>}
      </div>
    )
  }

  return (
    <div>
      <button onClick={function () { setSeciliId(null) }}
        style={{ background: '#1a1f2e', border: 'none', borderRadius: 10, padding: '8px 14px', color: '#94a3b8', cursor: 'pointer', fontWeight: 600, fontSize: 13, marginBottom: 12 }}>
        ← Bina Listesi
      </button>

      <div style={{ background: '#141824', borderRadius: 14, border: '1px solid #2a3050', padding: '14px 16px', marginBottom: 12 }}>
        <div style={{ fontWeight: 900, fontSize: 16, color: '#e0e6f0' }}>{secili.ad}</div>
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
          📍 {[(secili.semt ? secili.semt + ' Mah.' : ''), secili.adres, secili.ilce].filter(Boolean).join(', ')}
          {secili.yonetici ? ' · 👤 ' + secili.yonetici : ''}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>Dönem:</label>
          <input type="date" value={basStr} onChange={function (e) { setBasStr(e.target.value) }} style={inp} />
          <span style={{ color: '#64748b' }}>—</span>
          <input type="date" value={bitStr} onChange={function (e) { setBitStr(e.target.value) }} style={inp} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 8, marginBottom: 12 }}>
        <div style={{ background: '#1a1f2e', borderRadius: 10, padding: '10px 12px', textAlign: 'center', border: '1px solid #3b82f633' }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#3b82f6' }}>{tl(toplamBorc)} ₺</div>
          <div style={{ fontSize: 10, color: '#64748b' }}>Dönem Borç</div>
        </div>
        <div style={{ background: '#1a1f2e', borderRadius: 10, padding: '10px 12px', textAlign: 'center', border: '1px solid #10b98133' }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#10b981' }}>{tl(toplamAlacak)} ₺</div>
          <div style={{ fontSize: 10, color: '#64748b' }}>Dönem Ödenen</div>
        </div>
        <div style={{ background: '#1a1f2e', borderRadius: 10, padding: '10px 12px', textAlign: 'center', border: '1px solid ' + (guncelDevir > 0 ? '#ef444433' : '#10b98133') }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: guncelDevir > 0 ? '#ef4444' : '#10b981' }}>{tl(guncelDevir)} ₺</div>
          <div style={{ fontSize: 10, color: '#64748b' }}>Güncel Devir</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <button onClick={yazdir} disabled={!!isleniyor}
          style={{ flex: 1, minWidth: 120, padding: '11px 8px', borderRadius: 10, background: '#1e2640', border: '1px solid #3b82f644', color: '#3b82f6', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
          🖨️ Yazdır
        </button>
        <button onClick={pdfIndir} disabled={!!isleniyor}
          style={{ flex: 1, minWidth: 120, padding: '11px 8px', borderRadius: 10, background: 'linear-gradient(135deg,#ef4444,#b91c1c)', border: 'none', color: '#fff', fontWeight: 800, fontSize: 12, cursor: 'pointer', opacity: isleniyor === 'pdf' ? 0.6 : 1 }}>
          {isleniyor === 'pdf' ? '⏳ Hazırlanıyor...' : '📄 PDF İndir'}
        </button>
        <button onClick={wordIndir} disabled={!!isleniyor}
          style={{ flex: 1, minWidth: 120, padding: '11px 8px', borderRadius: 10, background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', border: 'none', color: '#fff', fontWeight: 800, fontSize: 12, cursor: 'pointer', opacity: isleniyor === 'word' ? 0.6 : 1 }}>
          {isleniyor === 'word' ? '⏳ Hazırlanıyor...' : '📝 Word İndir'}
        </button>
        <button onClick={pdfPaylas} disabled={!!isleniyor}
          style={{ flex: 1, minWidth: 120, padding: '11px 8px', borderRadius: 10, background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', color: '#fff', fontWeight: 800, fontSize: 12, cursor: 'pointer', opacity: isleniyor === 'paylas' ? 0.6 : 1 }}>
          {isleniyor === 'paylas' ? '⏳ Hazırlanıyor...' : '📲 Paylaş'}
        </button>
      </div>

      <div style={{ background: '#141824', borderRadius: 12, border: '1px solid #2a3050', overflow: 'hidden' }}>
        {rows.length === 0
          ? <div style={{ padding: 30, textAlign: 'center', color: '#64748b', fontSize: 13 }}>Bu dönemde işlem yok. Dönem aralığını genişletmeyi deneyin.</div>
          : <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    {['Tarih', 'İşlem', 'Açıklama', 'Borç', 'Alacak'].map(function (h, i) {
                      return <th key={h} style={{ padding: '8px 10px', textAlign: i >= 3 ? 'right' : 'left', color: '#64748b', fontWeight: 700, borderBottom: '1px solid #2a3050', whiteSpace: 'nowrap', fontSize: 10, textTransform: 'uppercase' }}>{h}</th>
                    })}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(function (r, i) {
                    var tipRenk = r.tip === 'Ödeme' ? '#10b981' : r.tip === 'Bakım' ? '#3b82f6' : '#f59e0b'
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #1e2640' }}>
                        <td style={{ padding: '7px 10px', color: '#94a3b8', whiteSpace: 'nowrap' }}>{trTarih(r.d)}</td>
                        <td style={{ padding: '7px 10px' }}>
                          <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 10, background: tipRenk + '22', color: tipRenk, fontWeight: 800, whiteSpace: 'nowrap' }}>{r.tip}</span>
                        </td>
                        <td style={{ padding: '7px 10px', color: '#cbd5e1', maxWidth: 220 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.aciklama}</div>
                        </td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 800, color: r.borc > 0 ? '#e0e6f0' : '#334155', whiteSpace: 'nowrap' }}>{r.borc > 0 ? tl(r.borc) + ' ₺' : '—'}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 800, color: r.alacak > 0 ? '#10b981' : '#334155', whiteSpace: 'nowrap' }}>{r.alacak > 0 ? tl(r.alacak) + ' ₺' : '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
        }
      </div>
      <div style={{ fontSize: 10, color: '#475569', marginTop: 8 }}>
        ℹ️ Borç: yapılan bakımların aylık ücreti + ekstra işler. Alacak: alınan ödemeler (peşin ekstra işler dahil). Güncel Devir sistemdeki anlık bakiyedir.
      </div>
    </div>
  )
}
