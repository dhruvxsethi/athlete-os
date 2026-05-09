---
name: setup-routines
description: Sets up automated training routines that run on a schedule — daily briefings, post-workout debriefs, weekly summaries, monthly reports. Use when the user wants automated check-ins, scheduled reports, or asks how to make Athlete OS run automatically.
triggers:
  - "set up routines"
  - "automate my weekly summary"
  - "schedule my training report"
  - "run automatically"
  - "weekly check-in"
  - "automated briefing"
  - "daily briefing"
  - "notify me after a workout"
---

# Setup Automated Training Routines

## Step 1 — Read credentials

Run this to get current credential values:

```bash
cat ~/.config/athlete-os/credentials.json
```

Extract these fields (you'll embed them directly in the routine prompts):
- `client_id`
- `client_secret`
- `refresh_token`
- `telegram_bot_token` (if present)
- `telegram_chat_id` (if present)
- `oura_access_token` (if present)

Also note which integrations are configured (telegram, oura) — use the appropriate routine prompt variant below.

## Step 2 — Ask what to automate

Use AskUserQuestion:
- Question: "Which routines do you want to run automatically? Pick as many as you like."
- Header: "Automated routines"
- multiSelect: true
- Options:
  - "After every workout — debrief sent to Telegram within an hour of finishing"
  - "Daily morning briefing — training load + today's recommendation"
  - "Weekly training summary — full week breakdown every Monday"
  - "Monthly trends — volume and progress charts"

## Step 3 — Ask timing (only for selections that need it)

If **weekly summary** selected:
- Question: "When do you want your weekly summary?"
- Options: "Monday 7am", "Monday 8am", "Sunday 8pm", "Sunday 9pm"

If **daily briefing** selected:
- Question: "What time for your daily briefing?"
- Options: "7am", "7:30am", "8am", "8:30am"

## Step 4 — Create the routines

Use the `schedule` skill for each. Every routine prompt must start with the credential restore block — substitute the actual values from Step 1.

**Credential restore block (prepend to every routine prompt):**
```
Start by restoring credentials. Run this bash command exactly:
node -e "const fs=require('fs'),os=require('os'),path=require('path'),d=path.join(os.homedir(),'.config/athlete-os');fs.mkdirSync(d,{recursive:true});fs.writeFileSync(path.join(d,'credentials.json'),JSON.stringify({client_id:'CLIENT_ID_HERE',client_secret:'CLIENT_SECRET_HERE',refresh_token:'REFRESH_TOKEN_HERE',telegram_bot_token:'BOT_TOKEN_HERE',telegram_chat_id:'CHAT_ID_HERE'},null,2));console.log('credentials restored');"

Then proceed with the routine below.
```

Substitute `CLIENT_ID_HERE`, `CLIENT_SECRET_HERE`, `REFRESH_TOKEN_HERE`, `BOT_TOKEN_HERE`, `CHAT_ID_HERE` with the actual values from Step 1. If Telegram isn't configured, omit those two fields from the JSON. If Oura is configured, add `oura_access_token:'OURA_TOKEN_HERE'` to the JSON.

---

### After every workout

**Cron**: `0 * * * *`

**Prompt:**
```
[credential restore block]

Check for new Strava activities in the last 90 minutes: call get-all-activities with after set to (current Unix timestamp minus 5400). If there are one or more new activities, run the debrief skill on the most recent one, then call send-telegram with the full debrief as plain text. If no new activities, do nothing and output nothing.
```

---

### Daily morning briefing

**Cron**: `0 7 * * *` (adjust hour/minute per chosen time: 7am=`0 7`, 7:30=`30 7`, 8am=`0 8`, 8:30=`30 8`)

**Prompt:**
```
[credential restore block]

Give a concise daily training briefing. Call get-all-activities for the last 90 days to compute training load (CTL/ATL/TSB). Call check-oura-connection — if connected, call get-oura-readiness for today. Write 2-3 sentences recommending what to do today based on form and recovery. Then call send-telegram with the full briefing as plain text.
```

---

### Weekly training summary

**Cron**: Monday 7am=`0 7 * * 1` · Monday 8am=`0 8 * * 1` · Sunday 8pm=`0 20 * * 0` · Sunday 9pm=`0 21 * * 0`

**Prompt:**
```
[credential restore block]

Run the summary skill for the past 7 days across all sport types. After generating, call send-telegram with the full summary as plain text (no markdown — strip ** and # but keep tables and unicode bars).
```

---

### Monthly trends

**Cron**: `0 8 1 * *`

**Prompt:**
```
[credential restore block]

Run the summary skill for the last 3 months showing month-by-month volume trends with unicode bar charts by sport. After generating, call send-telegram with the full output as plain text.
```

---

## Step 5 — Confirm

> "✓ [N] routine(s) created:
> [list each with its schedule]
>
> Credentials are embedded directly in each routine — no env var setup needed. The after-every-workout routine checks once per hour, so you'll get your debrief within 60 minutes of finishing."
