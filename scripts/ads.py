#!/usr/bin/env python3
"""
Asis Asansör - Google Ads Sabah Raporu
Kullanım: python3 ads.py [morning_report|campaigns|keywords|search_terms|set_budget|pause|enable]
Çevre değişkeni (GitHub Secret): ASIS_ADS_WORKFLOW  (JSON string)
Lokal: ~/.gads_config.json
"""

import sys, os, json, requests, io
from datetime import date, timedelta
from contextlib import redirect_stdout

# ── Kimlik bilgileri ──────────────────────────────────────────────────────────
def load_config():
    raw = os.environ.get("ASIS_ADS_WORKFLOW")
    if raw:
        return json.loads(raw)
    config_file = os.path.expanduser("~/.gads_config.json")
    if os.path.exists(config_file):
        with open(config_file) as f:
            return json.load(f)
    raise SystemExit(
        "❌  Kimlik bilgisi bulunamadı.\n"
        "    Lokal: ~/.gads_config.json\n"
        "    CI:    ASIS_ADS_WORKFLOW secret (JSON)"
    )

CFG            = load_config()
CUSTOMER_ID    = str(CFG["login_customer_id"]).replace("-", "")
DEV_TOKEN      = CFG["developer_token"]
CLIENT_ID      = CFG["client_id"]
CLIENT_SECRET  = CFG["client_secret"]
REFRESH_TOKEN  = CFG["refresh_token"]
TOKEN_URL      = "https://oauth2.googleapis.com/token"
GADS_HOST      = "https://googleads.googleapis.com"

_access_token = None
_api_version  = None

def get_token():
    global _access_token
    if _access_token:
        return _access_token
    r = requests.post(TOKEN_URL, data={
        "client_id":     CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "refresh_token": REFRESH_TOKEN,
        "grant_type":    "refresh_token",
    })
    r.raise_for_status()
    _access_token = r.json()["access_token"]
    return _access_token

def api_headers():
    return {
        "Authorization":      f"Bearer {get_token()}",
        "developer-token":    DEV_TOKEN,
        "login-customer-id":  CUSTOMER_ID,   # MCC veya doğrudan hesap için gerekli
        "Content-Type":       "application/json",
    }

def api_error_detail(r):
    """API hata yanıtından okunabilir mesaj üretir."""
    try:
        body = r.json()
        err  = body.get("error", {})
        msg  = err.get("message", "")
        # details içinde daha spesifik hata olabilir
        for d in err.get("details", []):
            for e in d.get("errors", []):
                msg += f"\n   → {e.get('errorCode', '')} : {e.get('message', '')}"
        return msg or r.text[:300]
    except Exception:
        return r.text[:300]

def detect_api_version():
    """Aktif Google Ads API versiyonunu bulur. JSON response = versiyon var."""
    global _api_version
    if _api_version:
        return _api_version
    hdrs = api_headers()
    print("🔍 API versiyonu tespit ediliyor...", flush=True)
    for ver in [f"v{n}" for n in range(30, 13, -1)]:
        url = f"{GADS_HOST}/{ver}/customers/{CUSTOMER_ID}/googleAds:search"
        try:
            r = requests.post(url, headers=hdrs,
                              json={"query": "SELECT customer.id FROM customer LIMIT 1"},
                              timeout=8)
            ct = r.headers.get("content-type", "")
            if "application/json" in ct or r.status_code == 200:
                _api_version = ver
                print(f"✅ Aktif versiyon: {ver} (HTTP {r.status_code})", flush=True)
                return ver
            print(f"   {ver}: HTTP {r.status_code} (HTML → yok)", flush=True)
        except Exception as e:
            print(f"   {ver}: hata → {e}", flush=True)
            continue
    raise SystemExit("❌  Çalışan Google Ads API versiyonu bulunamadı (v14-v30 tarandı).")

def api_base():
    return f"{GADS_HOST}/{detect_api_version()}"

def gaql(query, page_size=1000):
    url  = f"{api_base()}/customers/{CUSTOMER_ID}/googleAds:search"
    body = {"query": query, "pageSize": page_size}
    rows = []
    while True:
        r = requests.post(url, headers=api_headers(), json=body)
        if not r.ok:
            raise SystemExit(f"❌  API Hatası ({r.status_code}): {api_error_detail(r)}")
        data = r.json()
        rows.extend(data.get("results", []))
        token = data.get("nextPageToken")
        if not token:
            break
        body["pageToken"] = token
    return rows

def mutate(operations, resource="campaigns"):
    url = f"{api_base()}/customers/{CUSTOMER_ID}/{resource}:mutate"
    r   = requests.post(url, headers=api_headers(), json={"operations": operations})
    if not r.ok:
        raise SystemExit(f"❌  Mutate Hatası ({r.status_code}): {api_error_detail(r)}")
    return r.json()

# ── Yardımcı ──────────────────────────────────────────────────────────────────
def drange(days_back_start, days_back_end=1):
    end   = date.today() - timedelta(days=days_back_end)
    start = date.today() - timedelta(days=days_back_start)
    return start.strftime("%Y-%m-%d"), end.strftime("%Y-%m-%d")

def micros(v):  return int(v or 0)
def tl(m):      return m / 1_000_000
def fmt_tl(m):  return f"₺{tl(m):.2f}"
def fmt_pct(v): return f"{float(v or 0)*100:.2f}%"
def safe_f(v):  return float(v or 0)

def trend(val, avg, thr=0.1):
    if avg == 0: return "→"
    return "↑" if val > avg * (1 + thr) else ("↓" if val < avg * (1 - thr) else "→")

# ── 1. Kampanya raporu ────────────────────────────────────────────────────────
def cmd_campaigns():
    d_start, d_end = drange(1, 1)
    w_start, w_end = drange(7, 1)

    q_day = f"""
        SELECT campaign.id, campaign.name, campaign.status,
               campaign_budget.amount_micros,
               metrics.clicks, metrics.impressions, metrics.ctr,
               metrics.average_cpc, metrics.cost_micros, metrics.conversions
        FROM   campaign
        WHERE  segments.date BETWEEN '{d_start}' AND '{d_end}'
          AND  campaign.status != 'REMOVED'
        ORDER  BY metrics.cost_micros DESC
    """
    q_week = f"""
        SELECT campaign.id, metrics.clicks, metrics.cost_micros, metrics.conversions
        FROM   campaign
        WHERE  segments.date BETWEEN '{w_start}' AND '{w_end}'
          AND  campaign.status != 'REMOVED'
    """

    print(f"\n## 📅 Kampanya Raporu — Dün ({d_end})\n")

    yesterday = {}
    for row in gaql(q_day):
        c = row.get("campaign", {})
        m = row.get("metrics", {})
        b = row.get("campaignBudget", {})
        yesterday[c["id"]] = {
            "name":   c.get("name", "?"),
            "status": c.get("status", "?"),
            "budget": micros(b.get("amountMicros", 0)),
            "clicks": int(m.get("clicks", 0)),
            "impr":   int(m.get("impressions", 0)),
            "ctr":    safe_f(m.get("ctr", 0)),
            "cpc":    micros(m.get("averageCpc", 0)),
            "cost":   micros(m.get("costMicros", 0)),
            "conv":   safe_f(m.get("conversions", 0)),
        }

    weekly = {}
    for row in gaql(q_week):
        k = row.get("campaign", {}).get("id")
        m = row.get("metrics", {})
        if k not in weekly:
            weekly[k] = {"clicks": 0, "cost": 0, "conv": 0}
        weekly[k]["clicks"] += int(m.get("clicks", 0))
        weekly[k]["cost"]   += micros(m.get("costMicros", 0))
        weekly[k]["conv"]   += safe_f(m.get("conversions", 0))

    anomalies = []
    for k, d in yesterday.items():
        w          = weekly.get(k, {})
        avg_clicks = w.get("clicks", 0) / 7
        avg_cost   = w.get("cost",   0) / 7
        avg_conv   = w.get("conv",   0) / 7
        budget_pct = (d["cost"] / d["budget"] * 100) if d["budget"] > 0 else 0

        if budget_pct >= 95:
            anomalies.append(f"Bütçe erken tükendi: **{d['name']}** (%{budget_pct:.0f})")

        print(f"### 🏷️ {d['name']} `[{d['status']}]`")
        print(f"| Metrik | Dün | 7g Ort | Trend |")
        print(f"|--------|-----|--------|-------|")
        print(f"| Tıklama | {d['clicks']} | {avg_clicks:.1f} | {trend(d['clicks'], avg_clicks)} |")
        print(f"| Gösterim | {d['impr']} | — | — |")
        print(f"| CTR | {fmt_pct(d['ctr'])} | — | — |")
        print(f"| Harcama | {fmt_tl(d['cost'])} | {fmt_tl(avg_cost)} | {trend(d['cost'], avg_cost)} |")
        print(f"| Bütçe kul. | %{budget_pct:.0f} {'⚠️' if budget_pct>=95 else ''} | — | — |")
        print(f"| Dönüşüm | {d['conv']:.1f} | {avg_conv:.1f} | {trend(d['conv'], avg_conv)} |")
        print(f"| CPC | {fmt_tl(d['cpc'])} | — | — |")
        print()

    return anomalies, yesterday, weekly


# ── 2. Anahtar kelime analizi ──────────────────────────────────────────────────
def cmd_keywords():
    d_start, d_end = drange(30, 1)
    q = f"""
        SELECT ad_group_criterion.keyword.text,
               ad_group_criterion.keyword.matchType,
               ad_group_criterion.qualityInfo.qualityScore,
               metrics.clicks, metrics.cost_micros,
               metrics.conversions, metrics.average_cpc
        FROM   keyword_view
        WHERE  segments.date BETWEEN '{d_start}' AND '{d_end}'
          AND  ad_group_criterion.status != 'REMOVED'
          AND  campaign.status != 'REMOVED'
        ORDER  BY metrics.cost_micros DESC
        LIMIT  100
    """

    print(f"## 🔑 Anahtar Kelime Analizi — Son 30 gün\n")

    wasters, converters, low_qs = [], [], []
    for row in gaql(q):
        kw   = row.get("adGroupCriterion", {}).get("keyword", {})
        qi   = row.get("adGroupCriterion", {}).get("qualityInfo", {})
        m    = row.get("metrics", {})
        cost = micros(m.get("costMicros", 0))
        conv = safe_f(m.get("conversions", 0))
        qs   = qi.get("qualityScore")
        entry = {
            "kw":    kw.get("text", "?"),
            "match": kw.get("matchType", "?")[:3],
            "cost":  cost, "conv": conv,
            "cpc":   micros(m.get("averageCpc", 0)),
            "qs":    qs,
        }
        if cost > 50_000_000 and conv == 0:
            wasters.append(entry)
        if conv > 0:
            converters.append(entry)
        if qs and int(qs) <= 3:
            low_qs.append(entry)

    print("### 🔥 Para Yakanlar (harcama > ₺50, dönüşüm = 0)")
    if wasters:
        for e in sorted(wasters, key=lambda x: -x["cost"])[:10]:
            print(f"- `[{e['match']}]` **{e['kw']}** — {fmt_tl(e['cost'])} — conv:0 — QS:{e['qs'] or '?'}")
    else:
        print("- ✅ Yok")

    print(f"\n### ✅ Dönüşüm Getirenler")
    if converters:
        for e in sorted(converters, key=lambda x: -x["conv"])[:10]:
            print(f"- `[{e['match']}]` **{e['kw']}** — {fmt_tl(e['cost'])} — conv:{e['conv']:.1f} — QS:{e['qs'] or '?'}")
    else:
        print("- ⚠️ Son 30 günde dönüşüm yok")

    print(f"\n### 🟡 Düşük Quality Score (≤ 3)")
    if low_qs:
        for e in sorted(low_qs, key=lambda x: int(x["qs"] or 9))[:10]:
            print(f"- QS:{e['qs']} `[{e['match']}]` **{e['kw']}** — {fmt_tl(e['cost'])}")
    else:
        print("- ✅ Yok")
    print()

    return wasters, converters, low_qs


# ── 3. Arama terimi taraması ───────────────────────────────────────────────────
NEGATIVE_SIGNALS = [
    "nasıl", "diy", "ucuz", "ücretsiz", "bedava", "ne kadar fiyat",
    "iş ilanı", "eleman", "mühendis", "öğrenci", "ders", "sertifika",
    "kurs", "youtube", "wikipedia", "resim", "logo",
]

def cmd_search_terms():
    d_start, d_end = drange(7, 1)
    q = f"""
        SELECT search_term_view.search_term, search_term_view.status,
               metrics.clicks, metrics.cost_micros, metrics.conversions
        FROM   search_term_view
        WHERE  segments.date BETWEEN '{d_start}' AND '{d_end}'
          AND  metrics.impressions > 0
        ORDER  BY metrics.cost_micros DESC
        LIMIT  200
    """

    print(f"## 🔍 Arama Terimi Taraması — Son 7 gün\n")

    neg_add, pos_add = [], []
    for row in gaql(q):
        stv    = row.get("searchTermView", {})
        m      = row.get("metrics", {})
        term   = stv.get("searchTerm", "").lower()
        cost   = micros(m.get("costMicros", 0))
        conv   = safe_f(m.get("conversions", 0))
        status = stv.get("status", "")

        if cost > 10_000_000 and conv == 0 and any(s in term for s in NEGATIVE_SIGNALS):
            neg_add.append({"term": stv.get("searchTerm"), "cost": cost,
                            "clicks": int(m.get("clicks", 0))})
        if conv > 0 and status == "NONE":
            pos_add.append({"term": stv.get("searchTerm"), "conv": conv, "cost": cost})

    print("### 🚫 Negatife Eklenmesi Önerilen Terimler")
    if neg_add:
        for e in sorted(neg_add, key=lambda x: -x["cost"])[:15]:
            print(f'- `"{e["term"]}"` — {fmt_tl(e["cost"])} — {e["clicks"]} tık')
    else:
        print("- ✅ Belirgin negatif aday yok")

    print(f"\n### ➕ Pozitif Keyword Adayları")
    if pos_add:
        for e in sorted(pos_add, key=lambda x: -x["conv"])[:10]:
            print(f'- `"{e["term"]}"` — conv:{e["conv"]:.1f} — {fmt_tl(e["cost"])}')
    else:
        print("- ℹ️ Yok")
    print()

    return neg_add, pos_add


# ── 4. Karar önerisi ──────────────────────────────────────────────────────────
def cmd_decision(wasters=None, neg_add=None, converters=None, anomalies=None):
    print(f"## 📋 Karar Önerisi\n")

    suggestions = []
    if anomalies:
        for a in anomalies:
            suggestions.append(("🔴 ACİL", a, "Bütçe artır veya reklam çizelgesini düzenle"))
    if neg_add:
        suggestions.append(("🚫 Negatif kelime ekle",
            f"{len(neg_add)} alakasız terim bütçe tüketiyor",
            "Onay bekliyor"))
    if wasters:
        suggestions.append(("⏸️ Para yakan kelimeleri duraklat",
            f"{len(wasters)} kelime 0 dönüşümle bütçe eriyor",
            "Onay bekliyor"))
    if converters:
        suggestions.append(("💰 Dönüşüm getiren kelimelere bütçe kaydır",
            "En iyi kelimeler için teklif artır",
            "Onay bekliyor"))
    if not suggestions:
        suggestions.append(("✅ Bekle", "Aksiyon gerektiren durum yok", "—"))

    for title, reason, action in suggestions:
        print(f"- **{title}**: {reason} → _{action}_")

    print(f"\n> ⚠️ **Onay almadan değişiklik yapılmadı.** Yukarıdaki öneri(ler) için onay ver.")


# ── 5. Tam sabah raporu ───────────────────────────────────────────────────────
def cmd_morning_report(output_file=None):
    buf = io.StringIO()
    with redirect_stdout(buf):
        today_str = date.today().strftime("%d %B %Y")
        print(f"# ☀️ Asis Asansör — Sabah Raporu\n**{today_str}**\n\n---\n")
        anomalies, _, _ = cmd_campaigns()
        wasters, converters, _ = cmd_keywords()
        neg_add, _ = cmd_search_terms()
        cmd_decision(wasters=wasters, neg_add=neg_add,
                     converters=converters, anomalies=anomalies)

    output = buf.getvalue()
    if anomalies:
        output = "🔴 **ANOMALİ ALGILANDI**\n\n" + output

    if output_file:
        with open(output_file, "w") as f:
            f.write(output)
        print(f"Rapor kaydedildi: {output_file}")
    else:
        print(output)

    return output


# ── 6. Bütçe değiştir ─────────────────────────────────────────────────────────
def cmd_set_budget(args):
    if len(args) < 2:
        print("Kullanım: ads.py set_budget <campaign_id> <günlük_tl>"); return
    rows = gaql(f"SELECT campaign.id, campaign_budget.resource_name FROM campaign WHERE campaign.id = {args[0]}")
    if not rows:
        print(f"❌  Kampanya bulunamadı: {args[0]}"); return
    budget_rn = rows[0]["campaignBudget"]["resourceName"]
    mutate([{"update": {"resourceName": budget_rn,
                        "amountMicros": str(int(float(args[1]) * 1_000_000))},
             "updateMask": "amountMicros"}], resource="campaignBudgets")
    print(f"✅  Bütçe güncellendi → ₺{float(args[1]):.2f}/gün")


# ── 7. Kampanya durdur / aktifleştir ──────────────────────────────────────────
def _set_status(campaign_id, status):
    rows = gaql(f"SELECT campaign.resource_name FROM campaign WHERE campaign.id = {campaign_id}")
    if not rows:
        print(f"❌  Kampanya bulunamadı: {campaign_id}"); return
    rn = rows[0]["campaign"]["resourceName"]
    mutate([{"update": {"resourceName": rn, "status": status}, "updateMask": "status"}])
    print(f"✅  Kampanya {status}")

def cmd_pause(args):
    if not args: print("Kullanım: ads.py pause <campaign_id>"); return
    _set_status(args[0], "PAUSED")

def cmd_enable(args):
    if not args: print("Kullanım: ads.py enable <campaign_id>"); return
    _set_status(args[0], "ENABLED")


# ── Giriş noktası ─────────────────────────────────────────────────────────────
COMMANDS = {
    "campaigns":      lambda a: cmd_campaigns(),
    "keywords":       lambda a: cmd_keywords(),
    "search_terms":   lambda a: cmd_search_terms(),
    "morning_report": lambda a: cmd_morning_report(a[0] if a else None),
    "set_budget":     cmd_set_budget,
    "pause":          cmd_pause,
    "enable":         cmd_enable,
}

if __name__ == "__main__":
    if len(sys.argv) < 2 or sys.argv[1] not in COMMANDS:
        print("Kullanım: ads.py [" + "|".join(COMMANDS) + "] [argümanlar...]")
        sys.exit(1)
    COMMANDS[sys.argv[1]](sys.argv[2:])
