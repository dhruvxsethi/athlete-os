---
name: telegram-setup
description: Connect a Telegram bot so Athlete OS can send you training summaries automatically. Use when the user wants to set up Telegram notifications, connect Telegram, or get automated training reports sent to them.
triggers:
  - "set up Telegram"
  - "connect Telegram"
  - "Telegram notifications"
  - "send to Telegram"
  - "Telegram bot"
  - "automated summaries"
---

# Telegram Setup

Walk the user through creating a Telegram bot and saving the credentials. The whole thing takes about 2 minutes.

## Two Telegram systems — understand the difference

There are two separate Telegram integrations you might encounter. They are completely independent:

| System | What it is | What it's for |
|--------|-----------|---------------|
| **Athlete OS send-telegram** | Outbound push only. Uses a bot token + chat ID stored in credentials.json. | Automated training summaries, workout debriefs, weekly reports sent to your Telegram. |
| **Claude Code Telegram plugin** | Two-way chat. Configured separately via `/telegram:configure`. | Sending Claude messages FROM Telegram, having a conversation with Claude via Telegram. |

This skill sets up the **Athlete OS** side — outbound push notifications. If the user has the general Claude Code Telegram plugin set up, that's a separate thing and does NOT replace this setup.

## Steps

### 1. Check if already configured

Read the credentials file to see if Telegram is already saved:

```bash
node -e "
const fs = require('fs'), os = require('os'), path = require('path');
const f = path.join(os.homedir(), '.config/athlete-os/credentials.json');
try {
  const c = JSON.parse(fs.readFileSync(f, 'utf8'));
  console.log('telegram=' + (c.telegram_bot_token ? 'configured' : 'not configured'));
} catch { console.log('credentials=not found'); }
"
```

If it shows `configured`, confirm they're already set up and offer to reconfigure if needed.

### 2. Create a bot

Tell the user:

> "You need a free Telegram bot — takes about 60 seconds:
> 1. Open Telegram and search for **@BotFather**
> 2. Send it the message: `/newbot`
> 3. Follow the prompts — pick any name and username (e.g. 'MyAthleteOSBot')
> 4. BotFather gives you a **bot token** — looks like: `7412345678:AAHxyz...`
> 5. Copy that token"

### 3. Get their chat ID

After they have the token, tell them:

> "Now get your personal chat ID:
> 1. Search for **@userinfobot** in Telegram
> 2. Send it any message (e.g. `/start`)
> 3. It replies with your **Id** — copy that number (e.g. `123456789`)"

### 4. Ask for both values

Ask one at a time:
> "What's your bot token?"

Wait for their response, then:
> "And your chat ID (the number from @userinfobot)?"

### 5. Save to credentials file

Construct and run this command, substituting the actual values (no angle brackets, no quotes unless the value contains spaces):

```
node -e "const fs=require('fs'),os=require('os'),path=require('path'),f=path.join(os.homedir(),'.config/athlete-os/credentials.json'),c=JSON.parse(fs.readFileSync(f,'utf8'));c.telegram_bot_token='BOT_TOKEN_HERE';c.telegram_chat_id='CHAT_ID_HERE';fs.writeFileSync(f,JSON.stringify(c,null,2));console.log('saved');"
```

Replace `BOT_TOKEN_HERE` with the bot token and `CHAT_ID_HERE` with the chat ID. Run the complete single-line command so there are no shell escaping issues.

### 6. Verify

Call `send-telegram` with message:

```
✅ Athlete OS connected to Telegram!

Your training summaries will appear here. Try asking Claude: "Send my weekly summary to Telegram."
```

If the message arrives in their Telegram chat:

> "✅ Telegram connected! Say 'set up my routines' to automate weekly summaries, daily briefings, and post-workout debriefs."

## Error Handling

| Error | Fix |
|-------|-----|
| "Unauthorized" from Telegram | Bot token is wrong — check for spaces or truncation |
| "Chat not found" | Send at least one message to your bot first (tap Start), then retry |
| "Bad Request: chat_id" | Chat ID must be a plain number — no spaces or symbols |
| Credentials file not found | Run Strava setup first: "Connect my Strava account" |
| send-telegram errors but credentials look right | Try messaging your bot `/start` in Telegram to initiate the conversation |

## After setup

Offer immediately:
> "Want me to set up automated routines? I can send a post-workout debrief after every activity, a daily morning briefing, weekly training summary, and monthly trends — all to Telegram. Say 'set up my routines' to pick which ones."

## For cloud routines

When running as a scheduled cloud routine, Telegram uses `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` env vars (in addition to the Strava vars). Remind them to add these at **claude.ai/settings → Routines → Environment variables** alongside their Strava credentials.
