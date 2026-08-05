import React, { useMemo, useState } from 'react'
import { KPI, KategoriListesi, Bar, Modal } from '../bilesenler.jsx'
import { dosyaIndir } from '../depo.js'
import {
  yillikTablo, suz, toplamlar, kategoriDagilimi, kisiDagilimi, butceDurumu,
  paraYaz, yuzdeYaz, sayiOku, bugunIso, ayAnahtar, ayEtiket, ayEkle,
  csvUret, islemCsvSatirlari, yillikCsvSatirlari,
} from '../finans.js'

function ButceFormu({ kategoriler, butceler, simge, onKaydet, onKapat }) {
  const [degerler, setDegerler] = useState(function () {
    const d = {};
    (butceler || []).forEach(function (b) { d[b.kategoriId] = String(b.aylikLimit).replace(".", ","); });
    return d;
  });
  const giderKategorileri = kategoriler.filter(function (k) { return k.tip === "gider"; });

  function kaydet() {
    const yeni = [];
    giderKategorileri.forEach(function (k) {
      const limit = sayiOku(degerler[k.id]);
      if (limit > 0) yeni.push({ kategoriId: k.id, aylikLimit: limit });
    });
    onKaydet(yeni);
  }

  return (
    <Modal baslik="Aylık Bütçe" onKapat={onKapat} alt={<button className="btn ana tam" onClick={kaydet}>💾 Kaydet</button>}>
      <div className="uyari bilgi">
        Gider kategorileri için aylık üst sınır belirle. Boş bıraktığın ya da 0 yazdığın kategori bütçeye girmez.
      </div>
      {giderKategorileri.map(function (k) {
        return (
          <div key={k.id} className="alan">
            <label className="etiket" htmlFor={"b-" + k.id}>{k.ikon} {k.ad}</label>
            <input id={"b-" + k.id} className="girdi" type="text" inputMode="decimal" placeholder={"Aylık sınır (" + simge + ")"}
              value={degerler[k.id] || ""}
              onChange={function (e) {
                const v = e.target.value;
                setDegerler(function (p) { return Object.assign({}, p, { [k.id]: v }); });
              }} />
          </div>
        );
      })}
    </Modal>
  );
}

export default function Raporlar({ veri, guncelle, islemler, simge, kategoriAdi, hesapAdi }) {
  const bugun = bugunIso();
  const [yil, setYil] = useState(parseInt(bugun.slice(0, 4), 10));
  const [butceAy, setButceAy] = useState(ayAnahtar(bugun));
  const [butceFormu, setButceFormu] = useState(false);

  const yillar = useMemo(function () {
    const k = {};
    islemler.forEach(function (i) { k[i.tarih.slice(0, 4)] = true; });
    k[bugun.slice(0, 4)] = true;
    return Object.keys(k).sort().reverse();
  }, [islemler, bugun]);

  const tablo = useMemo(function () { return yillikTablo(islemler, yil); }, [islemler, yil]);
  const yilIslemleri = useMemo(function () {
    return suz(islemler, { bas: yil + "-01-01", bit: yil + "-12-31" });
  }, [islemler, yil]);
  const ozet = useMemo(function () { return toplamlar(yilIslemleri); }, [yilIslemleri]);
  const kisiler = useMemo(function () { return kisiDagilimi(yilIslemleri).slice(0, 10); }, [yilIslemleri]);
  const butceler = useMemo(function () {
    return butceDurumu(veri.butceler, islemler, butceAy, veri.kategoriler);
  }, [veri.butceler, islemler, butceAy, veri.kategoriler]);

  const enIyiAy = useMemo(function () {
    let en = null;
    tablo.forEach(function (s) { if (s.gelir || s.gider) { if (!en || s.net > en.net) en = s; } });
    return en;
  }, [tablo]);

  function butceKaydet(yeni) {
    guncelle(function (o) { return Object.assign({}, o, { butceler: yeni }); });
    setButceFormu(false);
  }

  function yilCsv() {
    dosyaIndir("kar-zarar_" + yil + ".csv", csvUret(yillikCsvSatirlari(islemler, yil)), "text/csv");
  }

  function hareketCsv() {
    dosyaIndir("islemler_" + yil + ".csv", csvUret(islemCsvSatirlari(yilIslemleri, kategoriAdi, hesapAdi)), "text/csv");
  }

  return (
    <>
      <div className="arali-dolgu" style={{ marginBottom: 12 }}>
        <select className="girdi" style={{ width: "auto" }} value={yil} onChange={function (e) { setYil(parseInt(e.target.value, 10)); }}>
          {yillar.map(function (y) { return <option key={y} value={y}>{y} yılı</option>; })}
        </select>
        <div className="arali">
          <button className="btn hafif k" onClick={yilCsv}>📥 Kâr/zarar</button>
          <button className="btn hafif k" onClick={hareketCsv} disabled={yilIslemleri.length === 0}>📥 Hareketler</button>
        </div>
      </div>

      <div className="izgara izgara-oto" style={{ marginBottom: 12 }}>
        <KPI ikon="💰" baslik={yil + " Geliri"} deger={<span className="gelir">{paraYaz(ozet.gelir, simge)}</span>} alt={ozet.gelirAdet + " işlem"} />
        <KPI ikon="💸" baslik={yil + " Gideri"} deger={<span className="gider">{paraYaz(ozet.gider, simge)}</span>} alt={ozet.giderAdet + " işlem"} />
        <KPI ikon={ozet.net >= 0 ? "📈" : "📉"} baslik={yil + " Net"}
          deger={<span className={ozet.net >= 0 ? "gelir" : "gider"}>{paraYaz(ozet.net, simge)}</span>}
          alt={"Marj " + yuzdeYaz(ozet.marj)} />
        <KPI ikon="🏆" baslik="En iyi ay"
          deger={enIyiAy ? enIyiAy.etiket : "—"}
          alt={enIyiAy ? paraYaz(enIyiAy.net, simge) + " net" : "Kayıt yok"} />
      </div>

      <div className="kart sifir-dolgu">
        <div className="kart-baslik" style={{ padding: "12px 13px 0" }}>📅 Ay Ay Kâr / Zarar — {yil}</div>
        <div className="tablo-sar">
          <table className="tablo">
            <thead>
              <tr><th>Ay</th><th>Gelir</th><th>Gider</th><th>Net</th><th>Marj</th></tr>
            </thead>
            <tbody>
              {tablo.map(function (s) {
                const bos = s.gelir === 0 && s.gider === 0;
                return (
                  <tr key={s.ay} className={bos ? "bos" : ""}>
                    <td className="kalin">{s.etiket}</td>
                    <td className="gelir">{s.gelir ? paraYaz(s.gelir, simge) : "—"}</td>
                    <td className="gider">{s.gider ? paraYaz(s.gider, simge) : "—"}</td>
                    <td className={"kalin " + (bos ? "silik" : s.net >= 0 ? "gelir" : "gider")}>{bos ? "—" : paraYaz(s.net, simge)}</td>
                    <td className="soluk">{s.gelir ? yuzdeYaz(s.marj, 0) : "—"}</td>
                  </tr>
                );
              })}
              <tr className="toplam">
                <td>TOPLAM</td>
                <td className="gelir">{paraYaz(ozet.gelir, simge)}</td>
                <td className="gider">{paraYaz(ozet.gider, simge)}</td>
                <td className={ozet.net >= 0 ? "gelir" : "gider"}>{paraYaz(ozet.net, simge)}</td>
                <td className="soluk">{yuzdeYaz(ozet.marj, 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="kart">
        <div className="arali-dolgu" style={{ marginBottom: 10 }}>
          <span className="kart-baslik" style={{ margin: 0 }}>🎯 Bütçe</span>
          <div className="arali">
            <select className="girdi" style={{ width: "auto", padding: "6px 8px" }} value={butceAy}
              onChange={function (e) { setButceAy(e.target.value); }}>
              {[0, -1, -2, -3, -4, -5].map(function (k) {
                const a = ayEkle(ayAnahtar(bugun), k);
                return <option key={a} value={a}>{ayEtiket(a)}</option>;
              })}
            </select>
            <button className="btn hafif k" onClick={function () { setButceFormu(true); }}>✏️ Düzenle</button>
          </div>
        </div>
        {butceler.length === 0 ? (
          <div className="orta silik" style={{ padding: "10px 0" }}>
            Bütçe tanımlı değil. "Düzenle" ile gider kategorilerine aylık sınır koyabilirsin.
          </div>
        ) : butceler.map(function (b) {
          return (
            <div key={b.kategoriId} style={{ marginBottom: 11 }}>
              <div className="arali-dolgu" style={{ marginBottom: 4 }}>
                <span className="orta tek-satir">{b.ikon} {b.ad}</span>
                <span className={"orta kalin " + (b.durum === "asildi" ? "gider" : "")}>
                  {paraYaz(b.harcanan, simge)} / {paraYaz(b.limit, simge)}
                </span>
              </div>
              <Bar oran={b.oran} renk={b.durum === "asildi" ? "var(--kirmizi-parlak)" : b.durum === "yaklasti" ? "var(--turuncu)" : "var(--yesil-parlak)"} />
              <div className="kucuk silik" style={{ marginTop: 2 }}>
                {b.kalan >= 0 ? paraYaz(b.kalan, simge) + " kaldı" : paraYaz(-b.kalan, simge) + " aşıldı"} · {yuzdeYaz(b.oran, 0)}
              </div>
            </div>
          );
        })}
      </div>

      {ozet.kdvGelir > 0 || ozet.kdvGider > 0 ? (
        <div className="kart">
          <div className="kart-baslik">🏛️ KDV Özeti — {yil}</div>
          <div className="izgara izgara-3">
            <div style={{ textAlign: "center" }}>
              <div className="kalin gelir">{paraYaz(ozet.kdvGelir, simge)}</div>
              <div className="kucuk silik">Hesaplanan</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div className="kalin notr">{paraYaz(ozet.kdvGider, simge)}</div>
              <div className="kucuk silik">İndirilecek</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div className={"kalin " + (ozet.kdvFark >= 0 ? "gider" : "gelir")}>{paraYaz(Math.abs(ozet.kdvFark), simge)}</div>
              <div className="kucuk silik">{ozet.kdvFark >= 0 ? "Ödenecek" : "Devreden"}</div>
            </div>
          </div>
          <div className="kucuk silik" style={{ marginTop: 8 }}>
            Yalnızca KDV oranı girilmiş kayıtlar hesaba katılır; resmî beyan yerine geçmez.
          </div>
        </div>
      ) : null}

      <div className="izgara" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
        <KategoriListesi baslik={"💰 " + yil + " Gelir Kalemleri"} dagilim={kategoriDagilimi(yilIslemleri, "gelir", veri.kategoriler)} bosMetin="Kayıt yok" simge={simge} />
        <KategoriListesi baslik={"💸 " + yil + " Gider Kalemleri"} dagilim={kategoriDagilimi(yilIslemleri, "gider", veri.kategoriler)} bosMetin="Kayıt yok" simge={simge} />
      </div>

      {kisiler.length > 0 ? (
        <div className="kart sifir-dolgu">
          <div className="kart-baslik" style={{ padding: "12px 13px 0" }}>👤 Kişi / Firma — {yil}</div>
          <div className="tablo-sar">
            <table className="tablo">
              <thead>
                <tr><th>Ad</th><th>Gelir</th><th>Gider</th><th>Net</th></tr>
              </thead>
              <tbody>
                {kisiler.map(function (k) {
                  return (
                    <tr key={k.ad}>
                      <td className="kalin">{k.ad}</td>
                      <td className="gelir">{k.gelir ? paraYaz(k.gelir, simge) : "—"}</td>
                      <td className="gider">{k.gider ? paraYaz(k.gider, simge) : "—"}</td>
                      <td className={"kalin " + (k.net >= 0 ? "gelir" : "gider")}>{paraYaz(k.net, simge)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {butceFormu ? (
        <ButceFormu kategoriler={veri.kategoriler} butceler={veri.butceler} simge={simge}
          onKaydet={butceKaydet} onKapat={function () { setButceFormu(false); }} />
      ) : null}
    </>
  );
}
