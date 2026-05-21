#!/bin/bash
# SessionStart hook: provisions Google Ads credentials into /tmp/gads
# Source order:
#   1. GADS_* environment variables (if set)
#   2. scripts/ads/config.yaml in the repo (fallback)

set -e

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
mkdir -p /tmp/gads

if [ -n "$GADS_DEVELOPER_TOKEN" ] && [ -n "$GADS_REFRESH_TOKEN" ]; then
  cat > /tmp/gads/config.yaml <<EOF
developer_token: ${GADS_DEVELOPER_TOKEN}
client_id: ${GADS_CLIENT_ID}
client_secret: ${GADS_CLIENT_SECRET}
refresh_token: ${GADS_REFRESH_TOKEN}
login_customer_id: ${GADS_LOGIN_CUSTOMER_ID}
use_proto_plus: true
EOF
  echo "[gads-setup] Credentials provisioned from environment variables" >&2
elif [ -f "$REPO_ROOT/scripts/ads/config.yaml" ]; then
  cp "$REPO_ROOT/scripts/ads/config.yaml" /tmp/gads/config.yaml
  echo "[gads-setup] Credentials provisioned from repo config.yaml" >&2
else
  echo "[gads-setup] No credentials found — skipping" >&2
  exit 0
fi

chmod 600 /tmp/gads/config.yaml
cp "$REPO_ROOT/scripts/ads/ads.py" /tmp/gads/ads.py
chmod +x /tmp/gads/ads.py

echo "[gads-setup] Google Ads ready at /tmp/gads/" >&2
