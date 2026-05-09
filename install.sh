#!/bin/bash
# Athlete OS — installer
# Uses Claude Code's plugin CLI directly.
#
# Usage (from inside the cloned repo):
#   bash install.sh

set -e

DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "Installing Athlete OS..."

# Register this repo as a local marketplace (idempotent)
claude plugin marketplace add "$DIR"

# Install the plugin from that marketplace
claude plugin install athlete-os

echo ""
echo "  → Fully quit Claude Code (⌘Q on Mac), then reopen it."
echo "    Closing a window isn't enough — the app must restart."
echo ""
echo "  → Then say: \"Connect my Strava account\""
echo ""
