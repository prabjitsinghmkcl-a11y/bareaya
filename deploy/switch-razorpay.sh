#!/usr/bin/env bash
#
# Bareaya — switch the LIVE server to the new Razorpay account.
#
# Run on the VPS as root:
#   sudo bash /var/www/bareaya/deploy/switch-razorpay.sh
#
# What it does (idempotent, with timestamped backups):
#   1. Writes the three RAZORPAY_* vars into backend/.env and /root/bareaya.env
#   2. git pull  (brings in the code that understands RAZORPAY_WEBHOOK_SECRET)
#   3. pm2 restart bareaya-api --update-env
#   4. pm2 save
#
set -euo pipefail

DEPLOY_DIR="/var/www/bareaya"
DEPLOY_USER="bareaya"
ENV_FILE="${DEPLOY_DIR}/backend/.env"
SECRETS_FILE="/root/bareaya.env"          # setup-vps.sh copies this to backend/.env

# ---- New Razorpay (Bareaya) credentials ----------------------------------
KEY_ID="rzp_live_To5aedQhNmBt85"
KEY_SECRET="dRoGi9Er7hNvgSQFxHj5Bruz"
WEBHOOK_SECRET="1nhIUg9nC1JbgJ1VporPw_AJG9JXfKU-PTYtiNu_mfOU"
# ---------------------------------------------------------------------------

log() { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }

[[ $EUID -eq 0 ]] || { echo "Run as root (sudo bash $0)"; exit 1; }

set_var() {
  local file="$1" key="$2" val="$3"
  [[ -f "$file" ]] || return 0
  if grep -q "^${key}=" "$file"; then
    sed -i "s|^${key}=.*|${key}=${val}|" "$file"
  else
    printf '\n%s=%s\n' "$key" "$val" >> "$file"
  fi
}

for f in "$ENV_FILE" "$SECRETS_FILE"; do
  if [[ -f "$f" ]]; then
    log "Updating $f"
    cp "$f" "${f}.bak.$(date +%Y%m%d%H%M%S)"
    set_var "$f" RAZORPAY_KEY_ID      "$KEY_ID"
    set_var "$f" RAZORPAY_KEY_SECRET  "$KEY_SECRET"
    set_var "$f" RAZORPAY_WEBHOOK_SECRET "$WEBHOOK_SECRET"
    { grep -E '^RAZORPAY_(KEY_ID|KEY_SECRET|WEBHOOK_SECRET)=' "$f" | sed 's/=.*/=<set>/' ; } || true
  else
    log "NOTE: $f not found — skipping"
  fi
done

[[ -f "$ENV_FILE" ]] && chown "${DEPLOY_USER}:${DEPLOY_USER}" "$ENV_FILE" || true

log "Pulling latest code"
sudo -iu "$DEPLOY_USER" bash -c "cd '$DEPLOY_DIR' && git pull --ff-only"

log "Restarting PM2 app with the new environment"
sudo -iu "$DEPLOY_USER" bash -c "pm2 restart bareaya-api --update-env"
sudo -iu "$DEPLOY_USER" bash -c "pm2 save"

log "Done"
echo "Check logs:  sudo -iu ${DEPLOY_USER} && pm2 logs bareaya-api --lines 30"
echo "Then place a Rs.1 live test order on https://bareaya.in"
