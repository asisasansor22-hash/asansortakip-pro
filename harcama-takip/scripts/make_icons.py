#!/usr/bin/env python3
"""
Cüzdan — uygulama ikonu üreteci (saf Python, harici kütüphane yok).

Emerald gradyan arka plan + beyaz cüzdan + para birimi tokası çizer.
Supersampling (kenar yumuşatma) ile temiz PNG'ler üretir.

Kullanım:  python3 make_icons.py
Çıktı:     ../icons/*.png
"""
import os
import zlib
import struct

# ── Renkler ────────────────────────────────────────────────────────────
TOP    = (52, 211, 153)   # emerald-400  (#34D399)
BOTTOM = (4, 120, 87)     # emerald-700  (#047857)
WHITE  = (255, 255, 255)
FLAP   = (220, 252, 231)  # emerald-50   (#DCFCE7)
ACCENT = (4, 95, 70)      # koyu emerald (toka / kart yuvası)


def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def in_round_rect(u, v, x0, y0, x1, y1, r):
    """(u,v) noktası, köşeleri r yarıçapla yuvarlatılmış dikdörtgenin içinde mi?"""
    if u < x0 or u > x1 or v < y0 or v > y1:
        return False
    cx = min(max(u, x0 + r), x1 - r)
    cy = min(max(v, y0 + r), y1 - r)
    dx, dy = u - cx, v - cy
    return dx * dx + dy * dy <= r * r


def in_circle(u, v, cx, cy, r):
    dx, dy = u - cx, v - cy
    return dx * dx + dy * dy <= r * r


def color_at(u, v, scale):
    """Birim karede (0..1) bir alt-pikselin rengini döndürür.
    scale: içerik ölçeği (maskable ikonlar için < 1, güvenli alanda kalsın)."""
    # Arka plan: çapraz gradyan (sol-üst açık → sağ-alt koyu)
    bg = lerp(TOP, BOTTOM, max(0.0, min(1.0, (u + v) / 2)))

    # İçeriği merkez etrafında ölçekle (maskable için)
    cu = 0.5 + (u - 0.5) / scale
    cv = 0.5 + (v - 0.5) / scale
    if cu < 0 or cu > 1 or cv < 0 or cv > 1:
        return bg

    # Cüzdan gövdesi
    wx0, wy0, wx1, wy1, wr = 0.20, 0.30, 0.80, 0.73, 0.075
    if in_round_rect(cu, cv, wx0, wy0, wx1, wy1, wr):
        # Kart yuvası (üstte ince koyu çizgi)
        if in_round_rect(cu, cv, 0.30, 0.255, 0.70, 0.315, 0.030):
            return ACCENT
        # Üst flap (hafif yeşilimsi beyaz)
        if cv < wy0 + 0.11:
            color = FLAP
        else:
            color = WHITE
        # Toka (sağ-merkezde koyu daire — gövdeyi "deler")
        if in_circle(cu, cv, 0.705, 0.515, 0.052):
            return ACCENT
        if in_circle(cu, cv, 0.705, 0.515, 0.072):
            return color  # toka çevresi beyaz halka
        return color

    return bg


def render(size, ss, scale):
    """size×size PNG için RGBA bytearray üretir (ss = supersample faktörü)."""
    raw = bytearray()
    inv = 1.0 / size
    sub = 1.0 / ss
    half = sub / 2.0
    nsamp = ss * ss
    for y in range(size):
        raw.append(0)  # filtre baytı
        for x in range(size):
            r = g = b = 0
            for sy in range(ss):
                for sx in range(ss):
                    u = (x + (sx * sub) + half) * inv
                    v = (y + (sy * sub) + half) * inv
                    cr, cg, cb = color_at(u, v, scale)
                    r += cr; g += cg; b += cb
            raw.append(r // nsamp)
            raw.append(g // nsamp)
            raw.append(b // nsamp)
            raw.append(255)
    return raw


def write_png(path, size, raw):
    def chunk(tag, data):
        c = tag + data
        return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xffffffff)
    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)  # 8-bit RGBA
    idat = zlib.compress(bytes(raw), 9)
    with open(path, "wb") as f:
        f.write(sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b""))


def main():
    out = os.path.join(os.path.dirname(__file__), "..", "icons")
    os.makedirs(out, exist_ok=True)
    # (dosya adı, boyut, supersample, içerik ölçeği)
    targets = [
        ("favicon-32.png",          32,  8, 1.0),
        ("apple-touch-icon-180.png", 180, 5, 1.0),
        ("pwa-192.png",             192, 5, 1.0),
        ("pwa-512.png",             512, 3, 1.0),
        ("maskable-512.png",        512, 3, 0.74),  # güvenli alan için küçült
    ]
    for name, size, ss, scale in targets:
        raw = render(size, ss, scale)
        write_png(os.path.join(out, name), size, raw)
        print(f"  ✓ {name} ({size}×{size})")
    print("Tüm ikonlar üretildi → harcama-takip/icons/")


if __name__ == "__main__":
    main()
