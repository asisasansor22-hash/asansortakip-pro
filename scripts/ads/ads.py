#!/usr/bin/env python3
import sys, json, urllib.request, urllib.parse
from pathlib import Path

CFG = {}
for line in Path("/tmp/gads/config.yaml").read_text().splitlines():
    if ":" in line and not line.startswith("#"):
        k, v = line.split(":", 1)
        CFG[k.strip()] = v.strip()

def token():
    data = urllib.parse.urlencode({
        "client_id": CFG["client_id"],
        "client_secret": CFG["client_secret"],
        "refresh_token": CFG["refresh_token"],
        "grant_type": "refresh_token",
    }).encode()
    r = urllib.request.urlopen("https://oauth2.googleapis.com/token", data=data, timeout=20)
    return json.loads(r.read())["access_token"]

def search(query, cid=None):
    cid = cid or CFG["login_customer_id"]
    url = f"https://googleads.googleapis.com/v20/customers/{cid}/googleAds:search"
    headers = {
        "Authorization": f"Bearer {token()}",
        "developer-token": CFG["developer_token"],
        "Content-Type": "application/json",
    }
    if CFG.get("login_customer_id"):
        headers["login-customer-id"] = CFG["login_customer_id"]
    req = urllib.request.Request(url, data=json.dumps({"query": query}).encode(), headers=headers)
    return json.loads(urllib.request.urlopen(req, timeout=30).read())

def mutate(endpoint, body, cid=None):
    cid = cid or CFG["login_customer_id"]
    url = f"https://googleads.googleapis.com/v20/customers/{cid}/{endpoint}:mutate"
    headers = {
        "Authorization": f"Bearer {token()}",
        "developer-token": CFG["developer_token"],
        "login-customer-id": CFG["login_customer_id"],
        "Content-Type": "application/json",
    }
    req = urllib.request.Request(url, data=json.dumps(body).encode(), headers=headers)
    return json.loads(urllib.request.urlopen(req, timeout=30).read())

def cmd_campaigns():
    q = ("SELECT campaign.id, campaign.name, campaign.status, "
         "campaign_budget.amount_micros, metrics.clicks, metrics.impressions, "
         "metrics.cost_micros, metrics.conversions, metrics.ctr, metrics.average_cpc "
         "FROM campaign WHERE segments.date DURING LAST_7_DAYS "
         "AND campaign.status != 'REMOVED'")
    r = search(q)
    out = []
    for row in r.get("results", []):
        c = row["campaign"]; m = row.get("metrics", {}); b = row.get("campaignBudget", {})
        out.append({
            "id": c["id"], "name": c["name"], "status": c["status"],
            "daily_budget_tl": int(b.get("amountMicros", 0))/1_000_000,
            "clicks_7d": int(m.get("clicks", 0)),
            "impr_7d": int(m.get("impressions", 0)),
            "cost_7d_tl": round(int(m.get("costMicros", 0))/1_000_000, 2),
            "conv_7d": float(m.get("conversions", 0)),
            "ctr_pct": round(float(m.get("ctr", 0))*100, 2),
            "cpc_tl": round(int(m.get("averageCpc", 0))/1_000_000, 2),
        })
    print(json.dumps(out, indent=2, ensure_ascii=False))

def cmd_keywords(campaign_id=None):
    where = f"AND campaign.id = {campaign_id}" if campaign_id else ""
    q = (f"SELECT ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type, "
         f"ad_group_criterion.quality_info.quality_score, metrics.clicks, metrics.impressions, "
         f"metrics.cost_micros, metrics.average_cpc, metrics.conversions FROM keyword_view "
         f"WHERE segments.date DURING LAST_7_DAYS AND ad_group_criterion.status = 'ENABLED' "
         f"{where} ORDER BY metrics.cost_micros DESC LIMIT 50")
    r = search(q)
    out = []
    for row in r.get("results", []):
        k = row["adGroupCriterion"]["keyword"]; m = row.get("metrics", {})
        out.append({
            "kw": k["text"], "match": k["matchType"],
            "qs": row["adGroupCriterion"].get("qualityInfo", {}).get("qualityScore"),
            "clicks": int(m.get("clicks", 0)),
            "impr": int(m.get("impressions", 0)),
            "cost_tl": round(int(m.get("costMicros", 0))/1_000_000, 2),
            "cpc_tl": round(int(m.get("averageCpc", 0))/1_000_000, 2),
            "conv": float(m.get("conversions", 0)),
        })
    print(json.dumps(out, indent=2, ensure_ascii=False))

def cmd_set_budget(campaign_id, daily_tl):
    bq = f"SELECT campaign.campaign_budget FROM campaign WHERE campaign.id = {campaign_id}"
    budget_res = search(bq)["results"][0]["campaign"]["campaignBudget"]
    micros = int(float(daily_tl) * 1_000_000)
    body = {"operations": [{"update": {"resourceName": budget_res, "amountMicros": str(micros)},
                            "updateMask": "amount_micros"}]}
    print(json.dumps(mutate("campaignBudgets", body), indent=2))

def cmd_status(campaign_id, status):
    cid = CFG["login_customer_id"]
    body = {"operations": [{"update": {"resourceName": f"customers/{cid}/campaigns/{campaign_id}",
                                       "status": status}, "updateMask": "status"}]}
    print(json.dumps(mutate("campaigns", body), indent=2))

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "campaigns"
    args = sys.argv[2:]
    try:
        if cmd == "campaigns": cmd_campaigns()
        elif cmd == "keywords": cmd_keywords(*args)
        elif cmd == "set_budget": cmd_set_budget(*args)
        elif cmd == "pause": cmd_status(args[0], "PAUSED")
        elif cmd == "enable": cmd_status(args[0], "ENABLED")
        else: print(f"unknown: {cmd}", file=sys.stderr); sys.exit(1)
    except urllib.error.HTTPError as e:
        print(f"HTTP {e.code}: {e.read().decode()}", file=sys.stderr); sys.exit(1)
