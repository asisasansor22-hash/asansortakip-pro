import urllib.request
import urllib.parse
import json
import os

# Credentials .env dosyasından veya environment variable'lardan okunur
CLIENT_ID = os.environ.get("GOOGLE_ADS_CLIENT_ID", "")
CLIENT_SECRET = os.environ.get("GOOGLE_ADS_CLIENT_SECRET", "")
REFRESH_TOKEN = os.environ.get("GOOGLE_ADS_REFRESH_TOKEN", "")
DEVELOPER_TOKEN = os.environ.get("GOOGLE_ADS_DEVELOPER_TOKEN", "")
CUSTOMER_ID = os.environ.get("GOOGLE_ADS_LOGIN_CUSTOMER_ID", "7840558523")

def load_env(path=".env"):
    if not os.path.exists(path):
        return
    with open(path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

def get_access_token():
    data = urllib.parse.urlencode({
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "refresh_token": REFRESH_TOKEN,
        "grant_type": "refresh_token"
    }).encode()
    req = urllib.request.Request("https://oauth2.googleapis.com/token", data=data, method="POST")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())["access_token"]

def get_campaigns(access_token):
    query = """
        SELECT
          campaign.name,
          campaign.status,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.ctr,
          metrics.average_cpc
        FROM campaign
        WHERE segments.date DURING LAST_30_DAYS
        ORDER BY metrics.cost_micros DESC
        LIMIT 20
    """
    url = f"https://googleads.googleapis.com/v17/customers/{CUSTOMER_ID}/googleAds:search"
    body = json.dumps({"query": query}).encode()
    req = urllib.request.Request(url, data=body, method="POST")
    req.add_header("Authorization", f"Bearer {access_token}")
    req.add_header("developer-token", DEVELOPER_TOKEN)
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        err = json.loads(e.read().decode())
        print("Hata:", json.dumps(err, indent=2, ensure_ascii=False))
        return None

def main():
    load_env()
    # env yüklendikten sonra değerleri güncelle
    global CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN, DEVELOPER_TOKEN, CUSTOMER_ID
    CLIENT_ID = os.environ.get("GOOGLE_ADS_CLIENT_ID", CLIENT_ID)
    CLIENT_SECRET = os.environ.get("GOOGLE_ADS_CLIENT_SECRET", CLIENT_SECRET)
    REFRESH_TOKEN = os.environ.get("GOOGLE_ADS_REFRESH_TOKEN", REFRESH_TOKEN)
    DEVELOPER_TOKEN = os.environ.get("GOOGLE_ADS_DEVELOPER_TOKEN", DEVELOPER_TOKEN)
    CUSTOMER_ID = os.environ.get("GOOGLE_ADS_LOGIN_CUSTOMER_ID", CUSTOMER_ID)

    if not all([CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN, DEVELOPER_TOKEN]):
        print("HATA: .env dosyası bulunamadı veya eksik. Lütfen .env dosyasını oluşturun.")
        print("Gereken değişkenler: GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, GOOGLE_ADS_REFRESH_TOKEN, GOOGLE_ADS_DEVELOPER_TOKEN")
        return

    print("Token alınıyor...")
    token = get_access_token()
    print("Kampanyalar çekiliyor...\n")
    data = get_campaigns(token)
    if not data:
        return
    rows = data.get("results", [])
    if not rows:
        print("Sonuç bulunamadı.")
        return
    print(f"{'Kampanya':<40} {'Durum':<12} {'Gösterim':>10} {'Tıklama':>8} {'Harcama (TL)':>13} {'CTR':>8}")
    print("-" * 100)
    for row in rows:
        c = row.get("campaign", {})
        m = row.get("metrics", {})
        cost = int(m.get("costMicros", 0)) / 1_000_000
        ctr = float(m.get("ctr", 0)) * 100
        print(f"{c.get('name',''):<40} {c.get('status',''):<12} {int(m.get('impressions',0)):>10,} {int(m.get('clicks',0)):>8,} {cost:>13.2f} {ctr:>7.2f}%")

if __name__ == "__main__":
    main()
