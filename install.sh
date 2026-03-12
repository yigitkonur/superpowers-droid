#!/usr/bin/env bash
#
# superpowers-droid one-liner installer for macOS
#
# Usage:
#   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/yigitkonur/superpowers-droid/main/install.sh)"
#
# Or with flags:
#   curl -fsSL .../install.sh | bash -s -- --user
#   curl -fsSL .../install.sh | bash -s -- --uninstall
#

set -euo pipefail

REPO="https://github.com/yigitkonur/superpowers-droid.git"
INSTALLER_URL="https://raw.githubusercontent.com/yigitkonur/superpowers-droid/main/scripts/install.mjs"
TMP_DIR=$(mktemp -d)

cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT

# ── colors ──────────────────────────────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
RESET='\033[0m'

info()  { printf "  ${CYAN}→${RESET} %s\n" "$1"; }
ok()    { printf "  ${GREEN}✓${RESET} %s\n" "$1"; }
fail()  { printf "  ${RED}✗${RESET} %s\n" "$1"; exit 1; }

# ── banner ──────────────────────────────────────────────────────────────────────

printf "\n${BOLD}superpowers-droid${RESET} ${DIM}installer${RESET}\n"
printf "${DIM}────────────────────────────${RESET}\n\n"

# ── check: git ──────────────────────────────────────────────────────────────────

if ! command -v git &>/dev/null; then
  fail "git is required. Install from https://git-scm.com"
fi
ok "git found ($(git --version | grep -oE '[0-9]+\.[0-9]+[\.0-9]*'))"

# ── check: node ─────────────────────────────────────────────────────────────────

if ! command -v node &>/dev/null; then
  fail "node is required (>=18). Install from https://nodejs.org"
fi

NODE_VERSION=$(node --version | grep -oE '[0-9]+' | head -1)
if [ "$NODE_VERSION" -lt 18 ]; then
  fail "node $(node --version) is too old — need >=18"
fi
ok "node found ($(node --version | tr -d 'v'))"

# ── download and run installer ──────────────────────────────────────────────────

info "Downloading installer..."

if curl -fsSL "$INSTALLER_URL" -o "$TMP_DIR/install.mjs" 2>/dev/null; then
  ok "Installer downloaded"
else
  # fallback: clone the repo and run from there
  info "Direct download failed, cloning repo..."
  git clone --depth 1 "$REPO" "$TMP_DIR/repo" 2>/dev/null
  cp "$TMP_DIR/repo/scripts/install.mjs" "$TMP_DIR/install.mjs"
  ok "Installer ready"
fi

# pass through any flags (--user, --project, --uninstall)
node "$TMP_DIR/install.mjs" "$@"
