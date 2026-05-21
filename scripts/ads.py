#!/usr/bin/env python3
"""
Asis Asansör - Google Ads Yönetim Scripti (REST API)
Kullanım: python3 ads.py [campaigns|keywords|search_terms|morning_report|set_budget|pause|enable|setup]
"""

import sys, os, json, requests
from datetime import date, timedelta

# ── Sabitler ──────────────────────────────────────────────────────────────────
API_VERSION   = "v19"
API_BASE      = f"https://googleads.googleapis.com/{API_VERSION}"
TOKEN_URL     = "https://oauth2.googleapis.com/token"
CONFIG_FILE   = os.path.expanduser("~/.gads_config.json")

# ── Kimlik bilgileri ──────────────────────────────────────────────────────────
def load_config():
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE) as f:
            return json.load(f)
    raise SystemExit("❌  ~/.gads_config.json bulunamadı. 'ads.py setup' çalıştır.")

CFG = load_config()
CUSTOMER_ID    = str(CFG["login_customer_id"]).replace("-", "")
DEV_TOKEN      = CFG["developer_token"]
CLIENT_ID      = CFG["client_id"]
CLIENT_SECRET  = CFG["client_secret"]
REFRESH_TOKEN  = CFG["refresh_token"]

_access_token = None

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

def headers():
    return {
        "Authorization":        f"Bearer {get_token()}",
        "developer-token":      DEV_TOKEN,
        "Content-Type":         "application/json",
    }

def gaql(query, page_size=1000):
    url  = f"{API_BASE}/customers/{CUSTOMER_ID}/googleAds:search"
    body = {"query": query, "pageSize": page_size}
    rows = []
    while True:
        r = requests.post(url, headers=headers(), json=body)
        if not r.ok:
            err = r.json()
            msg = err.get("error", {}).get("message", r.text)
            raise SystemExit(f"❌  API Hatası: {msg}")
        data = r.json()
        rows.extend(data.get("results", []))
        token = data.get("nextPageToken")
        if not token:
            break
        body["pageToken"] = token
    return rows

def mutate(operations, resource="campaigns"):
    url  = f"{API_BASE}/customers/{CUSTOMER_ID}/{resource}:mutate"
    body = {"operations": operations}
    r    = requests.post(url, headers=headers(), json=body)
    if not r.ok:
        err = r.json()
        msg = err.get("error", {}).get("message", r.text)
        raise SystemExit(f"❌  Mutate Hatası: {msg}")
    return r.json()

# ── Yardımcı ──────────────────────────────────────────────────────────────────
def drange(days_back_start, days_back_end=1):
    end   = date.today() - timedelta(days=days_back_end)
    start = date.today() - timedelta(days=days_back_start)
    return start.strftime("%Y-%m-%d"), end.strftime("%Y-%m-%d")

def micros(v): return int(v or 0)
def tl(micros_val): return micros_val / 1_000_000
def fmt_tl(m): return f"₺{tl(m):.2f}"
def fmt_pct(v): return f"{float(v or 0)*100:.2f}%"
def safe_float(v): return float(v or 0)

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
               metrics.average_cpc, metrics.cost_micros,
               metrics.conversions
        FROM   campaign
        WHERE  segments.date BETWEEN '{d_start}' AND '{d_end}'
          AND  campaign.status != 'REMOVED'
        ORDER  BY metrics.cost_micros DESC
    """
    q_week = f"""
        SELECT campaign.id,
               metrics.clicks, metrics.cost_micros, metrics.conversions
        FROM   campaign
        WHERE  segments.date BETWEEN '{w_start}' AND '{w_end}'
          AND  campaign.status != 'REMOVED'
    """

    print(f"\n📅  KAMPANYA RAPORU — Dün ({d_end})")
    print("=" * 62)

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
            "ctr":    safe_float(m.get("ctr", 0)),
            "cpc":    micros(m.get("averageCpc", 0)),
            "cost":   micros(m.get("costMicros", 0)),
            "conv":   safe_float(m.get("conversions", 0)),
        }

    weekly = {}
    for row in gaql(q_week):
        cid_key = row.get("campaign", {}).get("id")
        m = row.get("metrics", {})
        if cid_key not in weekly:
            weekly[cid_key] = {"clicks": 0, "cost": 0, "conv": 0}
        weekly[cid_key]["clicks"] += int(m.get("clicks", 0))
        weekly[cid_key]["cost"]   += micros(m.get("costMicros", 0))
        weekly[cid_key]["conv"]   += safe_float(m.get("conversions", 0))

    anomaly = False
    lines   = []
    for cid_key, d in yesterday.items():
        w          = weekly.get(cid_key, {})
        avg_clicks = w.get("clicks", 0) / 7
        avg_cost   = w.get("cost",   0) / 7
        avg_conv   = w.get("conv",   0) / 7
        budget_pct = (d["cost"] / d["budget"] * 100) if d["budget"] > 0 else 0
        budget_warn = " ⚠️ Erken bitti!" if budget_pct >= 95 else ""
        if budget_pct >= 95: anomaly = True

        lines.append(
            f"\n🏷️  {d['name']}  [{d['status']}]\n"
            f"   Tıklama  : {d['clicks']:>5}   7g ort: {avg_clicks:>5.1f}  {trend(d['clicks'], avg_clicks)}\n"
            f"   Gösterim : {d['impr']:>5}\n"
            f"   CTR      : {fmt_pct(d['ctr']):>8}\n"
            f"   Harcama  : {fmt_tl(d['cost']):>8}   7g ort: {fmt_tl(avg_cost)}  {trend(d['cost'], avg_cost)}\n"
            f"   Bütçe    : %{budget_pct:.0f} kullanıldı{budget_warn}\n"
            f"   Dönüşüm  : {d['conv']:>5.1f}   7g ort: {avg_conv:>5.1f}  {trend(d['conv'], avg_conv)}\n"
            f"   CPC      : {fmt_tl(d['cpc']):>8}"
        )

    if anomaly:
        print("🔴  ANOMALİ: Bütçe erken tükenen kampanya var!")
    for l in lines:
        print(l)


# ── 2. Anahtar kelime analizi ──────────────────────────────────────────────────
def cmd_keywords():
    d_start, d_end = drange(30, 1)
    q = f"""
        SELECT ad_group_criterion.keyword.text,
               ad_group_criterion.keyword.matchType,
               ad_group_criterion.qualityInfo.qualityScore,
               ad_group.name, campaign.name,
               metrics.clicks, metrics.cost_micros,
               metrics.conversions, metrics.average_cpc
        FROM   keyword_view
        WHERE  segments.date BETWEEN '{d_start}' AND '{d_end}'
          AND  ad_group_criterion.status != 'REMOVED'
          AND  campaign.status != 'REMOVED'
        ORDER  BY metrics.cost_micros DESC
        LIMIT  100
    """

    print(f"\n🔑  ANAHTAR KELİME ANALİZİ — Son 30 gün")
    print("=" * 62)

    wasters, converters, low_qs = [], [], []
    for row in gaql(q):
        kw   = row.get("adGroupCriterion", {}).get("keyword", {})
        qi   = row.get("adGroupCriterion", {}).get("qualityInfo", {})
        m    = row.get("metrics", {})
        cost = micros(m.get("costMicros", 0))
        conv = safe_float(m.get("conversions", 0))
        qs   = qi.get("qualityScore")

        entry = {
            "kw":    kw.get("text", "?"),
            "match": kw.get("matchType", "?")[:3],
            "cost":  cost,
            "conv":  conv,
            "cpc":   micros(m.get("averageCpc", 0)),
            "qs":    qs,
        }
        if cost > 50_000_000 and conv == 0:
            wasters.append(entry)
        if conv > 0:
            converters.append(entry)
        if qs and int(qs) <= 3:
            low_qs.append(entry)

    print("\n🔥  Para Yakanlar (harcama > ₺50, dönüşüm = 0):")
    if wasters:
        for e in sorted(wasters, key=lambda x: -x["cost"])[:10]:
            print(f"   [{e['match']}] {e['kw']:<32} {fmt_tl(e['cost']):>8}  conv:0  QS:{e['qs'] or '?'}")
    else:
        print("   ✅ Yok")

    print("\n✅  Dönüşüm Getirenler:")
    if converters:
        for e in sorted(converters, key=lambda x: -x["conv"])[:10]:
            print(f"   [{e['match']}] {e['kw']:<32} {fmt_tl(e['cost']):>8}  conv:{e['conv']:.1f}  QS:{e['qs'] or '?'}")
    else:
        print("   ⚠️  Son 30 günde dönüşüm yok")

    print("\n🟡  Düşük Quality Score (≤ 3):")
    if low_qs:
        for e in sorted(low_qs, key=lambda x: int(x["qs"] or 9))[:10]:
            print(f"   QS:{e['qs']}  [{e['match']}] {e['kw']:<32} {fmt_tl(e['cost']):>8}")
    else:
        print("   ✅ Yok")

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
               campaign.name,
               metrics.clicks, metrics.cost_micros, metrics.conversions
        FROM   search_term_view
        WHERE  segments.date BETWEEN '{d_start}' AND '{d_end}'
          AND  metrics.impressions > 0
        ORDER  BY metrics.cost_micros DESC
        LIMIT  200
    """

    print(f"\n🔍  ARAMA TERİMİ TARAMASI — Son 7 gün")
    print("=" * 62)

    neg_add, pos_add = [], []
    for row in gaql(q):
        stv   = row.get("searchTermView", {})
        m     = row.get("metrics", {})
        term  = stv.get("searchTerm", "").lower()
        cost  = micros(m.get("costMicros", 0))
        conv  = safe_float(m.get("conversions", 0))
        status = stv.get("status", "")

        if cost > 10_000_000 and conv == 0 and any(s in term for s in NEGATIVE_SIGNALS):
            neg_add.append({"term": stv.get("searchTerm"), "cost": cost,
                            "clicks": int(m.get("clicks", 0))})
        if conv > 0 and status == "NONE":
            pos_add.append({"term": stv.get("searchTerm"), "conv": conv, "cost": cost})

    print("\n🚫  Negatife Eklenmesi Önerilen Terimler:")
    if neg_add:
        for e in sorted(neg_add, key=lambda x: -x["cost"])[:15]:
            print(f'   - "{e["term"]}"  ({fmt_tl(e["cost"])}  {e["clicks"]} tık)')
    else:
        print("   ✅ Belirgin negatif aday yok")

    print("\n➕  Pozitif Keyword Adayları (dönüşüm getirdi, keyword değil):")
    if pos_add:
        for e in sorted(pos_add, key=lambda x: -x["conv"])[:10]:
            print(f'   + "{e["term"]}"  (conv:{e["conv"]:.1f}  {fmt_tl(e["cost"])})')
    else:
        print("   ℹ️  Yok")

    return neg_add, pos_add


# ── 4. Karar önerisi ──────────────────────────────────────────────────────────
def cmd_decision(wasters=None, neg_add=None, converters=None):
    print(f"\n📋  KARAR ÖNERİSİ — {date.today().strftime('%d %B %Y')}")
    print("=" * 62)
    suggestions = []

    if neg_add:
        suggestions.append(("🚫 Negatif kelime ekle",
            f"{len(neg_add)} alakasız terim bütçe tüketiyor → hemen ekle"))
    if wasters:
        suggestions.append(("⏸️  Para yakan kelimeleri duraklat",
            f"{len(wasters)} kelime 0 dönüşümle bütçe eriyor → pause veya teklif düşür"))
    if converters:
        suggestions.append(("💰 Dönüşüm getiren kelimelere bütçe kaydır",
            "En iyi kelimeler için teklif artır veya kampanya bütçesini yükselt"))
    if not suggestions:
        suggestions.append(("✅ Bekle",
            "Belirgin bir aksiyon gerektiren durum yok, veri izle"))

    for title, reason in suggestions:
        print(f"\n   {title}")
        print(f"   Neden: {reason}")

    print("\n⚠️  Onay Beklenenler:")
    print("   • Negatif kelime eklemek için onayını bekliyorum")
    print("   • Teklif/bütçe değişikliği için onayını bekliyorum")
    print("   • Kelime duraklatma için onayını bekliyorum")
    print()


# ── 5. Tam sabah raporu ───────────────────────────────────────────────────────
def cmd_morning_report():
    print("\n" + "=" * 62)
    print("☀️   ASİS ASANSÖR — SABAH RAPORU")
    print(f"     {date.today().strftime('%d %B %Y')}")
    print("=" * 62)
    cmd_campaigns()
    result = cmd_keywords()
    wasters   = result[0] if result else []
    converters = result[1] if result else []
    n_result  = cmd_search_terms()
    neg_add   = n_result[0] if n_result else []
    cmd_decision(wasters=wasters, neg_add=neg_add, converters=converters)
    print("=" * 62)


# ── 6. Bütçe değiştir ─────────────────────────────────────────────────────────
def cmd_set_budget(args):
    if len(args) < 2:
        print("Kullanım: ads.py set_budget <campaign_id> <günlük_tl>"); return
    campaign_id = args[0]
    amount_tl   = float(args[1])

    # Budget resource adını bul
    rows = gaql(f"""
        SELECT campaign.id, campaign_budget.resource_name
        FROM   campaign WHERE campaign.id = {campaign_id}
    """)
    if not rows:
        print(f"❌  Kampanya bulunamadı: {campaign_id}"); return

    budget_rn = rows[0]["campaignBudget"]["resourceName"]
    ops = [{"update": {"resourceName": budget_rn,
                        "amountMicros": str(int(amount_tl * 1_000_000))},
             "updateMask": "amountMicros"}]
    resp = mutate(ops, resource="campaignBudgets")
    print(f"✅  Bütçe güncellendi → ₺{amount_tl:.2f}/gün")
    print(f"   Resource: {resp['results'][0]['resourceName']}")


# ── 7. Kampanya durdur / aktifleştir ──────────────────────────────────────────
def _set_status(campaign_id, status):
    rows = gaql(f"SELECT campaign.resource_name FROM campaign WHERE campaign.id = {campaign_id}")
    if not rows:
        print(f"❌  Kampanya bulunamadı: {campaign_id}"); return
    rn  = rows[0]["campaign"]["resourceName"]
    ops = [{"update": {"resourceName": rn, "status": status}, "updateMask": "status"}]
    resp = mutate(ops, resource="campaigns")
    print(f"✅  Kampanya {status} → {resp['results'][0]['resourceName']}")

def cmd_pause(args):
    if not args: print("Kullanım: ads.py pause <campaign_id>"); return
    _set_status(args[0], "PAUSED")

def cmd_enable(args):
    if not args: print("Kullanım: ads.py enable <campaign_id>"); return
    _set_status(args[0], "ENABLED")


# ── 8. Kurulum rehberi ────────────────────────────────────────────────────────
def cmd_setup():
    print("""
🔧  KURULUM REHBERİ
──────────────────
~/.gads_config.json dosyasını oluştur:

{
  "developer_token":   "YOUR_DEVELOPER_TOKEN",
  "client_id":         "YOUR_CLIENT_ID.apps.googleusercontent.com",
  "client_secret":     "YOUR_CLIENT_SECRET",
  "refresh_token":     "YOUR_REFRESH_TOKEN",
  "login_customer_id": "1234567890",
  "use_proto_plus":    true
}

Test: python3 ads.py campaigns
""")


# ── Giriş noktası ─────────────────────────────────────────────────────────────
COMMANDS = {
    "campaigns":      lambda a: cmd_campaigns(),
    "keywords":       lambda a: cmd_keywords(),
    "search_terms":   lambda a: cmd_search_terms(),
    "morning_report": lambda a: cmd_morning_report(),
    "set_budget":     cmd_set_budget,
    "pause":          cmd_pause,
    "enable":         cmd_enable,
    "setup":          lambda a: cmd_setup(),
}

if __name__ == "__main__":
    if len(sys.argv) < 2 or sys.argv[1] not in COMMANDS:
        print("Kullanım: ads.py [" + "|".join(COMMANDS) + "] [argümanlar...]")
        sys.exit(1)
    COMMANDS[sys.argv[1]](sys.argv[2:])
