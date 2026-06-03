import React, { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

var ACCENT = '#1f4e79'
var ACCENT_HEX = '1F4E79'

function formatTarihTR(value) {
  if (!value) return ''
  var d = new Date(value)
  if (isNaN(d)) return value
  return d.toLocaleDateString('tr-TR')
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

var TEKLIF_HEADER_SRC = '/teklif-header.png'
var teklifHeaderBytesPromise = null
var teklifHeaderDataUrlPromise = null

function fetchImageBytes(url) {
  return fetch(url).then(function(res) {
    if (!res.ok) throw new Error('Gorsel yuklenemedi: ' + url)
    return res.arrayBuffer()
  })
}

function fetchImageDataUrl(url) {
  return fetch(url)
    .then(function(res) {
      if (!res.ok) throw new Error('Gorsel yuklenemedi: ' + url)
      return res.blob()
    })
    .then(function(blob) {
      return new Promise(function(resolve, reject) {
        var reader = new FileReader()
        reader.onload = function() { resolve(String(reader.result || '')) }
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
    })
}

function getTeklifHeaderBytes(customUrl) {
  if (customUrl) return fetchImageBytes(customUrl)
  if (!teklifHeaderBytesPromise) {
    teklifHeaderBytesPromise = fetchImageBytes(TEKLIF_HEADER_SRC)
  }
  return teklifHeaderBytesPromise
}

function getTeklifHeaderDataUrl(customUrl) {
  if (customUrl) return fetchImageDataUrl(customUrl)
  if (!teklifHeaderDataUrlPromise) {
    teklifHeaderDataUrlPromise = fetchImageDataUrl(TEKLIF_HEADER_SRC)
  }
  return teklifHeaderDataUrlPromise
}

function generateTenantHeaderDataUrl(logoDataUrl) {
  return new Promise(function(resolve, reject) {
    var canvas = document.createElement('canvas')
    canvas.width = 1120
    canvas.height = 130
    var ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, 1120, 130)

    var img = new Image()
    img.onload = function() {
      var maxW = 1120 - 28, maxH = 110
      var ratio = Math.min(maxW / img.width, maxH / img.height)
      var w = img.width * ratio, h = img.height * ratio
      ctx.drawImage(img, 14, (130 - h) / 2, w, h)

      // Alt çizgi
      ctx.strokeStyle = '#d0d5dd'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, 129)
      ctx.lineTo(1120, 129)
      ctx.stroke()

      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = reject
    img.src = logoDataUrl
  })
}

async function generateTenantHeaderBytes(logoDataUrl) {
  var dataUrl = await generateTenantHeaderDataUrl(logoDataUrl)
  var base64 = dataUrl.split(',')[1]
  var binary = atob(base64)
  var bytes = new Uint8Array(binary.length)
  for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

function cmToTwip(value) {
  return Math.round(value * 567)
}

function turkceBuyut(value) {
  return String(value || '').toLocaleUpperCase('tr-TR')
}

function parseIsler(value) {
  return String(value || '')
    .split(/\r?\n/)
    .map(function(line) { return line.trim() })
    .filter(Boolean)
    .map(function(line) { return line.replace(/^\d+[\).\-\s]+/, '').trim() })
}

function islerPreview(value) {
  var items = parseIsler(value)
  if (items.length === 0) return ''
  return items.map(function(item, index) {
    return (index + 1) + '. ' + item
  }).join('\n')
}

function teklifVerisi(teklif, elev, config) {
  var apartmanHam = (teklif.apartmanAdi || (elev && elev.ad) || '').trim()
  var recipientCore = apartmanHam || 'APARTMAN'
  if (!/YÖNET[İI]M[İI]\s*$/i.test(recipientCore)) recipientCore += ' YÖNETİMİ'
  var items = parseIsler(teklif.yapilacakIsler)
  var itemsFirst = items.slice(0, 12)
  var itemsSecond = items.slice(12)
  var tutarSayi = +teklif.tutar || 0
  var _kv = teklif.kdvDahil
  var kdv = (_kv === false || _kv === 'haric_goster') ? 'haric_goster' : (_kv === 'haric' ? 'haric' : 'dahil')
  function fmtTL(n) { return (Math.round(n) || 0).toLocaleString('tr-TR') + ' TL' }
  var totalRows
  if (kdv === 'haric_goster') {
    var kdvTutar = tutarSayi * 0.20
    totalRows = [
      { label: 'Ara Toplam', value: fmtTL(tutarSayi), big: false },
      { label: 'KDV (%20)', value: fmtTL(kdvTutar), big: false },
      { label: 'GENEL TOPLAM', value: fmtTL(tutarSayi + kdvTutar), big: true }
    ]
  } else if (kdv === 'haric') {
    totalRows = [{ label: 'TOPLAM TUTAR (KDV Dahil Değildir)', value: fmtTL(tutarSayi), big: true }]
  } else {
    totalRows = [{ label: 'TOPLAM TUTAR (KDV Dahil)', value: fmtTL(tutarSayi), big: true }]
  }

  var cfg = config || {}
  var isAsis = !!(cfg._isAsis)
  var company1 = (cfg.ad || '').trim() || (isAsis ? 'Asis Asansör Sistemleri' : '')
  var company2 = (cfg.adres || '').trim() || (isAsis ? 'Zafer Mahallesi Yüksel Sk. No:23, 34194 Bahçelievler / İstanbul' : '')
  var tel1 = (cfg.tel || '').trim() || (isAsis ? '0212-703-20-52' : '')
  var tel2 = (cfg.tel2 || '').trim() || (isAsis ? '0536-565-92-23' : '')
  var tel3 = (cfg.tel3 || '').trim() || (isAsis ? '0543-507-07-94' : '')
  var email1 = (cfg.email || '').trim()
  var email2 = (cfg.email2 || '').trim()

  var telLines = []
  if (tel1) telLines.push('Tel: ' + tel1)
  if (tel2) telLines.push('Cep Tel: ' + tel2)
  if (tel3) telLines.push(tel3)

  var footerParts = []
  if (company2) footerParts.push(company2)
  if (tel1) footerParts.push('Tel: ' + tel1)
  if (tel2) footerParts.push('Cep: ' + tel2)
  if (tel3) footerParts.push(tel3)
  if (email1) footerParts.push(email1)
  if (email2) footerParts.push(email2)

  // Teklif numarası (kayıtlı teklifin id'sinden türetilir, taslakta TASLAK)
  var d = teklif.tarih ? new Date(teklif.tarih) : new Date()
  var yil = isNaN(d) ? new Date().getFullYear() : d.getFullYear()
  var ref = teklif.id ? String(teklif.id).slice(-5) : 'TASLAK'
  var teklifNo = 'TKF-' + yil + '-' + ref

  // Geçerlilik: tarih + 15 gün
  var gecerlilik = '15 gün'
  if (teklif.tarih && !isNaN(d)) {
    var g = new Date(d); g.setDate(g.getDate() + 15)
    gecerlilik = formatTarihTR(g.toISOString())
  }

  return {
    date: formatTarihTR(teklif.tarih),
    teklifNo: teklifNo,
    gecerlilik: gecerlilik,
    recipient: turkceBuyut(recipientCore),
    recipientAddress: (teklif.adres || '').trim(),
    intro: 'Binanızda bulunan 1 adet asansörün firmamız tarafından yapılan incelemede belirlenen eksikler ve düzeltilmesi gereken maddeler aşağıda sırası ile belirtilmiştir.',
    title: 'YAPILACAK İŞLEMLER',
    items: items,
    itemsFirst: itemsFirst,
    itemsSecond: itemsSecond,
    secondStart: itemsFirst.length + 1,
    kdvDahil: kdv,
    totalRows: totalRows,
    delivery: 'ASANSÖR, SÖZLEŞME YAPILDIĞI TARİHTEN İTİBAREN 2 HAFTA İÇİNDE TESLİM EDİLECEKTİR.',
    company1: company1,
    company2: company2,
    telLines: telLines,
    footer: footerParts.join('   ·   '),
    signLeft: 'Sözleşme Onay Tarihi',
    signRight: 'Kaşe / İmza'
  }
}

function teklifItemsTableHtml(items, startIndex) {
  if (!items.length) return ''
  var rows = items.map(function(item, i) {
    var no = (startIndex || 0) + i + 1
    var zebra = (i % 2 === 1) ? ' class="zebra"' : ''
    return '<tr' + zebra + '><td class="no">' + no + '</td><td class="is">' + escapeHtml(item) + '</td></tr>'
  }).join('')
  return '<table class="items"><thead><tr><th class="no">No</th><th class="is">Yapılacak İşlem</th></tr></thead><tbody>' + rows + '</tbody></table>'
}

function teklifHtmlDocument(teklif, elev, options, config) {
  var data = teklifVerisi(teklif, elev, config)
  var preview = !!(options && options.preview)
  var autoPrint = !!(options && options.autoPrint)
  var title = escapeHtml((options && options.title) || 'Teklif')
  var headerSrc = (options && options.headerSrc) || null
  var showHeader = !!(headerSrc)

  var headerHtml = '<div class="doc-header">' +
    (showHeader ? '<img class="logo" src="' + headerSrc + '" alt="logo" />' : '<div class="logo-spacer"></div>') +
    '<div class="accent-bar"></div></div>'

  var bodyBg = preview ? '#eef2f6' : '#ffffff'
  var bodyPadding = preview ? '18px 0' : '0'
  var pageWidth = preview ? 'min(920px, calc(100vw - 20px))' : '210mm'
  var pageMargin = preview ? '0 auto 18px' : '0 auto'
  var pageShadow = preview ? '0 16px 40px rgba(16,24,40,.12)' : 'none'
  var script = autoPrint ? '<script>window.onload=function(){window.focus();};<\/script>' : ''

  var metaBox =
    '<div class="meta-box">' +
      '<div class="meta-title">TEKLİF</div>' +
      '<div class="meta-line"><span class="meta-k">Teklif No</span><span class="meta-v">' + escapeHtml(data.teklifNo) + '</span></div>' +
      (data.date ? '<div class="meta-line"><span class="meta-k">Tarih</span><span class="meta-v">' + escapeHtml(data.date) + '</span></div>' : '') +
      '<div class="meta-line"><span class="meta-k">Geçerlilik</span><span class="meta-v">' + escapeHtml(data.gecerlilik) + '</span></div>' +
    '</div>'

  var recipientBlock =
    '<div class="recipient">' +
      '<div class="rec-label">SAYIN</div>' +
      '<div class="rec-name">' + escapeHtml(data.recipient) + '</div>' +
      (data.recipientAddress ? '<div class="rec-addr">' + escapeHtml(data.recipientAddress) + '</div>' : '') +
    '</div>'

  var companyLines =
    (data.company1 ? '<div class="co-name">' + escapeHtml(data.company1) + '</div>' : '') +
    (data.company2 ? '<div class="co-line">' + escapeHtml(data.company2) + '</div>' : '') +
    data.telLines.map(function(t) { return '<div class="co-line">' + escapeHtml(t) + '</div>' }).join('')

  var totalRowsHtml = data.totalRows.map(function(r) {
    return '<div class="total-row' + (r.big ? ' big' : '') + '">' +
      '<span class="tr-label">' + escapeHtml(r.label) + '</span>' +
      '<span class="tr-value">' + escapeHtml(r.value) + '</span>' +
    '</div>'
  }).join('')
  var totalBox = '<div class="total-wrap"><div class="total-box' + (data.totalRows.length > 1 ? ' multi' : '') + '">' + totalRowsHtml + '</div></div>'

  var signatures =
    '<div class="signatures">' +
      '<div class="sig"><div class="sig-space"></div><div class="sig-label">' + escapeHtml(data.signLeft) + '</div></div>' +
      '<div class="sig"><div class="sig-space"></div><div class="sig-label">' + escapeHtml(data.signRight) + '</div></div>' +
    '</div>'

  var footerHtml = data.footer ? '<div class="footer-band">' + escapeHtml(data.footer) + '</div>' : ''

  var css =
    '*{box-sizing:border-box;}' +
    'body{margin:0;background:' + bodyBg + ';padding:' + bodyPadding + ';font-family:"Segoe UI",Verdana,Arial,sans-serif;color:#1a2330;-webkit-print-color-adjust:exact;print-color-adjust:exact;}' +
    '.page{width:' + pageWidth + ';min-height:297mm;margin:' + pageMargin + ';background:#fff;box-shadow:' + pageShadow + ';display:flex;flex-direction:column;overflow:hidden;}' +
    '.doc-header{width:100%;}' +
    '.doc-header .logo{display:block;width:100%;max-height:96px;object-fit:contain;padding:20px 36px 12px;}' +
    '.doc-header .logo-spacer{height:44px;}' +
    '.accent-bar{height:5px;background:linear-gradient(90deg,' + ACCENT + ',#2e6ca8);}' +
    '.content{padding:32px 40px 0;flex:1;display:flex;flex-direction:column;}' +
    '.meta-top{display:flex;justify-content:space-between;gap:28px;align-items:flex-start;margin-bottom:30px;}' +
    '.recipient .rec-label{font-size:11px;letter-spacing:1.5px;color:#7a8aa0;font-weight:700;}' +
    '.recipient .rec-name{font-size:16px;font-weight:800;color:' + ACCENT + ';margin-top:5px;line-height:1.3;}' +
    '.recipient .rec-addr{font-size:13px;color:#5a6b80;margin-top:7px;max-width:320px;line-height:1.6;}' +
    '.meta-box{border:1px solid #d4dde7;border-radius:9px;overflow:hidden;min-width:220px;}' +
    '.meta-box .meta-title{background:' + ACCENT + ';color:#fff;font-size:12px;font-weight:800;letter-spacing:3px;text-align:center;padding:8px 12px;}' +
    '.meta-box .meta-line{display:flex;justify-content:space-between;gap:16px;padding:8px 14px;font-size:13px;border-bottom:1px solid #eef2f6;}' +
    '.meta-box .meta-line:last-child{border-bottom:none;}' +
    '.meta-k{color:#7a8aa0;font-weight:600;}' +
    '.meta-v{color:#1a2330;font-weight:700;}' +
    '.intro{font-size:14px;line-height:1.8;text-align:justify;margin:0 0 28px;color:#2a3645;}' +
    '.section-title{font-size:14px;font-weight:800;letter-spacing:.6px;color:' + ACCENT + ';border-bottom:2px solid ' + ACCENT + ';padding-bottom:7px;margin:0 0 16px;}' +
    'table.items{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;}' +
    'table.items th{background:' + ACCENT + ';color:#fff;text-align:left;padding:10px 14px;font-size:13px;font-weight:700;letter-spacing:.3px;}' +
    'table.items th.no,table.items td.no{width:50px;text-align:center;}' +
    'table.items td{padding:10px 14px;border:1px solid #e4eaf1;color:#2a3645;line-height:1.5;}' +
    'table.items tr.zebra td{background:#f6f9fc;}' +
    '.page-two .content{padding-top:24px;justify-content:center;}' +
    '.bottom-block{margin-top:0;padding-top:0;}' +
    '.total-wrap{display:flex;justify-content:flex-end;margin-bottom:18px;}' +
    '.total-box{display:inline-flex;flex-direction:column;gap:6px;background:#eef3f8;border:1px solid #d4dde7;border-left:5px solid ' + ACCENT + ';border-radius:9px;padding:13px 22px;min-width:280px;}' +
    '.total-row{display:flex;justify-content:space-between;gap:28px;align-items:baseline;font-size:13px;}' +
    '.total-row .tr-label{font-weight:700;color:#3a4a5e;}' +
    '.total-row .tr-value{font-weight:700;color:#1a2330;}' +
    '.total-box.multi .total-row.big{border-top:1px solid #cdd9e6;padding-top:8px;margin-top:2px;}' +
    '.total-row.big .tr-label{color:' + ACCENT + ';font-size:13px;letter-spacing:.3px;}' +
    '.total-row.big .tr-value{color:' + ACCENT + ';font-size:23px;font-weight:900;}' +
    '.delivery{font-size:12px;color:#4a5a6e;font-weight:700;margin:0 0 22px;letter-spacing:.2px;}' +
    '.company-block{margin-bottom:8px;}' +
    '.company-block .co-name{font-family:Calibri,"Segoe UI",sans-serif;font-size:18px;font-weight:800;color:#1a2330;}' +
    '.company-block .co-line{font-family:Calibri,"Segoe UI",sans-serif;font-size:14px;font-weight:700;color:#3a4a5e;line-height:1.55;}' +
    '.signatures{display:flex;gap:48px;margin-top:18px;}' +
    '.signatures .sig{flex:1;}' +
    '.signatures .sig-space{height:46px;border-bottom:1.5px solid #8a99ad;margin-bottom:8px;}' +
    '.signatures .sig-label{text-align:center;font-size:12px;font-weight:700;color:#3a4a5e;}' +
    '.footer-band{margin-top:18px;background:' + ACCENT + ';color:#dfe9f4;font-size:11px;text-align:center;padding:9px 18px;letter-spacing:.2px;}' +
    '.footer-band a{color:#dfe9f4 !important;text-decoration:none !important;}' +
    '@media print{@page{size:A4;margin:0;}body{background:#fff;padding:0;}.page{width:auto;margin:0;box-shadow:none;page-break-after:always;}.page:last-child{page-break-after:auto;}}' +
    '@media (max-width:760px){.content{padding:16px 16px 0;}.meta-top{flex-direction:column;gap:14px;}.meta-box{min-width:0;width:100%;}.recipient .rec-name{font-size:17px;}.intro{font-size:13px;}.signatures{flex-direction:column;gap:24px;}.total-box{min-width:0;width:100%;}}'

  var page1 =
    '<section class="page">' +
      headerHtml +
      '<div class="content">' +
        '<div class="meta-top">' + recipientBlock + metaBox + '</div>' +
        '<p class="intro">' + escapeHtml(data.intro) + '</p>' +
        '<div class="section-title">' + escapeHtml(data.title) + '</div>' +
        teklifItemsTableHtml(data.itemsFirst, 0) +
      '</div>' +
    '</section>'

  var page2 =
    '<section class="page page-two">' +
      headerHtml +
      '<div class="content">' +
        (data.itemsSecond.length ? teklifItemsTableHtml(data.itemsSecond, data.secondStart - 1) : '') +
        '<div class="bottom-block">' +
          totalBox +
          '<p class="delivery">' + escapeHtml(data.delivery) + '</p>' +
          '<div class="company-block">' + companyLines + '</div>' +
          signatures +
        '</div>' +
      '</div>' +
      footerHtml +
    '</section>'

  return '<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1.0">' +
    '<meta name="format-detection" content="telephone=no,date=no,address=no,email=no">' +
    '<title>' + title + '</title>' +
    '<style>' + css + '</style></head><body>' +
    page1 + page2 + script +
    '</body></html>'
}

function teklifDosyaAdi(teklif, elev, ext) {
  var apartmanAdi = (teklif.apartmanAdi || (elev && elev.ad) || 'teklif').trim()
  var tarih = (teklif.tarih || '').trim()
  var parcalar = ['teklif', apartmanAdi]
  if (tarih) parcalar.push(tarih)
  return parcalar.join('-').replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') + '.' + ext
}

function teklifParagraf(docx, text, options) {
  var opts = options || {}
  return new docx.Paragraph({
    alignment: opts.justify ? docx.AlignmentType.JUSTIFIED : opts.align,
    indent: opts.leftCm ? { left: cmToTwip(opts.leftCm) } : undefined,
    spacing: {
      before: opts.beforePt ? opts.beforePt * 20 : 0,
      after: opts.afterPt ? opts.afterPt * 20 : 0
    },
    children: [
      new docx.TextRun({
        text: text,
        bold: !!opts.bold,
        font: opts.font || 'Verdana',
        size: (opts.sizePt || 12) * 2,
        color: opts.color
      })
    ]
  })
}

function waitForImages(root) {
  var imgs = Array.prototype.slice.call(root.querySelectorAll('img'))
  return Promise.all(imgs.map(function(img) {
    if (img.complete && img.naturalHeight > 0) return Promise.resolve()
    return new Promise(function(resolve) {
      img.addEventListener('load', resolve, { once: true })
      img.addEventListener('error', resolve, { once: true })
    })
  }))
}

function teklifHeaderParagraf(docx, headerBytes) {
  return new docx.Paragraph({
    border: {
      bottom: { style: docx.BorderStyle.SINGLE, color: ACCENT_HEX, size: 18 }
    },
    spacing: { after: 300 },
    children: [
      new docx.ImageRun({
        type: 'png',
        data: headerBytes,
        transformation: { width: 560, height: 65 }
      })
    ]
  })
}

function teklifNilBorders(docx) {
  var nil = { style: docx.BorderStyle.NIL, size: 0, color: 'FFFFFF' }
  return { top: nil, bottom: nil, left: nil, right: nil, insideHorizontal: nil, insideVertical: nil }
}

function teklifUstBilgiTablosu(docx, data) {
  var nilAll = teklifNilBorders(docx)
  var leftChildren = [
    new docx.Paragraph({ children: [new docx.TextRun({ text: 'SAYIN', bold: true, font: 'Verdana', size: 16, color: '7A8AA0' })] }),
    new docx.Paragraph({ spacing: { before: 30 }, children: [new docx.TextRun({ text: data.recipient, bold: true, font: 'Verdana', size: 26, color: ACCENT_HEX })] })
  ]
  if (data.recipientAddress) {
    leftChildren.push(new docx.Paragraph({ spacing: { before: 40 }, children: [new docx.TextRun({ text: data.recipientAddress, font: 'Verdana', size: 18, color: '5A6B80' })] }))
  }
  function metaLine(k, v) {
    return new docx.Paragraph({
      alignment: docx.AlignmentType.RIGHT,
      spacing: { after: 40 },
      children: [
        new docx.TextRun({ text: k + ': ', font: 'Verdana', size: 18, color: '7A8AA0' }),
        new docx.TextRun({ text: v, bold: true, font: 'Verdana', size: 18, color: '1A2330' })
      ]
    })
  }
  var rightChildren = [metaLine('Teklif No', data.teklifNo)]
  if (data.date) rightChildren.push(metaLine('Tarih', data.date))
  rightChildren.push(metaLine('Geçerlilik', data.gecerlilik))

  return new docx.Table({
    width: { size: 100, type: docx.WidthType.PERCENTAGE },
    columnWidths: [5600, 4000],
    borders: nilAll,
    rows: [
      new docx.TableRow({
        children: [
          new docx.TableCell({ borders: nilAll, margins: { top: 120, bottom: 160, right: 140 }, children: leftChildren }),
          new docx.TableCell({ borders: nilAll, verticalAlign: docx.VerticalAlign.TOP, margins: { top: 120, bottom: 160, left: 140 }, children: rightChildren })
        ]
      })
    ]
  })
}

function teklifBolumBasligi(docx, text) {
  return new docx.Paragraph({
    spacing: { before: 60, after: 140 },
    border: { bottom: { style: docx.BorderStyle.SINGLE, size: 12, color: ACCENT_HEX } },
    children: [new docx.TextRun({ text: text, bold: true, font: 'Verdana', size: 22, color: ACCENT_HEX })]
  })
}

function teklifTableBorders(docx) {
  var b = { style: docx.BorderStyle.SINGLE, size: 4, color: 'D6DEE8' }
  return { top: b, bottom: b, left: b, right: b, insideHorizontal: b, insideVertical: b }
}

function teklifTableCell(docx, text, opts) {
  opts = opts || {}
  var shading
  if (opts.header) shading = { type: docx.ShadingType.CLEAR, fill: ACCENT_HEX, color: 'auto' }
  else if (opts.zebra) shading = { type: docx.ShadingType.CLEAR, fill: 'F6F9FC', color: 'auto' }
  return new docx.TableCell({
    width: opts.widthPct ? { size: opts.widthPct, type: docx.WidthType.PERCENTAGE } : undefined,
    shading: shading,
    verticalAlign: docx.VerticalAlign.CENTER,
    margins: { top: 70, bottom: 70, left: 130, right: 130 },
    children: [
      new docx.Paragraph({
        alignment: opts.align,
        children: [new docx.TextRun({ text: String(text), bold: !!opts.header, color: opts.header ? 'FFFFFF' : '2A3645', font: 'Verdana', size: opts.header ? 20 : 22 })]
      })
    ]
  })
}

function teklifItemsTable(docx, items, startIndex) {
  var headerRow = new docx.TableRow({
    tableHeader: true,
    children: [
      teklifTableCell(docx, 'No', { header: true, align: docx.AlignmentType.CENTER, widthPct: 8 }),
      teklifTableCell(docx, 'Yapılacak İşlem', { header: true, widthPct: 92 })
    ]
  })
  var rows = (items || []).map(function(item, i) {
    var zebra = (i % 2 === 1)
    return new docx.TableRow({
      children: [
        teklifTableCell(docx, (startIndex || 0) + i + 1, { align: docx.AlignmentType.CENTER, widthPct: 8, zebra: zebra }),
        teklifTableCell(docx, item, { widthPct: 92, zebra: zebra })
      ]
    })
  })
  return new docx.Table({
    width: { size: 100, type: docx.WidthType.PERCENTAGE },
    columnWidths: [820, 8800],
    borders: teklifTableBorders(docx),
    rows: [headerRow].concat(rows)
  })
}

function teklifTotalTable(docx, rows) {
  var light = { style: docx.BorderStyle.SINGLE, size: 4, color: 'D4DDE7' }
  var accentL = { style: docx.BorderStyle.SINGLE, size: 28, color: ACCENT_HEX }
  var multi = rows.length > 1
  var paras = rows.map(function(r, idx) {
    return new docx.Paragraph({
      alignment: docx.AlignmentType.RIGHT,
      spacing: { before: idx === 0 ? 0 : 50 },
      border: (multi && r.big) ? { top: { style: docx.BorderStyle.SINGLE, size: 6, color: 'CDD9E6' } } : undefined,
      children: [
        new docx.TextRun({ text: r.label + ':   ', bold: true, font: 'Verdana', size: r.big ? 19 : 17, color: r.big ? ACCENT_HEX : '3A4A5E' }),
        new docx.TextRun({ text: r.value, bold: true, font: 'Verdana', size: r.big ? 32 : 19, color: r.big ? ACCENT_HEX : '1A2330' })
      ]
    })
  })
  return new docx.Table({
    alignment: docx.AlignmentType.RIGHT,
    width: { size: 56, type: docx.WidthType.PERCENTAGE },
    columnWidths: [5400],
    borders: { top: light, bottom: light, right: light, left: accentL, insideHorizontal: light, insideVertical: light },
    rows: [
      new docx.TableRow({
        children: [
          new docx.TableCell({
            shading: { type: docx.ShadingType.CLEAR, fill: 'EEF3F8', color: 'auto' },
            margins: { top: 150, bottom: 150, left: 220, right: 220 },
            children: paras
          })
        ]
      })
    ]
  })
}

function teklifImzaParagraflari(docx, leftText, rightText) {
  return [
    new docx.Paragraph({
      alignment: docx.AlignmentType.CENTER,
      spacing: { before: 760, after: 60 },
      children: [new docx.TextRun({ text: '______________________                    ______________________', font: 'Calibri', size: 22, color: '8A99AD' })]
    }),
    new docx.Paragraph({
      alignment: docx.AlignmentType.CENTER,
      spacing: { after: 0 },
      children: [new docx.TextRun({ text: leftText + '                         ' + rightText, bold: true, font: 'Calibri', size: 22, color: '3A4A5E' })]
    })
  ]
}

// Word sayfa altbilgisi (footer): tam genişlikte renkli bant, her sayfanın altına sabitlenir.
// Eski satır-içi paragraf yöntemi kısa sayfalarda imza alanıyla çakışıyordu.
function teklifWordFooter(docx, text) {
  var nil = { style: docx.BorderStyle.NIL, size: 0, color: 'FFFFFF' }
  var cell = new docx.TableCell({
    shading: { type: docx.ShadingType.CLEAR, fill: ACCENT_HEX, color: 'auto' },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [
      new docx.Paragraph({
        alignment: docx.AlignmentType.CENTER,
        spacing: { after: 0, line: 240 },
        children: [new docx.TextRun({ text: text, font: 'Calibri', size: 16, color: 'DFE9F4' })]
      })
    ]
  })
  var table = new docx.Table({
    width: { size: 100, type: docx.WidthType.PERCENTAGE },
    borders: { top: nil, bottom: nil, left: nil, right: nil, insideHorizontal: nil, insideVertical: nil },
    rows: [new docx.TableRow({ children: [cell] })]
  })
  return new docx.Footer({ children: [table] })
}

async function downloadWord(teklif, elev, config) {
  var data = teklifVerisi(teklif, elev, config)
  var docx = await import('docx')
  var customLogoUrl = config && config.logoUrl ? config.logoUrl.trim() : ''
  var resolvedLogoUrl = customLogoUrl || (config && config._isAsis ? TEKLIF_HEADER_SRC : '')
  var hasLogo = !!(resolvedLogoUrl)
  var isTenantLogo = hasLogo && resolvedLogoUrl.startsWith('data:')
  var headerBytes = hasLogo
    ? (isTenantLogo ? await generateTenantHeaderBytes(resolvedLogoUrl) : await getTeklifHeaderBytes(resolvedLogoUrl))
    : null

  var children = []
  if (hasLogo) children.push(teklifHeaderParagraf(docx, headerBytes))
  children.push(teklifUstBilgiTablosu(docx, data))
  children.push(teklifParagraf(docx, data.intro, { justify: true, sizePt: 11, afterPt: 12 }))
  children.push(teklifBolumBasligi(docx, data.title))
  children.push(teklifItemsTable(docx, data.itemsFirst, 0))

  children.push(new docx.Paragraph({ children: [new docx.PageBreak()] }))
  if (hasLogo) children.push(teklifHeaderParagraf(docx, headerBytes))
  if (data.itemsSecond.length) {
    children.push(teklifItemsTable(docx, data.itemsSecond, data.secondStart - 1))
    children.push(teklifParagraf(docx, '', { afterPt: 4 }))
  }
  children.push(teklifParagraf(docx, '', { afterPt: 8 }))
  children.push(teklifTotalTable(docx, data.totalRows))
  children.push(teklifParagraf(docx, data.delivery, { beforePt: 14, afterPt: 16, sizePt: 10, bold: true, color: '4A5A6E' }))
  if (data.company1) children.push(teklifParagraf(docx, data.company1, { font: 'Calibri', sizePt: 15, bold: true, afterPt: 2 }))
  if (data.company2) children.push(teklifParagraf(docx, data.company2, { font: 'Calibri', sizePt: 12, bold: true, afterPt: 2 }))
  data.telLines.forEach(function(t) { children.push(teklifParagraf(docx, t, { font: 'Calibri', sizePt: 12, bold: true, afterPt: 2 })) })
  children = children.concat(teklifImzaParagraflari(docx, data.signLeft, data.signRight))

  var doc = new docx.Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: cmToTwip(1.3),
            right: cmToTwip(1.9),
            bottom: cmToTwip(1.7),
            left: cmToTwip(1.9),
            footer: cmToTwip(0.4)
          }
        }
      },
      footers: data.footer ? { default: teklifWordFooter(docx, data.footer) } : undefined,
      children: children
    }]
  })

  var blob = await docx.Packer.toBlob(doc)
  var url = URL.createObjectURL(blob)
  var a = document.createElement('a')
  a.href = url
  a.download = teklifDosyaAdi(teklif, elev, 'docx')
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

async function downloadPdf(teklif, elev, config) {
  var dosyaAdi = teklifDosyaAdi(teklif, elev, 'pdf')
  var customLogoUrl = config && config.logoUrl ? config.logoUrl.trim() : ''
  var resolvedLogoUrl = customLogoUrl || (config && config._isAsis ? TEKLIF_HEADER_SRC : '')
  var headerDataUrl = resolvedLogoUrl
    ? (resolvedLogoUrl.startsWith('data:') ? await generateTenantHeaderDataUrl(resolvedLogoUrl) : await getTeklifHeaderDataUrl(resolvedLogoUrl))
    : null
  var html = teklifHtmlDocument(teklif, elev, { title: dosyaAdi, headerSrc: headerDataUrl }, config)

  var iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.style.cssText = 'position:fixed;left:0;top:0;width:210mm;height:297mm;border:0;opacity:0;pointer-events:none;z-index:-9999;'
  document.body.appendChild(iframe)

  try {
    await new Promise(function(resolve) {
      iframe.addEventListener('load', resolve, { once: true })
      iframe.srcdoc = html
    })

    var idoc = iframe.contentDocument
    if (!idoc) throw new Error('PDF onizleme penceresi olusturulamadi.')

    await waitForImages(idoc)
    if (idoc.fonts && idoc.fonts.ready) {
      try { await idoc.fonts.ready } catch (_) {}
    }

    var html2canvasMod = await import('html2canvas')
    var html2canvas = html2canvasMod.default || html2canvasMod
    var jspdfMod = await import('jspdf')
    var jsPDF = jspdfMod.jsPDF

    var pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true })
    var pageWidthMm = pdf.internal.pageSize.getWidth()
    var pageHeightMm = pdf.internal.pageSize.getHeight()
    var pages = idoc.querySelectorAll('.page')

    for (var i = 0; i < pages.length; i += 1) {
      var canvas = await html2canvas(pages[i], {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: pages[i].scrollWidth,
        windowHeight: pages[i].scrollHeight
      })
      var imgData = canvas.toDataURL('image/jpeg', 0.95)
      if (i > 0) pdf.addPage()
      pdf.addImage(imgData, 'JPEG', 0, 0, pageWidthMm, pageHeightMm, undefined, 'FAST')
    }

    pdf.save(dosyaAdi)
  } finally {
    document.body.removeChild(iframe)
  }
}

function TeklifKart(props) {
  var teklif = props.teklif
  var elev = props.elev
  var onEdit = props.onEdit
  var onDelete = props.onDelete
  var onWord = props.onWord
  var onPdf = props.onPdf

  return (
    <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 14, padding: 14, marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)' }}>{teklif.apartmanAdi || (elev && elev.ad) || 'Teklif'}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
            {formatTarihTR(teklif.tarih)}
            {elev && elev.ilce ? ' · ' + elev.ilce : ''}
            {teklif.yonetici ? ' · ' + teklif.yonetici : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button onClick={function() { onEdit(teklif) }} style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 9px', cursor: 'pointer' }}>Duzenle</button>
          <button onClick={function() { onDelete(teklif.id) }} style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '5px 9px', cursor: 'pointer' }}>Sil</button>
        </div>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text)', whiteSpace: 'pre-wrap', lineHeight: 1.5, marginBottom: 10 }}>
        {islerPreview(teklif.yapilacakIsler) || 'Is kalemi girilmedi.'}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#10b981' }}>{(+teklif.tutar || 0).toLocaleString('tr-TR') + ' ₺'}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={function() { onWord(teklif) }} style={{ padding: '7px 11px', borderRadius: 8, background: '#1e3a5f', color: '#93c5fd', border: '1px solid #3b82f633', cursor: 'pointer', fontWeight: 700, fontSize: 11 }}>Word Olarak Indir</button>
          <button onClick={function() { onPdf(teklif) }} style={{ padding: '7px 11px', borderRadius: 8, background: '#3a1e1e', color: '#fca5a5', border: '1px solid #ef444433', cursor: 'pointer', fontWeight: 700, fontSize: 11 }}>PDF Olarak Indir</button>
        </div>
      </div>
    </div>
  )
}

function TeklifModal(props) {
  var edit = props.edit
  var form = props.form
  var F = props.F
  var elevs = props.elevs
  var ilceler = props.ilceler
  var tenantConfig = props.tenantConfig || null
  var filtreIlce = props.filtreIlce
  var filteredElevs = props.filteredElevs
  var closeModal = props.closeModal
  var save = props.save
  var syncElevatorFields = props.syncElevatorFields
  var darModal = props.darModal
  var darAlan = props.darAlan

  var seciliElev = elevs.find(function(e) { return e.id === (+form.asansorId || form.asansorId) })
  var customLogoUrl = tenantConfig && tenantConfig.logoUrl ? tenantConfig.logoUrl.trim() : ''
  var rawLogoUrl = customLogoUrl || (tenantConfig && tenantConfig._isAsis ? TEKLIF_HEADER_SRC : null)

  var _useStateH = useState(null), previewHeaderSrc = _useStateH[0], setPreviewHeaderSrc = _useStateH[1]

  useEffect(function() {
    if (!rawLogoUrl) { setPreviewHeaderSrc(null); return }
    if (rawLogoUrl.startsWith('data:')) {
      generateTenantHeaderDataUrl(rawLogoUrl).then(setPreviewHeaderSrc).catch(function() { setPreviewHeaderSrc(rawLogoUrl) })
    } else {
      setPreviewHeaderSrc(rawLogoUrl)
    }
  }, [rawLogoUrl])

  var previewHtml = teklifHtmlDocument(form, seciliElev, { preview: true, headerSrc: previewHeaderSrc }, tenantConfig)

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000000b8', zIndex: 2000, display: 'flex', alignItems: darModal ? 'flex-start' : 'center', justifyContent: 'center', padding: darAlan ? 8 : 16, overflowY: 'auto' }}>
      <div style={{ width: 'min(1100px, 100%)', maxWidth: 'calc(100vw - ' + (darAlan ? 16 : 32) + 'px)', maxHeight: darModal ? 'none' : '90vh', overflowY: 'auto', overflowX: 'hidden', background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 18, margin: darModal ? '8px 0' : 0, boxShadow: '0 20px 60px rgba(0,0,0,0.45)' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--bg-panel)', zIndex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: '#3b82f6' }}>{edit ? 'Teklif Duzenle' : 'Yeni Teklif'}</div>
          <button onClick={closeModal} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: 16, display: 'grid', gridTemplateColumns: darModal ? '1fr' : 'minmax(0,1.15fr) minmax(320px,0.85fr)', gap: 16, alignItems: 'start' }}>
          <div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5 }}>Tarih</label>
              <input type="date" value={form.tarih || ''} onChange={function(e) { F('tarih', e.target.value) }} style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', color: 'var(--text)', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5 }}>Asansor / Bina</label>
              <select value={form.asansorId || ''} onChange={function(e) { syncElevatorFields(e.target.value) }} style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', color: 'var(--text)', boxSizing: 'border-box' }}>
                <option value="">— Bina secin —</option>
                {ilceler.map(function(il) {
                  var ilceElevs = filteredElevs.filter(function(e) { return e.ilce === il })
                  if (ilceElevs.length === 0 && filtreIlce !== 'Tümü') return null
                  return (
                    <optgroup key={il} label={il}>
                      {ilceElevs.map(function(e) {
                        return <option key={e.id} value={e.id}>{e.ad}</option>
                      })}
                    </optgroup>
                  )
                })}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: darAlan ? '1fr' : '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5 }}>Apartman Adi</label>
                <input value={form.apartmanAdi || ''} onChange={function(e) { F('apartmanAdi', e.target.value) }} style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', color: 'var(--text)', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5 }}>Yonetici</label>
                <input value={form.yonetici || ''} onChange={function(e) { F('yonetici', e.target.value) }} style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', color: 'var(--text)', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5 }}>Adres</label>
              <textarea value={form.adres || ''} onChange={function(e) { F('adres', e.target.value) }} rows={2} style={{ width: '100%', resize: 'vertical', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', color: 'var(--text)', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5 }}>Yapilacak Islemler</label>
              <textarea value={form.yapilacakIsler || ''} onChange={function(e) { F('yapilacakIsler', e.target.value) }} rows={10} placeholder="Her maddeyi alt alta yazin..." style={{ width: '100%', resize: 'vertical', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', color: 'var(--text)', boxSizing: 'border-box', lineHeight: 1.5 }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: darAlan ? '1fr' : '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5 }}>Tutar (TL)</label>
                <input type="number" value={form.tutar || ''} onChange={function(e) { F('tutar', e.target.value) }} style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', color: 'var(--text)', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5 }}>Onay Tarihi</label>
                <input type="date" value={form.onayTarihi || ''} onChange={function(e) { F('onayTarihi', e.target.value) }} style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', color: 'var(--text)', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ marginTop: 12, padding: '12px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '.5px' }}>KDV</div>
              {[
                { value: 'dahil', label: 'KDV Dahil', desc: 'Tutar KDV dahil, tek satır' },
                { value: 'haric_goster', label: 'KDV Hariç', desc: 'Ara Toplam + KDV %20 + Genel Toplam' },
                { value: 'haric', label: 'KDV Dahil Değildir', desc: 'Tutar KDV hariç, tek satır' }
              ].map(function(opt) {
                var cur = (form.kdvDahil === false || form.kdvDahil === 'haric_goster') ? 'haric_goster' : (form.kdvDahil === 'haric' ? 'haric' : 'dahil')
                return (
                  <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 5 }}>
                    <input type="radio" name="kdv" value={opt.value} checked={cur === opt.value} onChange={function() { F('kdvDahil', opt.value) }} style={{ accentColor: '#1f4e79' }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{opt.label}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{opt.desc}</span>
                  </label>
                )
              })}
            </div>
          </div>

          <div>
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 12, padding: 14, marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#3b82f6', marginBottom: 8 }}>Onizleme</div>
              <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border-soft)', background: '#e2e8f0' }}>
                <iframe
                  title="Teklif Onizleme"
                  srcDoc={previewHtml}
                  style={{ width: '100%', height: darModal ? 460 : 640, border: 'none', background: '#e2e8f0' }}
                />
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
              Bu onizleme artik gercek cikti sablonunun aynisidir. Word dosyasi gercek .docx olarak iner; PDF butonu ise ayni duzenden dogrudan .pdf dosyasi indirir.
            </div>
          </div>
        </div>

        <div style={{ padding: '0 16px 16px', display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={function() { downloadWord(form, seciliElev, tenantConfig).catch(function(err) { console.error(err); alert('Word çıktısı hazırlanamadı.'); }) }} style={{ padding: '10px 14px', borderRadius: 10, background: '#1e3a5f', border: '1px solid #3b82f633', color: '#93c5fd', cursor: 'pointer', fontWeight: 700 }}>Word Olarak Indir</button>
            <button onClick={function() { downloadPdf(form, seciliElev, tenantConfig).catch(function(err) { console.error(err); alert('PDF ciktisi hazirlanamadi.'); }) }} style={{ padding: '10px 14px', borderRadius: 10, background: '#3a1e1e', border: '1px solid #ef444433', color: '#fca5a5', cursor: 'pointer', fontWeight: 700 }}>PDF Olarak Indir</button>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button onClick={closeModal} style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 700 }}>Iptal</button>
            <button onClick={save} style={{ padding: '10px 16px', borderRadius: 10, background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 800 }}>{edit ? 'Guncelle' : 'Kaydet'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TeklifYonetimi(props) {
  var elevs = props.elevs
  var teklifler = props.teklifler
  var setTeklifler = props.setTeklifler
  var ilceler = props.ilceler
  var tenantConfig = props.tenantConfig || null
  var today = new Date().toISOString().split('T')[0]

  var _useState = useState(false), modal = _useState[0], setModal = _useState[1]
  var _useState2 = useState(null), edit = _useState2[0], setEdit = _useState2[1]
  var _useState3 = useState('Tümü'), filtreIlce = _useState3[0], setFiltreIlce = _useState3[1]
  var _useState4 = useState(''), arama = _useState4[0], setArama = _useState4[1]
  var _useState5 = useState({ tarih: today, asansorId: '', apartmanAdi: '', yonetici: '', adres: '', yapilacakIsler: '', tutar: '', onayTarihi: '', ilce: '', kdvDahil: 'dahil' }), form = _useState5[0], setForm = _useState5[1]
  var _useState6 = useState(typeof window !== 'undefined' ? window.innerWidth : 1280), viewportWidth = _useState6[0], setViewportWidth = _useState6[1]

  var darModal = viewportWidth < 1100
  var darAlan = viewportWidth < 760

  useEffect(function() {
    function onResize() {
      setViewportWidth(window.innerWidth)
    }
    window.addEventListener('resize', onResize)
    return function() {
      window.removeEventListener('resize', onResize)
    }
  }, [])

  useEffect(function() {
    if (typeof document === 'undefined') return undefined
    var oncekiOverflow = document.body.style.overflow
    if (modal) document.body.style.overflow = 'hidden'
    return function() {
      document.body.style.overflow = oncekiOverflow
    }
  }, [modal])

  function F(key, value) {
    setForm(function(prev) {
      var next = Object.assign({}, prev)
      next[key] = value
      return next
    })
  }

  var filteredElevs = useMemo(function() {
    return elevs.filter(function(e) {
      return filtreIlce === 'Tümü' || e.ilce === filtreIlce
    })
  }, [elevs, filtreIlce])

  var gorunenTeklifler = useMemo(function() {
    return teklifler.filter(function(t) {
      var elev = elevs.find(function(e) { return e.id === t.asansorId })
      var metin = [t.apartmanAdi, t.yonetici, t.yapilacakIsler, elev && elev.ilce, elev && elev.ad].join(' ').toLowerCase()
      var ilceOk = filtreIlce === 'Tümü' || (elev && elev.ilce === filtreIlce) || (!elev && t.ilce === filtreIlce)
      var aramaOk = !arama.trim() || metin.indexOf(arama.trim().toLowerCase()) >= 0
      return ilceOk && aramaOk
    }).slice().sort(function(a, b) {
      return String(b.tarih || '').localeCompare(String(a.tarih || ''))
    })
  }, [teklifler, elevs, filtreIlce, arama])

  function syncElevatorFields(elevId) {
    var elev = elevs.find(function(e) { return String(e.id) === String(elevId) })
    setForm(function(prev) {
      return Object.assign({}, prev, {
        asansorId: elevId,
        apartmanAdi: elev ? (elev.ad || '') : prev.apartmanAdi,
        yonetici: elev ? (elev.yonetici || '') : prev.yonetici,
        adres: elev ? ((elev.semt ? elev.semt + ' Mah., ' : '') + (elev.adres || '') + (elev.ilce ? ' / ' + elev.ilce : '')) : prev.adres,
        ilce: elev ? (elev.ilce || '') : prev.ilce
      })
    })
  }

  function openAdd() {
    setEdit(null)
    setForm({ tarih: today, asansorId: '', apartmanAdi: '', yonetici: '', adres: '', yapilacakIsler: '', tutar: '', onayTarihi: '', ilce: '', kdvDahil: 'dahil' })
    setModal(true)
  }

  function openEdit(teklif) {
    setEdit(teklif)
    setForm(Object.assign({ ilce: '' }, teklif))
    setModal(true)
  }

  function closeModal() {
    setModal(false)
    setEdit(null)
  }

  function save() {
    if (!String(form.apartmanAdi || '').trim()) {
      alert('Apartman adi zorunludur.')
      return
    }
    if (!String(form.tutar || '').trim()) {
      alert('Tutar zorunludur.')
      return
    }
    if (!(form.yapilacakIsler || '').trim()) {
      alert('Yapilacak isler zorunludur.')
      return
    }

    var kayit = Object.assign({}, form, {
      asansorId: form.asansorId ? +form.asansorId : null,
      tutar: +form.tutar || 0,
      guncellemeZamani: new Date().toLocaleString('tr-TR')
    })

    if (edit) {
      setTeklifler(function(prev) {
        return prev.map(function(item) {
          return item.id === edit.id ? Object.assign({}, item, kayit) : item
        })
      })
    } else {
      setTeklifler(function(prev) {
        return prev.concat([Object.assign({ id: Date.now(), olusturmaZamani: new Date().toLocaleString('tr-TR') }, kayit)])
      })
    }

    closeModal()
  }

  function remove(id) {
    if (!window.confirm('Bu teklif silinsin mi?')) return
    setTeklifler(function(prev) {
      return prev.filter(function(item) { return item.id !== id })
    })
  }

  var modalNode = modal && typeof document !== 'undefined'
    ? createPortal(
        <TeklifModal
          edit={edit}
          form={form}
          F={F}
          elevs={elevs}
          ilceler={ilceler}
          filteredElevs={filteredElevs}
          filtreIlce={filtreIlce}
          closeModal={closeModal}
          save={save}
          syncElevatorFields={syncElevatorFields}
          darModal={darModal}
          darAlan={darAlan}
          tenantConfig={tenantConfig}
        />,
        document.body
      )
    : null

  return (
    <>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 8, flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>Teklif Olusturma</h2>
          <button onClick={openAdd} style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 14px', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>+ Yeni Teklif</button>
        </div>

        <div style={{ background: 'var(--bg-panel)', borderRadius: 14, border: '1px solid var(--border)', padding: 12, marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <input value={arama} onChange={function(e) { setArama(e.target.value) }} placeholder="Apartman, yonetici veya is kalemi ara..." style={{ flex: 1, minWidth: 220, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }} />
            <select value={filtreIlce} onChange={function(e) { setFiltreIlce(e.target.value) }} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', color: 'var(--text)', cursor: 'pointer' }}>
              <option value="Tümü">Tum Ilceler</option>
              {ilceler.map(function(il) { return <option key={il} value={il}>{il}</option> })}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 11, background: '#1e3a5f', color: '#93c5fd', padding: '4px 8px', borderRadius: 999, fontWeight: 700 }}>{teklifler.length + ' teklif'}</div>
            <div style={{ fontSize: 11, background: '#102218', color: '#86efac', padding: '4px 8px', borderRadius: 999, fontWeight: 700 }}>Sablon: Kurumsal</div>
          </div>
        </div>

        {gorunenTeklifler.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 28, color: 'var(--text-dim)', background: 'var(--bg-panel)', borderRadius: 14, border: '1px solid var(--border)' }}>
            {teklifler.length === 0 ? 'Henuz teklif yok. Yeni teklif olusturarak baslayabilirsiniz.' : 'Bu filtrede teklif bulunamadi.'}
          </div>
        ) : gorunenTeklifler.map(function(teklif) {
          var elev = elevs.find(function(e) { return e.id === teklif.asansorId })
          return (
            <TeklifKart
              key={teklif.id}
              teklif={teklif}
              elev={elev}
              onEdit={openEdit}
              onDelete={remove}
              onWord={function(item) {
                downloadWord(item, elevs.find(function(e) { return e.id === item.asansorId }), tenantConfig).catch(function(err) {
                  console.error(err)
                  alert('Word çıktısı hazırlanamadı.')
                })
              }}
              onPdf={function(item) {
                downloadPdf(item, elevs.find(function(e) { return e.id === item.asansorId }), tenantConfig).catch(function(err) {
                  console.error(err)
                  alert('PDF ciktisi hazirlanamadi.')
                })
              }}
            />
          )
        })}
      </div>
      {modalNode}
    </>
  )
}
