import React, { useRef, useState } from 'react'
import { Modal, Onayla } from '../bilesenler.jsx'
import { yeniKimlik, yedekMetni, yedektenOku, dosyaIndir, bosVeri } from '../depo.js'
import {
  PERIYOTLAR, GUN_ADLARI, tekrarlarıUret, tekrarTarihleri, islemSirala,
  paraYaz, sayiOku, bugunIso, trTarih, ayEtiket,
} from '../finans.js'

const IKONLAR = ["💼", "🧾", "🛠️", "🏢", "📈", "🛒", "📦", "👷", "🏠", "🏛️", "⛽", "🍽️", "🚐", "🧰", "💡", "📱", "🎓", "🎁", "🩺", "✈️", "➕", "➖"];
const RENKLER = ["#16A34A", "#22C55E", "#0EA5E9", "#2563EB", "#7C3AED", "#DB2777", "#DC2626", "#EA580C", "#CA8A04", "#64748B"];

function KategoriFormu({ kategori, onKaydet, onKapat }) {
  const [f, setF] = useState({
    ad: kategori.ad || "",
    tip: kategori.tip || "gider",
    ikon: kategori.ikon || "📦",
    renk: kategori.renk || "#64748B",
  });
  const [hata, setHata] = useState("");

  return (
    <Modal baslik={kategori.id ? "Kategoriyi Düzenle" : "Yeni Kategori"} onKapat={onKapat}
      alt={<button className="btn ana tam" onClick={function () {
        if (!f.ad.trim()) { setHata("Kategori adı gerekli."); return; }
        onKaydet({ id: kategori.id, ad: f.ad.trim(), tip: f.tip, ikon: f.ikon, renk: f.renk });
      }}>💾 Kaydet</button>}>
      <div className="cipler" style={{ marginBottom: 14 }}>
        {[{ id: "gider", ad: "💸 Gider", s: "gider-secim" }, { id: "gelir", ad: "💰 Gelir", s: "gelir-secim" }].map(function (t) {
          return (
            <button key={t.id} className={"cip" + (f.tip === t.id ? " aktif " + t.s : "")} style={{ flex: 1, padding: "10px 8px" }}
              onClick={function () { setF(Object.assign({}, f, { tip: t.id })); }}>{t.ad}</button>
          );
        })}
      </div>
      <div className="alan">
        <label className="etiket" htmlFor="k-ad">Ad</label>
        <input id="k-ad" className="girdi" type="text" value={f.ad} placeholder="Ör: Nakliye"
          onChange={function (e) { setF(Object.assign({}, f, { ad: e.target.value })); }} />
      </div>
      <div className="alan">
        <label className="etiket">Simge</label>
        <div className="cipler">
          {IKONLAR.map(function (i) {
            return <button key={i} className={"cip" + (f.ikon === i ? " aktif" : "")} style={{ fontSize: 17, padding: "6px 10px" }}
              onClick={function () { setF(Object.assign({}, f, { ikon: i })); }}>{i}</button>;
          })}
        </div>
      </div>
      <div className="alan">
        <label className="etiket">Renk</label>
        <div className="cipler">
          {RENKLER.map(function (r) {
            return <button key={r} className="cip" onClick={function () { setF(Object.assign({}, f, { renk: r })); }}
              style={{ background: r, borderColor: f.renk === r ? "var(--yazi)" : r, width: 34, height: 30 }} aria-label={"Renk " + r} />;
          })}
        </div>
      </div>
      {hata ? <div className="uyari hata">{hata}</div> : null}
    </Modal>
  );
}

function TekrarFormu({ tekrar, kategoriler, hesaplar, simge, onKaydet, onKapat }) {
  const [f, setF] = useState({
    tip: tekrar.tip || "gider",
    ad: tekrar.ad || "",
    tutar: tekrar.tutar ? String(tekrar.tutar).replace(".", ",") : "",
    kategoriId: tekrar.kategoriId || "",
    hesapId: tekrar.hesapId || (hesaplar[0] ? hesaplar[0].id : ""),
    periyot: tekrar.periyot || "aylik",
    gun: tekrar.gun === undefined ? 1 : tekrar.gun,
    baslangic: tekrar.baslangic || bugunIso().slice(0, 7) + "-01",
    bitis: tekrar.bitis || "",
    aktif: tekrar.aktif === false ? false : true,
  });
  const [hata, setHata] = useState("");
  const kategoriSecenek = kategoriler.filter(function (k) { return k.tip === f.tip; });

  function kaydet() {
    if (!f.ad.trim()) { setHata("Ad gerekli."); return; }
    if (sayiOku(f.tutar) <= 0) { setHata("Tutar sıfırdan büyük olmalı."); return; }
    if (!f.kategoriId) { setHata("Kategori seçin."); return; }
    if (!f.hesapId) { setHata("Hesap seçin."); return; }
    if (f.bitis && f.bitis < f.baslangic) { setHata("Bitiş tarihi başlangıçtan önce olamaz."); return; }
    onKaydet({
      id: tekrar.id,
      tip: f.tip, ad: f.ad.trim(), tutar: sayiOku(f.tutar),
      kategoriId: f.kategoriId, hesapId: f.hesapId,
      periyot: f.periyot, gun: f.gun,
      baslangic: f.baslangic, bitis: f.bitis, aktif: !!f.aktif,
    });
  }

  const onizleme = tekrarTarihleri(Object.assign({}, f, { tutar: sayiOku(f.tutar) }), bugunIso()).slice(-3);

  return (
    <Modal baslik={tekrar.id ? "Tekrarı Düzenle" : "Yeni Tekrarlayan"} onKapat={onKapat}
      alt={<button className="btn ana tam" onClick={kaydet}>💾 Kaydet</button>}>
      <div className="uyari bilgi">
        Kira, maaş, abonelik gibi düzenli kalemleri bir kez tanımla; uygulama her dönem defterine kendisi işler.
        Geçmiş dönemlerin eksikleri de tamamlanır, ileri tarihli kayıt oluşturulmaz.
      </div>

      <div className="cipler" style={{ marginBottom: 14 }}>
        {[{ id: "gider", ad: "💸 Gider", s: "gider-secim" }, { id: "gelir", ad: "💰 Gelir", s: "gelir-secim" }].map(function (t) {
          return (
            <button key={t.id} className={"cip" + (f.tip === t.id ? " aktif " + t.s : "")} style={{ flex: 1, padding: "10px 8px" }}
              onClick={function () { setF(Object.assign({}, f, { tip: t.id, kategoriId: "" })); }}>{t.ad}</button>
          );
        })}
      </div>

      <div className="izgara izgara-2" style={{ marginBottom: 12 }}>
        <div>
          <label className="etiket" htmlFor="t-ad">Ad</label>
          <input id="t-ad" className="girdi" type="text" value={f.ad} placeholder="Ör: Dükkân kirası"
            onChange={function (e) { setF(Object.assign({}, f, { ad: e.target.value })); }} />
        </div>
        <div>
          <label className="etiket" htmlFor="t-tutar">Tutar ({simge})</label>
          <input id="t-tutar" className="girdi" type="text" inputMode="decimal" value={f.tutar} placeholder="0"
            onChange={function (e) { setF(Object.assign({}, f, { tutar: e.target.value })); }} />
        </div>
      </div>

      <div className="alan">
        <label className="etiket">Kategori</label>
        <select className="girdi" value={f.kategoriId} onChange={function (e) { setF(Object.assign({}, f, { kategoriId: e.target.value })); }}>
          <option value="">— Seç —</option>
          {kategoriSecenek.map(function (k) { return <option key={k.id} value={k.id}>{k.ikon + " " + k.ad}</option>; })}
        </select>
      </div>

      <div className="alan">
        <label className="etiket">Hesap</label>
        <select className="girdi" value={f.hesapId} onChange={function (e) { setF(Object.assign({}, f, { hesapId: e.target.value })); }}>
          {hesaplar.map(function (h) { return <option key={h.id} value={h.id}>{h.ad}</option>; })}
        </select>
      </div>

      <div className="alan">
        <label className="etiket">Sıklık</label>
        <div className="cipler">
          {PERIYOTLAR.map(function (p) {
            return (
              <button key={p.id} className={"cip" + (f.periyot === p.id ? " aktif" : "")}
                onClick={function () {
                  setF(Object.assign({}, f, { periyot: p.id, gun: p.id === "haftalik" ? 1 : p.id === "yillik" ? "01-01" : 1 }));
                }}>{p.ad}</button>
            );
          })}
        </div>
      </div>

      <div className="alan">
        {f.periyot === "aylik" ? (
          <>
            <label className="etiket" htmlFor="t-gun">Ayın kaçıncı günü</label>
            <input id="t-gun" className="girdi" type="number" min="1" max="28" value={f.gun}
              onChange={function (e) { setF(Object.assign({}, f, { gun: e.target.value })); }} />
          </>
        ) : f.periyot === "haftalik" ? (
          <>
            <label className="etiket">Haftanın günü</label>
            <select className="girdi" value={f.gun} onChange={function (e) { setF(Object.assign({}, f, { gun: parseInt(e.target.value, 10) })); }}>
              {GUN_ADLARI.map(function (g, i) { return <option key={g} value={i}>{g}</option>; })}
            </select>
          </>
        ) : (
          <>
            <label className="etiket" htmlFor="t-yil-gun">Her yıl (AA-GG)</label>
            <input id="t-yil-gun" className="girdi" type="text" value={f.gun} placeholder="01-15"
              onChange={function (e) { setF(Object.assign({}, f, { gun: e.target.value })); }} />
          </>
        )}
      </div>

      <div className="izgara izgara-2" style={{ marginBottom: 12 }}>
        <div>
          <label className="etiket" htmlFor="t-bas">Başlangıç</label>
          <input id="t-bas" className="girdi" type="date" value={f.baslangic}
            onChange={function (e) { setF(Object.assign({}, f, { baslangic: e.target.value })); }} />
        </div>
        <div>
          <label className="etiket" htmlFor="t-bit">Bitiş (boş = süresiz)</label>
          <input id="t-bit" className="girdi" type="date" value={f.bitis}
            onChange={function (e) { setF(Object.assign({}, f, { bitis: e.target.value })); }} />
        </div>
      </div>

      <label className="onay">
        <input type="checkbox" checked={f.aktif} onChange={function (e) { setF(Object.assign({}, f, { aktif: e.target.checked })); }} />
        <span className="orta">Aktif — her dönem otomatik işlensin</span>
      </label>

      {onizleme.length > 0 ? (
        <div className="kucuk silik" style={{ marginTop: 10 }}>
          Son oluşacak tarihler: {onizleme.map(trTarih).join(" · ")}
        </div>
      ) : null}

      {hata ? <div className="uyari hata" style={{ marginTop: 12 }}>{hata}</div> : null}
    </Modal>
  );
}

export default function Ayarlar({ veri, guncelle, islemler, simge }) {
  const [kategoriForm, setKategoriForm] = useState(null);
  const [tekrarForm, setTekrarForm] = useState(null);
  const [silinecekKategori, setSilinecekKategori] = useState(null);
  const [sifirlaOnay, setSifirlaOnay] = useState(false);
  const [geriBildirim, setGeriBildirim] = useState(null);
  const dosyaGirdi = useRef(null);

  const kullanim = {};
  islemler.forEach(function (i) { if (i.kategoriId) kullanim[i.kategoriId] = (kullanim[i.kategoriId] || 0) + 1; });

  function kategoriKaydet(gelen) {
    const id = gelen.id || yeniKimlik("k");
    guncelle(function (o) {
      const liste = o.kategoriler.slice();
      const idx = liste.findIndex(function (x) { return String(x.id) === String(id); });
      const kayit = Object.assign({}, gelen, { id: id });
      if (idx >= 0) liste[idx] = kayit; else liste.push(kayit);
      return Object.assign({}, o, { kategoriler: liste });
    });
    setKategoriForm(null);
  }

  function kategoriSil(k) {
    guncelle(function (o) {
      return Object.assign({}, o, {
        kategoriler: o.kategoriler.filter(function (x) { return String(x.id) !== String(k.id); }),
        butceler: o.butceler.filter(function (b) { return String(b.kategoriId) !== String(k.id); }),
      });
    });
    setSilinecekKategori(null);
  }

  function tekrarKaydet(gelen) {
    const id = gelen.id || yeniKimlik("t");
    guncelle(function (o) {
      const liste = o.tekrarlar.slice();
      const idx = liste.findIndex(function (x) { return String(x.id) === String(id); });
      const kayit = Object.assign({}, gelen, { id: id });
      if (idx >= 0) liste[idx] = kayit; else liste.push(kayit);
      const yeniVeri = Object.assign({}, o, { tekrarlar: liste });
      // Yeni/güncellenen tekrarın geçmiş dönemlerini hemen işle
      const uretilen = tekrarlarıUret([kayit], yeniVeri.islemler, bugunIso());
      return uretilen.length
        ? Object.assign({}, yeniVeri, { islemler: islemSirala(yeniVeri.islemler.concat(uretilen)) })
        : yeniVeri;
    });
    setTekrarForm(null);
  }

  function tekrarSil(t) {
    guncelle(function (o) {
      return Object.assign({}, o, { tekrarlar: o.tekrarlar.filter(function (x) { return String(x.id) !== String(t.id); }) });
    });
  }

  function yedekAl() {
    dosyaIndir("gelirgider-yedek-" + bugunIso() + ".json", yedekMetni(veri));
    setGeriBildirim({ tur: "bilgi", metin: "Yedek dosyası indirildi. Güvenli bir yerde sakla." });
  }

  function dosyaSecildi(e) {
    const dosya = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!dosya) return;
    const okuyucu = new FileReader();
    okuyucu.onload = function () {
      try {
        const yeni = yedektenOku(String(okuyucu.result));
        guncelle(function () { return yeni; });
        setGeriBildirim({ tur: "bilgi", metin: "Yedek geri yüklendi: " + yeni.islemler.length + " işlem, " + yeni.hesaplar.length + " hesap." });
      } catch (hata) {
        setGeriBildirim({ tur: "hata", metin: "Dosya okunamadı: " + hata.message });
      }
    };
    okuyucu.onerror = function () { setGeriBildirim({ tur: "hata", metin: "Dosya okunamadı." }); };
    okuyucu.readAsText(dosya);
  }

  const gelirKategorileri = veri.kategoriler.filter(function (k) { return k.tip === "gelir"; });
  const giderKategorileri = veri.kategoriler.filter(function (k) { return k.tip === "gider"; });

  return (
    <>
      {geriBildirim ? <div className={"uyari " + (geriBildirim.tur === "hata" ? "hata" : "bilgi")}>{geriBildirim.metin}</div> : null}

      <div className="kart">
        <div className="kart-baslik">🏷️ Defter</div>
        <div className="izgara izgara-2">
          <div>
            <label className="etiket" htmlFor="a-isim">İşletme / defter adı</label>
            <input id="a-isim" className="girdi" type="text" value={veri.ayarlar.isim} placeholder="Ör: Asis Asansör"
              onChange={function (e) {
                const v = e.target.value;
                guncelle(function (o) { return Object.assign({}, o, { ayarlar: Object.assign({}, o.ayarlar, { isim: v }) }); });
              }} />
          </div>
          <div>
            <label className="etiket" htmlFor="a-simge">Para simgesi</label>
            <input id="a-simge" className="girdi" type="text" maxLength={4} value={veri.ayarlar.paraSimgesi}
              onChange={function (e) {
                const v = e.target.value;
                guncelle(function (o) { return Object.assign({}, o, { ayarlar: Object.assign({}, o.ayarlar, { paraSimgesi: v }) }); });
              }} />
          </div>
        </div>
        <div className="alan" style={{ marginTop: 12, marginBottom: 0 }}>
          <label className="etiket">Tema</label>
          <div className="cipler">
            {[{ id: "koyu", ad: "🌙 Koyu" }, { id: "acik", ad: "☀️ Açık" }].map(function (t) {
              return (
                <button key={t.id} className={"cip" + (veri.ayarlar.tema === t.id ? " aktif" : "")}
                  onClick={function () {
                    guncelle(function (o) { return Object.assign({}, o, { ayarlar: Object.assign({}, o.ayarlar, { tema: t.id }) }); });
                  }}>{t.ad}</button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="kart">
        <div className="arali-dolgu" style={{ marginBottom: 10 }}>
          <span className="kart-baslik" style={{ margin: 0 }}>🔁 Tekrarlayan İşlemler</span>
          <button className="btn ana k" onClick={function () { setTekrarForm({}); }}>➕ Ekle</button>
        </div>
        {veri.tekrarlar.length === 0 ? (
          <div className="orta silik">Tanımlı yok. Kira, maaş, abonelik gibi düzenli kalemleri buraya ekleyebilirsin.</div>
        ) : veri.tekrarlar.map(function (t) {
          const k = veri.kategoriler.find(function (x) { return x.id === t.kategoriId; });
          const periyot = PERIYOTLAR.find(function (p) { return p.id === t.periyot; });
          return (
            <div key={t.id} className="satir" style={{ opacity: t.aktif === false ? 0.55 : 1 }}>
              <div className="rozet" style={{ color: k ? k.renk : "var(--yazi-silik)" }}>{k ? k.ikon : "🔁"}</div>
              <div className="govde">
                <div className="ad">{t.ad}{t.aktif === false ? " (pasif)" : ""}</div>
                <div className="aciklama">
                  <span>{(k ? k.ad : "Kategorisiz") + " · " + (periyot ? periyot.ad : t.periyot)}</span>
                  <span>· {t.baslangic ? ayEtiket(t.baslangic.slice(0, 7)) : ""}{t.bitis ? " – " + ayEtiket(t.bitis.slice(0, 7)) : " –"}</span>
                </div>
              </div>
              <div className="sag">
                <div className={"tutar " + (t.tip === "gelir" ? "gelir" : "gider")}>{paraYaz(t.tutar, simge)}</div>
                <div className="arali" style={{ justifyContent: "flex-end", marginTop: 4, gap: 5 }}>
                  <button className="btn hafif k" onClick={function () { setTekrarForm(t); }}>✏️</button>
                  <button className="btn tehlike k" onClick={function () { tekrarSil(t); }}>🗑</button>
                </div>
              </div>
            </div>
          );
        })}
        {veri.tekrarlar.length > 0 ? (
          <div className="kucuk silik" style={{ marginTop: 10 }}>
            Silmek yalnızca tanımı kaldırır; daha önce oluşmuş kayıtlar defterde durmaya devam eder.
          </div>
        ) : null}
      </div>

      <div className="kart">
        <div className="arali-dolgu" style={{ marginBottom: 10 }}>
          <span className="kart-baslik" style={{ margin: 0 }}>🗂️ Kategoriler</span>
          <button className="btn ana k" onClick={function () { setKategoriForm({}); }}>➕ Ekle</button>
        </div>
        {[{ baslik: "Gelir", liste: gelirKategorileri }, { baslik: "Gider", liste: giderKategorileri }].map(function (grup) {
          return (
            <div key={grup.baslik}>
              <div className="bolum-baslik">{grup.baslik}</div>
              <div className="cipler">
                {grup.liste.map(function (k) {
                  return (
                    <span key={k.id} className="cip" style={{ color: k.renk, borderColor: k.renk + "66", display: "inline-flex", gap: 6, alignItems: "center" }}>
                      <button onClick={function () { setKategoriForm(k); }}
                        style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", font: "inherit", padding: 0 }}>
                        {k.ikon} {k.ad}
                      </button>
                      <button onClick={function () { setSilinecekKategori(k); }} aria-label={k.ad + " kategorisini sil"}
                        style={{ background: "none", border: "none", color: "var(--yazi-silik)", cursor: "pointer", padding: 0 }}>✕</button>
                    </span>
                  );
                })}
                {grup.liste.length === 0 ? <span className="orta silik">Kategori yok</span> : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className="kart">
        <div className="kart-baslik">💾 Yedekleme</div>
        <div className="orta soluk" style={{ lineHeight: 1.6, marginBottom: 12 }}>
          Veriler yalnızca bu cihazda, tarayıcının deposunda tutuluyor — hiçbir sunucuya gönderilmiyor.
          Tarayıcı verisini temizlersen defter de silinir, bu yüzden ara ara yedek al.
        </div>
        <div className="izgara izgara-2">
          <button className="btn ana" onClick={yedekAl}>📥 Yedek al</button>
          <button className="btn hafif" onClick={function () { dosyaGirdi.current && dosyaGirdi.current.click(); }}>📤 Geri yükle</button>
        </div>
        <input ref={dosyaGirdi} type="file" accept="application/json,.json" onChange={dosyaSecildi} style={{ display: "none" }} />
        <div className="kucuk silik" style={{ marginTop: 10 }}>
          Geri yükleme mevcut defterin yerine geçer. {veri.islemler.length} işlem · {veri.hesaplar.length} hesap · {veri.kategoriler.length} kategori
          {veri.ayarlar.sonKayit ? " · son değişiklik " + new Date(veri.ayarlar.sonKayit).toLocaleString("tr-TR") : ""}
        </div>
      </div>

      <div className="kart">
        <div className="kart-baslik">🧨 Tehlikeli Bölge</div>
        <button className="btn tehlike tam" onClick={function () { setSifirlaOnay(true); }}>Tüm veriyi sil ve sıfırdan başla</button>
      </div>

      {kategoriForm ? <KategoriFormu kategori={kategoriForm} onKaydet={kategoriKaydet} onKapat={function () { setKategoriForm(null); }} /> : null}

      {tekrarForm ? (
        <TekrarFormu tekrar={tekrarForm} kategoriler={veri.kategoriler} hesaplar={veri.hesaplar} simge={simge}
          onKaydet={tekrarKaydet} onKapat={function () { setTekrarForm(null); }} />
      ) : null}

      {silinecekKategori ? (
        <Onayla baslik="Kategori silinsin mi?" tehlike onayMetni="Sil"
          metin={
            (kullanim[silinecekKategori.id] || 0) > 0
              ? "\"" + silinecekKategori.ad + "\" kategorisinde " + kullanim[silinecekKategori.id] + " işlem var. Kategori silinirse bu işlemler defterde kalır ama \"Kategorisiz\" görünür."
              : "\"" + silinecekKategori.ad + "\" kategorisi silinecek."
          }
          onOnay={function () { kategoriSil(silinecekKategori); }}
          onKapat={function () { setSilinecekKategori(null); }} />
      ) : null}

      {sifirlaOnay ? (
        <Onayla baslik="Her şey silinecek" tehlike onayMetni="Evet, sil"
          metin={"Tüm işlemler, hesaplar, kategoriler ve tekrarlayan tanımlar silinecek ve uygulama ilk günkü hâline dönecek. Bu işlem geri alınamaz — önce yedek almak isteyebilirsin."}
          onOnay={function () {
            guncelle(function () { return bosVeri(); });
            setSifirlaOnay(false);
            setGeriBildirim({ tur: "bilgi", metin: "Defter sıfırlandı." });
          }}
          onKapat={function () { setSifirlaOnay(false); }} />
      ) : null}
    </>
  );
}
