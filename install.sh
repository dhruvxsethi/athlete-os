#!/bin/bash
# Athlete OS — one-command installer
# Usage: bash install.sh

set -e

DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "Installing Athlete OS..."

# Register this directory as a local marketplace
claude plugin marketplace add "$DIR" 2>/dev/null || true

# Install the plugin
claude plugin install athlete-os

echo ""
echo "✓ Done. Open Claude and say: \"Connect my Strava account\""
echo ""
