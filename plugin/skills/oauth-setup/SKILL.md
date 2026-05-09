---
name: oauth-setup
description: Guides the user through connecting their Strava account to Athlete OS. Use when the user asks how to connect Strava, set up the plugin, get their API credentials, or when tool calls fail with authorization errors.
triggers:
  - "connect Strava"
  - "set up Athlete OS"
  - "how do I connect"
  - "Strava not connected"
  - "get API credentials"
  - "authorization error"
  - "set up credentials"
---

# Strava OAuth Setup

Walk the user through connecting their Strava account. Everything runs inside Claude.

Credentials are saved to `~/.config/athlete-os/credentials.json`.

## Finding the plugin path

The plugin is installed in Claude's cache, not the user's project folder. Always resolve the path before running any oauth.js commands:

```bash
ATHLETE_OS_PATH=$(node -e "
const d = JSON.parse(require('fs').readFileSync(require('os').homedir() + '/.claude/plugins/installed_plugins.json', 'utf8'));
const entry = Object.entries(d.plugins).find(([k]) => k.startsWith('athlete-os'));
console.log(entry ? entry[1][0].installPath : '');
")
echo $ATHLETE_OS_PATH
```

Use `$ATHLETE_OS_PATH/mcp-server/oauth.js` for all subsequent commands.

## Steps

### 1. Check if already connected

First try the MCP tool directly — call `check-strava-connection`. If it returns a name, they're already connected. Confirm and offer to reconnect if they want.

If the MCP tool isn't available yet, run:
```bash
node "$ATHLETE_OS_PATH/mcp-server/oauth.js" --check 2>/dev/null
```

If it prints `connected:<name>` — already set up. If `not_connected` or `token_expired` — proceed.

### 2. Explain what they need

Tell the user:

> "You need a free Strava developer app — takes about 60 seconds:
> 1. Go to **strava.com/settings/api**
> 2. Click **Create App**
> 3. Fill in: any name, category "Data Importer", website `http://localhost`, callback domain **`localhost`**
> 4. Copy the **Client ID** (a number) and **Client Secret** (a long string)"

### 3. Ask for credentials inline

Ask one at a time:

> "What's your Strava **Client ID**?"

Wait, then:

> "And your **Client Secret**?"

### 4. Run the OAuth helper

```bash
STRAVA_CLIENT_ID=<their_id> STRAVA_CLIENT_SECRET=<their_secret> node "$ATHLETE_OS_PATH/mcp-server/oauth.js"
```

This opens their browser, catches the OAuth callback on localhost:8888, exchanges the code for tokens, and saves to `~/.config/athlete-os/credentials.json`. The MCP server picks up credentials immediately — no restart needed.

### 5. Verify

Call `check-strava-connection`. If it returns the athlete's name:

> "✅ Connected as [Name]! Ask me anything about your training."

## Error Handling

| Error | Fix |
|-------|-----|
| Port 8888 in use | `lsof -ti :8888 \| xargs kill` then retry |
| "Invalid client" | Double-check Client ID and Secret — no extra spaces |
| "Redirect URI mismatch" | Ensure callback domain in Strava settings is exactly `localhost` |
| Browser doesn't open | Copy the URL printed in the terminal and open manually |
| `ATHLETE_OS_PATH` is empty | Plugin not installed — run `bash install.sh` from the cloned repo |
