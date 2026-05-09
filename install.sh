#!/bin/bash
# Athlete OS — install / reinstall / update
#
# Run this once to install, or again after git pull to update.
#
# Usage:
#   bash install.sh

set -e

DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "Installing Athlete OS..."

# Clean up any previous install (idempotent — safe to run on fresh install)
claude plugin uninstall athlete-os@athlete-os 2>/dev/null && echo "  Removed previous install" || true
claude plugin uninstall athlete-os 2>/dev/null || true
claude plugin marketplace remove athlete-os 2>/dev/null || true

# Register this repo as a marketplace and install fresh
claude plugin marketplace add "$DIR"
claude plugin install athlete-os

echo ""
echo "  → Fully quit Claude Code (⌘Q on Mac), then reopen it."
echo "    Closing a window isn't enough — the app must restart."
echo ""
echo "  → Then say: \"Connect my Strava account\""
echo ""
