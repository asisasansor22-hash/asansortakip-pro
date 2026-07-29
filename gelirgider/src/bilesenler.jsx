import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { paraYaz, yuzdeYaz, kisaPara } from './finans.js'

// Dar ekranda 12 aylık grafik okunmuyor: sütunlar iğne inceliğinde kalıyor.
// Bu yüzden ay sayısını ekrana göre seçiyoruz.
export function useDarEkran(esik) {
  const sorgu = "(max-width: " + (esik || 560) + "px)";
  const [dar, setDar] = useState(function () {
    return typeof window !== "undefined" && window.matchMedia ? window.matchMedia(sorgu).matches : false;
  });
  useEffect(function () {
    if (!window.matchMedia) return;
    const mm = window.matchMedia(sorgu);
    function degisti(e) { setDar(e.matches); }
    setDar(mm.matches);
    mm.addEventListener("change", degisti);
    return function () { mm.removeEventListener("change", degisti); };
  }, [sorgu]);
  return dar;
}

export function Modal({ baslik, onKapat, alt, children }) {
  // Modal açıkken arka planın kaymasını engelle (mobilde formu doldururken
  // sayfa altta kayıyor ve alan gözden kayboluyordu).
  useEffect(function () {
    const eski = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function tus(e) { if (e.key === "Escape") onKapat(); }
    window.addEventListener("keydown", tus);
    return function () {
      document.body.style.overflow = eski;
      window.removeEventListener("keydown", tus);
    };
  }, [onKapat]);

  return createPortal(
    <div className="modal-arka" onClick={onKapat}>
      <div className="modal-sayfa" onClick={function (e) { e.stopPropagation(); }}>
        <div className="modal-ust">
          <h2>{baslik}</h2>
          <button className="btn ikon hafif" onClick={onKapat} aria-label="Kapat">✕</button>
        </div>
        <div className="modal-govde">{children}</div>
        {alt ? <div className="modal-alt">{alt}</div> : null}
      </div>
    </div>,
    document.body
  );
}

export function Onayla({ baslik, metin, onayMetni, tehlike, onOnay, onKapat }) {
  return (
    <Modal baslik={baslik} onKapat={onKapat} alt={
      <div className="izgara izgara-2">
        <button className="btn hafif" onClick={onKapat}>Vazgeç</button>
        <button className={"btn " + (tehlike ? "tehlike" : "ana")} onClick={onOnay}>{onayMetni || "Onayla"}</button>
      </div>
    }>
      <div className="orta soluk" style={{ lineHeight: 1.6 }}>{metin}</div>
    </Modal>
  );
}

export function KPI({ ikon, baslik, deger, alt, sinif }) {
  return (
    <div className={"kpi " + (sinif || "")}>
      <div className="ust"><span>{ikon}</span><span className="tek-satir">{baslik}</span></div>
      <div className="deger">{deger}</div>
      {alt ? <div className="alt">{alt}</div> : null}
    </div>
  );
}

export function Bos({ resim, baslik, metin, eylem }) {
  return (
    <div className="kart bos">
      <div className="resim">{resim}</div>
      <div className="baslik">{baslik}</div>
      {metin ? <div className="metin">{metin}</div> : null}
      {eylem ? <div style={{ marginTop: 14 }}>{eylem}</div> : null}
    </div>
  );
}

export function Bar({ oran, renk, kalin }) {
  return (
    <div className={"bar" + (kalin ? " kalin" : "")}>
      <i style={{ width: Math.max(0, Math.min(100, oran)) + "%", background: renk }} />
    </div>
  );
}

// Gelir/gider sütunları + net kâr eğrisi. Sıfır çizgisi ortaktır, bu yüzden
// zarar eden aylar çizginin altında görünür.
export function TrendGrafik({ seri, simge }) {
  const G = 720, Y = 250;
  const sol = 48, sag = 12, ust = 14, alt = 46;
  const alanG = G - sol - sag;
  const alanY = Y - ust - alt;

  const enUst = Math.max(1, ...seri.map(function (s) { return Math.max(s.gelir, s.gider, s.net); }));
  const enAlt = Math.min(0, ...seri.map(function (s) { return s.net; }));
  const menzil = enUst - enAlt || 1;
  function y(v) { return ust + alanY * ((enUst - v) / menzil); }
  const sifir = y(0);

  const grup = alanG / Math.max(1, seri.length);
  const sutun = Math.min(16, grup / 3.2);
  const cizgi = seri.map(function (s, i) { return (sol + grup * i + grup / 2) + "," + y(s.net); }).join(" ");
  const isaretler = enAlt < 0 ? [enUst, enUst / 2, 0, enAlt] : [enUst, enUst / 2, 0];

  return (
    <div className="grafik">
      <svg viewBox={"0 0 " + G + " " + Y} role="img" aria-label="Son aylara ait gelir, gider ve net kâr grafiği">
        {isaretler.map(function (v, i) {
          return (
            <g key={i}>
              <line x1={sol} y1={y(v)} x2={G - sag} y2={y(v)} stroke="currentColor" strokeOpacity={v === 0 ? 0.35 : 0.14} strokeDasharray={v === 0 ? "" : "3 4"} />
              <text x={sol - 6} y={y(v) + 4} textAnchor="end" fontSize="10" fill="currentColor" fillOpacity="0.45">{kisaPara(v)}</text>
            </g>
          );
        })}
        {seri.map(function (s, i) {
          const merkez = sol + grup * i + grup / 2;
          return (
            <g key={s.ay}>
              <rect x={merkez - sutun - 2} y={y(s.gelir)} width={sutun} height={Math.max(0.5, sifir - y(s.gelir))} rx="3" fill="var(--yesil-parlak)" />
              <rect x={merkez + 2} y={y(s.gider)} width={sutun} height={Math.max(0.5, sifir - y(s.gider))} rx="3" fill="var(--kirmizi-parlak)" />
              <text x={merkez} y={Y - alt + 16} textAnchor="middle" fontSize="10.5" fill="currentColor" fillOpacity="0.6" fontWeight="600">{s.kisa}</text>
              {s.gelir || s.gider
                ? <text x={merkez} y={Y - alt + 30} textAnchor="middle" fontSize="9.5" fontWeight="700" fill={s.net >= 0 ? "var(--yesil-parlak)" : "var(--kirmizi-parlak)"}>{kisaPara(s.net)}</text>
                : null}
            </g>
          );
        })}
        <polyline points={cizgi} fill="none" stroke="var(--mavi)" strokeWidth="2" strokeLinejoin="round" opacity="0.85" />
        {seri.map(function (s, i) {
          return <circle key={s.ay} cx={sol + grup * i + grup / 2} cy={y(s.net)} r="2.8" fill="var(--mavi)" />;
        })}
      </svg>
      <div className="gosterge">
        <span><i style={{ background: "var(--yesil-parlak)" }} />Gelir</span>
        <span><i style={{ background: "var(--kirmizi-parlak)" }} />Gider</span>
        <span><i style={{ background: "var(--mavi)", height: 3, borderRadius: 2, width: 14 }} />Net kâr</span>
      </div>
      <div className="kucuk silik" style={{ textAlign: "center", marginTop: 4 }}>
        Tutarlar {simge || "₺"} · B = bin, M = milyon
      </div>
    </div>
  );
}

export function IslemSatiri({ islem, kategoriBilgi, hesapAdi, simge, onAc, onIptal }) {
  const k = islem.tip === "transfer" ? null : kategoriBilgi(islem.kategoriId);
  const transfer = islem.tip === "transfer";
  const gelir = islem.tip === "gelir";
  const renk = transfer ? "var(--mavi)" : gelir ? "var(--yesil-parlak)" : "var(--kirmizi-parlak)";
  const ikon = transfer ? "🔄" : (k ? k.ikon : "❔");
  const rozetRenk = transfer ? "var(--mavi)" : (k ? k.renk : "var(--yazi-silik)");

  return (
    <div className={"satir" + (islem.iptal ? " iptal" : "")}>
      <div className="rozet" style={{ color: rozetRenk }}>{ikon}</div>
      <button className="govde" onClick={function () { onAc(islem); }}
        style={{ background: "none", border: "none", padding: 0, textAlign: "left", cursor: "pointer", color: "inherit" }}>
        <div className="ad tek-satir">
          {islem.aciklama || (transfer ? "Transfer" : (k ? k.ad : "İşlem"))}
        </div>
        <div className="aciklama">
          <span>{transfer ? hesapAdi(islem.hesapId) + " → " + hesapAdi(islem.hedefHesapId) : (k ? k.ad : "Kategorisiz") + " · " + hesapAdi(islem.hesapId)}</span>
          {islem.kisi ? <span>· 👤 {islem.kisi}</span> : null}
          {islem.belgeNo ? <span>· 🧾 {islem.belgeNo}</span> : null}
          {islem.kaynak === "tekrar" ? <span>· 🔁 tekrarlayan</span> : null}
          {islem.iptal ? <span className="gider">· İPTAL</span> : null}
        </div>
      </button>
      <div className="sag">
        <div className="tutar" style={{ color: renk }}>
          {(transfer ? "" : gelir ? "+" : "−") + paraYaz(islem.tutar, simge)}
        </div>
        {onIptal ? (
          <button className="btn hafif k" style={{ marginTop: 4 }} onClick={function () { onIptal(islem); }}
            title={islem.iptal ? "İptali geri al" : "İptal et — toplamlara girmez"}>
            {islem.iptal ? "↩" : "🚫"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function KategoriListesi({ baslik, dagilim, bosMetin, simge }) {
  return (
    <div className="kart">
      <div className="kart-baslik">{baslik}</div>
      {dagilim.length === 0
        ? <div className="orta silik" style={{ textAlign: "center", padding: "12px 0" }}>{bosMetin}</div>
        : dagilim.map(function (k) {
          return (
            <div key={k.id} style={{ marginBottom: 11 }}>
              <div className="arali-dolgu" style={{ marginBottom: 4 }}>
                <span className="orta tek-satir">{k.ikon} {k.ad} <span className="silik">· {k.adet}</span></span>
                <span className="orta kalin" style={{ color: k.renk }}>{paraYaz(k.tutar, simge)}</span>
              </div>
              <Bar oran={k.yuzde} renk={k.renk} />
              <div className="kucuk silik" style={{ marginTop: 2 }}>{yuzdeYaz(k.yuzde)}</div>
            </div>
          );
        })}
    </div>
  );
}
