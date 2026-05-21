#!/usr/bin/env python3
"""
Asis Asansör - Google Ads Yönetim Scripti
Kullanım: python3 ads.py [campaigns|keywords|search_terms|morning_report|set_budget|pause|enable]
"""

import sys
import os
import json
from datetime import date, timedelta
from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException

# ── Konfigürasyon ──────────────────────────────────────────────────────────────
CONFIG_FILE = os.path.expanduser("~/.gads_config.json")
YAML_FILE   = os.path.expanduser("~/google-ads.yaml")

def load_config():
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE) as f:
            return json.load(f)
    return {}

def get_client():
    if os.path.exists(YAML_FILE):
        return GoogleAdsClient.load_from_storage(YAML_FILE)
    cfg = load_config()
    if cfg.get("developer_token"):
        return GoogleAdsClient.load_from_dict(cfg)
    raise SystemExit(
        "❌  Kimlik bilgisi bulunamadı.\n"
        "    Lütfen ~/.gads_config.json veya ~/google-ads.yaml oluştur.\n"
        "    Örnek: python3 ads.py setup"
    )

def customer_id():
    cfg = load_config()
    cid = cfg.get("login_customer_id") or os.environ.get("GADS_CUSTOMER_ID", "")
    if not cid:
        raise SystemExit("❌  GADS_CUSTOMER_ID bulunamadı.")
    return str(cid).replace("-", "")

# ── Yardımcı ──────────────────────────────────────────────────────────────────
def date_range(days_back_start, days_back_end=1):
    end   = date.today() - timedelta(days=days_back_end)
    start = date.today() - timedelta(days=days_back_start)
    return start.strftime("%Y-%m-%d"), end.strftime("%Y-%m-%d")

def fmt_pct(val):
    return f"{val*100:.2f}%"

def fmt_money(micros):
    return f"₺{micros/1_000_000:.2f}"

# ── 1. Kampanya özeti ─────────────────────────────────────────────────────────
def cmd_campaigns():
    client = get_client()
    cid    = customer_id()
    ga_svc = client.get_service("GoogleAdsService")

    d_start, d_end = date_range(1, 1)   # dün
    w_start, w_end = date_range(7, 1)   # son 7 gün

    query = f"""
        SELECT
          campaign.id,
          campaign.name,
          campaign.status,
          campaign.advertising_channel_type,
          campaign_budget.amount_micros,
          metrics.clicks,
          metrics.impressions,
          metrics.ctr,
          metrics.average_cpc,
          metrics.cost_micros,
          metrics.conversions,
          metrics.conversion_rate
        FROM campaign
        WHERE segments.date BETWEEN '{d_start}' AND '{d_end}'
          AND campaign.status != 'REMOVED'
        ORDER BY metrics.cost_micros DESC
    """

    query_7d = f"""
        SELECT
          campaign.id,
          metrics.clicks,
          metrics.impressions,
          metrics.ctr,
          metrics.average_cpc,
          metrics.cost_micros,
          metrics.conversions
        FROM campaign
        WHERE segments.date BETWEEN '{w_start}' AND '{w_end}'
          AND campaign.status != 'REMOVED'
    """

    print(f"\n📅  KAMPANYA RAPORU — Dün ({d_end})")
    print("=" * 60)

    yesterday = {}
    try:
        for row in ga_svc.search(customer_id=cid, query=query):
            c = row.campaign
            m = row.metrics
            yesterday[c.id] = {
                "name":       c.name,
                "status":     c.status.name,
                "budget":     row.campaign_budget.amount_micros,
                "clicks":     m.clicks,
                "impr":       m.impressions,
                "ctr":        m.ctr,
                "cpc":        m.average_cpc,
                "cost":       m.cost_micros,
                "conv":       m.conversions,
                "conv_rate":  m.conversion_rate,
            }
    except GoogleAdsException as ex:
        for error in ex.failure.errors:
            print(f"❌  {error.message}")
        return

    weekly = {}
    for row in ga_svc.search(customer_id=cid, query=query_7d):
        cid_key = row.campaign.id
        m = row.metrics
        if cid_key not in weekly:
            weekly[cid_key] = {"clicks": 0, "cost": 0, "conv": 0, "impr": 0}
        weekly[cid_key]["clicks"] += m.clicks
        weekly[cid_key]["cost"]   += m.cost_micros
        weekly[cid_key]["conv"]   += m.conversions
        weekly[cid_key]["impr"]   += m.impressions

    for cid_key, d in yesterday.items():
        w = weekly.get(cid_key, {})
        avg_clicks = w.get("clicks", 0) / 7
        avg_cost   = w.get("cost",   0) / 7
        avg_conv   = w.get("conv",   0) / 7

        clicks_trend = "↑" if d["clicks"] > avg_clicks * 1.1 else ("↓" if d["clicks"] < avg_clicks * 0.9 else "→")
        cost_trend   = "↑" if d["cost"]   > avg_cost   * 1.1 else ("↓" if d["cost"]   < avg_cost   * 0.9 else "→")
        conv_trend   = "↑" if d["conv"]   > avg_conv   * 1.1 else ("↓" if d["conv"]   < avg_conv   * 0.9 else "→")

        budget_used_pct = (d["cost"] / d["budget"] * 100) if d["budget"] > 0 else 0

        print(f"\n🏷️  {d['name']}  [{d['status']}]")
        print(f"   Tıklama:   {d['clicks']:>6}  (7g ort: {avg_clicks:.1f})  {clicks_trend}")
        print(f"   Gösterim:  {d['impr']:>6}")
        print(f"   CTR:       {fmt_pct(d['ctr']):>8}")
        print(f"   Harcama:   {fmt_money(d['cost']):>8}  (7g ort: {fmt_money(avg_cost)})  {cost_trend}")
        print(f"   Bütçe kul: {budget_used_pct:.0f}%  {'⚠️ Erken bitti!' if budget_used_pct >= 95 else ''}")
        print(f"   Dönüşüm:   {d['conv']:>6.1f}  (7g ort: {avg_conv:.1f})  {conv_trend}")
        print(f"   CPC:       {fmt_money(d['cpc']):>8}")


# ── 2. Anahtar kelime analizi ──────────────────────────────────────────────────
def cmd_keywords():
    client = get_client()
    cid    = customer_id()
    ga_svc = client.get_service("GoogleAdsService")

    d_start, d_end = date_range(30, 1)  # son 30 gün

    query = f"""
        SELECT
          ad_group_criterion.keyword.text,
          ad_group_criterion.keyword.match_type,
          ad_group_criterion.quality_info.quality_score,
          ad_group_criterion.status,
          ad_group.name,
          campaign.name,
          metrics.clicks,
          metrics.impressions,
          metrics.cost_micros,
          metrics.conversions,
          metrics.average_cpc
        FROM keyword_view
        WHERE segments.date BETWEEN '{d_start}' AND '{d_end}'
          AND ad_group_criterion.status != 'REMOVED'
          AND campaign.status != 'REMOVED'
        ORDER BY metrics.cost_micros DESC
        LIMIT 50
    """

    print(f"\n🔑  ANAHTAR KELİME ANALİZİ — Son 30 gün ({d_start} → {d_end})")
    print("=" * 60)

    wasters     = []
    converters  = []
    low_qs      = []

    try:
        for row in ga_svc.search(customer_id=cid, query=query):
            kw   = row.ad_group_criterion.keyword
            m    = row.metrics
            qs   = row.ad_group_criterion.quality_info.quality_score

            entry = {
                "keyword":  kw.text,
                "match":    kw.match_type.name,
                "campaign": row.campaign.name,
                "ad_group": row.ad_group.name,
                "clicks":   m.clicks,
                "cost":     m.cost_micros,
                "conv":     m.conversions,
                "cpc":      m.average_cpc,
                "qs":       qs,
            }

            if m.cost_micros > 50_000_000 and m.conversions == 0:
                wasters.append(entry)
            if m.conversions > 0:
                converters.append(entry)
            if 1 <= qs <= 3:
                low_qs.append(entry)

    except GoogleAdsException as ex:
        for error in ex.failure.errors:
            print(f"❌  {error.message}")
        return

    print("\n🔥  Para Yakanlar (harcama > ₺50, dönüşüm = 0):")
    if wasters:
        for e in sorted(wasters, key=lambda x: -x["cost"])[:10]:
            print(f"   [{e['match'][:3]}] {e['keyword']:<30} {fmt_money(e['cost']):>8}  conv:0  QS:{e['qs'] or '?'}")
    else:
        print("   ✅ Yok")

    print("\n✅  Dönüşüm Getirenler:")
    if converters:
        for e in sorted(converters, key=lambda x: -x["conv"])[:10]:
            print(f"   [{e['match'][:3]}] {e['keyword']:<30} {fmt_money(e['cost']):>8}  conv:{e['conv']:.1f}  QS:{e['qs'] or '?'}")
    else:
        print("   ⚠️  Son 30 günde dönüşüm yok")

    print("\n🟡  Düşük Quality Score (≤3):")
    if low_qs:
        for e in sorted(low_qs, key=lambda x: x["qs"])[:10]:
            print(f"   QS:{e['qs']}  [{e['match'][:3]}] {e['keyword']:<30} {fmt_money(e['cost']):>8}")
    else:
        print("   ✅ Yok")


# ── 3. Arama terimi taraması ───────────────────────────────────────────────────
def cmd_search_terms():
    client = get_client()
    cid    = customer_id()
    ga_svc = client.get_service("GoogleAdsService")

    d_start, d_end = date_range(7, 1)

    query = f"""
        SELECT
          search_term_view.search_term,
          search_term_view.status,
          campaign.name,
          metrics.clicks,
          metrics.impressions,
          metrics.cost_micros,
          metrics.conversions
        FROM search_term_view
        WHERE segments.date BETWEEN '{d_start}' AND '{d_end}'
          AND metrics.impressions > 0
        ORDER BY metrics.cost_micros DESC
        LIMIT 100
    """

    print(f"\n🔍  ARAMA TERİMİ TARAMASI — Son 7 gün ({d_start} → {d_end})")
    print("=" * 60)

    # Negatif kelime işaretçileri
    negative_signals = [
        "nasıl yapılır", "diy", "ucuz", "ücretsiz", "bedava", "ne kadar",
        "fiyatı nedir", "arıyorum iş", "mühendis", "öğrenci", "ders",
        "sertifika", "kurs", "youtube", "video", "wikipedia",
        "istanbul dışı", "ankara", "izmir", "bursa", "konya",  # adjust per city
    ]

    negative_add  = []
    positive_add  = []

    try:
        rows = list(ga_svc.search(customer_id=cid, query=query))
    except GoogleAdsException as ex:
        for error in ex.failure.errors:
            print(f"❌  {error.message}")
        return

    for row in rows:
        term = row.search_term_view.search_term.lower()
        m    = row.metrics
        is_neg_candidate = (
            m.cost_micros > 20_000_000 and m.conversions == 0 and
            any(sig in term for sig in negative_signals)
        )
        is_pos_candidate = (
            m.conversions > 0 and
            row.search_term_view.status.name == "NONE"  # henüz keyword eklenmemiş
        )
        if is_neg_candidate:
            negative_add.append({"term": row.search_term_view.search_term, "cost": m.cost_micros, "clicks": m.clicks})
        if is_pos_candidate:
            positive_add.append({"term": row.search_term_view.search_term, "conv": m.conversions, "cost": m.cost_micros})

    print("\n🚫  Negatife Eklenmesi Önerilen Terimler:")
    if negative_add:
        for e in sorted(negative_add, key=lambda x: -x["cost"])[:15]:
            print(f"   - \"{e['term']}\"  ({fmt_money(e['cost'])}  {e['clicks']} tık)")
    else:
        print("   ✅ Belirgin negatif aday yok")

    print("\n➕  Pozitif Keyword Adayları (dönüşüm getirdi ama keyword değil):")
    if positive_add:
        for e in sorted(positive_add, key=lambda x: -x["conv"])[:10]:
            print(f"   + \"{e['term']}\"  (conv:{e['conv']:.1f}  {fmt_money(e['cost'])})")
    else:
        print("   ℹ️  Yok (mevcut keyword'ler kapsıyor)")


# ── 4. Sabah raporu (hepsi bir arada) ─────────────────────────────────────────
def cmd_morning_report():
    print("\n" + "=" * 60)
    print("☀️   ASİS ASANSÖR — SABAH RAPORU")
    print(f"     {date.today().strftime('%d %B %Y')}")
    print("=" * 60)
    cmd_campaigns()
    cmd_keywords()
    cmd_search_terms()
    print("\n" + "=" * 60)
    print("📋  KARAR ÖNERİSİ → 'python3 ads.py decision' ile görüntüle")
    print("=" * 60 + "\n")


# ── 5. Bütçe değiştir ─────────────────────────────────────────────────────────
def cmd_set_budget(args):
    if len(args) < 2:
        print("Kullanım: ads.py set_budget <campaign_id> <günlük_tl>")
        return
    client = get_client()
    cid    = customer_id()
    campaign_id = args[0]
    amount_tl   = float(args[1])

    # Kampanyanın mevcut budget resource'unu bul
    ga_svc = client.get_service("GoogleAdsService")
    query  = f"""
        SELECT campaign.id, campaign_budget.resource_name, campaign_budget.amount_micros
        FROM campaign
        WHERE campaign.id = {campaign_id}
    """
    row = next(ga_svc.search(customer_id=cid, query=query), None)
    if not row:
        print(f"❌  Kampanya bulunamadı: {campaign_id}")
        return

    budget_rn = row.campaign_budget.resource_name
    budget_svc = client.get_service("CampaignBudgetService")
    budget_op  = client.get_type("CampaignBudgetOperation")
    budget     = budget_op.update
    budget.resource_name        = budget_rn
    budget.amount_micros        = int(amount_tl * 1_000_000)
    field_mask = client.get_type("FieldMask")
    field_mask.paths.append("amount_micros")
    budget_op.update_mask.CopyFrom(field_mask)

    try:
        resp = budget_svc.mutate_campaign_budgets(customer_id=cid, operations=[budget_op])
        print(f"✅  Bütçe güncellendi → ₺{amount_tl:.2f}/gün")
        print(f"   Resource: {resp.results[0].resource_name}")
    except GoogleAdsException as ex:
        for e in ex.failure.errors:
            print(f"❌  {e.message}")


# ── 6. Kampanya durdur / aktifleştir ──────────────────────────────────────────
def _set_campaign_status(campaign_id, status_str):
    client = get_client()
    cid    = customer_id()
    svc    = client.get_service("CampaignService")
    op     = client.get_type("CampaignOperation")
    campaign = op.update
    campaign.resource_name = svc.campaign_path(cid, campaign_id)
    status_enum = client.enums.CampaignStatusEnum.CampaignStatus.Value(status_str)
    campaign.status = status_enum
    field_mask = client.get_type("FieldMask")
    field_mask.paths.append("status")
    op.update_mask.CopyFrom(field_mask)
    try:
        resp = svc.mutate_campaigns(customer_id=cid, operations=[op])
        print(f"✅  Kampanya {status_str} → {resp.results[0].resource_name}")
    except GoogleAdsException as ex:
        for e in ex.failure.errors:
            print(f"❌  {e.message}")

def cmd_pause(args):
    if not args:
        print("Kullanım: ads.py pause <campaign_id>")
        return
    _set_campaign_status(args[0], "PAUSED")

def cmd_enable(args):
    if not args:
        print("Kullanım: ads.py enable <campaign_id>")
        return
    _set_campaign_status(args[0], "ENABLED")


# ── 7. İlk kurulum rehberi ────────────────────────────────────────────────────
def cmd_setup():
    print("""
🔧  KURULUM REHBERİ
──────────────────
1) Google Ads API erişimi için:
   • Google Cloud Console → yeni proje → Google Ads API etkinleştir
   • OAuth 2.0 credentials (Desktop App) indir

2) ~/.gads_config.json oluştur:
{
  "developer_token":  "YOUR_DEVELOPER_TOKEN",
  "client_id":        "YOUR_CLIENT_ID",
  "client_secret":    "YOUR_CLIENT_SECRET",
  "refresh_token":    "YOUR_REFRESH_TOKEN",
  "login_customer_id":"YOUR_MCC_OR_CUSTOMER_ID",
  "use_proto_plus":   true
}

3) Alternatif: ~/google-ads.yaml kullan
   (google-ads kütüphanesi standart formatı)

4) Test et:
   python3 ads.py campaigns
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
        print("         ads.py morning_report  → tam sabah raporu")
        print("         ads.py setup           → kurulum rehberi")
        sys.exit(1)
    COMMANDS[sys.argv[1]](sys.argv[2:])
