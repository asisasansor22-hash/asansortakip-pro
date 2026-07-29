import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { veriYukle, veriKaydet, yeniKimlik } from './depo.js'
import { islemleriNormalize, islemSirala, tekrarlarıUret, bugunIso } from './finans.js'
import IslemFormu from './IslemFormu.jsx'
import Ozet from './ekranlar/Ozet.jsx'
import Islemler from './ekranlar/Islemler.jsx'
import Hesaplar from './ekranlar/Hesaplar.jsx'
import Raporlar from './ekranlar/Raporlar.jsx'
import Ayarlar from './ekranlar/Ayarlar.jsx'

const SEKMELER = [
  { id: "ozet", ad: "Özet", ikon: "📊" },
  { id: "islemler", ad: "İşlemler", ikon: "🧾" },
  { id: "hesaplar", ad: "Hesaplar", ikon: "👛" },
  { id: "rapor", ad: "Rapor", ikon: "📈" },
  { id: "ayarlar", ad: "Ayarlar", ikon: "⚙️" },
];

export default function App() {
  const [veri, setVeri] = useState(veriYukle);
  const [sekme, setSekme] = useState("ozet");
  const [form, setForm] = useState(null);       // düzenlenen/eklenen işlem
  const [kayitHatasi, setKayitHatasi] = useState(false);
  const ilkKayit = useRef(true);

  // Tema
  useEffect(function () {
    document.documentElement.setAttribute("data-tema", veri.ayarlar.tema === "acik" ? "acik" : "koyu");
    const mt = document.querySelector('meta[name="theme-color"]');
    if (mt) mt.setAttribute("content", veri.ayarlar.tema === "acik" ? "#F4F6FB" : "#0B0F17");
  }, [veri.ayarlar.tema]);

  // Her değişiklikte diske yaz. İlk turda yazmıyoruz: okuduğumuzu geri
  // yazmanın anlamı yok ve bozuk bir okuma varsa üzerine yazmasın.
  useEffect(function () {
    if (ilkKayit.current) { ilkKayit.current = false; return; }
    const oldu = veriKaydet(veri);
    setKayitHatasi(!oldu);
  }, [veri]);

  const guncelle = useCallback(function (yamaFn) {
    setVeri(function (onceki) {
      const yeni = yamaFn(onceki);
      return yeni === onceki ? onceki : Object.assign({}, yeni, { ayarlar: Object.assign({}, yeni.ayarlar, { sonKayit: new Date().toISOString() }) });
    });
  }, []);

  // Tekrarlayan işlemlerin eksik aylarını tamamla (açılışta bir kez).
  useEffect(function () {
    guncelle(function (o) {
      const yeniler = tekrarlarıUret(o.tekrarlar, o.islemler, bugunIso());
      if (yeniler.length === 0) return o;
      return Object.assign({}, o, { islemler: islemSirala(o.islemler.concat(yeniler)) });
    });
  }, [guncelle]);

  const islemler = useMemo(function () { return islemSirala(islemleriNormalize(veri.islemler)); }, [veri.islemler]);
  const simge = veri.ayarlar.paraSimgesi || "₺";

  const kategoriAdlari = useMemo(function () {
    const h = {};
    veri.kategoriler.forEach(function (k) { h[k.id] = k; });
    return h;
  }, [veri.kategoriler]);

  const hesapAdlari = useMemo(function () {
    const h = {};
    veri.hesaplar.forEach(function (x) { h[x.id] = x; });
    return h;
  }, [veri.hesaplar]);

  const kategoriAdi = useCallback(function (id) {
    const k = kategoriAdlari[id];
    return k ? k.ad : "";
  }, [kategoriAdlari]);

  const hesapAdi = useCallback(function (id) {
    const h = hesapAdlari[id];
    return h ? h.ad : "";
  }, [hesapAdlari]);

  // ── İşlem yazma ──
  function islemKaydet(gelen) {
    const id = gelen.id || yeniKimlik("i");
    guncelle(function (o) {
      const liste = islemleriNormalize(o.islemler);
      const idx = liste.findIndex(function (x) { return x.id === String(id); });
      const kayit = Object.assign({}, gelen, { id: id });
      if (idx >= 0) liste[idx] = Object.assign({}, liste[idx], kayit);
      else liste.push(kayit);
      return Object.assign({}, o, { islemler: islemSirala(islemleriNormalize(liste)) });
    });
    setForm(null);
  }

  function islemSil(islem) {
    guncelle(function (o) {
      return Object.assign({}, o, { islemler: o.islemler.filter(function (x) { return String(x.id) !== String(islem.id); }) });
    });
    setForm(null);
  }

  function islemIptal(islem) {
    guncelle(function (o) {
      return Object.assign({}, o, {
        islemler: o.islemler.map(function (x) {
          return String(x.id) === String(islem.id) ? Object.assign({}, x, { iptal: !x.iptal }) : x;
        }),
      });
    });
  }

  const ortak = {
    veri: veri, guncelle: guncelle, islemler: islemler, simge: simge,
    kategoriAdi: kategoriAdi, hesapAdi: hesapAdi,
    kategoriBilgi: function (id) { return kategoriAdlari[id]; },
    hesapBilgi: function (id) { return hesapAdlari[id]; },
    islemAc: function (baslangic) { setForm(baslangic || { tip: "gider", tarih: bugunIso() }); },
    islemIptal: islemIptal,
    sekmeyeGit: setSekme,
  };

  return (
    <div className="kabuk">
      <header className="ust-bar">
        <div style={{ flex: 1 }}>
          <h1>📒 Gelir Gider</h1>
          <div className="alt">{veri.ayarlar.isim ? veri.ayarlar.isim : "Kasa ve kâr/zarar defteri"}</div>
        </div>
        <button className="btn ana k" onClick={function () { ortak.islemAc(); }}>➕ İşlem</button>
      </header>

      <nav className="nav">
        {SEKMELER.map(function (s) {
          return (
            <button key={s.id} className={sekme === s.id ? "aktif" : ""} onClick={function () { setSekme(s.id); }}>
              <span className="ikon">{s.ikon}</span>
              <span>{s.ad}</span>
            </button>
          );
        })}
      </nav>

      {kayitHatasi ? (
        <div className="uyari hata">
          ⚠️ Değişiklikler bu cihaza kaydedilemedi (depolama dolu ya da tarayıcı gizli modda olabilir).
          Verini kaybetmemek için Ayarlar → Yedek al ile dosyaya indir.
        </div>
      ) : null}

      {sekme === "ozet" ? <Ozet {...ortak} /> : null}
      {sekme === "islemler" ? <Islemler {...ortak} /> : null}
      {sekme === "hesaplar" ? <Hesaplar {...ortak} /> : null}
      {sekme === "rapor" ? <Raporlar {...ortak} /> : null}
      {sekme === "ayarlar" ? <Ayarlar {...ortak} /> : null}

      {form ? (
        <IslemFormu
          islem={form}
          kategoriler={veri.kategoriler}
          hesaplar={veri.hesaplar}
          simge={simge}
          onKaydet={islemKaydet}
          onSil={islemSil}
          onKapat={function () { setForm(null); }}
        />
      ) : null}
    </div>
  );
}
