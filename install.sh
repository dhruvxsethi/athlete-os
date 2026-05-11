#!/bin/bash
# Athlete OS — install / reinstall / update
#
# Run this once to install, or again after git pull to update.
#
# Usage:
#   bash install.sh

set -e

DIR="$(cd "$(dirname "$0")" && pwd)"

# ── Node.js version check (auto-install if missing or too old) ───────────────

install_node_via_brew() {
  echo ""
  echo "  → Installing Node.js via Homebrew..."
  brew install node 2>&1 | tail -3
  # Reload PATH so the new node binary is found
  eval "$(/opt/homebrew/bin/brew shellenv 2>/dev/null || /usr/local/bin/brew shellenv 2>/dev/null)"
}

NODE_VERSION=$(node --version 2>/dev/null | sed 's/v//' | cut -d. -f1)

if [ -z "$NODE_VERSION" ] || [ "$NODE_VERSION" -lt 18 ]; then
  if [ -z "$NODE_VERSION" ]; then
    echo ""
    echo "  ✗ Node.js not found."
  else
    echo ""
    echo "  ✗ Node.js $NODE_VERSION found — Athlete OS requires Node.js 18+."
  fi

  # Try Homebrew (macOS)
  if command -v brew &>/dev/null; then
    install_node_via_brew
  elif [ "$(uname)" = "Darwin" ]; then
    # Homebrew itself not installed — offer to install it
    echo "  → Homebrew not found. Install it first:"
    echo ""
    echo "    /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
    echo ""
    echo "  Then re-run: bash install.sh"
    echo ""
    exit 1
  else
    # Linux fallback
    echo "  → Install Node.js 18+ then re-run this script:"
    echo "    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -"
    echo "    sudo apt-get install -y nodejs"
    echo ""
    exit 1
  fi

  # Re-check after attempted install
  NODE_VERSION=$(node --version 2>/dev/null | sed 's/v//' | cut -d. -f1)
  if [ -z "$NODE_VERSION" ] || [ "$NODE_VERSION" -lt 18 ]; then
    echo ""
    echo "  ✗ Node.js 18+ still not available. Install manually: https://nodejs.org"
    echo ""
    exit 1
  fi
fi

echo ""
echo "Installing Athlete OS... (Node.js v$NODE_VERSION ✓)"

# ── Clean up any previous install ───────────────────────────────────────────
# Multiple forms cover version/namespace changes across Claude Code releases
claude plugin uninstall athlete-os@athlete-os 2>/dev/null && echo "  Removed previous install (athlete-os@athlete-os)" || true
claude plugin uninstall athlete-os 2>/dev/null && echo "  Removed previous install (athlete-os)" || true
claude plugin marketplace remove athlete-os 2>/dev/null && echo "  Removed previous marketplace entry" || true

# ── Register and install ─────────────────────────────────────────────────────
claude plugin marketplace add "$DIR"
claude plugin install athlete-os

echo ""
echo "  ✓ Athlete OS installed."
echo ""
echo "  → Fully quit Claude Code (⌘Q on Mac), then reopen it."
echo "    Closing a window isn't enough — the MCP server loads on startup."
echo ""
echo "  → Then say: \"Connect my Strava account\""
echo ""
