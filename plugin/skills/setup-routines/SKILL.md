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

Help the athlete set up scheduled routines. Be upfront about the one setup requirement before asking anything else.

## Important: remote agents need env vars

Scheduled routines run in Claude's cloud — they can't read your local credentials file. Say this immediately:

> "Before we set up the schedule, there's one quick thing: routines run in the cloud so they need your credentials as environment variables.
>
> Run this to see your values:
> ```bash
> cat ~/.config/athlete-os/credentials.json
> ```
>
> Then go to **claude.ai/settings → Routines → Environment variables** and add:
> - `STRAVA_CLIENT_ID`
> - `STRAVA_CLIENT_SECRET`
> - `STRAVA_REFRESH_TOKEN`
>
> If you have Telegram set up, also add:
> - `TELEGRAM_BOT_TOKEN`
> - `TELEGRAM_CHAT_ID`
>
> If you have Oura, add:
> - `OURA_ACCESS_TOKEN`
>
> Skip `STRAVA_ACCESS_TOKEN` — it expires every 6 hours and is refreshed automatically."

Run the cat command and show the output so they can copy the values directly.

## Step 1 — Check Telegram

Check if Telegram is configured by reading credentials directly (do NOT call send-telegram to check — that sends a real message):

```bash
node -e "
const fs = require('fs'), os = require('os'), path = require('path');
const f = path.join(os.homedir(), '.config/athlete-os/credentials.json');
try {
  const c = JSON.parse(fs.readFileSync(f, 'utf8'));
  console.log(c.telegram_bot_token ? 'telegram=configured' : 'telegram=not_configured');
} catch { console.log('telegram=not_configured'); }
"
```

Store whether Telegram is available for the routine prompts below.

## Step 2 — Ask what to automate

Use AskUserQuestion:
- Question: "Which routines do you want to run automatically? Pick as many as you like."
- Header: "Automated routines"
- multiSelect: true
- Options:
  - "After every workout — debrief sent to Telegram within an hour of finishing" (description: "Checks hourly for new activities, sends post-workout debrief automatically")
  - "Daily morning briefing — training load + today's recommendation" (description: "Every morning: CTL/ATL/TSB, Oura readiness if connected, what to do today")
  - "Weekly training summary — full week breakdown every Monday" (description: "Every Monday morning: distance, zones, highlights, coaching reflection")
  - "Monthly trends — volume and progress charts" (description: "1st of each month: last 3 months of training trends by sport")

## Step 3 — Ask timing (only for selections that need it)

If **weekly summary** is selected:
- Question: "When do you want your weekly summary?"
- Header: "Weekly schedule"
- Options: "Monday 7am", "Monday 8am", "Sunday 8pm", "Sunday 9pm"

If **daily briefing** is selected:
- Question: "What time for your daily briefing?"
- Header: "Daily schedule"
- Options: "7am", "7:30am", "8am", "8:30am"

## Step 4 — Create the routines

Use the `schedule` skill to create each selected routine. Create all selected routines in sequence.

---

### After every workout (hourly check)

**Cron**: `0 * * * *`

**Prompt (with Telegram):**
```
Check for new Strava activities in the last 90 minutes: call get-all-activities with after set to (current Unix timestamp minus 5400). If there are one or more new activities, run the post-workout-debrief skill on the most recent one, then call send-telegram with the full debrief text. If there are no new activities, do nothing and output nothing.
```

**Prompt (without Telegram):**
```
Check for new Strava activities in the last 90 minutes: call get-all-activities with after set to (current Unix timestamp minus 5400). If there are one or more new activities, run the post-workout-debrief skill on the most recent one. If there are no new activities, do nothing and output nothing.
```

---

### Daily morning briefing

**Cron**: `0 7 * * *` (or `30 7`, `0 8`, `30 8` depending on chosen time)

**Prompt (with Telegram):**
```
Give a concise daily training briefing. Call get-all-activities for the last 90 days to compute training load (CTL/ATL/TSB using the training-load skill instructions). Call check-oura-connection — if connected, call get-oura-readiness for today and include the readiness score. Write a 2-3 sentence recommendation for today's training based on form and recovery. Then call send-telegram with the full briefing as plain text.
```

**Prompt (without Telegram):**
```
Give a concise daily training briefing. Call get-all-activities for the last 90 days to compute training load (CTL/ATL/TSB using the training-load skill instructions). Call check-oura-connection — if connected, call get-oura-readiness for today and include the readiness score. Write a 2-3 sentence recommendation for today's training based on form and recovery.
```

---

### Weekly training summary

**Cron** (based on chosen time):
- Monday 7am: `0 7 * * 1`
- Monday 8am: `0 8 * * 1`
- Sunday 8pm: `0 20 * * 0`
- Sunday 9pm: `0 21 * * 0`

**Prompt (with Telegram):**
```
Run the weekly-training-summary skill for the past 7 days. Focus on all sport types. After generating the summary, call send-telegram with the full summary as plain text (no markdown formatting).
```

**Prompt (without Telegram):**
```
Run the weekly-training-summary skill for the past 7 days. Focus on all sport types.
```

---

### Monthly trends

**Cron**: `0 8 1 * *`

**Prompt (with Telegram):**
```
Run the monthly-trends skill for the last 3 months. Show distance trends by sport with unicode bar charts. After generating, call send-telegram with the full output as plain text.
```

**Prompt (without Telegram):**
```
Run the monthly-trends skill for the last 3 months. Show distance trends by sport with unicode bar charts.
```

---

## Step 5 — Confirm

> "✓ [N] routine(s) created:
> [list each routine and its schedule]
>
> Once you've added the env vars at claude.ai/settings → Routines, they'll run automatically. The after-every-workout routine checks once per hour — so you'll get your debrief within 60 minutes of finishing. Say 'show my routines' anytime to manage them."
