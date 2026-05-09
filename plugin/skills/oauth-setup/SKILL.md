---
name: oauth-setup
description: Guides the user through connecting their Strava account to Athlete OS. Use when the user asks how to connect Strava, set up the plugin, or when tool calls fail with authorization errors.
triggers:
  - "connect Strava"
  - "connect my Strava"
  - "set up Athlete OS"
  - "how do I connect"
  - "Strava not connected"
  - "authorization error"
  - "set up credentials"
  - "link my Strava"
---

# Strava OAuth Setup

Walk the user through connecting their Strava account. Everything runs inside Claude.

Credentials are saved to `~/.config/athlete-os/credentials.json`.

## Finding the plugin path

Always resolve this first — the plugin lives in Claude's cache, not the user's project folder:

```bash
ATHLETE_OS_PATH=$(node -e "
const d = JSON.parse(require('fs').readFileSync(require('os').homedir() + '/.claude/plugins/installed_plugins.json', 'utf8'));
const entry = Object.entries(d.plugins).find(([k]) => k.startsWith('athlete-os'));
console.log(entry ? entry[1][0].installPath : '');
")
echo "Plugin path: $ATHLETE_OS_PATH"
```

If this prints an empty path, the plugin isn't installed — tell the user to run `bash install.sh` from the repo.

## Step 1 — Check if already connected

Call `check-strava-connection`. If it returns a name, they're already connected — confirm and offer to reconnect only if they explicitly want to.

## Step 2 — Get Strava API credentials

Tell the user:

> "You need a free Strava developer app — takes about 60 seconds:
> 1. Go to **strava.com/settings/api**
> 2. Click **Create App**
> 3. Fill in: any name, category "Data Importer", website `http://localhost`, callback domain **`localhost`**
> 4. Copy the **Client ID** (a number) and **Client Secret** (a long string)"

## Step 3 — Ask for credentials

Ask one at a time in the chat:

> "What's your Strava **Client ID**?"

Wait for the answer, then:

> "And your **Client Secret**?"

## Step 4 — Run the OAuth helper

Pass credentials as env vars so the script runs in auto mode (no readline prompts):

```bash
STRAVA_CLIENT_ID=<their_id> STRAVA_CLIENT_SECRET=<their_secret> node "$ATHLETE_OS_PATH/mcp-server/oauth.js"
```

This opens their browser, catches the OAuth callback on localhost:8888, exchanges the code for tokens, and saves to `~/.config/athlete-os/credentials.json`.

**Important:** Do NOT pipe anything to stdin. The env vars make it auto mode — it requires no interactive input at all.

## Step 5 — Verify

Call `check-strava-connection`. If it returns the athlete's name, connection is confirmed.

## Step 6 — Offer integrations

Immediately after confirming Strava is connected, use AskUserQuestion:
- Question: "Strava is connected! Want to set up any of these now? (you can always do them later)"
- Header: "Optional integrations"
- multiSelect: true
- Options:
  - "Oura Ring — recovery scores and HRV woven into every analysis"
  - "Telegram — get summaries sent to your phone automatically"
  - "Skip for now"

If they select **Oura Ring** → invoke `oura-setup` skill immediately.
If they select **Telegram** → invoke `telegram-setup` skill immediately.
If they select **Skip** or nothing → say: "No problem — say 'connect my Oura' or 'set up Telegram notifications' anytime."

After all setup completes:
> "You're all set. Try: 'What did I do this week?' or '/athlete-latest'"

## Error Handling

| Error | Fix |
|-------|-----|
| Plugin path is empty | Plugin not installed — run `bash install.sh` from the repo |
| Port 8888 in use | `lsof -ti :8888 \| xargs kill` then retry |
| "Invalid client" | Double-check Client ID and Secret — no extra spaces |
| "Redirect URI mismatch" | Ensure callback domain in Strava settings is exactly `localhost` |
| Browser doesn't open | Copy the URL printed in the terminal and open manually |
| Script exits immediately | Make sure you're passing STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET as env vars |
