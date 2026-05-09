---
name: connect
description: Connect Strava, Oura Ring, or Telegram to Athlete OS. Use when the user wants to connect any service, set up the plugin for the first time, link their account, or when Strava calls fail with authorization errors.
triggers:
  - "connect Strava"
  - "connect my Strava"
  - "connect Oura"
  - "connect my Oura"
  - "set up Athlete OS"
  - "set up Telegram"
  - "connect Telegram"
  - "Oura Ring"
  - "Telegram notifications"
  - "link my account"
  - "Strava not connected"
  - "authorization error"
---

# Connect

Handles connecting Strava, Oura Ring, and Telegram to Athlete OS. Figure out what the user wants to connect and run the right flow. All credentials are saved to `~/.config/athlete-os/credentials.json`.

---

## Strava

### Find the plugin path (do this first)

```bash
ATHLETE_OS_PATH=$(node -e "
const d = JSON.parse(require('fs').readFileSync(require('os').homedir() + '/.claude/plugins/installed_plugins.json', 'utf8'));
const entry = Object.entries(d.plugins).find(([k]) => k.startsWith('athlete-os'));
console.log(entry ? entry[1][0].installPath : '');
")
echo "Plugin path: $ATHLETE_OS_PATH"
```

If empty → plugin isn't installed. Tell them to run `bash install.sh` from the repo.

### Step 1 — Check if already connected

Call `check-strava-connection`. If it returns a name, they're already connected — confirm and only offer to reconnect if they explicitly ask.

### Step 2 — Get Strava API credentials

> "You need a free Strava developer app — takes about 60 seconds:
> 1. Go to **strava.com/settings/api**
> 2. Click **Create App**
> 3. Fill in: any name, category "Data Importer", website `http://localhost`, callback domain **`localhost`**
> 4. Copy the **Client ID** (a number) and **Client Secret** (a long string)"

Ask one at a time:
> "What's your Strava **Client ID**?"

Wait, then:
> "And your **Client Secret**?"

### Step 3 — Run OAuth

Pass credentials as env vars (triggers auto mode — no readline prompts):

```bash
STRAVA_CLIENT_ID=<their_id> STRAVA_CLIENT_SECRET=<their_secret> node "$ATHLETE_OS_PATH/mcp-server/oauth.js"
```

This opens their browser, catches the callback on localhost:8888, exchanges the code for tokens, and saves to credentials.json.

### Step 4 — Verify and offer more

Call `check-strava-connection`. On success, immediately ask (multiSelect: true):

- Question: "Strava is connected! Want to set up anything else now?"
- Header: "Optional integrations"
- Options:
  - "Oura Ring — readiness and HRV woven into every analysis"
  - "Telegram — get summaries and debriefs sent to your phone"
  - "Skip for now"

If Oura selected → run Oura flow below.
If Telegram selected → run Telegram flow below.
If skip → "No problem — say 'connect my Oura' or 'set up Telegram' anytime."

### Strava errors

| Error | Fix |
|-------|-----|
| Plugin path empty | Run `bash install.sh` from the repo |
| Port 8888 in use | `lsof -ti :8888 \| xargs kill` then retry |
| "Invalid client" | Double-check Client ID and Secret — no extra spaces |
| "Redirect URI mismatch" | Callback domain in Strava settings must be exactly `localhost` |
| Browser doesn't open | Copy the printed URL and open manually |

---

## Oura Ring

### Step 1 — Check if already configured

```bash
node -e "const fs=require('fs'),os=require('os'),path=require('path'),f=path.join(os.homedir(),'.config/athlete-os/credentials.json'),c=JSON.parse(fs.readFileSync(f,'utf8'));console.log('oura='+(c.oura_access_token?'configured':'not configured'));"
```

If configured → confirm and offer to update token if they want.

### Step 2 — Get the token

> "Oura uses a personal access token — no browser auth needed:
> 1. Go to **cloud.ouraring.com/personal-access-tokens**
> 2. Click **Create New Personal Access Token**
> 3. Give it any name (e.g. 'Athlete OS')
> 4. Copy the token"

> "What's your Oura personal access token?"

### Step 3 — Save

```
node -e "const fs=require('fs'),os=require('os'),path=require('path'),f=path.join(os.homedir(),'.config/athlete-os/credentials.json'),c=JSON.parse(fs.readFileSync(f,'utf8'));c.oura_access_token='TOKEN_HERE';fs.writeFileSync(f,JSON.stringify(c,null,2));console.log('saved');"
```

Replace `TOKEN_HERE` with the actual token.

### Step 4 — Verify

Call `check-oura-connection`. If it returns a readiness score:

> "✅ Oura connected! Your readiness today is [X]/100. Recovery data is now woven into your training analysis."

### Oura errors

| Error | Fix |
|-------|-----|
| 401 Unauthorized | Token is wrong — check for spaces or truncation |
| No data returned | Open the Oura app to sync first, then retry |
| Credentials file not found | Connect Strava first |

---

## Telegram

Telegram is **outbound only** — Athlete OS pushes summaries and debriefs to your phone. To ask questions, use Claude Code directly.

### Step 1 — Check if already configured

```bash
node -e "const fs=require('fs'),os=require('os'),path=require('path'),f=path.join(os.homedir(),'.config/athlete-os/credentials.json'),c=JSON.parse(fs.readFileSync(f,'utf8'));console.log('telegram='+(c.telegram_bot_token?'configured':'not configured'));"
```

### Step 2 — Create a bot

> "You need a free Telegram bot:
> 1. Open Telegram and search **@BotFather**
> 2. Send `/newbot`
> 3. Pick any name and username
> 4. Copy the **bot token** it gives you (looks like `7412345678:AAHxyz...`)"

### Step 3 — Get chat ID

> "Now get your chat ID:
> 1. Search **@userinfobot** in Telegram
> 2. Send it any message
> 3. Copy the **Id** number it replies with"

Ask: "What's your bot token?" → wait → "And your chat ID?"

### Step 4 — Save

```
node -e "const fs=require('fs'),os=require('os'),path=require('path'),f=path.join(os.homedir(),'.config/athlete-os/credentials.json'),c=JSON.parse(fs.readFileSync(f,'utf8'));c.telegram_bot_token='BOT_TOKEN_HERE';c.telegram_chat_id='CHAT_ID_HERE';fs.writeFileSync(f,JSON.stringify(c,null,2));console.log('saved');"
```

Replace `BOT_TOKEN_HERE` and `CHAT_ID_HERE` with the actual values.

### Step 5 — Verify

Call `send-telegram` with: `✅ Athlete OS connected to Telegram! Your workout debriefs and summaries will appear here.`

On success: "✅ Telegram connected! Say 'set up my routines' to automate summaries and debriefs."

### Telegram errors

| Error | Fix |
|-------|-----|
| "Unauthorized" | Bot token wrong — check for spaces |
| "Chat not found" | Send your bot a message first (tap Start), then retry |
| "Bad Request: chat_id" | Chat ID must be a plain number |
