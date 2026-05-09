---
name: oauth-setup
description: Guides the user through connecting their Strava account to Athlete OS. Use when the user asks how to connect Strava, set up the plugin, get their API credentials, or when tool calls fail with authorization errors. Runs the OAuth helper script interactively.
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

Walk the user through connecting their Strava account. This runs entirely inside Claude Code — no manual curl commands needed.

## Steps

### 1. Check if already connected

Run:
```bash
node mcp-server/oauth.js --check 2>/dev/null || echo "not_connected"
```

Or call `check-strava-connection`. If it returns a name, they're already connected — confirm and offer to reconnect if they want.

### 2. Explain what they need (30 seconds)

Tell the user:

> "You need a free Strava developer app. It takes about 60 seconds to create:
> 1. Go to **strava.com/settings/api**
> 2. Click **Create App**
> 3. Fill in any name (e.g. "Athlete OS"), category "Data Importer", website "http://localhost", callback domain **localhost**
> 4. Copy the **Client ID** (a number) and **Client Secret** (a long string)"

### 3. Ask for credentials inline

Ask the user directly in the conversation:

> "What's your Strava **Client ID**?"

Wait for their answer, then:

> "And your **Client Secret**?"

Do NOT ask both at once — one at a time keeps it clear.

### 4. Run the OAuth helper

Once you have both values, set them as environment variables and run the OAuth helper:

```bash
STRAVA_CLIENT_ID=<their_id> STRAVA_CLIENT_SECRET=<their_secret> node mcp-server/oauth.js
```

This will:
- Open their browser to the Strava authorization page
- Start a local server on port 8888 to catch the callback
- Exchange the code for tokens automatically
- Save everything to `.env`

### 5. Load the tokens

After success, instruct:

```bash
set -a && source .env && set +a
```

Or on fish shell:
```bash
export $(grep -v '^#' .env | xargs)
```

### 6. Verify

Call `check-strava-connection`. It should return the athlete's name. If it does, say:

> "✅ Connected as [Name]! You can now ask me anything about your training."

## Error Handling

| Error | Fix |
|-------|-----|
| Port 8888 in use | `lsof -ti :8888 \| xargs kill` then retry |
| "Invalid client" | Double-check Client ID and Secret — no extra spaces |
| "Redirect URI mismatch" | Ensure callback domain in Strava settings is exactly `localhost` |
| Browser doesn't open | Copy the URL printed in the terminal and open manually |

## Privacy Note

- The Client Secret is sensitive — treat it like a password
- It's saved to `.env` which is gitignored — never committed to version control
- Access tokens expire every 6h; the MCP server refreshes them automatically using the refresh token
