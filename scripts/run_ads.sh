#!/bin/bash
# Asis Asansör - Google Ads sabah raporu
# Kullanım: ./run_ads.sh [morning_report|campaigns|keywords|search_terms|set_budget|pause|enable]
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
python3 "$SCRIPT_DIR/ads.py" "$@"
