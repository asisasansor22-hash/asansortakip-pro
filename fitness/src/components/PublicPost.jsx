import React, { useEffect, useState } from "react";
import { publicPostGet } from "../firebase";

const nameOf = (e) => (e || "").split("@")[0] || "kullanıcı";
function timeAgo(t) {
  if (!t) return "";
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return "az önce";
  const m = Math.floor(s / 60); if (m < 60) return m + " dk önce";
  const h = Math.floor(m / 60); if (h < 24) return h + " sa önce";
  const d = Math.floor(h / 24); if (d < 7) return d + " gün önce";
  try { return new Date(t).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" }); } catch (e) { return ""; }
}

export default function PublicPost({ id }) {
  const [post, setPost] = useState(undefined); // undefined=yükleniyor, null=bulunamadı
  useEffect(() => {
    let alive = true;
    (async () => { const p = await publicPostGet(id); if (alive) setPost(p); })();
    return () => { alive = false; };
  }, [id]);

  const appUrl = window.location.origin + window.location.pathname;

  return (
    <div className="app" style={{ paddingTop: "calc(20px + env(safe-area-inset-top))", maxWidth: 560 }}>
      <div className="row" style={{ justifyContent: "center", marginBottom: 16 }}>
        <div className="brand" style={{ fontSize: 26 }}>Fit<span>+be</span></div>
      </div>

      {post === undefined && <p style={{ color: "var(--muted)", textAlign: "center" }}>Yükleniyor…</p>}

      {post === null && (
        <div className="card" style={{ textAlign: "center", padding: 24 }}>
          <div style={{ fontSize: 40 }}>🔍</div>
          <p style={{ color: "var(--muted)" }}>Bu gönderi bulunamadı veya artık paylaşımda değil.</p>
        </div>
      )}

      {post && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="row" style={{ gap: 8, alignItems: "center" }}>
            <div style={{ width: 36, height: 36, borderRadius: 999, overflow: "hidden", background: "var(--card2)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "var(--accent)", flexShrink: 0 }}>
              {post.avatar ? <img src={post.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : nameOf(post.email).slice(0, 1).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{nameOf(post.email)}</div>
              <div style={{ color: "var(--muted)", fontSize: 11 }}>{timeAgo(post.t)}</div>
            </div>
          </div>
          {post.text && <p style={{ margin: "12px 0 0", whiteSpace: "pre-wrap", lineHeight: 1.45 }}>{post.text}</p>}
          {post.media && post.media.type === "image" && (
            <img src={post.media.src} alt="" style={{ width: "100%", borderRadius: 10, marginTop: 12, objectFit: "cover" }} />
          )}
          {post.media && post.media.type === "video" && (
            <video src={post.media.src} controls playsInline style={{ width: "100%", borderRadius: 10, marginTop: 12 }} />
          )}
        </div>
      )}

      <a href={appUrl} className="btn-primary" style={{ display: "block", textAlign: "center", textDecoration: "none" }}>
        💪 Fit+be'ye Katıl
      </a>
      <p style={{ color: "var(--muted)", fontSize: 12, textAlign: "center", marginTop: 10 }}>
        Ücretsiz antrenman & beslenme uygulaması
      </p>
    </div>
  );
}
