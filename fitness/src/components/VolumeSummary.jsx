import React from "react";
import { volumeRows, TARGET_MIN, TARGET_MAX } from "../data/volume";
import { tensionMix } from "../data/tension";
import { REGIONS } from "../data/exercises";

const REGION_NAME = {};
REGIONS.forEach((r) => { REGION_NAME[r.id] = r.name; });

// Kas grubuna özel "neden dolaylı yetmez" açıklaması (bkz. docs/dolayli-hacim.md)
const HINT = {
  triceps: "(uzun baş preslerde hiç büyümüyor)",
  biceps: "(omuz fleksiyon görevi çekişlerde yüklenmiyor)",
  hamstring: "(çift bacak squat hamstringde anlamlı hipertrofi üretmiyor)",
  yanDeltoid: "(yan deltoid preslerde çalışmaz)",
  arkaDeltoid: "(arka deltoid preslerde çalışmaz)",
  baldir: "(baldır squat'ta sabitler, boyu değişmez)",
};

const COLOR = {
  none: "var(--line)",
  low:  "var(--attn)",
  // "thin" = toplam yeterli ama doğrudan set yok/az. Bilerek "low" ile AYNI
  // amber: beşinci bir renk eklemek paleti gürültüye boğardı. Ayrımı metin
  // ("· dolaylı") ve çubuktaki soluk parça taşıyor.
  thin: "var(--attn)",
  ok:   "var(--accent)",
  high: "var(--attn2)",
};

// Sayıyı gereksiz ondalıksız yaz: 13.5 → "13,5", 12.0 → "12"
const num = (n) => String(Math.round(n * 2) / 2).replace(".", ",");

// 📊 Haftalık kas grubu hacmi özeti — "omuz 10 set · göğüs 15 set" gibi.
// days: [{exercises, sets}] — tek program için [program] gönder.
// Hareket eklendikçe/çıktıkça anında güncellenir (saf hesap, state yok).
export default function VolumeSummary({ days, title = "Haftalık Hacim (set/kas)", compact = false, showTension = true }) {
  const list = Array.isArray(days) ? days : [days];
  const rows = volumeRows(list);
  const active = rows.filter((r) => r.sets > 0);
  const allIds = list.flatMap((d) => (d && d.exercises) || []);
  const mix = tensionMix(allIds);

  if (active.length === 0) {
    return (
      <div style={{ color: "var(--muted)", fontSize: 12 }}>
        Hareket ekledikçe haftalık set dağılımı burada görünecek.
      </div>
    );
  }

  const low = active.filter((r) => r.level === "low");
  // Toplamı yeterli ama doğrudan seti eksik olanlar — ayrı uyarı alır.
  // Bunlar "low" listesine GİRMEMELİ: oradaki metin "bu bölgeye hareket ekle"
  // diyor ve kullanıcı daha fazla pres ekleyerek sorunu büyütebilir.
  const thin = active.filter((r) => r.level === "thin");

  // Kompakt: tek satır rozetler (ör. program kartı içinde)
  if (compact) {
    return (
      <div>
        <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>
          {active.map((r) => (
            <span key={r.id} style={{
              fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 999,
              background: "var(--card2)", color: COLOR[r.level],
            }}>
              {r.emoji} {r.name} {num(r.direct)}{r.indirect > 0 ? "+" + num(r.indirect) : ""}
            </span>
          ))}
        </div>
        <div style={{ color: "var(--muted)", fontSize: 10, marginTop: 4 }}>sayı = doğrudan + dolaylı</div>
      </div>
    );
  }

  const max = Math.max(TARGET_MAX, ...active.map((r) => r.sets));

  return (
    <div>
      {title && <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>{title}</div>}
      {rows.map((r, i) => (
        <div key={r.id} style={{ marginBottom: 8 }}>
          {/* Kas grupları bölge başlığı altında gruplanır — 14 satır düz liste
              olarak okunmuyordu. */}
          {(i === 0 || rows[i - 1].region !== r.region) && (
            <div style={{ color: "var(--muted)", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginTop: i === 0 ? 0 : 10, marginBottom: 4 }}>
              {REGION_NAME[r.region] || r.region}
            </div>
          )}
          <div className="row" style={{ justifyContent: "space-between", fontSize: 12, marginBottom: 3, gap: 6, flexWrap: "nowrap" }}>
            <span style={{ color: r.sets === 0 ? "var(--muted)" : "var(--text)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.emoji} {r.name}</span>
            {/* Başlık sayı DOĞRUDAN settir. Dolaylı katkı ayrı ve soluk yazılır —
                "13,5 set" tek parça gösterilince kullanıcı 13,5 kol hareketi
                yaptığını sanıyordu. */}
            {/* "· dolaylı" eki yazmıyoruz: "+ 13,5 dolaylı" zaten aynı şeyi
                söylüyor ve satırı taşırıyordu. ⚠ hem kısa hem renk körlüğünde
                da okunur. */}
            <span style={{ fontWeight: 700, color: COLOR[r.level], flexShrink: 0, whiteSpace: "nowrap" }}>
              {num(r.direct)} set
              {r.indirect > 0 && (
                <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: 11 }}>
                  {" + " + num(r.indirect) + " dolaylı"}
                </span>
              )}
              {r.level === "low" ? " · az" : r.level === "thin" ? " ⚠" : ""}
            </span>
          </div>
          <div style={{ position: "relative", height: 8, background: "var(--card2)", borderRadius: 999, display: "flex", overflow: "hidden" }}>
            {/* İki parça: dolu = doğrudan, soluk = dolaylı. "Bu çubuğun çoğu
                hayalet" görüntüsü, sayının tek başına yapamadığı işi yapıyor. */}
            <div style={{ width: Math.min(100, (r.direct / max) * 100) + "%", height: "100%", background: COLOR[r.level] }} />
            <div style={{ width: Math.min(100, (r.indirect / max) * 100) + "%", height: "100%", background: COLOR[r.level], opacity: 0.35 }} />
            {/* Bölgenin etkili alt eşiği (karın için 6, diğerleri 10) */}
            <div title={r.min + " set — etkili alt eşik"} style={{
              position: "absolute", top: -2, bottom: -2,
              left: (r.min / max) * 100 + "%",
              width: 2, background: "var(--text)", opacity: 0.45, borderRadius: 2,
            }} />
            {/* Doğrudan set alt sınırı — yalnız kol/omuz gibi ayrı sınırı olan bölgelerde */}
            {r.directMin !== r.min && (
              <div title={r.directMin + " doğrudan set — alt sınır"} style={{
                position: "absolute", top: 0, bottom: 0,
                left: (r.directMin / max) * 100 + "%",
                width: 1.5, background: "var(--text)", opacity: 0.3,
              }} />
            )}
          </div>
        </div>
      ))}

      <div style={{ color: "var(--muted)", fontSize: 10, marginTop: 6 }}>
        Koyu = doğrudan set · soluk = dolaylı (bileşik hareketlerden)
        <br />🟡 az / dolaylı ağırlıklı · 🟢 ideal ({TARGET_MIN}-{TARGET_MAX}) · 🟠 yüksek · dikey çizgi = alt eşik
        <br />Hacim kas grubu başına sayılır: "bacak" yerine quad, arka bacak ve kalça ayrı ayrı.
      </div>

      {low.length > 0 && (
        <p style={{ color: "var(--attn)", fontSize: 11.5, marginTop: 8, marginBottom: 0 }}>
          {/* En eksik 3 tanesi yazılır; 14 kas grubunu tek tek listelemek
              okunmaz bir duvar oluşturuyordu. */}
          ⚠️ {low.slice()
                .sort((a, b) => (a.sets / a.min) - (b.sets / b.min))
                .slice(0, 3)
                .map((r) => `${r.name} (${num(r.sets)}/${r.min})`).join(", ")}
          {low.length > 3 ? ` ve ${low.length - 3} kas daha` : ""} eşiğin altında.
          Hipertrofi hedefliyorsan bu kaslara hareket/set ekle.
        </p>
      )}

      {thin.map((r) => (
        <p key={r.id} style={{ color: "var(--attn)", fontSize: 11.5, marginTop: 8, marginBottom: 0, lineHeight: 1.6 }}>
          ⚠️ <b>{r.name}</b>: {num(r.sets)} setin <b>tamamı</b> bileşik hareketlerden <b>dolaylı</b> geliyor —
          bu kası doğrudan çalıştıran tek bir hareket yok. Dolaylı yük doğrudan setin yaklaşık yarısı
          sayılır ve kasın bazı bölümlerine hiç ulaşmaz{HINT[r.id] ? " " + HINT[r.id] : ""}.
          Programa <b>{r.name.toLowerCase()}</b> için doğrudan bir hareket ekle.
        </p>
      ))}

      {showTension && (
        <p style={{ color: mix.hasStretch ? "var(--muted)" : "var(--attn)", fontSize: 11.5, marginTop: 8, marginBottom: 0 }}>
          {mix.hasStretch
            ? `🔵 Gerilme (uzun boy) hareketi: ${mix.uzun} · ⚪ orta: ${mix.orta} · 🟠 kasılma: ${mix.kisa}`
            : "⚠️ Programda kası gerilmiş boyda yükleyen hareket yok. Hipertrofi için her kasa en az bir gerilme hareketi ekle."}
        </p>
      )}

      <p style={{ color: "var(--muted)", fontSize: 10.5, marginTop: 6, marginBottom: 0, lineHeight: 1.6 }}>
        Not: Bileşik hareketlerin yardımcı kaslara katkısı <b>yarım set</b>, bazı hareketlerde
        <b> çeyrek set</b> sayılır (bench press → omuz/kol yarım; face pull → kol çeyrek).
        Bu bir <b>ölçüm</b> yöntemidir; program tasarımında her bölgenin ayrıca <b>doğrudan</b> seti olmalıdır.
      </p>
    </div>
  );
}
