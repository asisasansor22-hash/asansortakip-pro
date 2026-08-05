import React, { useMemo, useState } from 'react'
import { KPI, TrendGrafik, KategoriListesi, IslemSatiri, Bar, Bos, useDarEkran } from '../bilesenler.jsx'
import {
  donemAralik, aralikGunSayisi, suz, toplamlar, kategoriDagilimi, aylikSeri,
  hesapBakiyeleri, butceDurumu, paraYaz, yuzdeYaz, bugunIso, ayAnahtar,
} from '../finans.js'

const DONEMLER = [
  { id: "bugun", ad: "Bugün" },
  { id: "hafta", ad: "Hafta" },
  { id: "ay", ad: "Bu Ay" },
  { id: "gecenAy", ad: "Geçen Ay" },
  { id: "yil", ad: "Yıl" },
  { id: "tumu", ad: "Tümü" },
];

export default function Ozet({ veri, islemler, simge, kategoriBilgi, hesapAdi, islemAc, islemIptal, sekmeyeGit }) {
  const [donem, setDonem] = useState("ay");
  const bugun = bugunIso();
  const aralik = useMemo(function () { return donemAralik(donem, bugun); }, [donem, bugun]);

  const donemIslemleri = useMemo(function () {
    return suz(islemler, { bas: aralik.bas, bit: aralik.bit });
  }, [islemler, aralik]);

  const ozet = useMemo(function () { return toplamlar(donemIslemleri); }, [donemIslemleri]);
  const gelirDagilim = useMemo(function () { return kategoriDagilimi(donemIslemleri, "gelir", veri.kategoriler); }, [donemIslemleri, veri.kategoriler]);
  const giderDagilim = useMemo(function () { return kategoriDagilimi(donemIslemleri, "gider", veri.kategoriler); }, [donemIslemleri, veri.kategoriler]);
  const dar = useDarEkran(560);
  const ayAdedi = dar ? 6 : 12;
  const seri = useMemo(function () { return aylikSeri(islemler, ayAdedi, bugun); }, [islemler, ayAdedi, bugun]);
  const bakiyeler = useMemo(function () { return hesapBakiyeleri(veri.hesaplar, islemler); }, [veri.hesaplar, islemler]);
  const varlik = bakiyeler.reduce(function (s, h) { return s + h.bakiye; }, 0);
  const butceler = useMemo(function () {
    return butceDurumu(veri.butceler, islemler, ayAnahtar(bugun), veri.kategoriler);
  }, [veri.butceler, islemler, veri.kategoriler, bugun]);

  const gunSayisi = aralikGunSayisi(aralik.bas, aralik.bit);
  const sonIslemler = donemIslemleri.slice(0, 6);
  const denge = ozet.gelir + ozet.gider;

  if (islemler.length === 0) {
    return (
      <>
        <div className="cipler" style={{ marginBottom: 12 }}>
          {DONEMLER.map(function (d) {
            return <button key={d.id} className={"cip" + (donem === d.id ? " aktif" : "")} onClick={function () { setDonem(d.id); }}>{d.ad}</button>;
          })}
        </div>
        <Bos
          resim="📒"
          baslik="Defter henüz boş"
          metin={"İlk işlemini ekleyerek başla. Gelir ve giderlerini girdikçe kâr/zararın, kasa bakiyen ve aylık grafiğin burada oluşur."}
          eylem={<button className="btn ana" onClick={function () { islemAc(); }}>➕ İlk işlemi ekle</button>}
        />
      </>
    );
  }

  return (
    <>
      <div className="cipler" style={{ marginBottom: 10 }}>
        {DONEMLER.map(function (d) {
          return <button key={d.id} className={"cip" + (donem === d.id ? " aktif" : "")} onClick={function () { setDonem(d.id); }}>{d.ad}</button>;
        })}
      </div>
      <div className="kucuk silik" style={{ marginBottom: 12 }}>
        📅 {aralik.etiket} · {gunSayisi} gün · {ozet.adet} işlem
      </div>

      <div className="izgara izgara-oto" style={{ marginBottom: 12 }}>
        <KPI ikon="💰" baslik="Gelir" deger={<span className="gelir">{paraYaz(ozet.gelir, simge)}</span>} alt={ozet.gelirAdet + " işlem"} sinif="vurgu-gelir" />
        <KPI ikon="💸" baslik="Gider" deger={<span className="gider">{paraYaz(ozet.gider, simge)}</span>} alt={ozet.giderAdet + " işlem"} sinif="vurgu-gider" />
        <KPI ikon={ozet.net >= 0 ? "📈" : "📉"} baslik={ozet.net >= 0 ? "Net Kâr" : "Net Zarar"}
          deger={<span className={ozet.net >= 0 ? "gelir" : "gider"}>{paraYaz(ozet.net, simge)}</span>}
          alt={"Kâr marjı " + yuzdeYaz(ozet.marj)} />
        <KPI ikon="👛" baslik="Toplam Varlık" deger={<span className={varlik >= 0 ? "notr" : "gider"}>{paraYaz(varlik, simge)}</span>}
          alt={bakiyeler.length + " hesap"} />
      </div>

      <div className="kart">
        <div className="arali-dolgu" style={{ marginBottom: 8 }}>
          <span className="orta kalin gelir">Gelir {paraYaz(ozet.gelir, simge)}</span>
          <span className="orta kalin gider">Gider {paraYaz(ozet.gider, simge)}</span>
        </div>
        <div className="bar kalin ikili">
          <i style={{ width: (denge > 0 ? (ozet.gelir / denge) * 100 : 50) + "%", background: "var(--yesil-parlak)" }} />
          <i style={{ flex: 1, background: ozet.gider > 0 ? "var(--kirmizi-parlak)" : "transparent" }} />
        </div>
        <div className="kucuk silik" style={{ marginTop: 6 }}>
          {ozet.gelir > 0
            ? "Her 100 " + simge + " gelirin " + Math.round(ozet.giderOrani) + " " + simge + " kadarı gidere gidiyor."
            : "Bu dönemde gelir kaydı yok."}
        </div>
      </div>

      {butceler.length > 0 ? (
        <div className="kart">
          <div className="arali-dolgu" style={{ marginBottom: 10 }}>
            <span className="kart-baslik" style={{ margin: 0 }}>🎯 Bu Ayın Bütçesi</span>
            <button className="btn hafif k" onClick={function () { sekmeyeGit("rapor"); }}>Düzenle →</button>
          </div>
          {butceler.slice(0, 4).map(function (b) {
            return (
              <div key={b.kategoriId} style={{ marginBottom: 10 }}>
                <div className="arali-dolgu" style={{ marginBottom: 4 }}>
                  <span className="orta tek-satir">{b.ikon} {b.ad}</span>
                  <span className={"orta kalin " + (b.durum === "asildi" ? "gider" : b.durum === "yaklasti" ? "" : "soluk")}>
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
      ) : null}

      <div className="kart">
        <div className="kart-baslik">📈 Son {ayAdedi} Ay</div>
        <TrendGrafik seri={seri} simge={simge} />
      </div>

      <div className="izgara" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
        <KategoriListesi baslik="💰 Gelir Dağılımı" dagilim={gelirDagilim} bosMetin="Bu dönemde gelir yok" simge={simge} />
        <KategoriListesi baslik="💸 Gider Dağılımı" dagilim={giderDagilim} bosMetin="Bu dönemde gider yok" simge={simge} />
      </div>

      <div className="kart sifir-dolgu">
        <div className="arali-dolgu" style={{ padding: "12px 13px" }}>
          <span className="kart-baslik" style={{ margin: 0 }}>🕐 Son İşlemler</span>
          <button className="btn hafif k" onClick={function () { sekmeyeGit("islemler"); }}>Tümü →</button>
        </div>
        {sonIslemler.length === 0
          ? <div className="orta silik" style={{ padding: "20px 14px", textAlign: "center" }}>Bu dönemde işlem yok.</div>
          : sonIslemler.map(function (i) {
            return (
              <IslemSatiri key={i.id} islem={i} kategoriBilgi={kategoriBilgi} hesapAdi={hesapAdi}
                simge={simge} onAc={islemAc} onIptal={islemIptal} />
            );
          })}
      </div>
    </>
  );
}
