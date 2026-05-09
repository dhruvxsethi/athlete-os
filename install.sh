#!/bin/bash
# Athlete OS — install / reinstall / update
#
# Run this once to install, or again after git pull to update.
#
# Usage:
#   bash install.sh

set -e

DIR="$(cd "$(dirname "$0")" && pwd)"

# ── Node.js version check ────────────────────────────────────────────────────
NODE_VERSION=$(node --version 2>/dev/null | sed 's/v//' | cut -d. -f1)
if [ -z "$NODE_VERSION" ]; then
  echo ""
  echo "  ✗ Node.js not found. Install Node.js 18+ from https://nodejs.org"
  echo ""
  exit 1
fi
if [ "$NODE_VERSION" -lt 18 ]; then
  echo ""
  echo "  ✗ Node.js $NODE_VERSION found but Athlete OS requires Node.js 18+."
  echo "    Update at: https://nodejs.org"
  echo ""
  exit 1
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
