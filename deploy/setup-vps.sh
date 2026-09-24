#!/usr/bin/env bash
#
# Bareaya — production VPS setup for Ubuntu 22.04 / 24.04 (x86_64)
# Run as ROOT:
#   sudo bash deploy/setup-vps.sh
#
# What it does:
#   1. Installs Node.js 22 LTS, git, build-essential, nginx, certbot
#   2. Adds 2 GB swap (only if the box has no swap and little RAM) — needed for the CRA build
#   3. Creates the deploy user and clones the (private) repo
#   4. Writes backend/.env from /root/bareaya.env (see deploy/.env.example)
#   5. Installs npm deps and builds the STOREFRONT
#   6. Starts the API under PM2 (auto-restart) 
#   7. Installs the nginx site and a free Let's Encrypt certificate
#   8. Enables the firewall
#
# Edit the CONFIG block below before running.

set -euo pipefail

# ---------------------------------------------------------------- CONFIG ----
DOMAIN="${DOMAIN:-bareya.in}"
ADMIN_EMAIL="${ADMIN_EMAIL:-noreply@bareya.in}"     # certbot registration email
GITHUB_TOKEN="${GITHUB_TOKEN:-}"                    # PAT with repo read scope (private repo)
REPO_URL="${REPO_URL:-https://github.com/prabjitsingh15/Bareaya.git}"
REPO_URL_AUTH="https://x-access-token:${GITHUB_TOKEN}@github.com/prabjitsingh15/Bareaya.git"
DEPLOY_USER="${DEPLOY_USER:-bareaya}"
DEPLOY_DIR="/var/www/bareaya"
SECRETS_FILE="${SECRETS_FILE:-/root/bareaya.env}"   # full production .env values
# ----------------------------------------------------------------------------

log()  { echo -e "\n\033[1;34m==> $*\033[0m"; }
ok()   { echo -e "\033[1;32m    OK\033[0m $*"; }
warn() { echo -e "\033[1;33m    !! $*\033[0m"; }
die()  { echo -e "\033[1;31mFAILED: $*\033[0m" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "Run as root (sudo bash $0)"
command -v apt-get >/dev/null 2>&1 || die "This script targets Debian/Ubuntu (apt-based) systems."

export DEBIAN_FRONTEND=noninteractive

# --------------------------------------------------------------- 1. packages
log "Installing system packages"
apt-get update
apt-get install -y --no-install-recommends \
  curl ca-certificates gnupg lsb-release \
  git build-essential nginx ufw \
  certbot python3-certbot-nginx

# ------------------------------------------------- node 22 LTS (NodeSource)
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | cut -d. -f1)" != v22* ]]; then
  log "Installing Node.js 22 LTS (NodeSource)"
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
node -v; npm -v

log "Installing PM2 globally"
npm install -g pm2 >/dev/null 2>&1 || npm install -g pm2

# ---------------------------------------------------------------------- swap
if [[ "$(free -m | awk '/^Swap:/{print $2}')" -lt 1024 ]]; then
  log "Adding 2 GB swap (needed for the React build on small VPS)"
  if [[ ! -f /swapfile ]]; then
    fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
    chmod 600 /swapfile
    mkswap /swapfile >/dev/null
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ok "swap enabled"
  fi
fi

# -------------------------------------------------------------- 2. deploy user
log "Creating deploy user '${DEPLOY_USER}'"
id "${DEPLOY_USER}" >/dev/null 2>&1 || useradd -m -s /bin/bash "${DEPLOY_USER}"
mkdir -p "${DEPLOY_DIR}"
chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "${DEPLOY_DIR}"
as_user() { su - "${DEPLOY_USER}" -c "$*"; }

# ---------------------------------------------------------------------- repo
if [[ ! -d "${DEPLOY_DIR}/.git" ]]; then
  log "Cloning repository"
  if [[ -n "${GITHUB_TOKEN}" ]]; then
    as_user "git clone '${REPO_URL_AUTH}' '${DEPLOY_DIR}'"
    as_user "cd '${DEPLOY_DIR}' && git remote set-url origin '${REPO_URL}'"  # drop token from remote
  else
    warn "GITHUB_TOKEN not set — trying public clone (private repo will fail)."
    warn "  Retry with: GITHUB_TOKEN=ghp_xxx sudo bash deploy/setup-vps.sh"
    as_user "git clone '${REPO_URL}' '${DEPLOY_DIR}'"
  fi
  as_user "cd '${DEPLOY_DIR}' && git checkout main 2>/dev/null || true"
else
  log "Repo already present — pulling latest"
  as_user "cd '${DEPLOY_DIR}' && git pull --ff-only 2>/dev/null || true"
fi
ok "repo at ${DEPLOY_DIR} (branch: $(as_user "cd '${DEPLOY_DIR}' && git branch --show-current"))"

# ---------------------------------------------------------------- 3. env file
log "Writing backend/.env"
if [[ -f "${SECRETS_FILE}" ]]; then
  cp "${SECRETS_FILE}" "${DEPLOY_DIR}/backend/.env"
  chown "${DEPLOY_USER}:${DEPLOY_USER}" "${DEPLOY_DIR}/backend/.env"
  ok "using secrets from ${SECRETS_FILE}"
elif [[ -f "${DEPLOY_DIR}/backend/.env" ]]; then
  warn "${SECRETS_FILE} missing but backend/.env exists — keeping it."
else
  cp "${DEPLOY_DIR}/deploy/.env.example" "${DEPLOY_DIR}/backend/.env"
  chown "${DEPLOY_USER}:${DEPLOY_USER}" "${DEPLOY_DIR}/backend/.env"
  warn "${SECRETS_FILE} NOT found — copied deploy/.env.example as backend/.env."
  warn "  Edit it now with the REAL values (then the PM2 app will auto-reload):"
  warn "    nano ${DEPLOY_DIR}/backend/.env"
fi

# ----------------------------------------------------- 4. npm install + build
log "Installing npm dependencies"
as_user "cd '${DEPLOY_DIR}' && npm install --no-audit --no-fund 2>/dev/null || npm install"
as_user "cd '${DEPLOY_DIR}/backend' && npm install --no-audit --no-fund 2>/dev/null || npm install"
as_user "cd '${DEPLOY_DIR}/frontend' && npm install --no-audit --no-fund 2>/dev/null || npm install"
ok "dependencies installed"

log "Building STOREFRONT frontend (react-scripts build)"
if ! as_user "cd '${DEPLOY_DIR}/frontend' && npm run build"; then
  warn "Build failed — retrying with --openssl-legacy-provider"
  as_user "cd '${DEPLOY_DIR}/frontend' && NODE_OPTIONS=--openssl-legacy-provider npm run build"
fi
ok "storefront built (frontend/build)"

# ------------------------------------------------------------ 5. PM2 app start
log "Starting API under PM2"
as_user "cd '${DEPLOY_DIR}' && pm2 delete bareaya-api 2>/dev/null || true"
as_user "cd '${DEPLOY_DIR}' && pm2 start ecosystem.config.js"
as_user "pm2 save"
as_user "pm2 startup systemd -u '${DEPLOY_USER}' --hp /home/${DEPLOY_USER} | tail -n 20 | bash 2>/dev/null || true"
ok "pm2 started bareaya-api on port 5000"

# -------------------------------------------------------------- 6. nginx config
log "Installing nginx site"
sed "s/server_name bareya.in www.bareya.in;/server_name ${DOMAIN} www.${DOMAIN};/" \
  "${DEPLOY_DIR}/deploy/nginx.conf" > /etc/nginx/sites-available/bareaya
ln -sf /etc/nginx/sites-available/bareaya /etc/nginx/sites-enabled/bareaya
rm -f /etc/nginx/sites-enabled/default
if nginx -t 2>/dev/null; then
  systemctl reload nginx
  ok "nginx reloaded (HTTP-only; certbot adds TLS next)"
else
  warn "nginx -t  failed: ${DEPLOY_DIR}/deploy/nginx.conf references certs that do not exist yet."
  warn "  Temporarily removing the 443 block so the build/certbot steps can proceed."
  sed -n '1,/server {/p' "${DEPLOY_DIR}/deploy/nginx.conf" | sed '$d' > /etc/nginx/sites-available/bareaya
  nginx -t && systemctl reload nginx
fi

# ------------------------------------------------------------------- 7. SSL
log "Requesting Let's Encrypt certificate (needs A/AAAA records for ${DOMAIN} and www.${DOMAIN})"
if certbot --nginx -d "${DOMAIN}" -d "www.${DOMAIN}" \
      --non-interactive --agree-tos -m "${ADMIN_EMAIL}" --redirect; then
  ok "SSL configured"
else
  warn "certbot failed for www.${DOMAIN} — retrying for ${DOMAIN} only (if www is not in use)."
  if certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos -m "${ADMIN_EMAIL}" --redirect; then
    ok "SSL configured (${DOMAIN} only)"
  else
    warn "SSL could not be issued. Fix DNS or re-run: certbot --nginx -d ${DOMAIN}"
  fi
fi
systemctl reload nginx

# ------------------------------------------------------------- 8. firewall
log "Configuring firewall"
ufw allow OpenSSH >/dev/null
ufw allow 'Nginx Full' >/dev/null
ufw --force enable >/dev/null
ok "ufw enabled (OpenSSH + 80/443)"

# ------------------------------------------------------------------ verify
log "Final checks"
sleep 3
curl -fsS "https://${DOMAIN}/api/products" >/dev/null 2>&1 \
  && ok "https://${DOMAIN} serves the API (storefront on /)" \
  || warn "curl https://${DOMAIN}/api/products failed — check: pm2 logs bareaya-api"

echo
echo "============================================================"
echo "  Bareaya is up. Useful commands:"
echo "    sudo -iu ${DEPLOY_USER}"
echo "    pm2 logs bareaya-api          # app logs"
echo "    pm2 restart bareaya-api        # restart app (also picks up .env edits)"
echo "    cd /var/www/bareaya && git pull   # deploy new code"
echo "    pm2 save                       # persist process list"
echo "  Switch to the ADMIN build (one-time, switches frontend/build):"
echo "    sudo -iu ${DEPLOY_USER} && cd /var/www/bareaya/frontend && npm run build:admin && pm2 restart bareaya-api"
echo "  Switch back to STOREFRONT with: npm run build && pm2 restart bareaya-api"
echo "  Renew certs: certbot renew (auto via systemd timer)"
echo "============================================================"