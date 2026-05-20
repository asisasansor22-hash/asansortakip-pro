#!/bin/bash
# SessionStart hook: provisions Google Ads credentials into /tmp/gads
# Credentials must be set as environment variables in the Claude Code web environment settings:
#   GADS_DEVELOPER_TOKEN, GADS_CLIENT_ID, GADS_CLIENT_SECRET,
#   GADS_REFRESH_TOKEN, GADS_LOGIN_CUSTOMER_ID

set -e

if [ -z "$GADS_DEVELOPER_TOKEN" ] || [ -z "$GADS_REFRESH_TOKEN" ]; then
  echo "[gads-setup] GADS_* env vars not set — skipping Google Ads provisioning." >&2
  exit 0
fi

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
mkdir -p /tmp/gads
cat > /tmp/gads/config.yaml <<EOF
developer_token: ${GADS_DEVELOPER_TOKEN}
client_id: ${GADS_CLIENT_ID}
client_secret: ${GADS_CLIENT_SECRET}
refresh_token: ${GADS_REFRESH_TOKEN}
login_customer_id: ${GADS_LOGIN_CUSTOMER_ID}
use_proto_plus: true
EOF
chmod 600 /tmp/gads/config.yaml

cp "$REPO_ROOT/scripts/ads/ads.py" /tmp/gads/ads.py
chmod +x /tmp/gads/ads.py

echo "[gads-setup] Google Ads credentials provisioned at /tmp/gads/" >&2
