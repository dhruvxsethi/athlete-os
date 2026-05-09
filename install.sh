#!/bin/bash
# Athlete OS — installer
# Registers the plugin directly in Claude's plugin registry.
# No marketplace needed. Works offline.
#
# Usage (from inside the cloned repo):
#   bash install.sh

set -e

PLUGIN_DIR="$(cd "$(dirname "$0")" && pwd)"
INSTALLED="$HOME/.claude/plugins/installed_plugins.json"
PLUGIN_KEY="athlete-os@local"

# Ensure the plugins directory exists
mkdir -p "$HOME/.claude/plugins"

# Bootstrap installed_plugins.json if it doesn't exist
if [ ! -f "$INSTALLED" ]; then
  echo '{"version":2,"plugins":{}}' > "$INSTALLED"
fi

# Write the plugin entry pointing at this directory
node -e "
const fs = require('fs');
const file = '$INSTALLED';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
data.plugins['$PLUGIN_KEY'] = [{
  scope: 'user',
  installPath: '$PLUGIN_DIR',
  version: '0.1.0',
  installedAt: new Date().toISOString(),
  lastUpdated: new Date().toISOString()
}];
fs.writeFileSync(file, JSON.stringify(data, null, 2));
console.log('✓ Athlete OS registered at: $PLUGIN_DIR');
"

echo ""
echo "✓ Installed. Restart Claude Code, then say: \"Connect my Strava account\""
echo ""
