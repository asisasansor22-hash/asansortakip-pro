import React, { useMemo, useState } from 'react'
import { Modal } from './bilesenler.jsx'
import { bugunIso, sayiOku, paraYaz } from './finans.js'

const KDV_ORANLARI = [0, 1, 10, 20];

const TURLER = [
  { id: "gider", ad: "💸 Gider", sinif: "gider-secim" },
  { id: "gelir", ad: "💰 Gelir", sinif: "gelir-secim" },
  { id: "transfer", ad: "🔄 Transfer", sinif: "" },
];

export default function IslemFormu({ islem, kategoriler, hesaplar, simge, onKaydet, onKapat, onSil }) {
  const duzenleme = !!islem.id;
  const aktifHesaplar = useMemo(function () {
    return (hesaplar || []).filter(function (h) { return h.aktif !== false; });
  }, [hesaplar]);

  const [f, setF] = useState(function () {
    return {
      tip: islem.tip || "gider",
      tarih: islem.tarih || bugunIso(),
      tutar: islem.tutar ? String(islem.tutar).replace(".", ",") : "",
      kategoriId: islem.kategoriId || "",
      hesapId: islem.hesapId || (aktifHesaplar[0] ? aktifHesaplar[0].id : ""),
      hedefHesapId: islem.hedefHesapId || (aktifHesaplar[1] ? aktifHesaplar[1].id : ""),
      aciklama: islem.aciklama || "",
      kisi: islem.kisi || "",
      belgeNo: islem.belgeNo || "",
      kdvOran: islem.kdvOran || 0,
      detayAcik: !!(islem.kisi || islem.belgeNo || islem.kdvOran),
    };
  });
  const [hata, setHata] = useState("");

  function set(alan, deger) { setF(function (p) { return Object.assign({}, p, { [alan]: deger }); }); }

  const tipKategorileri = useMemo(function () {
    return (kategoriler || []).filter(function (k) { return k.tip === f.tip; });
  }, [kategoriler, f.tip]);

  const tutar = sayiOku(f.tutar);
  const kdvOran = Number(f.kdvOran) || 0;

  function tipDegistir(yeniTip) {
    setF(function (p) {
      return Object.assign({}, p, {
        tip: yeniTip,
        // Kategori diğer türe ait kalmasın
        kategoriId: yeniTip === "transfer" ? "" : "",
      });
    });
    setHata("");
  }

  function kaydet() {
    if (tutar <= 0) { setHata("Tutar sıfırdan büyük olmalı."); return; }
    if (!f.tarih) { setHata("Tarih seçin."); return; }
    if (!f.hesapId) { setHata("Hesap seçin."); return; }
    if (f.tip === "transfer") {
      if (!f.hedefHesapId) { setHata("Hedef hesabı seçin."); return; }
      if (f.hedefHesapId === f.hesapId) { setHata("Transferde kaynak ve hedef hesap aynı olamaz."); return; }
    } else if (!f.kategoriId) {
      setHata("Kategori seçin."); return;
    }
    onKaydet({
      id: islem.id,
      tip: f.tip,
      tarih: f.tarih,
      tutar: tutar,
      kategoriId: f.tip === "transfer" ? "" : f.kategoriId,
      hesapId: f.hesapId,
      hedefHesapId: f.tip === "transfer" ? f.hedefHesapId : "",
      aciklama: f.aciklama.trim(),
      kisi: f.kisi.trim(),
      belgeNo: f.belgeNo.trim(),
      kdvOran: f.tip === "transfer" ? 0 : kdvOran,
      iptal: !!islem.iptal,
      kaynak: islem.kaynak || "manuel",
      girisZamani: islem.girisZamani || new Date().toLocaleString("tr-TR"),
      guncelleme: duzenleme ? new Date().toLocaleString("tr-TR") : "",
    });
  }

  return (
    <Modal
      baslik={duzenleme ? "İşlemi Düzenle" : "Yeni İşlem"}
      onKapat={onKapat}
      alt={
        <div className="arali" style={{ gap: 8 }}>
          {duzenleme && onSil
            ? <button className="btn tehlike" onClick={function () { onSil(islem); }}>🗑 Sil</button>
            : null}
          <button className={"btn tam " + (f.tip === "gelir" ? "yesil" : "ana")} onClick={kaydet}>
            💾 {duzenleme ? "Güncelle" : "Kaydet"}
          </button>
        </div>
      }
    >
      {islem.kaynak === "tekrar" ? (
        <div className="uyari bilgi">
          ℹ️ Bu kayıt tekrarlayan bir işlemden otomatik oluştu. Burada değiştirdiğin bilgiler yalnızca bu aya işler;
          tutarı kalıcı değiştirmek için Ayarlar → Tekrarlayan İşlemler'i düzenle.
        </div>
      ) : null}

      <div className="cipler" style={{ marginBottom: 14 }}>
        {TURLER.map(function (t) {
          return (
            <button key={t.id}
              className={"cip" + (f.tip === t.id ? " aktif " + t.sinif : "")}
              onClick={function () { tipDegistir(t.id); }}
              style={{ flex: 1, padding: "10px 8px", fontSize: 13 }}>
              {t.ad}
            </button>
          );
        })}
      </div>

      <div className="izgara izgara-2" style={{ marginBottom: 12 }}>
        <div>
          <label className="etiket" htmlFor="gg-tarih">Tarih</label>
          <input id="gg-tarih" className="girdi" type="date" value={f.tarih} onChange={function (e) { set("tarih", e.target.value); }} />
        </div>
        <div>
          <label className="etiket" htmlFor="gg-tutar">Tutar ({simge})</label>
          <input id="gg-tutar" className={"girdi tutar " + (f.tip === "gelir" ? "gelir" : f.tip === "gider" ? "gider" : "notr")}
            type="text" inputMode="decimal" placeholder="0" value={f.tutar}
            onChange={function (e) { set("tutar", e.target.value); }} />
        </div>
      </div>

      {f.tip === "transfer" ? (
        <div className="izgara izgara-2" style={{ marginBottom: 12 }}>
          <div>
            <label className="etiket" htmlFor="gg-kaynak">Çıkan hesap</label>
            <select id="gg-kaynak" className="girdi" value={f.hesapId} onChange={function (e) { set("hesapId", e.target.value); }}>
              {aktifHesaplar.map(function (h) { return <option key={h.id} value={h.id}>{h.ad}</option>; })}
            </select>
          </div>
          <div>
            <label className="etiket" htmlFor="gg-hedef">Giren hesap</label>
            <select id="gg-hedef" className="girdi" value={f.hedefHesapId} onChange={function (e) { set("hedefHesapId", e.target.value); }}>
              {aktifHesaplar.map(function (h) { return <option key={h.id} value={h.id}>{h.ad}</option>; })}
            </select>
          </div>
        </div>
      ) : (
        <>
          <div className="alan">
            <label className="etiket">Kategori</label>
            <div className="cipler">
              {tipKategorileri.map(function (k) {
                const secili = f.kategoriId === k.id;
                return (
                  <button key={k.id} className={"cip" + (secili ? " aktif" : "")} onClick={function () { set("kategoriId", k.id); }}
                    style={secili ? { background: k.renk, borderColor: k.renk, color: "#fff" } : { color: k.renk, borderColor: k.renk + "66" }}>
                    {k.ikon} {k.ad}
                  </button>
                );
              })}
              {tipKategorileri.length === 0
                ? <span className="orta silik">Bu tür için kategori yok — Ayarlar'dan ekleyebilirsin.</span>
                : null}
            </div>
          </div>

          <div className="alan">
            <label className="etiket" htmlFor="gg-hesap">Hesap</label>
            <select id="gg-hesap" className="girdi" value={f.hesapId} onChange={function (e) { set("hesapId", e.target.value); }}>
              {aktifHesaplar.map(function (h) { return <option key={h.id} value={h.id}>{h.ad}</option>; })}
            </select>
          </div>
        </>
      )}

      <div className="alan">
        <label className="etiket" htmlFor="gg-aciklama">Açıklama</label>
        <input id="gg-aciklama" className="girdi" type="text" value={f.aciklama}
          placeholder={f.tip === "gelir" ? "Ör: Mart ayı hizmet bedeli" : f.tip === "gider" ? "Ör: 2 koli malzeme" : "Ör: Kasadan bankaya yatırma"}
          onChange={function (e) { set("aciklama", e.target.value); }} />
      </div>

      {f.tip !== "transfer" ? (
        <>
          <button className="btn hafif k" onClick={function () { set("detayAcik", !f.detayAcik); }} style={{ marginBottom: 12 }}>
            {f.detayAcik ? "▾" : "▸"} Kişi / belge / KDV
          </button>

          {f.detayAcik ? (
            <>
              <div className="izgara izgara-2" style={{ marginBottom: 12 }}>
                <div>
                  <label className="etiket" htmlFor="gg-kisi">Kişi / Firma</label>
                  <input id="gg-kisi" className="girdi" type="text" value={f.kisi} placeholder="Ör: Yılmaz Ticaret"
                    onChange={function (e) { set("kisi", e.target.value); }} />
                </div>
                <div>
                  <label className="etiket" htmlFor="gg-belge">Belge / Fiş No</label>
                  <input id="gg-belge" className="girdi" type="text" value={f.belgeNo} placeholder="Ör: A-1042"
                    onChange={function (e) { set("belgeNo", e.target.value); }} />
                </div>
              </div>

              <div className="alan">
                <label className="etiket">KDV Oranı</label>
                <div className="cipler">
                  {KDV_ORANLARI.map(function (o) {
                    return (
                      <button key={o} className={"cip" + (kdvOran === o ? " aktif" : "")} style={{ flex: 1 }}
                        onClick={function () { set("kdvOran", o); }}>
                        {o === 0 ? "Yok" : "%" + o}
                      </button>
                    );
                  })}
                </div>
                {kdvOran > 0 && tutar > 0 ? (
                  <div className="kucuk silik" style={{ marginTop: 6 }}>
                    KDV hariç <b>{paraYaz(tutar / (1 + kdvOran / 100), simge)}</b> · KDV <b>{paraYaz(tutar - tutar / (1 + kdvOran / 100), simge)}</b>
                  </div>
                ) : null}
              </div>
            </>
          ) : null}
        </>
      ) : null}

      {hata ? <div className="uyari hata">{hata}</div> : null}
    </Modal>
  );
}
