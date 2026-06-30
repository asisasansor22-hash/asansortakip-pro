import React, { useEffect, useState, useRef } from "react";
import { feedList, feedPost, feedDelete, currentUid, isAdmin, auth } from "../firebase";

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

export default function Timeline() {
  const [posts, setPosts] = useState(null);
  const [err, setErr] = useState("");
  const [text, setText] = useState("");
  const [media, setMedia] = useState(null); // {type, src}
  const [busy, setBusy] = useState(false);
  const [prep, setPrep] = useState("");
  const [viewer, setViewer] = useState(null);
  const closedAt = useRef(0);

  const me = currentUid();
  const admin = isAdmin(auth.currentUser);

  async function load() {
    setErr("");
    const r = await feedList();
    if (r.success) setPosts(r.posts);
    else { setPosts([]); setErr("Akış yüklenemedi (" + r.error + "). Veritabanı kuralında /fitness/feed izni gerekiyor."); }
  }
  useEffect(() => { load(); }, []);

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
    if (r.success) { setPosts((p) => [r.post, ...(p || [])]); setText(""); setMedia(null); }
    else setErr("Gönderilemedi (" + r.error + ").");
  }

  async function remove(post) {
    if (!window.confirm("Bu gönderi silinsin mi?")) return;
    const r = await feedDelete(post.id);
    if (r.success) setPosts((p) => p.filter((x) => x.id !== post.id));
    else setErr("Silinemedi (" + r.error + ").");
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
      <h2>Akış</h2>
      <p style={{ color: "var(--muted)", marginTop: -4 }}>Antrenmanını, ilerlemeni paylaş. Herkes görür. 💬</p>

      {/* Gönderi oluştur */}
      <div className="card" style={{ marginBottom: 16 }}>
        <textarea className="input" rows={3} placeholder="Bir şeyler yaz…" value={text}
          onChange={(e) => setText(e.target.value)} style={{ resize: "none", width: "100%" }} />
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

      {err && <div className="err" style={{ marginBottom: 12 }}>{err}</div>}

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
                  {post.avatar
                    ? <img src={post.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : nameOf(post.email).slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{nameOf(post.email)}</div>
                  <div style={{ color: "var(--muted)", fontSize: 11 }}>{timeAgo(post.t)}</div>
                </div>
              </div>
              {(post.uid === me || admin) && (
                <button className="icon-btn danger" style={{ padding: "4px 10px" }} onClick={() => remove(post)}>Sil</button>
              )}
            </div>
            {post.text && <p style={{ margin: "10px 0 0", whiteSpace: "pre-wrap", lineHeight: 1.45 }}>{post.text}</p>}
            {post.media && post.media.type === "image" && (
              <img src={post.media.src} alt="" onClick={() => openViewer(post.media)}
                style={{ width: "100%", borderRadius: 10, marginTop: 10, maxHeight: 420, objectFit: "cover", cursor: "pointer" }} />
            )}
            {post.media && post.media.type === "video" && (
              <video src={post.media.src} controls playsInline
                style={{ width: "100%", borderRadius: 10, marginTop: 10, maxHeight: 420 }} />
            )}
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
