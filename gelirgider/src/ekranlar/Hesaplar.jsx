import React, { useMemo, useState } from 'react'
import { Modal, Onayla, KPI, Bos } from '../bilesenler.jsx'
import { yeniKimlik } from '../depo.js'
import { HESAP_TURLERI, hesapBakiyeleri, paraYaz, sayiOku, suz, toplamlar, bugunIso, donemAralik } from '../finans.js'

function turBilgi(id) {
  for (let i = 0; i < HESAP_TURLERI.length; i++) if (HESAP_TURLERI[i].id === id) return HESAP_TURLERI[i];
  return HESAP_TURLERI[HESAP_TURLERI.length - 1];
}

function HesapFormu({ hesap, onKaydet, onKapat }) {
  const [f, setF] = useState({
    ad: hesap.ad || "",
    tur: hesap.tur || "nakit",
    acilisBakiye: hesap.acilisBakiye ? String(hesap.acilisBakiye).replace(".", ",") : "",
    renk: hesap.renk || "#2563EB",
    aktif: hesap.aktif === false ? false : true,
  });
  const [hata, setHata] = useState("");

  function kaydet() {
    if (!f.ad.trim()) { setHata("Hesap adı gerekli."); return; }
    onKaydet({
      id: hesap.id,
      ad: f.ad.trim(),
      tur: f.tur,
      acilisBakiye: sayiOku(f.acilisBakiye),
      renk: f.renk,
      aktif: !!f.aktif,
    });
  }

  return (
    <Modal baslik={hesap.id ? "Hesabı Düzenle" : "Yeni Hesap"} onKapat={onKapat}
      alt={<button className="btn ana tam" onClick={kaydet}>💾 Kaydet</button>}>
      <div className="alan">
        <label className="etiket" htmlFor="h-ad">Hesap adı</label>
        <input id="h-ad" className="girdi" type="text" value={f.ad} placeholder="Ör: Ziraat vadesiz, Kasa"
          onChange={function (e) { setF(Object.assign({}, f, { ad: e.target.value })); }} />
      </div>
      <div className="alan">
        <label className="etiket">Tür</label>
        <div className="cipler">
          {HESAP_TURLERI.map(function (t) {
            return (
              <button key={t.id} className={"cip" + (f.tur === t.id ? " aktif" : "")}
                onClick={function () { setF(Object.assign({}, f, { tur: t.id })); }}>{t.ikon} {t.ad}</button>
            );
          })}
        </div>
      </div>
      <div className="izgara izgara-2">
        <div className="alan">
          <label className="etiket" htmlFor="h-acilis">Açılış bakiyesi</label>
          <input id="h-acilis" className="girdi" type="text" inputMode="decimal" value={f.acilisBakiye} placeholder="0"
            onChange={function (e) { setF(Object.assign({}, f, { acilisBakiye: e.target.value })); }} />
        </div>
        <div className="alan">
          <label className="etiket" htmlFor="h-renk">Renk</label>
          <input id="h-renk" className="girdi" type="color" value={f.renk} style={{ height: 44, padding: 4 }}
            onChange={function (e) { setF(Object.assign({}, f, { renk: e.target.value })); }} />
        </div>
      </div>
      <label className="onay">
        <input type="checkbox" checked={f.aktif} onChange={function (e) { setF(Object.assign({}, f, { aktif: e.target.checked })); }} />
        <span className="orta">Aktif — yeni işlemlerde seçilebilsin</span>
      </label>
      {hata ? <div className="uyari hata" style={{ marginTop: 12 }}>{hata}</div> : null}
    </Modal>
  );
}

export default function Hesaplar({ veri, guncelle, islemler, simge, islemAc }) {
  const [form, setForm] = useState(null);
  const [silinecek, setSilinecek] = useState(null);
  const bugun = bugunIso();

  const bakiyeler = useMemo(function () { return hesapBakiyeleri(veri.hesaplar, islemler); }, [veri.hesaplar, islemler]);
  const varlik = bakiyeler.reduce(function (s, h) { return s + h.bakiye; }, 0);

  const ayAralik = useMemo(function () { return donemAralik("ay", bugun); }, [bugun]);
  const ayIslemleri = useMemo(function () { return suz(islemler, { bas: ayAralik.bas, bit: ayAralik.bit }); }, [islemler, ayAralik]);
  const ayOzet = useMemo(function () { return toplamlar(ayIslemleri); }, [ayIslemleri]);

  // Hesap başına bu ayki hareket sayısı — silmeden önce uyarmak için de gerekli
  const hareketSayisi = useMemo(function () {
    const h = {};
    islemler.forEach(function (i) {
      h[i.hesapId] = (h[i.hesapId] || 0) + 1;
      if (i.hedefHesapId) h[i.hedefHesapId] = (h[i.hedefHesapId] || 0) + 1;
    });
    return h;
  }, [islemler]);

  function hesapKaydet(gelen) {
    const id = gelen.id || yeniKimlik("h");
    guncelle(function (o) {
      const liste = o.hesaplar.slice();
      const idx = liste.findIndex(function (x) { return String(x.id) === String(id); });
      const kayit = Object.assign({}, gelen, { id: id });
      if (idx >= 0) liste[idx] = kayit; else liste.push(kayit);
      return Object.assign({}, o, { hesaplar: liste });
    });
    setForm(null);
  }

  function hesapSil(hesap) {
    guncelle(function (o) {
      return Object.assign({}, o, { hesaplar: o.hesaplar.filter(function (x) { return String(x.id) !== String(hesap.id); }) });
    });
    setSilinecek(null);
  }

  return (
    <>
      <div className="izgara izgara-oto" style={{ marginBottom: 12 }}>
        <KPI ikon="👛" baslik="Toplam Varlık" deger={<span className={varlik >= 0 ? "notr" : "gider"}>{paraYaz(varlik, simge)}</span>}
          alt={bakiyeler.length + " hesap"} />
        <KPI ikon="💰" baslik="Bu Ay Giren" deger={<span className="gelir">{paraYaz(ayOzet.gelir, simge)}</span>} alt={ayAralik.etiket} />
        <KPI ikon="💸" baslik="Bu Ay Çıkan" deger={<span className="gider">{paraYaz(ayOzet.gider, simge)}</span>} alt={ayAralik.etiket} />
      </div>

      <div className="arali-dolgu" style={{ marginBottom: 10 }}>
        <span className="bolum-baslik" style={{ margin: 0 }}>Hesaplar</span>
        <div className="arali">
          <button className="btn hafif k" onClick={function () { islemAc({ tip: "transfer", tarih: bugun }); }}>🔄 Transfer</button>
          <button className="btn ana k" onClick={function () { setForm({}); }}>➕ Hesap</button>
        </div>
      </div>

      {bakiyeler.length === 0 ? (
        <Bos resim="👛" baslik="Hesap yok" metin="Nakit kasan ve banka hesapların için birer kayıt açarsan paranın nerede olduğunu da takip edebilirsin." />
      ) : bakiyeler.map(function (h) {
        const t = turBilgi(h.tur);
        return (
          <div key={h.id} className="kart" style={{ display: "flex", alignItems: "center", gap: 12, opacity: h.aktif === false ? 0.6 : 1 }}>
            <div className="rozet" style={{ color: h.renk }}>{t.ikon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="kalin">{h.ad}{h.aktif === false ? " (pasif)" : ""}</div>
              <div className="kucuk silik" style={{ marginTop: 2 }}>
                {t.ad} · {hareketSayisi[h.id] || 0} hareket
                {h.acilisBakiye ? " · açılış " + paraYaz(h.acilisBakiye, simge) : ""}
              </div>
            </div>
            <div className="sag">
              <div className={"kalin " + (h.bakiye >= 0 ? "" : "gider")} style={{ fontSize: 16 }}>{paraYaz(h.bakiye, simge)}</div>
              <div className="arali" style={{ justifyContent: "flex-end", marginTop: 5, gap: 5 }}>
                <button className="btn hafif k" onClick={function () { setForm(h); }}>✏️</button>
                <button className="btn tehlike k" onClick={function () { setSilinecek(h); }}>🗑</button>
              </div>
            </div>
          </div>
        );
      })}

      {form ? <HesapFormu hesap={form} onKaydet={hesapKaydet} onKapat={function () { setForm(null); }} /> : null}

      {silinecek ? (
        <Onayla
          baslik="Hesap silinsin mi?"
          tehlike
          onayMetni="Sil"
          metin={
            (hareketSayisi[silinecek.id] || 0) > 0
              ? "\"" + silinecek.ad + "\" hesabında " + hareketSayisi[silinecek.id] + " hareket var. Hesabı silersen bu işlemler defterde kalır ama hesapsız görünür ve bakiyeye girmez. Bunun yerine hesabı pasife almak isteyebilirsin."
              : "\"" + silinecek.ad + "\" hesabı silinecek."
          }
          onOnay={function () { hesapSil(silinecek); }}
          onKapat={function () { setSilinecek(null); }}
        />
      ) : null}
    </>
  );
}
