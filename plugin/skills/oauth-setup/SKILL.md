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

Walk the user through connecting their Strava account. Everything runs inside Claude — no terminal needed beyond what Claude runs automatically.

Credentials are saved to `~/.config/athlete-os/credentials.json` (gitignored, never committed).

## Steps

### 1. Check if already connected

Run:
```bash
node mcp-server/oauth.js --check 2>/dev/null
```

If it prints `connected:<name>`, they're already set up — confirm and offer to reconnect if they want. If it prints `not_connected` or `token_expired`, proceed.

### 2. Explain what they need (30 seconds)

Tell the user:

> "You need a free Strava developer app. It takes about 60 seconds:
> 1. Go to **strava.com/settings/api**
> 2. Click **Create App**
> 3. Fill in any name (e.g. "Athlete OS"), category "Data Importer", website `http://localhost`, callback domain **`localhost`**
> 4. Copy the **Client ID** (a number) and **Client Secret** (a long string)"

### 3. Ask for credentials inline

Ask the user directly in the conversation:

> "What's your Strava **Client ID**?"

Wait for their answer, then:

> "And your **Client Secret**?"

Ask one at a time — it's clearer.

### 4. Run the OAuth helper

Once you have both values, run:

```bash
STRAVA_CLIENT_ID=<their_id> STRAVA_CLIENT_SECRET=<their_secret> node mcp-server/oauth.js
```

This will:
- Open their browser to the Strava authorization page
- Start a local server on port 8888 to catch the callback
- Exchange the code for tokens automatically
- Save everything to `~/.config/athlete-os/credentials.json`

The MCP server picks up the new credentials automatically — no restart needed.

### 5. Verify

Run:
```bash
node mcp-server/oauth.js --check
```

Or call `check-strava-connection`. If it returns the athlete's name, say:

> "✅ Connected as [Name]! Ask me anything about your training."

## Error Handling

| Error | Fix |
|-------|-----|
| Port 8888 in use | `lsof -ti :8888 \| xargs kill` then retry |
| "Invalid client" | Double-check Client ID and Secret — no extra spaces |
| "Redirect URI mismatch" | Ensure callback domain in Strava settings is exactly `localhost` |
| Browser doesn't open | Copy the URL printed in the terminal and open manually |

## Privacy Note

- Credentials are saved to `~/.config/athlete-os/credentials.json` — gitignored, never committed
- Access tokens expire every 6h; the MCP server refreshes them automatically
