import React, { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { ASIS_LOGO_B64 } from '../utils/makbuz.js'

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

function islerHtml(value) {
  var items = parseIsler(value)
  if (items.length === 0) return ''
  return '<ol style="margin:0;padding-left:22px;">' + items.map(function(item) {
    return '<li style="margin:0 0 8px 0;padding-left:4px;">' + escapeHtml(item) + '</li>'
  }).join('') + '</ol>'
}

function teklifMetni(teklif, elev) {
  var apartmanAdi = (teklif.apartmanAdi || (elev && elev.ad) || '').trim()
  var tarih = formatTarihTR(teklif.tarih)
  var isler = islerPreview(teklif.yapilacakIsler)
  var tutar = (+teklif.tutar || 0).toLocaleString('tr-TR')
  var teslim = (teklif.teslimSuresi || '2 hafta').trim()

  return [
    tarih,
    'SN. ' + apartmanAdi + ' YONETIMI',
    '',
    '',
    'Binanizda bulunan 1 adet asansorun firmamiz tarafindan yapilan',
    'incelemede belirlenen eksikler ve duzeltilmesini istedigimiz maddeler asagida sirasiyla belirtilmistir.',
    '',
    isler,
    '',
    '',
    'FIYATIMIZ YUKARIDAKI BIR ADET ASANSOR ICIN TOPLAM TUTAR ' + tutar + " TL'DIR.",
    'ASANSOR SOZLESME YAPILDIGI TARIHTEN ITIBAREN ' + teslim + ' ICINDE',
    'BITIRILIP UYGUNLUK ETIKETI ALINACAKTIR.',
    '',
    'Asis Asansor Sistemleri',
    'Zafer Mahallesi Yuksel Sokak No:23 Bahcelievler / ISTANBUL',
    'Tel: 0212-703-20-52',
    'Cep Tel: 0536-565-92-23 / 0543-507-07-94',
    '',
    'Sozlesme Onay Tarihi: ' + (teklif.onayTarihi ? formatTarihTR(teklif.onayTarihi) : '........................'),
    'Kase / Imza'
  ].join('\n')
}

function teklifHtml(teklif, elev) {
  var apartmanAdi = (teklif.apartmanAdi || (elev && elev.ad) || '').trim()
  var yonetici = (teklif.yonetici || (elev && elev.yonetici) || '').trim()
  var adres = teklif.adres || (elev ? ((elev.semt ? elev.semt + ' Mah., ' : '') + (elev.adres || '') + (elev.ilce ? ' / ' + elev.ilce : '')) : '')
  var tarih = formatTarihTR(teklif.tarih)
  var onay = teklif.onayTarihi ? formatTarihTR(teklif.onayTarihi) : '........................'
  var isler = islerHtml(teklif.yapilacakIsler)
  var tutar = (+teklif.tutar || 0).toLocaleString('tr-TR')
  var teslim = (teklif.teslimSuresi || '2 hafta').trim()

  return '<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1.0">' +
    '<title>Teklif</title>' +
    '<style>' +
    'body{font-family:Arial,sans-serif;background:#fff;color:#111;margin:0;padding:40px;line-height:1.55;}' +
    '.wrap{max-width:820px;margin:0 auto;}' +
    '.header{display:flex;align-items:center;gap:16px;margin-bottom:28px;border-bottom:2px solid #0f172a;padding-bottom:16px;}' +
    '.logo{height:56px;object-fit:contain;}' +
    '.firma{font-size:24px;font-weight:800;color:#0f172a;}' +
    '.alt{font-size:13px;color:#475569;margin-top:4px;}' +
    '.meta{margin-bottom:28px;font-size:16px;}' +
    '.meta strong{display:block;margin-bottom:8px;}' +
    '.icerik{min-height:120px;white-space:normal;font-size:16px;}' +
    '.isler{margin:28px 0;padding:18px 20px;border:1px solid #cbd5e1;border-radius:12px;background:#f8fafc;min-height:180px;}' +
    '.tutar{margin:28px 0;padding:18px 20px;border-radius:12px;background:#eff6ff;border:1px solid #93c5fd;font-weight:800;font-size:18px;color:#1d4ed8;}' +
    '.footer{margin-top:40px;font-size:15px;}' +
    '.info{margin-top:20px;color:#334155;}' +
    '.imza{display:flex;justify-content:space-between;gap:24px;margin-top:60px;}' +
    '.imza-box{flex:1;border-top:1px solid #334155;padding-top:10px;font-size:14px;color:#475569;text-align:center;}' +
    '@media print{@page{size:A4;margin:18mm;} body{padding:0;}}' +
    '</style></head><body><div class="wrap">' +
    '<div class="header">' +
    '<img class="logo" src="' + ASIS_LOGO_B64 + '" alt="Asis">' +
    '<div><div class="firma">ASIS ASANSOR SISTEMLERI</div><div class="alt">Teklif Formu</div></div>' +
    '</div>' +
    '<div class="meta"><strong>' + tarih + '</strong>SN. ' + escapeHtml(apartmanAdi) + ' YONETIMI' +
    (yonetici ? '<div style="margin-top:6px;color:#475569;">Yetkili: ' + escapeHtml(yonetici) + '</div>' : '') +
    (adres ? '<div style="margin-top:6px;color:#475569;">Adres: ' + escapeHtml(adres) + '</div>' : '') +
    '</div>' +
    '<div class="icerik">Binanizda bulunan 1 adet asansorun firmamiz tarafindan yapilan incelemede belirlenen eksikler ve duzeltilmesini istedigimiz maddeler asagida sirasiyla belirtilmistir.</div>' +
    '<div class="isler">' + (isler || '&nbsp;') + '</div>' +
    '<div class="tutar">FIYATIMIZ YUKARIDAKI BIR ADET ASANSOR ICIN TOPLAM TUTAR ' + tutar + " TL'DIR.</div>" +
    '<div class="footer">ASANSOR SOZLESME YAPILDIGI TARIHTEN ITIBAREN ' + escapeHtml(teslim) + ' ICINDE BITIRILIP UYGUNLUK ETIKETI ALINACAKTIR.</div>' +
    '<div class="info">Asis Asansor Sistemleri<br>Zafer Mahallesi Yuksel Sokak No:23 Bahcelievler / ISTANBUL<br>Tel: 0212-703-20-52<br>Cep Tel: 0536-565-92-23 / 0543-507-07-94</div>' +
    '<div class="imza"><div class="imza-box">Sozlesme Onay Tarihi: ' + onay + '</div><div class="imza-box">Kase / Imza</div></div>' +
    '</div></body></html>'
}

function teklifDosyaAdi(teklif, elev, ext) {
  var apartmanAdi = (teklif.apartmanAdi || (elev && elev.ad) || 'teklif').trim()
  var tarih = (teklif.tarih || '').trim()
  var parcalar = ['teklif', apartmanAdi]
  if (tarih) parcalar.push(tarih)
  return parcalar.join('-').replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') + '.' + ext
}

function downloadWord(teklif, elev) {
  var html = teklifHtml(teklif, elev)
  var blob = new Blob(['\ufeff', html], { type: 'application/msword' })
  var url = URL.createObjectURL(blob)
  var a = document.createElement('a')
  a.href = url
  a.download = teklifDosyaAdi(teklif, elev, 'doc')
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function downloadPdf(teklif, elev) {
  var dosyaAdi = teklifDosyaAdi(teklif, elev, 'pdf')
  var w = window.open('', '_blank', 'width=980,height=720')
  if (!w) return
  w.document.write(
    teklifHtml(teklif, elev).replace('<title>Teklif</title>', '<title>' + escapeHtml(dosyaAdi) + '</title>') +
    '<script>window.onload=function(){setTimeout(function(){window.focus();window.print();},150);};<\/script>'
  )
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
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 12, lineHeight: 1.7, color: 'var(--text)', maxHeight: 420, overflowY: 'auto' }}>
                {teklifMetni(form, seciliElev)}
              </pre>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
              Tarih yeni teklifte otomatik gelir. Yapilacak islemler alanina her satira bir is kalemi yazmaniz yeterlidir; sistem ciktida bunlari otomatik olarak 1, 2, 3 seklinde siralar. Alttaki butonlardan teklifi Word olarak indirebilir veya PDF olarak kaydetmek icin yazdirma penceresini acabilirsiniz.
            </div>
          </div>
        </div>

        <div style={{ padding: '0 16px 16px', display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={function() { downloadWord(form, seciliElev) }} style={{ padding: '10px 14px', borderRadius: 10, background: '#1e3a5f', border: '1px solid #3b82f633', color: '#93c5fd', cursor: 'pointer', fontWeight: 700 }}>Word Olarak Indir</button>
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
              onWord={function(item) { downloadWord(item, elevs.find(function(e) { return e.id === item.asansorId })) }}
              onPdf={function(item) { downloadPdf(item, elevs.find(function(e) { return e.id === item.asansorId })) }}
            />
          )
        })}
      </div>
      {modalNode}
    </>
  )
}
