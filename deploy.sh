#!/bin/bash

# =============================================================================
# HRMS VM Deployment Script
# =============================================================================
# Performs: git pull, npm install (backend & frontend), frontend build, PM2 restart
# Usage: ./deploy.sh
#
# Folder structure:
#   hrms-app/                 (codebase root)
#   hrms-app/HRMS-Backend/    (backend)
#   hrms-app/HRMS-Frontend/   (frontend)
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Paths - hrms-app/HRMS-Backend, hrms-app/HRMS-Frontend
APP_ROOT="${APP_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)}"
BACKEND_DIR="$APP_ROOT/HRMS-Backend"
FRONTEND_DIR="$APP_ROOT/HRMS-Frontend"
GIT_BRANCH="${GIT_BRANCH:-main}"
PM2_PROCESS="${PM2_PROCESS:-hrms-backend}"

log_info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# -----------------------------------------------------------------------------
echo ""
echo "=============================================="
echo "  HRMS Deployment - VM"
echo "=============================================="
echo ""
log_info "APP_ROOT: $APP_ROOT"
log_info "BACKEND:  $BACKEND_DIR"
log_info "FRONTEND: $FRONTEND_DIR"
log_info "BRANCH:   $GIT_BRANCH"
echo ""

# -----------------------------------------------------------------------------
log_info "Step 1/5: Git pull ($GIT_BRANCH)..."
cd "$APP_ROOT"
if [[ -d .git ]]; then
  git fetch origin
  git checkout "$GIT_BRANCH"
  git pull origin "$GIT_BRANCH"
  log_info "Git pull completed."
else
  log_warn "Not a git repo, skipping git pull."
fi
echo ""

# -----------------------------------------------------------------------------
log_info "Step 2/5: Backend npm install..."
if [[ ! -d "$BACKEND_DIR" ]]; then
  log_error "Backend directory not found: $BACKEND_DIR"
  exit 1
fi
cd "$BACKEND_DIR"
npm install --production
log_info "Backend dependencies installed."
echo ""

# -----------------------------------------------------------------------------
log_info "Step 3/5: Frontend npm install..."
if [[ ! -d "$FRONTEND_DIR" ]]; then
  log_error "Frontend directory not found: $FRONTEND_DIR"
  exit 1
fi
cd "$FRONTEND_DIR"
npm install
log_info "Frontend dependencies installed."
echo ""

# -----------------------------------------------------------------------------
log_info "Step 4/5: Frontend build..."
cd "$FRONTEND_DIR"
npm run build
log_info "Frontend build completed."
echo ""

# -----------------------------------------------------------------------------
log_info "Step 5/5: PM2 restart all services..."
if command -v pm2 &> /dev/null; then
  pm2 restart all 2>/dev/null || pm2 restart "$PM2_PROCESS" 2>/dev/null || {
    log_warn "PM2 process not found. Attempting pm2 start..."
    cd "$BACKEND_DIR"
    pm2 start server.js --name "$PM2_PROCESS" --env production 2>/dev/null || true
  }
  pm2 save 2>/dev/null || true
  log_info "PM2 services restarted."
  pm2 status
else
  log_warn "PM2 not installed. Skipping PM2 restart."
fi
echo ""

# -----------------------------------------------------------------------------
echo "=============================================="
echo -e "  ${GREEN}Deployment completed successfully!${NC}"
echo "=============================================="
echo ""
log_info "Backend:  npm install + PM2 restarted"
log_info "Frontend: npm install + build (dist/)"
log_info "Nginx will serve the new frontend build automatically."
echo ""
