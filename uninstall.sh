#!/bin/bash
# Athlete OS — uninstaller

set -e

echo ""
claude plugin uninstall athlete-os 2>/dev/null && echo "✓ Plugin uninstalled" || echo "Plugin was not installed"
claude plugin marketplace remove athlete-os 2>/dev/null && echo "✓ Marketplace removed" || echo "Marketplace was not registered"

echo ""
echo "  Strava credentials were NOT removed."
echo "  To fully reset: rm ~/.config/athlete-os/credentials.json"
echo ""
echo "  Restart Claude Code to apply."
echo ""
