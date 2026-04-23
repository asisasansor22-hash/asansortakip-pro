import React, { useEffect, useMemo, useState } from 'react'
import { ASIS_LOGO_B64 } from '../utils/makbuz.js'

function formatTarihTR(value) {
  if (!value) return "";
  var d = new Date(value);
  if (isNaN(d)) return value;
  return d.toLocaleDateString("tr-TR");
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function parseIsler(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map(function(line) { return line.trim(); })
    .filter(Boolean)
    .map(function(line) { return line.replace(/^\d+[\).\-\s]+/, "").trim(); });
}

function islerPreview(value) {
  var items = parseIsler(value);
  if (items.length === 0) return "";
  return items.map(function(item, index) {
    return (index + 1) + ". " + item;
  }).join("\n");
}

function islerHtml(value) {
  var items = parseIsler(value);
  if (items.length === 0) return "";
  return '<ol style="margin:0;padding-left:22px;">' + items.map(function(item) {
    return '<li style="margin:0 0 8px 0;padding-left:4px;">' + escapeHtml(item) + '</li>';
  }).join("") + '</ol>';
}

function teklifMetni(teklif, elev) {
  var apartmanAdi = (teklif.apartmanAdi || (elev && elev.ad) || "").trim();
  var tarih = formatTarihTR(teklif.tarih);
  var isler = islerPreview(teklif.yapilacakIsler);
  var tutar = (+teklif.tutar || 0).toLocaleString("tr-TR");
  var teslim = (teklif.teslimSuresi || "2 hafta").trim();
  return [
    tarih,
    "SN. " + apartmanAdi + " YÖNETİMİ",
    "",
    "",
    "Binanızda bulunan 1 adet asansörün firmamız tarafından yapılan",
    "incelemede belirlediği eksikler ve düzeltilmesini istediği maddeler aşağıda sırası ile belirtilmiştir.",
    "",
    isler,
    "",
    "",
    "FIYATIMIZ YUKARIDAKİ BİR ADET ASANSÖR İÇİN TOPLAM TUTAR " + tutar + " TL'DİR.",
    "ASANSÖR SÖZLEŞME YAPILDIĞI TARİHTEN İTİBAREN " + teslim + " İÇİNDE",
    "BİTİRİLİP UYGUNLUK ETİKETİ ALINACAKTIR.",
    "",
    "Asis Asansör Sistemleri",
    "Zafer Mahallesi Yüksel Sokak No:23 Bahçelievler / İSTANBUL",
    "Tel: 0212-703-20-52",
    "Cep Tel: 0536-565-92-23 / 0543-507-07-94",
    "",
    "Sözleşme Onay Tarihi: " + (teklif.onayTarihi ? formatTarihTR(teklif.onayTarihi) : "........................"),
    "Kaşe / İmza"
  ].join("\n");
}

function teklifHtml(teklif, elev) {
  var apartmanAdi = (teklif.apartmanAdi || (elev && elev.ad) || "").trim();
  var yonetici = (teklif.yonetici || (elev && elev.yonetici) || "").trim();
  var adres = teklif.adres || (elev ? ((elev.semt ? elev.semt + " Mah., " : "") + (elev.adres || "") + (elev.ilce ? " / " + elev.ilce : "")) : "");
  var tarih = formatTarihTR(teklif.tarih);
  var onay = teklif.onayTarihi ? formatTarihTR(teklif.onayTarihi) : "........................";
  var isler = islerHtml(teklif.yapilacakIsler);
  var tutar = (+teklif.tutar || 0).toLocaleString("tr-TR");
  var teslim = (teklif.teslimSuresi || "2 hafta").trim();
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
    '.icerik{min-height:240px;white-space:normal;font-size:16px;}' +
    '.isler{margin:28px 0;padding:18px 20px;border:1px solid #cbd5e1;border-radius:12px;background:#f8fafc;min-height:180px;}' +
    '.tutar{margin:28px 0;padding:18px 20px;border-radius:12px;background:#eff6ff;border:1px solid #93c5fd;font-weight:800;font-size:18px;color:#1d4ed8;}' +
    '.footer{margin-top:40px;font-size:15px;}' +
    '.info{margin-top:20px;color:#334155;}' +
    '.imza{display:flex;justify-content:space-between;gap:24px;margin-top:60px;}' +
    '.imza-box{flex:1;border-top:1px solid #334155;padding-top:10px;font-size:14px;color:#475569;text-align:center;}' +
    '@media print{@page{size:A4;margin:18mm;} body{padding:0;} .print-hide{display:none !important;}}' +
    '</style></head><body><div class="wrap">' +
    '<div class="header">' +
    '<img class="logo" src="' + ASIS_LOGO_B64 + '" alt="Asis">' +
    '<div><div class="firma">ASIS ASANSÖR SİSTEMLERİ</div><div class="alt">Teklif Formu</div></div>' +
    '</div>' +
    '<div class="meta"><strong>' + tarih + '</strong>SN. ' + apartmanAdi + ' YÖNETİMİ' +
    (yonetici ? '<div style="margin-top:6px;color:#475569;">Yetkili: ' + yonetici + '</div>' : '') +
    (adres ? '<div style="margin-top:6px;color:#475569;">Adres: ' + adres + '</div>' : '') +
    '</div>' +
    '<div class="icerik">Binanızda bulunan 1 adet asansörün firmamız tarafından yapılan incelemede belirlediği eksikler ve düzeltilmesini istediği maddeler aşağıda sırası ile belirtilmiştir.</div>' +
    '<div class="isler">' + (isler || '&nbsp;') + '</div>' +
    '<div class="tutar">FİYATIMIZ YUKARIDAKİ BİR ADET ASANSÖR İÇİN TOPLAM TUTAR ' + tutar + ' TL\'DİR.</div>' +
    '<div class="footer">ASANSÖR SÖZLEŞME YAPILDIĞI TARİHTEN İTİBAREN ' + teslim + ' İÇİNDE BİTİRİLİP UYGUNLUK ETİKETİ ALINACAKTIR.</div>' +
    '<div class="info">Asis Asansör Sistemleri<br>Zafer Mahallesi Yüksel Sokak No:23 Bahçelievler / İSTANBUL<br>Tel: 0212-703-20-52<br>Cep Tel: 0536-565-92-23 / 0543-507-07-94</div>' +
    '<div class="imza"><div class="imza-box">Sözleşme Onay Tarihi: ' + onay + '</div><div class="imza-box">Kaşe / İmza</div></div>' +
    '</div></body></html>';
}

function downloadWord(teklif, elev) {
  var html = teklifHtml(teklif, elev);
  var blob = new Blob(['\ufeff', html], { type: 'application/msword' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = (teklif.apartmanAdi || (elev && elev.ad) || 'teklif').replace(/[\\/:*?"<>|]+/g, '-') + '.doc';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function openPdfPrint(teklif, elev) {
  var w = window.open("", "_blank", "width=980,height=720");
  if (!w) return;
  w.document.write(teklifHtml(teklif, elev) + '<script>window.onload=function(){window.print();}<\/script>');
  w.document.close();
}

function TeklifKart(_ref) {
  var teklif = _ref.teklif, elev = _ref.elev, onEdit = _ref.onEdit, onDelete = _ref.onDelete, onWord = _ref.onWord, onPdf = _ref.onPdf;
  return React.createElement('div', {
    style: { background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 14, padding: 14, marginBottom: 10 }
  },
    React.createElement('div', { style: { display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 10, alignItems: "flex-start" } },
      React.createElement('div', { style: { minWidth: 0, flex: 1 } },
        React.createElement('div', { style: { fontWeight: 800, fontSize: 14, color: "var(--text)" } }, teklif.apartmanAdi || (elev && elev.ad) || "Teklif"),
        React.createElement('div', { style: { fontSize: 11, color: "var(--text-muted)", marginTop: 3 } },
          formatTarihTR(teklif.tarih),
          (elev && elev.ilce ? " · " + elev.ilce : ""),
          (teklif.yonetici ? " · " + teklif.yonetici : "")
        )
      ),
      React.createElement('div', { style: { display: "flex", gap: 6, flexShrink: 0 } },
        React.createElement('button', { onClick: function(){ onEdit(teklif); }, style: { background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border)", borderRadius: 8, padding: "5px 9px", cursor: "pointer" } }, "✏️"),
        React.createElement('button', { onClick: function(){ onDelete(teklif.id); }, style: { background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, padding: "5px 9px", cursor: "pointer" } }, "🗑️")
      )
    ),
    React.createElement('div', { style: { fontSize: 12, color: "var(--text)", whiteSpace: "pre-wrap", lineHeight: 1.5, marginBottom: 10 } },
      islerPreview(teklif.yapilacakIsler) || "İş kalemi girilmedi."
    ),
    React.createElement('div', { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" } },
      React.createElement('div', { style: { fontSize: 12, fontWeight: 800, color: "#10b981" } }, (+teklif.tutar || 0).toLocaleString("tr-TR") + " ₺"),
      React.createElement('div', { style: { display: "flex", gap: 8, flexWrap: "wrap" } },
        React.createElement('button', { onClick: function(){ onWord(teklif); }, style: { padding: "7px 11px", borderRadius: 8, background: "#1e3a5f", color: "#93c5fd", border: "1px solid #3b82f633", cursor: "pointer", fontWeight: 700, fontSize: 11 } }, "📄 Word"),
        React.createElement('button', { onClick: function(){ onPdf(teklif); }, style: { padding: "7px 11px", borderRadius: 8, background: "#3a1e1e", color: "#fca5a5", border: "1px solid #ef444433", cursor: "pointer", fontWeight: 700, fontSize: 11 } }, "🖨️ PDF")
      )
    )
  );
}

export default function TeklifYonetimi(_ref2) {
  var elevs = _ref2.elevs, teklifler = _ref2.teklifler, setTeklifler = _ref2.setTeklifler, ilceler = _ref2.ilceler;
  var today = new Date().toISOString().split("T")[0];
  var _useState = useState(false), modal = _useState[0], setModal = _useState[1];
  var _useState2 = useState(null), edit = _useState2[0], setEdit = _useState2[1];
  var _useState3 = useState("Tümü"), filtreIlce = _useState3[0], setFiltreIlce = _useState3[1];
  var _useState4 = useState(""), arama = _useState4[0], setArama = _useState4[1];
  var _useState5 = useState({ tarih: today, asansorId: "", apartmanAdi: "", yonetici: "", adres: "", yapilacakIsler: "", tutar: "", teslimSuresi: "2 hafta", onayTarihi: "" }), form = _useState5[0], setForm = _useState5[1];
  var _useState6 = useState(typeof window !== "undefined" ? window.innerWidth : 1280), viewportWidth = _useState6[0], setViewportWidth = _useState6[1];
  var darModal = viewportWidth < 1100;
  var darAlan = viewportWidth < 760;

  useEffect(function() {
    function onResize() {
      setViewportWidth(window.innerWidth);
    }
    window.addEventListener("resize", onResize);
    return function() {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  function F(k, v) {
    setForm(function(p) {
      var next = Object.assign({}, p);
      next[k] = v;
      return next;
    });
  }

  var filteredElevs = useMemo(function() {
    return elevs.filter(function(e) { return filtreIlce === "Tümü" || e.ilce === filtreIlce; });
  }, [elevs, filtreIlce]);

  var gorunenTeklifler = useMemo(function() {
    return teklifler.filter(function(t) {
      var elev = elevs.find(function(e){ return e.id === t.asansorId; });
      var metin = [t.apartmanAdi, t.yonetici, t.yapilacakIsler, elev && elev.ilce, elev && elev.ad].join(" ").toLowerCase();
      var ilceOk = filtreIlce === "Tümü" || (elev && elev.ilce === filtreIlce) || (!elev && t.ilce === filtreIlce);
      var aramaOk = !arama.trim() || metin.indexOf(arama.trim().toLowerCase()) >= 0;
      return ilceOk && aramaOk;
    }).slice().sort(function(a,b){ return String(b.tarih || "").localeCompare(String(a.tarih || "")); });
  }, [teklifler, elevs, filtreIlce, arama]);

  function syncElevatorFields(elevId) {
    var elev = elevs.find(function(e){ return String(e.id) === String(elevId); });
    setForm(function(p) {
      return Object.assign({}, p, {
        asansorId: elevId,
        apartmanAdi: elev ? (elev.ad || "") : p.apartmanAdi,
        yonetici: elev ? (elev.yonetici || "") : p.yonetici,
        adres: elev ? ((elev.semt ? elev.semt + " Mah., " : "") + (elev.adres || "") + (elev.ilce ? " / " + elev.ilce : "")) : p.adres,
        ilce: elev ? (elev.ilce || "") : p.ilce
      });
    });
  }

  function openAdd() {
    setEdit(null);
    setForm({ tarih: today, asansorId: "", apartmanAdi: "", yonetici: "", adres: "", yapilacakIsler: "", tutar: "", teslimSuresi: "2 hafta", onayTarihi: "" });
    setModal(true);
  }

  function openEdit(t) {
    setEdit(t);
    setForm(Object.assign({ teslimSuresi: "2 hafta" }, t));
    setModal(true);
  }

  function closeModal() {
    setModal(false);
    setEdit(null);
  }

  function save() {
    if (!form.apartmanAdi.trim()) { alert("Apartman adı zorunludur."); return; }
    if (!String(form.tutar).trim()) { alert("Tutar zorunludur."); return; }
    if (!(form.yapilacakIsler || "").trim()) { alert("Yapılacak işler zorunludur."); return; }
    var kayit = Object.assign({}, form, {
      asansorId: form.asansorId ? +form.asansorId : null,
      tutar: +form.tutar || 0,
      guncellemeZamani: new Date().toLocaleString("tr-TR")
    });
    if (edit) setTeklifler(function(p){ return p.map(function(x){ return x.id === edit.id ? Object.assign({}, x, kayit) : x; }); });
    else setTeklifler(function(p){ return p.concat([Object.assign({ id: Date.now(), olusturmaZamani: new Date().toLocaleString("tr-TR") }, kayit)]); });
    closeModal();
  }

  function remove(id) {
    if (!window.confirm("Bu teklif silinsin mi?")) return;
    setTeklifler(function(p){ return p.filter(function(x){ return x.id !== id; }); });
  }

  return React.createElement('div', null,
    React.createElement('div', { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, gap: 8, flexWrap: "wrap" } },
      React.createElement('h2', { style: { fontSize: 18, fontWeight: 900, margin: 0 } }, "📑 Teklif Oluşturma"),
      React.createElement('button', {
        onClick: openAdd,
        style: { background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontWeight: 700, fontSize: 12, cursor: "pointer" }
      }, "+ Yeni Teklif")
    ),
    React.createElement('div', { style: { background: "var(--bg-panel)", borderRadius: 14, border: "1px solid var(--border)", padding: 12, marginBottom: 14 } },
      React.createElement('div', { style: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" } },
        React.createElement('input', {
          value: arama,
          onChange: function(e){ setArama(e.target.value); },
          placeholder: "🔍 Apartman, yönetici veya iş kalemi ara...",
          style: { flex: 1, minWidth: 220, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 12px", color: "var(--text)", outline: "none", boxSizing: "border-box" }
        }),
        React.createElement('select', {
          value: filtreIlce,
          onChange: function(e){ setFiltreIlce(e.target.value); },
          style: { background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 12px", color: "var(--text)", cursor: "pointer" }
        },
          React.createElement('option', { value: "Tümü" }, "Tüm İlçeler"),
          ilceler.map(function(il){ return React.createElement('option', { key: il, value: il }, il); })
        )
      ),
      React.createElement('div', { style: { display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" } },
        React.createElement('div', { style: { fontSize: 11, background: "#1e3a5f", color: "#93c5fd", padding: "4px 8px", borderRadius: 999, fontWeight: 700 } }, teklifler.length + " teklif"),
        React.createElement('div', { style: { fontSize: 11, background: "#102218", color: "#86efac", padding: "4px 8px", borderRadius: 999, fontWeight: 700 } }, "Şablon: Boş Teklif")
      )
    ),
    gorunenTeklifler.length === 0
      ? React.createElement('div', { style: { textAlign: "center", padding: 28, color: "var(--text-dim)", background: "var(--bg-panel)", borderRadius: 14, border: "1px solid var(--border)" } },
          teklifler.length === 0 ? "Henüz teklif yok. Yeni teklif oluşturarak başlayabilirsiniz." : "Bu filtrede teklif bulunamadı."
        )
      : gorunenTeklifler.map(function(t) {
          var elev = elevs.find(function(e){ return e.id === t.asansorId; });
          return React.createElement(TeklifKart, {
            key: t.id,
            teklif: t,
            elev: elev,
            onEdit: openEdit,
            onDelete: remove,
            onWord: function(tt){ downloadWord(tt, elevs.find(function(e){ return e.id === tt.asansorId; })); },
            onPdf: function(tt){ openPdfPrint(tt, elevs.find(function(e){ return e.id === tt.asansorId; })); }
          });
        }),
    modal && React.createElement('div', { style: { position: "fixed", inset: 0, background: "#000000b8", zIndex: 2000, display: "flex", alignItems: darModal ? "flex-start" : "center", justifyContent: "center", padding: darAlan ? 8 : 16, overflowY: "auto" } },
      React.createElement('div', { style: { width: "min(1100px, 100%)", maxWidth: "calc(100vw - " + (darAlan ? 16 : 32) + "px)", maxHeight: darModal ? "none" : "90vh", overflowY: "auto", overflowX: "hidden", background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 18, margin: darModal ? "8px 0" : 0 } },
        React.createElement('div', { style: { padding: "14px 16px", borderBottom: "1px solid var(--border-soft)", display: "flex", justifyContent: "space-between", alignItems: "center" } },
          React.createElement('div', { style: { fontWeight: 800, fontSize: 16, color: "#3b82f6" } }, edit ? "Teklif Düzenle" : "Yeni Teklif"),
          React.createElement('button', { onClick: closeModal, style: { background: "none", border: "none", color: "var(--text-muted)", fontSize: 22, cursor: "pointer", lineHeight: 1 } }, "×")
        ),
        React.createElement('div', { style: { padding: 16, display: "grid", gridTemplateColumns: darModal ? "1fr" : "minmax(0,1.15fr) minmax(320px,0.85fr)", gap: 16, alignItems: "start" } },
          React.createElement('div', null,
            React.createElement('div', { style: { marginBottom: 12 } },
              React.createElement('label', { style: { display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 5 } }, "Tarih"),
              React.createElement('input', {
                type: "date", value: form.tarih || "", onChange: function(e){ F("tarih", e.target.value); },
                style: { width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 12px", color: "var(--text)", boxSizing: "border-box" }
              })
            ),
            React.createElement('div', { style: { marginBottom: 12 } },
              React.createElement('label', { style: { display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 5 } }, "Asansör / Bina"),
              React.createElement('select', {
                value: form.asansorId || "", onChange: function(e){ syncElevatorFields(e.target.value); },
                style: { width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 12px", color: "var(--text)", boxSizing: "border-box" }
              },
                React.createElement('option', { value: "" }, "— Bina seçin —"),
                ilceler.map(function(il) {
                  var ilceElevs = filteredElevs.filter(function(e){ return e.ilce === il; });
                  if (ilceElevs.length === 0 && filtreIlce !== "Tümü") return null;
                  return React.createElement('optgroup', { key: il, label: il },
                    ilceElevs.map(function(e){
                      return React.createElement('option', { key: e.id, value: e.id }, e.ad);
                    })
                  );
                })
              )
            ),
            React.createElement('div', { style: { display: "grid", gridTemplateColumns: darAlan ? "1fr" : "1fr 1fr", gap: 10, marginBottom: 12 } },
              React.createElement('div', null,
                React.createElement('label', { style: { display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 5 } }, "Apartman Adı"),
                React.createElement('input', { value: form.apartmanAdi || "", onChange: function(e){ F("apartmanAdi", e.target.value); }, style: { width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 12px", color: "var(--text)", boxSizing: "border-box" } })
              ),
              React.createElement('div', null,
                React.createElement('label', { style: { display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 5 } }, "Yönetici"),
                React.createElement('input', { value: form.yonetici || "", onChange: function(e){ F("yonetici", e.target.value); }, style: { width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 12px", color: "var(--text)", boxSizing: "border-box" } })
              )
            ),
            React.createElement('div', { style: { marginBottom: 12 } },
              React.createElement('label', { style: { display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 5 } }, "Adres"),
              React.createElement('textarea', {
                value: form.adres || "", onChange: function(e){ F("adres", e.target.value); }, rows: 2,
                style: { width: "100%", resize: "vertical", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 12px", color: "var(--text)", boxSizing: "border-box" }
              })
            ),
            React.createElement('div', { style: { marginBottom: 12 } },
              React.createElement('label', { style: { display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 5 } }, "Yapılacak İşlemler"),
              React.createElement('textarea', {
                value: form.yapilacakIsler || "", onChange: function(e){ F("yapilacakIsler", e.target.value); }, rows: 10,
                placeholder: "Her maddeyi alt alta yazın...",
                style: { width: "100%", resize: "vertical", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 12px", color: "var(--text)", boxSizing: "border-box", lineHeight: 1.5 }
              })
            ),
            React.createElement('div', { style: { display: "grid", gridTemplateColumns: darAlan ? "1fr" : (darModal ? "1fr 1fr" : "1fr 1fr 1fr"), gap: 10 } },
              React.createElement('div', null,
                React.createElement('label', { style: { display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 5 } }, "Tutar (TL)"),
                React.createElement('input', { type: "number", value: form.tutar || "", onChange: function(e){ F("tutar", e.target.value); }, style: { width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 12px", color: "var(--text)", boxSizing: "border-box" } })
              ),
              React.createElement('div', null,
                React.createElement('label', { style: { display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 5 } }, "Teslim Süresi"),
                React.createElement('input', { value: form.teslimSuresi || "", onChange: function(e){ F("teslimSuresi", e.target.value); }, style: { width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 12px", color: "var(--text)", boxSizing: "border-box" } })
              ),
              React.createElement('div', null,
                React.createElement('label', { style: { display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 5 } }, "Onay Tarihi"),
                React.createElement('input', { type: "date", value: form.onayTarihi || "", onChange: function(e){ F("onayTarihi", e.target.value); }, style: { width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 12px", color: "var(--text)", boxSizing: "border-box" } })
              )
            )
          ),
          React.createElement('div', null,
            React.createElement('div', { style: { background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 12, padding: 14, marginBottom: 12 } },
              React.createElement('div', { style: { fontSize: 12, fontWeight: 800, color: "#3b82f6", marginBottom: 8 } }, "Önizleme"),
              React.createElement('pre', { style: { margin: 0, whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: 12, lineHeight: 1.7, color: "var(--text)", maxHeight: 420, overflowY: "auto" } },
                teklifMetni(form, elevs.find(function(e){ return e.id === (+form.asansorId || form.asansorId); }))
              )
            ),
            React.createElement('div', { style: { fontSize: 11, color: "var(--text-muted)", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 12, padding: 12 } },
              "Tarih yeni teklifte otomatik gelir. Yapılacak işlemler alanına her satıra bir iş kalemi yazmanız yeterlidir; sistem çıktıda bunları otomatik olarak 1, 2, 3 şeklinde sıralar. PDF düğmesi belgeyi yazdırma penceresinde açar, Word düğmesi ise indirilebilir .doc dosyası üretir."
            )
          )
        ),
        React.createElement('div', { style: { padding: "0 16px 16px", display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" } },
          React.createElement('div', { style: { display: "flex", gap: 8, flexWrap: "wrap" } },
            React.createElement('button', { onClick: function(){ downloadWord(form, elevs.find(function(e){ return e.id === (+form.asansorId || form.asansorId); })); }, style: { padding: "10px 14px", borderRadius: 10, background: "#1e3a5f", border: "1px solid #3b82f633", color: "#93c5fd", cursor: "pointer", fontWeight: 700 } }, "📄 Word İndir"),
            React.createElement('button', { onClick: function(){ openPdfPrint(form, elevs.find(function(e){ return e.id === (+form.asansorId || form.asansorId); })); }, style: { padding: "10px 14px", borderRadius: 10, background: "#3a1e1e", border: "1px solid #ef444433", color: "#fca5a5", cursor: "pointer", fontWeight: 700 } }, "🖨️ PDF Aç")
          ),
          React.createElement('div', { style: { display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" } },
            React.createElement('button', { onClick: closeModal, style: { padding: "10px 14px", borderRadius: 10, background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-muted)", cursor: "pointer", fontWeight: 700 } }, "İptal"),
            React.createElement('button', { onClick: save, style: { padding: "10px 16px", borderRadius: 10, background: "linear-gradient(135deg,#10b981,#059669)", border: "none", color: "#fff", cursor: "pointer", fontWeight: 800 } }, edit ? "Güncelle" : "Kaydet")
          )
        )
      )
    )
  );
}
