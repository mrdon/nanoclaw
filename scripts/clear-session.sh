#!/usr/bin/env bash
# Clear NanoClaw agent session(s) and restart
set -euo pipefail

DB="$(dirname "$0")/../store/messages.db"
GROUP="${1:-main}"

if [[ "$GROUP" == "--all" ]]; then
  sqlite3 "$DB" "DELETE FROM sessions;"
  echo "Cleared all sessions"
else
  sqlite3 "$DB" "DELETE FROM sessions WHERE group_folder = '$GROUP';"
  echo "Cleared session for '$GROUP'"
fi

systemctl --user restart nanoclaw
echo "Service restarted"
