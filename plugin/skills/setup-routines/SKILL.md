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

Routines are scheduled Claude agents that run on a cron schedule. They use the credentials already saved on your machine — no extra setup needed.

## Step 1 — Check connections

Call `check-strava-connection` to confirm Strava is active. If Telegram routines are selected, verify `telegram_bot_token` is in credentials:

```bash
node -e "const c=JSON.parse(require('fs').readFileSync(require('os').homedir()+'/.config/athlete-os/credentials.json','utf8'));console.log('telegram='+(c.telegram_bot_token?'configured':'NOT configured'));"
```

If Telegram isn't configured and the user selects a routine that sends to Telegram, run the Telegram setup from the `connect` skill first.

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

Use the `schedule` skill for each.

---

### After every workout

**Cron**: `0 * * * *`

**Prompt:**
```
Check for new Strava activities that haven't been debriefed yet:

1. Call get-last-processed-activity to get the last activity ID that was sent.
2. Call get-all-activities with after set to (current Unix timestamp minus 5400) to find activities in the last 90 minutes.
3. If there are no new activities, stop — output nothing.
4. If the most recent activity has the same ID as last_processed_activity_id, stop — it was already debriefed.
5. Otherwise, run a full workout debrief on the most recent activity (use the debrief skill — post-workout mode). Then call send-telegram with the debrief as plain text (no markdown).
6. Call mark-activity-processed with the activity's ID.
```

---

### Daily morning briefing

**Cron**: `0 7 * * *` (adjust: 7:30am=`30 7`, 8am=`0 8`, 8:30am=`30 8`)

**Prompt:**
```
Give a concise daily training briefing. Call get-all-activities for the last 90 days to compute training load (CTL/ATL/TSB). Call check-oura-connection — if connected, call get-oura-readiness for today. Write 2–3 sentences recommending what to do today based on form and recovery. Call send-telegram with the full briefing as plain text.
```

---

### Weekly training summary

**Cron**: Monday 7am=`0 7 * * 1` · Monday 8am=`0 8 * * 1` · Sunday 8pm=`0 20 * * 0` · Sunday 9pm=`0 21 * * 0`

**Prompt:**
```
Run the summary skill for the past 7 days across all sport types. Build the full Unicode chart output (volume by sport bars, daily activity grid, highlights, coaching reflection). Send everything as a single plain-text message using send-telegram.
```

---

### Monthly trends

**Cron**: `0 8 1 * *`

**Prompt:**
```
Run the summary skill for the last 3 months. Build the full Unicode chart output (monthly volume table with sparklines, month-over-month changes, trend analysis). Send everything as a single plain-text message using send-telegram.
```

---

## Step 5 — Confirm

> "✓ [N] routine(s) created:
> [list each with its schedule]
>
> The after-every-workout routine checks once per hour and skips activities that have already been debriefed — no duplicates."
