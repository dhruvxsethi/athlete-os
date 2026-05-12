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

# ── Create launcher script + patch .mcp.json ─────────────────────────────────
# ${CLAUDE_PLUGIN_ROOT} expands to the source dir, which may have spaces in the
# path (e.g. "Personal Projects"). Claude Code passes the expanded path to a
# shell, where spaces split arguments and node fails to start.
# Fix: create a launcher shell script at a space-free path, then point .mcp.json
# at the launcher. Works for any clone location on any machine.

INSTALL_PATH=$(node -e "
try {
  const d = JSON.parse(require('fs').readFileSync(require('os').homedir()+'/.claude/plugins/installed_plugins.json','utf8'));
  const entry = Object.entries(d.plugins).find(([k]) => k.startsWith('athlete-os'));
  console.log(entry ? entry[1][0].installPath : '');
} catch(e) { console.log(''); }
" 2>/dev/null)

LAUNCHER="$HOME/.config/athlete-os/mcp-launcher.sh"
mkdir -p "$HOME/.config/athlete-os"

if [ -n "$INSTALL_PATH" ]; then
  # Write launcher — quotes the path so spaces are handled correctly
  printf '#!/bin/sh\nexec node "%s/mcp-server/index.js"\n' "$INSTALL_PATH" > "$LAUNCHER"
  chmod +x "$LAUNCHER"

  # Patch both the cache and source .mcp.json to use the launcher
  MCP_CONFIG="{\"mcpServers\":{\"athlete-os-strava\":{\"command\":\"$LAUNCHER\"}}}"

  echo "$MCP_CONFIG" | node -e "
const fs=require('fs'),data=require('fs').readFileSync('/dev/stdin','utf8').trim();
const parsed=JSON.parse(data);
const pretty=JSON.stringify(parsed,null,2);
fs.writeFileSync('$INSTALL_PATH/.mcp.json', pretty);
fs.writeFileSync('$DIR/plugin/.mcp.json', pretty);
console.log('  ✓ MCP launcher: $LAUNCHER');
console.log('  ✓ Server: $INSTALL_PATH/mcp-server/index.js');
  "
else
  echo "  ⚠ Could not find install path — run install.sh again."
fi

echo ""
echo "  ✓ Athlete OS installed."
echo ""
echo "  → Fully quit Claude Code (⌘Q on Mac), then reopen it."
echo "    Closing a window isn't enough — the MCP server loads on startup."
echo ""
echo "  → Then say: \"Connect my Strava account\""
echo ""
