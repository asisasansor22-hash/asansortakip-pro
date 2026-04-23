import React, { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

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

function getTeklifHeaderBytes() {
  if (!teklifHeaderBytesPromise) {
    teklifHeaderBytesPromise = fetch(TEKLIF_HEADER_SRC).then(function(res) {
      if (!res.ok) throw new Error('Teklif başlığı yüklenemedi.')
      return res.arrayBuffer()
    })
  }
  return teklifHeaderBytesPromise
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

function teklifVerisi(teklif, elev) {
  var apartmanHam = (teklif.apartmanAdi || (elev && elev.ad) || '').trim()
  var recipientCore = apartmanHam || 'APARTMAN'
  if (!/YÖNETİMİ$/i.test(recipientCore)) recipientCore += ' YÖNETİMİ'
  var items = parseIsler(teklif.yapilacakIsler)
  var itemsFirst = items.slice(0, 6)
  var itemsSecond = items.slice(6)
  var tutar = (+teklif.tutar || 0).toLocaleString('tr-TR')
  var teslim = (teklif.teslimSuresi || '2 hafta').trim()

  return {
    date: formatTarihTR(teklif.tarih),
    recipient: turkceBuyut(recipientCore),
    intro1: 'Binanızda bulunan 1 adet asansörün firmamız tarafından yapılan',
    intro2: 'incelemede belirlediği eksikler ve düzeltilmesini istediği maddeler aşağıda sırası ile belirtilmiştir.',
    title: 'YAPILACAK İŞLEMLER',
    itemsFirst: itemsFirst,
    itemsSecond: itemsSecond,
    secondStart: itemsFirst.length + 1,
    price: "FİYATIMIZ YUKARIDAKİ BİR ADET ASANSÖR İÇİN TOPLAM TUTAR " + tutar + " TL'DİR.",
    delivery1: 'ASANSÖR SÖZLEŞME YAPILDIĞI TARİHTEN İTİBAREN ' + turkceBuyut(teslim) + ' İÇİNDE',
    delivery2: 'BİTİRİLİP UYGUNLUK ETİKETİ ALINACAKTIR.',
    company1: 'Asis Asansör Sistemleri',
    company2: 'Zafer Mahallesi Yüksel Sokak No:23 Bahçelievler / İSTANBUL',
    company3: 'Tel: 0212-703-20-52',
    company4: 'Cep Tel: 0536-565-92-23   0543-507-07-94',
    signLeft: 'Sözleşme Onay Tarihi',
    signRight: 'Kaşe / İmza'
  }
}

function teklifItemsHtml(items, start) {
  if (!items.length) return ''
  var startAttr = start && start > 1 ? ' start="' + start + '"' : ''
  return '<ol class="items"' + startAttr + '>' + items.map(function(item) {
    return '<li>' + escapeHtml(item) + '</li>'
  }).join('') + '</ol>'
}

function teklifHtmlDocument(teklif, elev, options) {
  var data = teklifVerisi(teklif, elev)
  var preview = !!(options && options.preview)
  var autoPrint = !!(options && options.autoPrint)
  var title = escapeHtml((options && options.title) || 'Teklif')
  var bodyBg = preview ? '#eef2f6' : '#ffffff'
  var bodyPadding = preview ? '18px 0' : '0'
  var pageWidth = preview ? 'min(920px, calc(100vw - 20px))' : '210mm'
  var pageMargin = preview ? '0 auto 18px' : '0 auto'
  var pageShadow = preview ? '0 16px 40px rgba(16,24,40,.12)' : 'none'
  var pagePadding = preview ? '32px 36px 42px' : '32mm 20mm 21mm'
  var script = autoPrint ? '<script>window.onload=function(){setTimeout(function(){window.focus();window.print();},180);};<\/script>' : ''

  return '<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1.0">' +
    '<title>' + title + '</title>' +
    '<style>' +
    'body{margin:0;background:' + bodyBg + ';padding:' + bodyPadding + ';font-family:Verdana,Arial,sans-serif;color:#111;}' +
    '.page{width:' + pageWidth + ';min-height:297mm;margin:' + pageMargin + ';background:#fff;padding:' + pagePadding + ';box-shadow:' + pageShadow + ';box-sizing:border-box;}' +
    '.header{width:100%;display:block;border-bottom:1px solid #d0d5dd;padding-bottom:8px;margin-bottom:34px;}' +
    '.p{margin:0 0 4px;font-size:18px;line-height:1.6;}' +
    '.right{text-align:right;font-weight:700;}' +
    '.indent{margin-left:82px;}' +
    '.items{margin:0 0 14px 114px;font-size:18px;line-height:1.6;}' +
    '.items li{margin-bottom:8px;}' +
    '.recipient-row{display:grid;grid-template-columns:52px 1fr 52px;align-items:center;margin:0 0 22px;}' +
    '.recipient-prefix{font-size:18px;font-weight:700;text-align:right;padding-right:10px;}' +
    '.recipient-name{font-size:18px;font-weight:700;text-align:center;}' +
    '.price{margin-left:28px;font-weight:700;color:#1f4e79;}' +
    '.company{font-family:Calibri,Arial,sans-serif;font-size:22px;font-weight:700;}' +
    '.signatures{display:flex;gap:28px;margin-top:38px;}' +
    '.sig{flex:1;border-top:1px solid #667085;padding-top:12px;text-align:center;font-family:Calibri,Arial,sans-serif;font-size:18px;font-weight:700;}' +
    '.page-two{display:flex;flex-direction:column;}' +
    '.bottom-block{margin-top:auto;}' +
    '@media print{@page{size:A4;margin:0;}body{background:#fff;padding:0;}.page{width:auto;margin:0;box-shadow:none;page-break-after:always;}.page:last-child{page-break-after:auto;}}' +
    '@media (max-width:760px){body{padding:10px 0;}.page{width:calc(100vw - 12px);padding:18px 14px 26px;min-height:auto;}.p,.items{font-size:16px;}.indent,.price{margin-left:0;}.items{margin-left:24px;}.company{font-size:18px;}.signatures{flex-direction:column;gap:18px;}}' +
    '</style></head><body>' +
    '<section class="page">' +
    '<img class="header" src="' + TEKLIF_HEADER_SRC + '" alt="Asis header" />' +
    '<p class="p right">' + escapeHtml(data.date) + '</p>' +
    '<div class="recipient-row"><div class="recipient-prefix">SN.</div><div class="recipient-name">' + escapeHtml(data.recipient) + '</div><div></div></div>' +
    '<p class="p indent">' + escapeHtml(data.intro1) + '</p>' +
    '<p class="p indent">' + escapeHtml(data.intro2) + '</p>' +
    '<p class="p indent"><strong>' + escapeHtml(data.title) + '</strong></p>' +
    teklifItemsHtml(data.itemsFirst, 1) +
    '</section>' +
    '<section class="page page-two">' +
    '<img class="header" src="' + TEKLIF_HEADER_SRC + '" alt="Asis header" />' +
    (data.itemsSecond.length ? teklifItemsHtml(data.itemsSecond, data.secondStart) : '') +
    '<div class="bottom-block">' +
    '<p class="p price">' + escapeHtml(data.price) + '</p>' +
    '<p class="p indent">' + escapeHtml(data.delivery1) + '</p>' +
    '<p class="p indent">' + escapeHtml(data.delivery2) + '</p>' +
    '<p class="p indent company">' + escapeHtml(data.company1) + '</p>' +
    '<p class="p indent company">' + escapeHtml(data.company2) + '</p>' +
    '<p class="p indent company">' + escapeHtml(data.company3) + '</p>' +
    '<p class="p indent company">' + escapeHtml(data.company4) + '</p>' +
    '<div class="signatures"><div class="sig">' + escapeHtml(data.signLeft) + '</div><div class="sig">' + escapeHtml(data.signRight) + '</div></div>' +
    '</div></section>' +
    script +
    '</body></html>'
}

function teklifDosyaAdi(teklif, elev, ext) {
  var apartmanAdi = (teklif.apartmanAdi || (elev && elev.ad) || 'teklif').trim()
  var tarih = (teklif.tarih || '').trim()
  var parcalar = ['teklif', apartmanAdi]
  if (tarih) parcalar.push(tarih)
  return parcalar.join('-').replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') + '.' + ext
}

function teklifBosHucresizBorders(docx) {
  return {
    top: { style: docx.BorderStyle.NIL, size: 0, color: 'FFFFFF' },
    left: { style: docx.BorderStyle.NIL, size: 0, color: 'FFFFFF' },
    right: { style: docx.BorderStyle.NIL, size: 0, color: 'FFFFFF' },
    bottom: { style: docx.BorderStyle.NIL, size: 0, color: 'FFFFFF' }
  }
}

function teklifParagraf(docx, text, options) {
  var opts = options || {}
  return new docx.Paragraph({
    alignment: opts.align,
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

function teklifNumaraliParagraf(docx, index, text) {
  return new docx.Paragraph({
    indent: { left: cmToTwip(2.4) },
    spacing: { after: 80 },
    children: [
      new docx.TextRun({
        text: index + '. ' + text,
        font: 'Verdana',
        size: 24
      })
    ]
  })
}

function teklifImzaTablosu(docx, leftText, rightText) {
  return new docx.Table({
    width: { size: cmToTwip(16.2), type: docx.WidthType.DXA },
    layout: docx.TableLayoutType.FIXED,
    borders: teklifBosHucresizBorders(docx),
    rows: [
      new docx.TableRow({
        children: [leftText, rightText].map(function(text) {
          return new docx.TableCell({
            width: { size: cmToTwip(8.1), type: docx.WidthType.DXA },
            borders: {
              top: { style: docx.BorderStyle.SINGLE, color: '667085', size: 8 },
              left: { style: docx.BorderStyle.NIL, size: 0, color: 'FFFFFF' },
              right: { style: docx.BorderStyle.NIL, size: 0, color: 'FFFFFF' },
              bottom: { style: docx.BorderStyle.NIL, size: 0, color: 'FFFFFF' }
            },
            children: [
              new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                spacing: { before: 120 },
                children: [
                  new docx.TextRun({
                    text: text,
                    bold: true,
                    font: 'Calibri',
                    size: 24
                  })
                ]
              })
            ]
          })
        })
      })
    ]
  })
}

function teklifRecipientTablosu(docx, recipient) {
  return new docx.Table({
    width: { size: cmToTwip(16.5), type: docx.WidthType.DXA },
    layout: docx.TableLayoutType.FIXED,
    borders: teklifBosHucresizBorders(docx),
    rows: [
      new docx.TableRow({
        children: [
          { text: 'SN.', width: 1.4, align: docx.AlignmentType.RIGHT },
          { text: recipient, width: 13.7, align: docx.AlignmentType.CENTER },
          { text: '', width: 1.4, align: docx.AlignmentType.LEFT }
        ].map(function(item) {
          return new docx.TableCell({
            width: { size: cmToTwip(item.width), type: docx.WidthType.DXA },
            borders: teklifBosHucresizBorders(docx),
            children: [
              new docx.Paragraph({
                alignment: item.align,
                children: item.text ? [
                  new docx.TextRun({
                    text: item.text,
                    bold: true,
                    font: 'Verdana',
                    size: 24
                  })
                ] : []
              })
            ]
          })
        })
      })
    ]
  })
}

function teklifSpacerTablosu(docx, itemCount) {
  var spacerCm = Math.max(6.2, 16.4 - (itemCount * 1.15))
  return new docx.Table({
    width: { size: cmToTwip(16.5), type: docx.WidthType.DXA },
    layout: docx.TableLayoutType.FIXED,
    borders: teklifBosHucresizBorders(docx),
    rows: [
      new docx.TableRow({
        height: { value: cmToTwip(spacerCm), rule: docx.HeightRule.EXACT },
        children: [
          new docx.TableCell({
            width: { size: cmToTwip(16.5), type: docx.WidthType.DXA },
            borders: teklifBosHucresizBorders(docx),
            children: [new docx.Paragraph('')]
          })
        ]
      })
    ]
  })
}

async function downloadWord(teklif, elev) {
  var data = teklifVerisi(teklif, elev)
  var docx = await import('docx')
  var headerBytes = await getTeklifHeaderBytes()

  var children = [
    teklifParagraf(docx, data.date, { align: docx.AlignmentType.RIGHT, bold: true, afterPt: 4 }),
    teklifRecipientTablosu(docx, data.recipient),
    teklifParagraf(docx, '', { afterPt: 22 }),
    teklifParagraf(docx, data.intro1, { leftCm: 2.2, afterPt: 2 }),
    teklifParagraf(docx, data.intro2, { leftCm: 2.2, afterPt: 14 }),
    teklifParagraf(docx, data.title, { leftCm: 2.2, bold: true, afterPt: 8 })
  ]

  data.itemsFirst.forEach(function(item, index) {
    children.push(teklifNumaraliParagraf(docx, index + 1, item))
  })

  children.push(new docx.Paragraph({ children: [new docx.PageBreak()] }))

  data.itemsSecond.forEach(function(item, index) {
    children.push(teklifNumaraliParagraf(docx, data.secondStart + index, item))
  })

  children.push(teklifSpacerTablosu(docx, data.itemsSecond.length))
  children.push(teklifParagraf(docx, data.price, { leftCm: 0.8, bold: true, color: '1F4E79', afterPt: 12 }))
  children.push(teklifParagraf(docx, data.delivery1, { leftCm: 2.2, afterPt: 2 }))
  children.push(teklifParagraf(docx, data.delivery2, { leftCm: 2.2, afterPt: 16 }))
  children.push(teklifParagraf(docx, data.company1, { leftCm: 2.2, font: 'Calibri', sizePt: 16, bold: true, afterPt: 2 }))
  children.push(teklifParagraf(docx, data.company2, { leftCm: 2.2, font: 'Calibri', sizePt: 16, bold: true, afterPt: 2 }))
  children.push(teklifParagraf(docx, data.company3, { leftCm: 2.2, font: 'Calibri', sizePt: 16, bold: true, afterPt: 2 }))
  children.push(teklifParagraf(docx, data.company4, { leftCm: 2.2, font: 'Calibri', sizePt: 16, bold: true, afterPt: 30 }))
  children.push(teklifImzaTablosu(docx, data.signLeft, data.signRight))

  var doc = new docx.Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: cmToTwip(4.1),
            right: cmToTwip(2.0),
            bottom: cmToTwip(2.1),
            left: cmToTwip(2.0)
          }
        }
      },
      headers: {
        default: new docx.Header({
          children: [
            new docx.Paragraph({
              border: {
                bottom: { style: docx.BorderStyle.SINGLE, color: 'D0D5DD', size: 6 }
              },
              spacing: { after: 40 },
              children: [
                new docx.ImageRun({
                  data: headerBytes,
                  transformation: { width: 652, height: 76 }
                })
              ]
            })
          ]
        })
      },
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

function downloadPdf(teklif, elev) {
  var dosyaAdi = teklifDosyaAdi(teklif, elev, 'pdf')
  var w = window.open('', '_blank', 'width=980,height=720')
  if (!w) return
  w.document.write(teklifHtmlDocument(teklif, elev, { title: dosyaAdi, autoPrint: true }))
  w.document.close()
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
  var filteredElevs = props.filteredElevs
  var filtreIlce = props.filtreIlce
  var closeModal = props.closeModal
  var save = props.save
  var syncElevatorFields = props.syncElevatorFields
  var darModal = props.darModal
  var darAlan = props.darAlan

  var seciliElev = elevs.find(function(e) { return e.id === (+form.asansorId || form.asansorId) })
  var previewHtml = teklifHtmlDocument(form, seciliElev, { preview: true })

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

            <div style={{ display: 'grid', gridTemplateColumns: darAlan ? '1fr' : (darModal ? '1fr 1fr' : '1fr 1fr 1fr'), gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5 }}>Tutar (TL)</label>
                <input type="number" value={form.tutar || ''} onChange={function(e) { F('tutar', e.target.value) }} style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', color: 'var(--text)', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5 }}>Teslim Suresi</label>
                <input value={form.teslimSuresi || ''} onChange={function(e) { F('teslimSuresi', e.target.value) }} style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', color: 'var(--text)', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5 }}>Onay Tarihi</label>
                <input type="date" value={form.onayTarihi || ''} onChange={function(e) { F('onayTarihi', e.target.value) }} style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', color: 'var(--text)', boxSizing: 'border-box' }} />
              </div>
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
              Bu onizleme artik gercek cikti sablonunun aynisidir. Word dosyasi gercek .docx olarak iner; PDF butonu ise ayni sablonu yazdirma kaydetme penceresinde acar.
            </div>
          </div>
        </div>

        <div style={{ padding: '0 16px 16px', display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={function() { downloadWord(form, seciliElev).catch(function(err) { console.error(err); alert('Word çıktısı hazırlanamadı.'); }) }} style={{ padding: '10px 14px', borderRadius: 10, background: '#1e3a5f', border: '1px solid #3b82f633', color: '#93c5fd', cursor: 'pointer', fontWeight: 700 }}>Word Olarak Indir</button>
            <button onClick={function() { downloadPdf(form, seciliElev) }} style={{ padding: '10px 14px', borderRadius: 10, background: '#3a1e1e', border: '1px solid #ef444433', color: '#fca5a5', cursor: 'pointer', fontWeight: 700 }}>PDF Olarak Indir</button>
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
  var today = new Date().toISOString().split('T')[0]

  var _useState = useState(false), modal = _useState[0], setModal = _useState[1]
  var _useState2 = useState(null), edit = _useState2[0], setEdit = _useState2[1]
  var _useState3 = useState('Tümü'), filtreIlce = _useState3[0], setFiltreIlce = _useState3[1]
  var _useState4 = useState(''), arama = _useState4[0], setArama = _useState4[1]
  var _useState5 = useState({ tarih: today, asansorId: '', apartmanAdi: '', yonetici: '', adres: '', yapilacakIsler: '', tutar: '', teslimSuresi: '2 hafta', onayTarihi: '', ilce: '' }), form = _useState5[0], setForm = _useState5[1]
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
    setForm({ tarih: today, asansorId: '', apartmanAdi: '', yonetici: '', adres: '', yapilacakIsler: '', tutar: '', teslimSuresi: '2 hafta', onayTarihi: '', ilce: '' })
    setModal(true)
  }

  function openEdit(teklif) {
    setEdit(teklif)
    setForm(Object.assign({ teslimSuresi: '2 hafta', ilce: '' }, teklif))
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
            <div style={{ fontSize: 11, background: '#102218', color: '#86efac', padding: '4px 8px', borderRadius: 999, fontWeight: 700 }}>Sablon: Bos Teklif</div>
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
                downloadWord(item, elevs.find(function(e) { return e.id === item.asansorId })).catch(function(err) {
                  console.error(err)
                  alert('Word çıktısı hazırlanamadı.')
                })
              }}
              onPdf={function(item) { downloadPdf(item, elevs.find(function(e) { return e.id === item.asansorId })) }}
            />
          )
        })}
      </div>
      {modalNode}
    </>
  )
}
