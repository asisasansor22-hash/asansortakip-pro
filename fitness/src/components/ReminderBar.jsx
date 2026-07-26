import React, { useEffect, useState, useRef } from "react";
import { reminderState, notifDue, markFired, markDismissed, dismissedToday, msUntilRemTime, remOn } from "../utils/reminder";
import { showWorkoutReminder } from "../utils/alerts";

// Bugün antrenman günüyse ve henüz yapılmadıysa üstte çıkan şerit.
// Ayrıca hatırlatma saati geldiğinde (uygulama açıkken) bildirimi tetikler.
//
// Şerit, bildirim ayarından BAĞIMSIZ çalışır: bildirim izni verilmemiş olsa da
// uygulamayı açtığında bugünkü antrenmanını görürsün. remOn() yalnızca
// bildirimi kontrol eder.
export default function ReminderBar({ schedule, programs, history, onStart }) {
  const [hidden, setHidden] = useState(() => dismissedToday());
  const [, bump] = useState(0);      // saat gelince yeniden değerlendirme
  const timer = useRef(null);

  const st = reminderState({ schedule, programs, history });

  // Bildirim: saat geldiğinde bir kez. Uygulama arka plandayken de sekme
  // yaşıyorsa zamanlayıcı çalışır; kapalıysa uygulama açılır açılmaz (saat
  // çoktan geçmişse) hemen tetiklenir.
  useEffect(() => {
    clearTimeout(timer.current);
    if (!remOn() || !st.pending) return;

    const fire = () => {
      const now = reminderState({ schedule, programs, history });
      if (!notifDue(now)) return;
      markFired();
      showWorkoutReminder(now.program ? now.program.name : null);
    };

    const left = msUntilRemTime();
    if (left <= 0) fire();
    // setTimeout 32 bit sınırını (~24.8 gün) aşamaz; kalan süre her zaman
    // aynı gün içinde olduğu için burada güvenli.
    else timer.current = setTimeout(() => { fire(); bump((n) => n + 1); }, left + 500);

    return () => clearTimeout(timer.current);
    // program/geçmiş değişince (ör. antrenman bitince) yeniden değerlendirilir
  }, [schedule, programs, history, st.pending]);

  // Uygulama öne geldiğinde: gün değişmiş olabilir, saat geçmiş olabilir
  useEffect(() => {
    const onVis = () => { if (document.visibilityState === "visible") { setHidden(dismissedToday()); bump((n) => n + 1); } };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  if (!st.pending || hidden) return null;

  return (
    <div className="card" style={{ marginBottom: 12, padding: 12, borderColor: "var(--accent)", background: "var(--card2)" }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ color: "var(--muted)", fontSize: 12 }}>🏋️ Bugün ({st.day}) antrenman günün</div>
          <div style={{ fontWeight: 800, fontSize: 15, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {st.program.name}
          </div>
        </div>
        <button className="btn-primary" style={{ width: "auto", padding: "0 16px", height: 40, flexShrink: 0 }}
          onClick={() => onStart(st.program)}>▶ Başlat</button>
        <button className="icon-btn" aria-label="Bugünlük gizle" style={{ padding: "0 10px", height: 40, flexShrink: 0 }}
          onClick={() => { markDismissed(); setHidden(true); }}>✕</button>
      </div>
    </div>
  );
}
