import React, { useMemo, useState } from 'react'
import { IslemSatiri, Bos } from '../bilesenler.jsx'
import { dosyaIndir } from '../depo.js'
import {
  donemAralik, suz, toplamlar, gunlereGrupla, paraYaz, trTarih, gunAdi,
  bugunIso, csvUret, islemCsvSatirlari,
} from '../finans.js'

const DONEMLER = [
  { id: "hafta", ad: "Hafta" },
  { id: "ay", ad: "Bu Ay" },
  { id: "gecenAy", ad: "Geçen Ay" },
  { id: "yil", ad: "Yıl" },
  { id: "tumu", ad: "Tümü" },
  { id: "ozel", ad: "Özel" },
];

export default function Islemler({ veri, islemler, simge, kategoriBilgi, kategoriAdi, hesapAdi, islemAc, islemIptal }) {
  const bugun = bugunIso();
  const [donem, setDonem] = useState("ay");
  const [ozel, setOzel] = useState(function () {
    const a = donemAralik("ay", bugun);
    return { bas: a.bas, bit: a.bit };
  });
  const [tip, setTip] = useState("hepsi");
  const [kategoriId, setKategoriId] = useState("hepsi");
  const [hesapId, setHesapId] = useState("hepsi");
  const [arama, setArama] = useState("");
  const [iptalleriGoster, setIptalleriGoster] = useState(false);
  const [filtreAcik, setFiltreAcik] = useState(false);

  const aralik = useMemo(function () { return donemAralik(donem, bugun, ozel); }, [donem, bugun, ozel]);

  const liste = useMemo(function () {
    return suz(islemler, {
      bas: aralik.bas, bit: aralik.bit, tip: tip, kategoriId: kategoriId, hesapId: hesapId,
      arama: arama, iptalleriGoster: iptalleriGoster, kategoriAdi: kategoriAdi, hesapAdi: hesapAdi,
    });
  }, [islemler, aralik, tip, kategoriId, hesapId, arama, iptalleriGoster, kategoriAdi, hesapAdi]);

  const ozet = useMemo(function () { return toplamlar(liste); }, [liste]);
  const gruplar = useMemo(function () { return gunlereGrupla(liste); }, [liste]);
  const kategoriSecenekleri = useMemo(function () {
    return veri.kategoriler.filter(function (k) { return tip === "hepsi" || tip === "transfer" ? true : k.tip === tip; });
  }, [veri.kategoriler, tip]);

  function csvIndir() {
    const icerik = csvUret(islemCsvSatirlari(liste, kategoriAdi, hesapAdi));
    dosyaIndir("gelir-gider_" + aralik.bas + "_" + aralik.bit + ".csv", icerik, "text/csv");
  }

  return (
    <>
      <div className="cipler" style={{ marginBottom: 10 }}>
        {DONEMLER.map(function (d) {
          return <button key={d.id} className={"cip" + (donem === d.id ? " aktif" : "")} onClick={function () { setDonem(d.id); }}>{d.ad}</button>;
        })}
      </div>

      {donem === "ozel" ? (
        <div className="izgara izgara-2" style={{ marginBottom: 12 }}>
          <div>
            <label className="etiket">Başlangıç</label>
            <input className="girdi" type="date" value={ozel.bas} onChange={function (e) { setOzel(function (p) { return Object.assign({}, p, { bas: e.target.value }); }); }} />
          </div>
          <div>
            <label className="etiket">Bitiş</label>
            <input className="girdi" type="date" value={ozel.bit} onChange={function (e) { setOzel(function (p) { return Object.assign({}, p, { bit: e.target.value }); }); }} />
          </div>
        </div>
      ) : null}

      <div className="kart">
        <input className="girdi" type="search" value={arama} placeholder="🔍 Açıklama, kişi, kategori, belge no…"
          onChange={function (e) { setArama(e.target.value); }} />

        <div className="cipler" style={{ marginTop: 10 }}>
          {[{ id: "hepsi", ad: "Hepsi" }, { id: "gelir", ad: "💰 Gelir", s: "gelir-secim" }, { id: "gider", ad: "💸 Gider", s: "gider-secim" }, { id: "transfer", ad: "🔄 Transfer" }].map(function (t) {
            return (
              <button key={t.id} className={"cip" + (tip === t.id ? " aktif " + (t.s || "") : "")} style={{ flex: 1 }}
                onClick={function () { setTip(t.id); setKategoriId("hepsi"); }}>{t.ad}</button>
            );
          })}
        </div>

        <button className="btn hafif k" style={{ marginTop: 10 }} onClick={function () { setFiltreAcik(!filtreAcik); }}>
          {filtreAcik ? "▾" : "▸"} Kategori · hesap · iptaller
        </button>

        {filtreAcik ? (
          <div style={{ marginTop: 10 }}>
            <div className="izgara izgara-2">
              <select className="girdi" value={kategoriId} onChange={function (e) { setKategoriId(e.target.value); }}>
                <option value="hepsi">Tüm kategoriler</option>
                {kategoriSecenekleri.map(function (k) { return <option key={k.id} value={k.id}>{k.ikon + " " + k.ad}</option>; })}
              </select>
              <select className="girdi" value={hesapId} onChange={function (e) { setHesapId(e.target.value); }}>
                <option value="hepsi">Tüm hesaplar</option>
                {veri.hesaplar.map(function (h) { return <option key={h.id} value={h.id}>{h.ad}</option>; })}
              </select>
            </div>
            <label className="onay" style={{ marginTop: 10 }}>
              <input type="checkbox" checked={iptalleriGoster} onChange={function (e) { setIptalleriGoster(e.target.checked); }} />
              <span className="orta">İptal edilenleri de göster</span>
            </label>
          </div>
        ) : null}

        <div className="arali-dolgu" style={{ marginTop: 10 }}>
          <span className="kucuk silik">{liste.length} kayıt</span>
          <button className="btn hafif k" onClick={csvIndir} disabled={liste.length === 0}>📥 CSV indir</button>
        </div>
      </div>

      <div className="izgara izgara-3" style={{ marginBottom: 12 }}>
        <div className="kart" style={{ margin: 0, padding: "10px 8px", textAlign: "center" }}>
          <div className="kalin gelir">{paraYaz(ozet.gelir, simge)}</div>
          <div className="kucuk silik">Gelir</div>
        </div>
        <div className="kart" style={{ margin: 0, padding: "10px 8px", textAlign: "center" }}>
          <div className="kalin gider">{paraYaz(ozet.gider, simge)}</div>
          <div className="kucuk silik">Gider</div>
        </div>
        <div className="kart" style={{ margin: 0, padding: "10px 8px", textAlign: "center" }}>
          <div className={"kalin " + (ozet.net >= 0 ? "gelir" : "gider")}>{paraYaz(ozet.net, simge)}</div>
          <div className="kucuk silik">Net</div>
        </div>
      </div>

      {gruplar.length === 0 ? (
        <Bos resim="🧾" baslik="Kayıt bulunamadı" metin="Dönemi ya da filtreleri değiştirmeyi dene."
          eylem={<button className="btn ana" onClick={function () { islemAc(); }}>➕ İşlem ekle</button>} />
      ) : gruplar.map(function (g) {
        const bugunMu = g.tarih === bugun;
        return (
          <div key={g.tarih} className="kart sifir-dolgu">
            <div className={"gun-basligi" + (bugunMu ? " bugun" : "")}>
              <span>{(bugunMu ? "☀️ Bugün · " : "") + gunAdi(g.tarih) + ", " + trTarih(g.tarih)}</span>
              <span>
                {g.gelir > 0 ? <span className="gelir">+{paraYaz(g.gelir, simge)}</span> : null}
                {g.gelir > 0 && g.gider > 0 ? <span className="silik"> · </span> : null}
                {g.gider > 0 ? <span className="gider">−{paraYaz(g.gider, simge)}</span> : null}
              </span>
            </div>
            {g.islemler.map(function (i) {
              return (
                <IslemSatiri key={i.id} islem={i} kategoriBilgi={kategoriBilgi} hesapAdi={hesapAdi}
                  simge={simge} onAc={islemAc} onIptal={islemIptal} />
              );
            })}
          </div>
        );
      })}
    </>
  );
}
