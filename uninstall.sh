#!/bin/bash
# Athlete OS — uninstaller
# Removes plugin registry entries. Does NOT delete Strava credentials.
#
# To also remove saved credentials:
#   rm ~/.config/athlete-os/credentials.json

set -e

INSTALLED="$HOME/.claude/plugins/installed_plugins.json"

if [ ! -f "$INSTALLED" ]; then
  echo "Nothing to uninstall."
  exit 0
fi

node -e "
const fs = require('fs');
const file = '$INSTALLED';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const before = Object.keys(data.plugins).length;
Object.keys(data.plugins).forEach(k => {
  if (k.includes('athlete-os')) delete data.plugins[k];
});
const after = Object.keys(data.plugins).length;
fs.writeFileSync(file, JSON.stringify(data, null, 2));
console.log('✓ Removed ' + (before - after) + ' athlete-os plugin entry/entries');
"

echo ""
echo "✓ Uninstalled. Restart Claude Code to take effect."
echo ""
echo "  Strava credentials were NOT removed."
echo "  To fully reset: rm ~/.config/athlete-os/credentials.json"
echo ""
