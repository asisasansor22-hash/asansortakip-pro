import React, { useState, useMemo } from "react";
import { getExercise } from "../data/exercises";
import { substitutesFor } from "../data/muscles";
import ExerciseAnimation from "./ExerciseAnimation";
import WeeklyPlan from "./WeeklyPlan";
import IntervalTimer from "./IntervalTimer";
import OneRMTool from "./OneRMTool";
import VolumeSummary from "./VolumeSummary";

const DAY_LETTERS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const DAY_FULL = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
const todayIdx = () => (new Date().getDay() + 6) % 7; // Pzt=0

// "4 x 8-10" -> { n: 4, reps: "8-10" }. Sayı x tekrar biçimi değilse (ör.
// "10-20 dk" kardiyo) null döner → set sayısı ayarlanamaz, ham metin gösterilir.
function parseSetCount(s) {
  const m = /^(\d+)\s*[xX]\s*(.+)$/.exec(s || "");
  return m ? { n: parseInt(m[1], 10), reps: m[2].trim() } : null;
}

export default function ProgramBuilder({
  programs, schedule, history, onSetSchedule, onCreate, onDelete, onRemoveExercise, onMoveExercise, onSetCount, onToggleSuperset, onSwapExercise, onStart,
}) {
  const [swapAt, setSwapAt] = useState(null); // {programId, index} — açık değiştirme paneli
  const [newName, setNewName] = useState("");
  const [openId, setOpenId] = useState(null);
  const [dayPickerId, setDayPickerId] = useState(null);
  const [selDay, setSelDay] = useState(todayIdx()); // Haftalık Plan'da seçili gün
  const [showAll, setShowAll] = useState(false);    // gün filtresini kapat, tümünü listele
  const [timerOpen, setTimerOpen] = useState(false);
  const [ormOpen, setOrmOpen] = useState(false);
  const sch = schedule || {};

  // Seçili günün programı — varsa (ve 'tümü' kapalıysa) liste sadece onu gösterir
  const selProg = programs.find((p) => p.id === sch[selDay]);
  const visible = (!showAll && selProg) ? [selProg] : programs;

  function create() {
    const n = newName.trim();
    if (!n) return;
    onCreate(n);
    setNewName("");
  }

  // --- Haftalık toplam hacim: takvime ATANMIŞ tüm programların toplamı ---
  // Bir program iki güne atanmışsa iki kez sayılır (haftada 2 kez yapılıyor demektir).
  const weekly = useMemo(() => {
    const days = [];
    const names = [];
    for (let d = 0; d < 7; d++) {
      const p = programs.find((x) => x.id === sch[d]);
      if (!p) continue;
      days.push(p);
      names.push(p.name);
    }
    const unassigned = programs.filter((p) => !Object.values(sch).includes(p.id));
    return { days, names, unassigned };
  }, [programs, sch]);

  // Bu program hangi günlere atanmış (birden fazla olabilir, ör. Full Body Pzt+Çar+Cum)
  function daysOf(programId) {
    return Object.keys(sch).filter((k) => sch[k] === programId).map(Number);
  }
  // Atanmamış programları boş günlere dağıt. Öncelik sırası, antrenman
  // günleri arasında dinlenme kalacak şekilde seçilir (Pzt-Çar-Cum-Sal-Per-Cmt-Paz).
  const SPREAD_ORDER = [0, 2, 4, 1, 3, 5, 6];
  function autoAssign() {
    const free = SPREAD_ORDER.filter((d) => !sch[d]);
    weekly.unassigned.forEach((p, k) => {
      if (free[k] != null) onSetSchedule(free[k], p.id);
    });
  }

  // Bir hareketin yerine önerilecek alternatifler. Mantık data/muscles.js'te
  // (substitutesFor): kas verisiyle doğrulanıyor ve testle korunuyor.
  function altsFor(program, exId) {
    return substitutesFor(exId, program.exercises);
  }

  function toggleDay(program, dayIdx) {
    const isAssigned = sch[dayIdx] === program.id;
    onSetSchedule(dayIdx, isAssigned ? null : program.id);
  }

  return (
    <div>
      <h2>Programlarım</h2>
      <p style={{ color: "var(--muted)", marginTop: -4 }}>
        Kendi programını oluştur; hareketleri Bölgeler'den "Programıma Ekle" ile seç. Üstte gün seçince o günün programı listelenir.
      </p>

      <div className="row" style={{ marginBottom: 10 }}>
        <input className="input" style={{ flex: 1 }} placeholder="Yeni program adı (örn. Pazartesi - Göğüs)"
          value={newName} onChange={(e) => setNewName(e.target.value)} />
        <button className="icon-btn" onClick={create}>+ Oluştur</button>
      </div>
      <div className="row" style={{ gap: 8, marginBottom: 16 }}>
        <button className="icon-btn" style={{ flex: 1, padding: 10 }} onClick={() => setTimerOpen(true)}>⏱️ HIIT Sayacı</button>
        <button className="icon-btn" style={{ flex: 1, padding: 10 }} onClick={() => setOrmOpen(true)}>🧮 1RM Tablosu</button>
      </div>
      {timerOpen && <IntervalTimer onClose={() => setTimerOpen(false)} />}
      {ormOpen && <OneRMTool onClose={() => setOrmOpen(false)} />}

      {programs.length > 0 && (
        <WeeklyPlan programs={programs} schedule={schedule} history={history}
          onSetSchedule={onSetSchedule} onStart={onStart} sel={selDay} onSel={(d) => { setSelDay(d); setShowAll(false); }} />
      )}

      {/* HAFTALIK TOPLAM — takvime atanmış tüm günlerin toplam hacmi.
          Tek bir programın hacmi yanıltıcıdır (o yalnız 1 günü gösterir);
          hipertrofi hedefleri haftalık toplam üzerinden değerlendirilir. */}
      {programs.length > 0 && (
        <div className="card" style={{ marginBottom: 16, borderColor: "var(--accent2)" }}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 2 }}>📊 Haftalık Toplam Hacim</div>
          <p style={{ color: "var(--muted)", fontSize: 11.5, margin: "0 0 10px" }}>
            {weekly.days.length > 0
              ? "Takvimine atadığın " + weekly.days.length + " günün toplamı: " + weekly.names.join(", ")
              : "Henüz hiçbir program güne atanmamış."}
          </p>
          {weekly.days.length > 0 ? (
            <VolumeSummary days={weekly.days} title="" />
          ) : (
            <p style={{ color: "var(--attn)", fontSize: 12, margin: 0 }}>
              ⚠️ Haftalık hacmi görebilmek için programlarını günlere ata (aşağıdaki 📅 “Güne ata” düğmesi).
            </p>
          )}
          {weekly.unassigned.length > 0 && (
            <div style={{ marginTop: 10, borderTop: "1px solid var(--line)", paddingTop: 10 }}>
              <p style={{ color: "var(--attn)", fontSize: 12, margin: "0 0 8px", lineHeight: 1.5 }}>
                ⚠️ <b>{weekly.unassigned.length} program güne atanmamış</b>, bu yüzden yukarıdaki toplama dahil
                değil — hacim olduğundan düşük görünüyor. Tek dokunuşla boş günlere dağıtabilirsin:
              </p>
              <div style={{ color: "var(--muted)", fontSize: 11, marginBottom: 8 }}>
                {weekly.unassigned.map((p) => p.name).join(", ")}
              </div>
              <button className="btn-primary" style={{ width: "100%", padding: 12 }} onClick={autoAssign}>
                📅 Boş günlere otomatik ata
              </button>
            </div>
          )}
        </div>
      )}

      {programs.length === 0 && (
        <div className="empty">Henüz programın yok.<br />Yukarıdan bir program oluştur, sonra bölgelerden hareket ekle. 💪</div>
      )}

      {programs.length > 0 && (
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center", margin: "0 2px 10px" }}>
          <span style={{ color: "var(--muted)", fontSize: 13 }}>
            {(!showAll && selProg) ? "📅 " + DAY_FULL[selDay] + " programı" : "Tüm programlar (" + programs.length + ")"}
          </span>
          {selProg && (
            <button className="icon-btn" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => setShowAll((v) => !v)}>
              {showAll ? "Sadece " + DAY_LETTERS[selDay] : "Tümünü göster (" + programs.length + ")"}
            </button>
          )}
        </div>
      )}

      {visible.map((p) => {
        const open = p.id === openId;
        return (
          <div key={p.id} className="card" style={{ marginBottom: 12 }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <button onClick={() => setOpenId(open ? null : p.id)}
                style={{ background: "none", color: "var(--text)", fontWeight: 700, fontSize: 16, flex: 1, textAlign: "left" }}>
                {p.name} <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: 13 }}>({p.exercises.length})</span>
              </button>
              <button className="icon-btn danger" onClick={() => onDelete(p.id)}>Sil</button>
            </div>

            {p.note && (
              <p style={{ color: "var(--muted)", fontSize: 12, margin: "8px 0 0" }}>ℹ️ {p.note}</p>
            )}

            <div style={{ marginTop: 10 }}>
              <button className="icon-btn" style={{ fontSize: 12, padding: "5px 10px" }}
                onClick={() => setDayPickerId(dayPickerId === p.id ? null : p.id)}>
                📅 {daysOf(p.id).length > 0
                  ? daysOf(p.id).map((d) => DAY_LETTERS[d]).join(", ")
                  : "Güne ata"}
              </button>
              {dayPickerId === p.id && (
                <div className="row" style={{ gap: 4, marginTop: 8, flexWrap: "wrap" }}>
                  {DAY_LETTERS.map((d, i) => {
                    const on = sch[i] === p.id;
                    return (
                      <button key={i} onClick={() => toggleDay(p, i)}
                        style={{
                          padding: "6px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                          background: on ? "var(--accent)" : "var(--card2)",
                          color: on ? "#04321f" : "var(--text)",
                        }}>{d}</button>
                    );
                  })}
                </div>
              )}
            </div>

            {p.exercises.length > 0 && (
              <button className="btn-primary" style={{ marginTop: 10, padding: 12 }} onClick={() => onStart(p)}>
                ▶ Antrenmanı Başlat
              </button>
            )}

            {open && (
              <div style={{ marginTop: 12 }}>
                {/* Haftalık kas grubu hacmi — hareket ekleyip çıkardıkça anında güncellenir */}
                {p.exercises.length > 0 && (
                  <div className="card" style={{ background: "var(--card2)", marginBottom: 12 }}>
                    <VolumeSummary days={[p]} title={"📊 Sadece bu günün hacmi" + (daysOf(p.id).length > 1 ? " (×" + daysOf(p.id).length + " gün atanmış)" : "")} />
                    <p style={{ color: "var(--muted)", fontSize: 10.5, marginTop: 8, marginBottom: 0 }}>
                      Bu <b>tek bir antrenman gününün</b> hacmidir — eşiklerin altında görünmesi normaldir.
                      Haftalık toplam için sayfanın üstündeki <b>📊 Haftalık Toplam Hacim</b> kartına bak.
                    </p>
                  </div>
                )}
                {p.exercises.length === 0 && <div className="empty" style={{ padding: 18 }}>Bu programda hareket yok.</div>}
                {p.exercises.map((exId, i) => {
                  const ex = getExercise(exId);
                  if (!ex) return null;
                  const parsed = parseSetCount(ex.sets);
                  const cur = (p.sets && p.sets[exId] != null) ? p.sets[exId] : (parsed ? parsed.n : null);
                  const repsShown = (p.reps && p.reps[exId] != null) ? String(p.reps[exId]) : (parsed ? parsed.reps : null);
                  const ssl = p.ssLinks || [];
                  const linkedNext = i < p.exercises.length - 1 && ssl.some((l) => l[0] === exId && l[1] === p.exercises[i + 1]);
                  const linkedPrev = i > 0 && ssl.some((l) => l[0] === p.exercises[i - 1] && l[1] === exId);
                  return (
                    <React.Fragment key={exId + "-" + i}>
                    <div className="prog-ex-row"
                      style={linkedPrev ? { borderLeft: "3px solid var(--accent2)", paddingLeft: 6 } : undefined}>
                      <div className="prog-ex-main">
                      <div className="prog-ex-move">
                        <button disabled={i === 0} title="Yukarı taşı"
                          onClick={() => onMoveExercise(p.id, i, -1)}>▲</button>
                        <button disabled={i === p.exercises.length - 1} title="Aşağı taşı"
                          onClick={() => onMoveExercise(p.id, i, 1)}>▼</button>
                      </div>
                      <div className="figbox" style={{ width: 56, height: 56, padding: 0 }}>
                        <ExerciseAnimation type={ex.anim} gear={ex.equip} exId={ex.id} size={52} still />
                      </div>
                      <div className="grow" style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>
                          {(linkedPrev || linkedNext) && <span style={{ color: "var(--accent2)", fontSize: 11 }}>🔗 </span>}{ex.name}
                        </div>
                        {cur != null ? (
                          <div className="row prog-ex-sets" style={{ gap: 8, alignItems: "center", marginTop: 6 }}>
                            <button disabled={cur <= 1}
                              onClick={() => onSetCount && onSetCount(p.id, exId, cur - 1)}>−</button>
                            <span style={{ fontWeight: 700, fontSize: 14, minWidth: 46, textAlign: "center" }}>{cur} set</span>
                            <button disabled={cur >= 12}
                              onClick={() => onSetCount && onSetCount(p.id, exId, cur + 1)}>＋</button>
                            {repsShown && <span style={{ color: "var(--muted)", fontSize: 12 }}>× {repsShown}</span>}
                          </div>
                        ) : (
                          <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>{i + 1}. sıra · {ex.sets}</div>
                        )}
                      </div>
                      </div>

                      {/* Eylem çubuğu — tam genişlik, ~44px dokunma hedefi */}
                      <div className="prog-ex-actions">
                        {onSwapExercise && (
                          <button onClick={() => setSwapAt(
                            (swapAt && swapAt.programId === p.id && swapAt.index === i) ? null : { programId: p.id, index: i }
                          )}>⇄ Değiştir</button>
                        )}
                        {i < p.exercises.length - 1 && (
                          <button className={linkedNext ? "on" : ""}
                            onClick={() => onToggleSuperset && onToggleSuperset(p.id, i)}>
                            🔗 Süperset
                          </button>
                        )}
                        <button className="danger" onClick={() => onRemoveExercise(p.id, i)}>✕ Çıkar</button>
                      </div>
                    </div>
                    {swapAt && swapAt.programId === p.id && swapAt.index === i && (() => {
                      const alts = altsFor(p, exId);
                      return (
                        <div className="card" style={{ background: "var(--card2)", padding: 10, margin: "0 0 8px" }}>
                          <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <span style={{ fontWeight: 700, fontSize: 13 }}>“{ex.name}” yerine:</span>
                            <button className="icon-btn" style={{ padding: "2px 8px" }} onClick={() => setSwapAt(null)}>✕</button>
                          </div>
                          {alts.length === 0 ? (
                            <p style={{ color: "var(--muted)", fontSize: 12, margin: 0 }}>
                              Aynı kası çalıştıran ve programda bulunmayan alternatif yok.
                            </p>
                          ) : (
                            <>
                              <p style={{ color: "var(--muted)", fontSize: 11, margin: "0 0 8px" }}>
                                Aynı kası çalıştıran hareketler. Set/tekrar ayarın ve süperset bağın korunur.
                              </p>
                              {/* İç kaydırma YOK: iOS'ta çubuk görünmediği için liste
                                  kesik sanılıyordu. Tüm alternatifler listelenir, sayfa kayar. */}
                              <div>
                                {alts.map((o) => (
                                  <button key={o.id}
                                    onClick={() => { onSwapExercise(p.id, i, o.id); setSwapAt(null); }}
                                    style={{ display: "block", width: "100%", textAlign: "left", background: "var(--card)",
                                      border: "none", borderRadius: 8, padding: "9px 10px", marginBottom: 6, color: "var(--text)" }}>
                                    <div style={{ fontWeight: 600, fontSize: 13 }}>{o.name}</div>
                                    <div style={{ color: "var(--muted)", fontSize: 11 }}>{o.equip || "serbest"} · {o.sets || ""}</div>
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })()}
                    </React.Fragment>
                  );
                })}
                {(p.ssLinks || []).length > 0 && (
                  <div style={{ color: "var(--muted)", fontSize: 11, margin: "2px 4px" }}>
                    🔗 Süperset: bağlı hareketler antrenmanda dinlenmesiz arka arkaya yapılır.
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
