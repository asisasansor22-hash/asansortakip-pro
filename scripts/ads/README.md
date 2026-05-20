# Google Ads Skill

Asis Asansör Google Ads hesabını sorgulamak ve yönetmek için CLI script.

## Kurulum (tek seferlik)

Claude Code web environment ayarlarında şu env vars'ları ekle:

| Env Var | Değer |
|---|---|
| `GADS_DEVELOPER_TOKEN` | Developer token |
| `GADS_CLIENT_ID` | OAuth client ID |
| `GADS_CLIENT_SECRET` | OAuth client secret |
| `GADS_REFRESH_TOKEN` | OAuth refresh token |
| `GADS_LOGIN_CUSTOMER_ID` | `7840558523` |

`.claude/hooks/setup-gads.sh` her session başında bunları `/tmp/gads/config.yaml`'e yazar.

## Kullanım

```bash
python3 /tmp/gads/ads.py campaigns              # son 7 gün kampanya performansı
python3 /tmp/gads/ads.py keywords [campaign_id] # en pahalı 50 anahtar kelime
python3 /tmp/gads/ads.py set_budget <id> <tl>   # günlük bütçe değiştir
python3 /tmp/gads/ads.py pause <id>             # kampanya duraklat
python3 /tmp/gads/ads.py enable <id>            # kampanya aç
```
