import React, { useEffect, useState, useRef, useMemo } from "react";
import { feedList, feedPost, feedDelete, feedSharePublic, publicAvatarsGet, feedLikesGet, feedLikeToggle, feedCommentsGet, feedCommentAdd, feedCommentDelete, currentUid, isAdmin, auth } from "../firebase";

const VIDEO_MAX = 8 * 1024 * 1024; // 8 MB (base64 olarak DB'de tutulur)

// Fotoğrafı küçült (en uzun kenar ~1280px, JPEG)
function resizeImage(file, maxDim = 1280, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        const scale = Math.min(1, maxDim / Math.max(w, h));
        w = Math.round(w * scale); h = Math.round(h * scale);
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function timeAgo(t) {
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return "az önce";
  const m = Math.floor(s / 60);
  if (m < 60) return m + " dk önce";
  const h = Math.floor(m / 60);
  if (h < 24) return h + " sa önce";
  const d = Math.floor(h / 24);
  if (d < 7) return d + " gün önce";
  try { return new Date(t).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" }); }
  catch (e) { return ""; }
}
const nameOf = (email) => (email || "").split("@")[0] || "kullanıcı";
// Gönderi/yorum sahibinin görünen adı: kayıtlı ad varsa onu, yoksa e-posta öneki.
const displayOf = (obj) => (obj && obj.name && obj.name.trim()) ? obj.name.trim() : nameOf(obj && obj.email);
const MENTION_CHARS = "a-zA-Z0-9_.çğıöşüÇĞİÖŞÜ";

// Gönderi metnindeki @etiketleri vurgula
function renderText(t) {
  const re = new RegExp("(@[" + MENTION_CHARS + "]+)", "g");
  return String(t).split(re).map((part, i) =>
    new RegExp("^@[" + MENTION_CHARS + "]+$").test(part)
      ? <span key={i} style={{ color: "var(--accent)", fontWeight: 600 }}>{part}</span>
      : part
  );
}

export default function Timeline() {
  const [posts, setPosts] = useState(null);
  const [err, setErr] = useState("");
  const [text, setText] = useState("");
  const [media, setMedia] = useState(null); // {type, src}
  const [busy, setBusy] = useState(false);
  const [prep, setPrep] = useState("");
  const [viewer, setViewer] = useState(null);
  const [shareMsg, setShareMsg] = useState("");
  const [mention, setMention] = useState(null); // {start, query}
  const [avatars, setAvatars] = useState({}); // uid -> dataURL (herkese açık güncel)
  const [likes, setLikes] = useState({}); // postId -> {uid: true}
  const [comments, setComments] = useState({}); // postId -> {commentId: {...}}
  const [openComments, setOpenComments] = useState(null); // yorumları açık gönderi id
  const [commentText, setCommentText] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const closedAt = useRef(0);
  const taRef = useRef(null);

  const me = currentUid();
  const admin = isAdmin(auth.currentUser);
  let myAvatar = null;
  try { myAvatar = localStorage.getItem("fitbe_avatar") || null; } catch (e) {}

  // @etiketleme önerileri: akışa katılmış (gönderi atmış) kullanıcı adları + kendi adın.
  const knownNames = useMemo(() => {
    const map = new Map();
    const add = (n) => { if (n && n !== "kullanıcı") map.set(n.toLowerCase(), n); };
    (posts || []).forEach((p) => add(displayOf(p)));
    try { const u = auth.currentUser; if (u) add((u.displayName && u.displayName.trim()) || nameOf(u.email)); } catch (e) {}
    return [...map.values()];
  }, [posts]);

  // İmleç konumuna göre yazılmakta olan @etiketi yakala
  function onText(e) {
    const v = e.target.value;
    setText(v);
    const caret = (e.target.selectionStart != null) ? e.target.selectionStart : v.length;
    const upto = v.slice(0, caret);
    const m = upto.match(new RegExp("(?:^|\\s)@([" + MENTION_CHARS + "]*)$"));
    if (m) setMention({ start: caret - m[1].length, query: m[1].toLowerCase() });
    else setMention(null);
  }

  const suggestions = mention
    ? knownNames.filter((n) => n.toLowerCase().includes(mention.query)).slice(0, 6)
    : [];

  function pickMention(name) {
    if (!mention) return;
    const before = text.slice(0, mention.start);          // "@" dahil önceki kısım
    const after = text.slice(mention.start + mention.query.length);
    const next = before + name + " " + after;
    setText(next);
    setMention(null);
    setTimeout(() => {
      const ta = taRef.current; if (!ta) return;
      const pos = (before + name + " ").length;
      ta.focus();
      try { ta.setSelectionRange(pos, pos); } catch (e) {}
    }, 0);
  }

  async function load() {
    setErr("");
    const r = await feedList();
    if (r.success) setPosts(r.posts);
    else { setPosts([]); setErr("Akış yüklenemedi (" + r.error + "). Veritabanı kuralında /fitness/feed izni gerekiyor."); }
  }
  useEffect(() => { load(); }, []);
  useEffect(() => {
    let alive = true;
    (async () => {
      const [a, l, c] = await Promise.all([publicAvatarsGet(), feedLikesGet(), feedCommentsGet()]);
      if (!alive) return;
      setAvatars(a || {});
      setLikes(l || {});
      setComments(c || {});
    })();
    return () => { alive = false; };
  }, []);

  function toggleLike(post) {
    const liked = !!(likes[post.id] && likes[post.id][me]);
    // İyimser güncelle, hata olursa geri al
    setLikes((prev) => {
      const p = { ...(prev[post.id] || {}) };
      if (liked) delete p[me]; else p[me] = true;
      return { ...prev, [post.id]: p };
    });
    feedLikeToggle(post.id, !liked).then((r) => {
      if (!r.success) setLikes((prev) => {
        const p = { ...(prev[post.id] || {}) };
        if (liked) p[me] = true; else delete p[me];
        return { ...prev, [post.id]: p };
      });
    });
  }

  async function addComment(post) {
    const t = commentText.trim();
    if (!t) return;
    setCommentBusy(true);
    const r = await feedCommentAdd(post.id, t);
    setCommentBusy(false);
    if (r.success) {
      setComments((prev) => ({ ...prev, [post.id]: { ...(prev[post.id] || {}), [r.comment.id]: r.comment } }));
      setCommentText("");
    } else setErr("Yorum gönderilemedi (" + r.error + "). Veritabanı kuralında feed_comments izni gerekiyor.");
  }

  async function removeComment(postId, cid) {
    const r = await feedCommentDelete(postId, cid);
    if (r.success) setComments((prev) => {
      const p = { ...(prev[postId] || {}) };
      delete p[cid];
      return { ...prev, [postId]: p };
    });
  }

  async function onPhoto(e) {
    const f = e.target.files && e.target.files[0]; e.target.value = "";
    if (!f) return;
    setPrep("Fotoğraf hazırlanıyor…");
    try { setMedia({ type: "image", src: await resizeImage(f) }); } catch (x) {}
    setPrep("");
  }
  async function onVideo(e) {
    const f = e.target.files && e.target.files[0]; e.target.value = "";
    if (!f) return;
    if (f.size > VIDEO_MAX) { setPrep(""); setErr("Video çok büyük (en fazla 8 MB). Daha kısa bir klip seç."); return; }
    setErr(""); setPrep("Video hazırlanıyor…");
    try { setMedia({ type: "video", src: await readAsDataURL(f) }); } catch (x) {}
    setPrep("");
  }

  async function submit() {
    if (!text.trim() && !media) return;
    setBusy(true); setErr("");
    let avatar = null;
    try { avatar = localStorage.getItem("fitbe_avatar") || null; } catch (e) {}
    const r = await feedPost({ text: text.trim(), media, avatar });
    setBusy(false);
    if (r.success) { setPosts((p) => [r.post, ...(p || [])]); setText(""); setMedia(null); setMention(null); }
    else setErr("Gönderilemedi (" + r.error + ").");
  }

  async function remove(post) {
    if (!window.confirm("Bu gönderi silinsin mi?")) return;
    const r = await feedDelete(post.id);
    if (r.success) setPosts((p) => p.filter((x) => x.id !== post.id));
    else setErr("Silinemedi (" + r.error + ").");
  }

  async function share(post) {
    if (!window.confirm("Bu gönderi herkese açık bir bağlantıyla paylaşılacak; linke sahip herkes (giriş yapmadan) görebilir. Devam edilsin mi?")) return;
    const r = await feedSharePublic(post);
    if (!r.success) { setErr("Paylaşılamadı (" + r.error + "). /fitness/public_feed kuralı eklenmiş olmalı."); return; }
    const url = window.location.origin + window.location.pathname + "#/p/" + post.id;
    try {
      if (navigator.share) await navigator.share({ title: "Fit+be", text: "Fit+be'de bir gönderi:", url });
      else { await navigator.clipboard.writeText(url); setShareMsg("Bağlantı kopyalandı: " + url); setTimeout(() => setShareMsg(""), 4000); }
    } catch (e) { /* kullanıcı paylaşmayı iptal etti */ }
  }

  const closeViewer = () => { closedAt.current = Date.now(); setViewer(null); };
  const openViewer = (m) => { if (Date.now() - closedAt.current < 450) return; setViewer(m); };

  useEffect(() => {
    if (!viewer) return;
    function onKey(e) { if (e.key === "Escape") closeViewer(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [viewer]);

  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <h2>Akış</h2>
        <button className="icon-btn" onClick={load} title="Akışı yenile">🔄 Yenile</button>
      </div>
      <p style={{ color: "var(--muted)", marginTop: -4 }}>Antrenmanını, ilerlemeni paylaş. Herkes görür. 💬</p>

      {/* Gönderi oluştur */}
      <div className="card" style={{ marginBottom: 16 }}>
        <textarea ref={taRef} className="input" rows={3} placeholder="Bir şeyler yaz… (@ ile etiketle)" value={text}
          onChange={onText} onKeyUp={onText} onClick={onText} style={{ resize: "none", width: "100%" }} />
        {mention && suggestions.length > 0 && (
          <div className="card" style={{ padding: 6, marginTop: 6 }}>
            <div style={{ color: "var(--muted)", fontSize: 11, margin: "2px 6px 4px" }}>Etiketle:</div>
            <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>
              {suggestions.map((n) => (
                <button key={n} className="chip on" onClick={() => pickMention(n)}>@{n}</button>
              ))}
            </div>
          </div>
        )}
        {media && (
          <div style={{ position: "relative", marginTop: 8 }}>
            {media.type === "image"
              ? <img src={media.src} alt="" style={{ width: "100%", borderRadius: 10, maxHeight: 280, objectFit: "cover" }} />
              : <video src={media.src} controls style={{ width: "100%", borderRadius: 10, maxHeight: 280 }} />}
            <button className="icon-btn" onClick={() => setMedia(null)}
              style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,.6)" }}>✕</button>
          </div>
        )}
        {prep && <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 6 }}>{prep}</div>}
        <div className="row" style={{ gap: 8, marginTop: 10, alignItems: "center" }}>
          <label className="icon-btn" style={{ cursor: "pointer" }}>📷 Fotoğraf
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={onPhoto} />
          </label>
          <label className="icon-btn" style={{ cursor: "pointer" }}>🎬 Video
            <input type="file" accept="video/*" style={{ display: "none" }} onChange={onVideo} />
          </label>
          <button className="btn-primary" style={{ marginLeft: "auto", width: "auto", padding: "0 20px", height: 40 }}
            disabled={busy || (!text.trim() && !media)} onClick={submit}>
            {busy ? "Paylaşılıyor…" : "Paylaş"}
          </button>
        </div>
      </div>

      {err && (
        <div className="err" style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <span style={{ flex: 1 }}>{err}</span>
          <button className="icon-btn" style={{ flexShrink: 0 }} onClick={load}>Tekrar dene</button>
        </div>
      )}
      {shareMsg && <div style={{ color: "var(--ok)", fontSize: 12, marginBottom: 12, wordBreak: "break-all" }}>{shareMsg}</div>}

      {posts === null ? (
        <p style={{ color: "var(--muted)" }}>Yükleniyor…</p>
      ) : posts.length === 0 ? (
        <p style={{ color: "var(--muted)", fontSize: 13 }}>Henüz gönderi yok. İlk paylaşan sen ol! 💪</p>
      ) : (
        posts.map((post) => (
          <div key={post.id} className="card" style={{ marginBottom: 12 }}>
            <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
              <div className="row" style={{ gap: 8, alignItems: "center" }}>
                <div style={{ width: 32, height: 32, borderRadius: 999, overflow: "hidden", background: "var(--card2)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "var(--accent)", flexShrink: 0 }}>
                  {(() => {
                    // Öncelik: herkese açık güncel avatar → (kendi gönderinse) yerel → gönderiye eklenmiş anlık
                    const av = avatars[post.uid] || (post.uid === me ? myAvatar : null) || post.avatar;
                    return av
                      ? <img src={av} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : displayOf(post).slice(0, 1).toUpperCase();
                  })()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{displayOf(post)}</div>
                  <div style={{ color: "var(--muted)", fontSize: 11 }}>{timeAgo(post.t)}</div>
                </div>
              </div>
              <div className="row" style={{ gap: 6 }}>
                {(post.uid === me || admin) && (
                  <button className="icon-btn" style={{ padding: "4px 10px", color: "var(--accent)" }} onClick={() => share(post)}>↗ Paylaş</button>
                )}
                {(post.uid === me || admin) && (
                  <button className="icon-btn danger" style={{ padding: "4px 10px" }} onClick={() => remove(post)}>Sil</button>
                )}
              </div>
            </div>
            {post.text && <p style={{ margin: "10px 0 0", whiteSpace: "pre-wrap", lineHeight: 1.45 }}>{renderText(post.text)}</p>}
            {post.media && post.media.type === "image" && (
              <img src={post.media.src} alt="" onClick={() => openViewer(post.media)}
                style={{ width: "100%", borderRadius: 10, marginTop: 10, maxHeight: 420, objectFit: "cover", cursor: "pointer" }} />
            )}
            {post.media && post.media.type === "video" && (
              <video src={post.media.src} controls playsInline
                style={{ width: "100%", borderRadius: 10, marginTop: 10, maxHeight: 420 }} />
            )}

            {(() => {
              const likeMap = likes[post.id] || {};
              const likeCount = Object.keys(likeMap).length;
              const iLiked = !!likeMap[me];
              const comMap = comments[post.id] || {};
              const comList = Object.keys(comMap).map((cid) => ({ id: cid, ...comMap[cid] })).sort((a, b) => (a.t || 0) - (b.t || 0));
              const isOpen = openComments === post.id;
              return (
                <div style={{ marginTop: 10 }}>
                  <div className="row" style={{ gap: 8 }}>
                    <button className="icon-btn" onClick={() => toggleLike(post)}
                      style={{ color: iLiked ? "#f87171" : "var(--muted)", fontWeight: 700 }}>
                      {iLiked ? "❤️" : "🤍"} {likeCount > 0 ? likeCount : ""}
                    </button>
                    <button className="icon-btn" onClick={() => { setOpenComments(isOpen ? null : post.id); setCommentText(""); }}
                      style={{ color: isOpen ? "var(--accent)" : "var(--muted)" }}>
                      💬 {comList.length > 0 ? comList.length : "Yorum yap"}
                    </button>
                  </div>

                  {isOpen && (
                    <div style={{ marginTop: 8, borderTop: "1px solid var(--line)", paddingTop: 8 }}>
                      {comList.map((c) => (
                        <div key={c.id} className="row" style={{ gap: 8, alignItems: "flex-start", marginBottom: 8 }}>
                          <div style={{ width: 24, height: 24, borderRadius: 999, overflow: "hidden", background: "var(--card2)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 11, color: "var(--accent)", flexShrink: 0 }}>
                            {(avatars[c.uid] || c.avatar)
                              ? <img src={avatars[c.uid] || c.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              : displayOf(c).slice(0, 1).toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ fontWeight: 700, fontSize: 12 }}>{displayOf(c)}</span>
                            <span style={{ color: "var(--muted)", fontSize: 10, marginLeft: 6 }}>{timeAgo(c.t)}</span>
                            <div style={{ fontSize: 13, lineHeight: 1.4, wordBreak: "break-word" }}>{renderText(c.text)}</div>
                          </div>
                          {(c.uid === me || admin) && (
                            <button className="icon-btn" style={{ padding: "2px 8px", fontSize: 11 }} onClick={() => removeComment(post.id, c.id)}>✕</button>
                          )}
                        </div>
                      ))}
                      <div className="row" style={{ gap: 6 }}>
                        <input className="input" style={{ flex: 1, padding: 10, fontSize: 14 }} placeholder="Yorum yaz…"
                          value={commentText} onChange={(e) => setCommentText(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") addComment(post); }} />
                        <button className="btn-primary" style={{ width: "auto", padding: "0 14px", height: 40 }}
                          disabled={commentBusy || !commentText.trim()} onClick={() => addComment(post)}>
                          {commentBusy ? "…" : "Gönder"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        ))
      )}

      {viewer && (
        <div onClick={closeViewer} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.93)", zIndex: 60,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 12,
        }}>
          <button className="icon-btn" onClick={(e) => { e.stopPropagation(); closeViewer(); }}
            style={{ position: "fixed", top: 14, right: 14, background: "rgba(255,255,255,.12)", zIndex: 61 }}>Kapat ✕</button>
          <img src={viewer.src} alt="" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "100%", maxHeight: "92vh", borderRadius: 12 }} />
        </div>
      )}
    </div>
  );
}
