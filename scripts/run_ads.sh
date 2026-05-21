#!/bin/bash
# Asis Asansör - Google Ads wrapper
# Kullanım: ./run_ads.sh [campaigns|keywords|search_terms|morning_report|set_budget|pause|enable]
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PYTHONPATH=/tmp/gads/lib python3 /tmp/gads/ads.py "$@"
