import React, { useEffect, useRef, useState } from "react";
import { dirGet, dmList, dmSend, dmMetaGet, publicAvatarsGet, currentUid } from "../firebase";

// Okundu bilgisi (cihazda): { otherUid: lastReadTs }
export function dmSeenGet(myUid) {
  try { return JSON.parse(localStorage.getItem("fitbe_dmseen_" + myUid) || "{}") || {}; } catch (e) { return {}; }
}
export function dmSeenMark(myUid, otherUid) {
  try {
    const m = dmSeenGet(myUid); m[otherUid] = Date.now();
    localStorage.setItem("fitbe_dmseen_" + myUid, JSON.stringify(m));
  } catch (e) {}
}

const fmtTime = (t) => {
  try {
    const d = new Date(t), now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    return sameDay
      ? d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
      : d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch (e) { return ""; }
};

function Ava({ src, name, size = 36 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: 999, overflow: "hidden", background: "var(--card2)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "var(--accent)", flexShrink: 0, fontSize: size / 2.4 }}>
      {src
        ? <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : (name || "?").slice(0, 1).toUpperCase()}
    </div>
  );
}

// ✉️ Mesajlar — kullanıcı arama (Twitter tarzı) + birebir DM.
export default function Messages({ onSeen }) {
  const me = currentUid();
  const [users, setUsers] = useState({});     // uid -> {name, t}
  const [avatars, setAvatars] = useState({});
  const [meta, setMeta] = useState({});       // otherUid -> {t, last, from}
  const [q, setQ] = useState("");
  const [chat, setChat] = useState(null);     // {uid, name}
  const [msgs, setMsgs] = useState(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  async function loadLists() {
    const [d, av, m] = await Promise.all([dirGet(), publicAvatarsGet(), dmMetaGet()]);
    setUsers(d || {}); setAvatars(av || {}); setMeta(m || {});
  }
  useEffect(() => {
    loadLists();
    const iv = setInterval(loadLists, 30000);
    return () => clearInterval(iv);
  }, []);

  // Açık sohbeti 4 sn'de bir tazele; gelenleri okundu say
  useEffect(() => {
    if (!chat) return;
    let alive = true;
    const tick = async () => {
      const l = await dmList(chat.uid);
      if (!alive) return;
      setMsgs(l);
      dmSeenMark(me, chat.uid);
      if (onSeen) onSeen();
    };
    tick();
    const iv = setInterval(tick, 4000);
    return () => { alive = false; clearInterval(iv); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat && chat.uid]);

  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ block: "end" });
  }, [msgs && msgs.length, chat && chat.uid]);

  function openChat(uid, name) {
    dmSeenMark(me, uid);
    if (onSeen) onSeen();
    setMsgs(null);
    setChat({ uid, name });
  }

  async function send() {
    const t = text.trim();
    if (!t || busy || !chat) return;
    setBusy(true);
    const r = await dmSend(chat.uid, t);
    setBusy(false);
    if (r.success) {
      setText("");
      setMsgs((p) => [...(p || []), r.msg]);
      dmSeenMark(me, chat.uid);
      if (onSeen) onSeen();
    }
  }

  // --- Sohbet görünümü ---
  if (chat) {
    return (
      <div>
        <div className="row" style={{ alignItems: "center", gap: 10, marginBottom: 8 }}>
          <button className="btn-back" style={{ margin: 0 }} onClick={() => { setChat(null); loadLists(); }}>←</button>
          <Ava src={avatars[chat.uid]} name={chat.name} size={32} />
          <div style={{ fontWeight: 800, fontSize: 16 }}>{chat.name}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, minHeight: "40vh", maxHeight: "52vh", overflowY: "auto", padding: "8px 2px", WebkitOverflowScrolling: "touch" }}>
          {msgs === null ? (
            <p style={{ color: "var(--muted)", textAlign: "center" }}>Yükleniyor…</p>
          ) : msgs.length === 0 ? (
            <p style={{ color: "var(--muted)", textAlign: "center", marginTop: 30 }}>Henüz mesaj yok — ilk mesajı sen yaz 👋</p>
          ) : (
            msgs.map((m) => {
              const mine = m.uid === me;
              return (
                <div key={m.id} style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "80%" }}>
                  <div style={{
                    background: mine ? "var(--accent)" : "var(--card2)",
                    color: mine ? "#04321f" : "var(--text)",
                    borderRadius: 14, padding: "8px 12px", fontSize: 14, lineHeight: 1.4,
                    wordBreak: "break-word", whiteSpace: "pre-wrap",
                  }}>{m.text}</div>
                  <div style={{ color: "var(--muted)", fontSize: 10, marginTop: 2, textAlign: mine ? "right" : "left" }}>{fmtTime(m.t)}</div>
                </div>
              );
            })
          )}
          <div ref={endRef} />
        </div>
        <div className="row" style={{ gap: 6, marginTop: 8 }}>
          <input className="input" style={{ flex: 1 }} placeholder="Mesaj yaz…" value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send(); }} />
          <button className="btn-primary" style={{ width: "auto", padding: "0 18px", height: 44 }}
            disabled={busy || !text.trim()} onClick={send}>{busy ? "…" : "Gönder"}</button>
        </div>
      </div>
    );
  }

  // --- Liste görünümü: arama + sohbetler + tüm kullanıcılar ---
  const seen = dmSeenGet(me);
  const ql = q.trim().toLowerCase();
  const nameOf = (uid) => (users[uid] && users[uid].name) || "sporcu";
  const others = Object.keys(users).filter((uid) => uid !== me)
    .map((uid) => ({ uid, name: nameOf(uid) }))
    .filter((u) => !ql || u.name.toLowerCase().includes(ql))
    .sort((a, b) => a.name.localeCompare(b.name, "tr"));
  const convs = Object.keys(meta)
    .map((uid) => ({ uid, name: nameOf(uid), ...(meta[uid] || {}) }))
    .filter((c) => !ql || c.name.toLowerCase().includes(ql))
    .sort((a, b) => (b.t || 0) - (a.t || 0));

  return (
    <div>
      <h2 style={{ marginBottom: 6 }}>✉️ Mesajlar</h2>
      <input className="search-input" placeholder="🔍 Kullanıcı ara…" value={q} onChange={(e) => setQ(e.target.value)} />

      {convs.length > 0 && (
        <>
          <div className="section-title">Sohbetler</div>
          {convs.map((c) => {
            const unread = c.from && c.from !== me && (c.t || 0) > (seen[c.uid] || 0);
            return (
              <button key={c.uid} className="card" style={{ width: "100%", textAlign: "left", marginBottom: 8, padding: 12 }}
                onClick={() => openChat(c.uid, c.name)}>
                <div className="row" style={{ alignItems: "center", gap: 10 }}>
                  <Ava src={avatars[c.uid]} name={c.name} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="row" style={{ justifyContent: "space-between" }}>
                      <span style={{ fontWeight: unread ? 800 : 700, fontSize: 14 }}>{c.name}</span>
                      <span style={{ color: "var(--muted)", fontSize: 11 }}>{fmtTime(c.t)}</span>
                    </div>
                    <div style={{ color: unread ? "var(--text)" : "var(--muted)", fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: unread ? 600 : 400 }}>
                      {c.from === me ? "Sen: " : ""}{c.last || ""}
                    </div>
                  </div>
                  {unread && <span style={{ width: 10, height: 10, borderRadius: 999, background: "var(--danger)", flexShrink: 0 }} />}
                </div>
              </button>
            );
          })}
        </>
      )}

      <div className="section-title">{ql ? "Arama sonuçları" : "Tüm kullanıcılar"}</div>
      {others.length === 0 ? (
        <p style={{ color: "var(--muted)", fontSize: 13 }}>{ql ? "Eşleşen kullanıcı yok." : "Henüz başka kullanıcı yok."}</p>
      ) : (
        others.map((u) => (
          <div key={u.uid} className="card" style={{ marginBottom: 8, padding: 12 }}>
            <div className="row" style={{ alignItems: "center", gap: 10 }}>
              <Ava src={avatars[u.uid]} name={u.name} />
              <div style={{ flex: 1, fontWeight: 700, fontSize: 14, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>@{u.name}</div>
              <button className="icon-btn" style={{ color: "var(--accent)" }} onClick={() => openChat(u.uid, u.name)}>✉️ Mesaj</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
