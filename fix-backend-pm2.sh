#!/bin/bash
# =============================================================================
# Fix Backend PM2 - ensures HRMS backend runs from /var/www/hrms-app/HRMS-Backend
# Run this on the VM when deploy.sh restarts PM2 but old code still runs.
# Usage: ./fix-backend-pm2.sh
# =============================================================================

set -e
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
log_info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

APP_ROOT="${APP_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)}"
BACKEND_DIR="$APP_ROOT/HRMS-Backend"
BACKEND_PORT="${BACKEND_PORT:-5000}"
PM2_NAME="hrms-app-backend"

echo ""
log_info "Fix Backend PM2 - ensure backend runs from $BACKEND_DIR"
echo ""

# 1. Find what listens on port 5000
log_info "Step 1: Finding process on port $BACKEND_PORT..."
if command -v lsof &>/dev/null; then
  PORT_PID=$(lsof -ti :$BACKEND_PORT 2>/dev/null || true)
elif command -v ss &>/dev/null; then
  PORT_PID=$(ss -tlnp 2>/dev/null | grep ":$BACKEND_PORT " | grep -oP 'pid=\K[0-9]+' | head -1 || true)
else
  PORT_PID=""
fi

if [ -n "$PORT_PID" ]; then
  log_info "  Port $BACKEND_PORT is used by PID: $PORT_PID"
  ps -p "$PORT_PID" -o args= 2>/dev/null || true
else
  log_warn "  No process found on port $BACKEND_PORT"
fi
echo ""

# 2. Stop and delete HRMS backend PM2 processes (they may run from wrong directory)
# Include 'server' - it is often the legacy name for the API backend
log_info "Step 2: Stopping old HRMS backend processes..."
for name in hrms-app-backend hrms-backend server; do
  if pm2 describe "$name" &>/dev/null; then
    pm2 delete "$name" 2>/dev/null || true
    log_info "  Deleted PM2 process: $name"
  fi
done
pm2 save 2>/dev/null || true
echo ""

# 3. Start fresh from correct directory
log_info "Step 3: Starting backend from $BACKEND_DIR..."
cd "$BACKEND_DIR"
pm2 delete "$PM2_NAME" 2>/dev/null || true
pm2 start server.js --name "$PM2_NAME" --cwd "$BACKEND_DIR"
pm2 save
log_info "  Started $PM2_NAME"
echo ""

# 4. Verify
sleep 2
log_info "Step 4: Verifying..."
HTTP=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$BACKEND_PORT/" 2>/dev/null || echo "000")
if [ "$HTTP" = "200" ]; then
  log_info "  Backend health: OK (HTTP $HTTP)"
else
  log_warn "  Backend health: got HTTP $HTTP (expected 200)"
fi

# 5. Test dashboard-all
TOKEN=""
LOGIN=$(curl -s -X POST "http://localhost:$BACKEND_PORT/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@example.com","password":"12345"}' 2>/dev/null || echo '{}')
TOKEN=$(echo "$LOGIN" | grep -o '"token":"[^"]*"' | head -1 | sed 's/"token":"//;s/"$//')
if [ -n "$TOKEN" ]; then
  DASH_ALL=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" "http://localhost:$BACKEND_PORT/api/dashboard-all" 2>/dev/null || echo "000")
  if [ "$DASH_ALL" = "200" ]; then
    log_info "  /api/dashboard-all: OK (HTTP 200)"
  else
    log_warn "  /api/dashboard-all: HTTP $DASH_ALL (expected 200)"
  fi
fi

echo ""
log_info "Done. Run: bash $APP_ROOT/HRMS-Backend/test-dashboard-api.sh"
echo ""
