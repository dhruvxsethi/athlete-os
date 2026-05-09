---
name: setup-routines
description: Sets up automated training routines that run on a schedule — weekly summaries, monthly trend reports — without the user having to ask. Use when the user wants automated check-ins, scheduled reports, or asks how to make Athlete OS run automatically.
triggers:
  - "set up routines"
  - "automate my weekly summary"
  - "schedule my training report"
  - "run automatically"
  - "weekly check-in"
  - "automated briefing"
---

# Setup Automated Training Routines

Help the athlete set up scheduled routines. Be upfront about the one setup requirement before asking anything else.

## Important: remote agents need env vars

Scheduled routines run in Claude's cloud — they can't read your local credentials file. Say this immediately:

> "Before we set up the schedule, there's one quick thing: routines run in the cloud so they need your Strava credentials as environment variables. Run this to see what you need:
> ```bash
> cat ~/.config/athlete-os/credentials.json
> ```
> Then go to **claude.ai/settings → Routines → Environment variables** and add:
> - `STRAVA_CLIENT_ID`
> - `STRAVA_CLIENT_SECRET`
> - `STRAVA_REFRESH_TOKEN`
>
> Skip `STRAVA_ACCESS_TOKEN` — it expires every 6 hours and gets refreshed automatically."

Run the cat command and show the output so they can copy the values directly.

## Steps

### 1. Ask what to automate

Use AskUserQuestion:
- Question: "Which routines do you want to run automatically?"
- Header: "Routines"
- multiSelect: true
- Options:
  - "Weekly training summary" (description: "Every Monday morning — full week breakdown by sport")
  - "Monthly trends" (description: "1st of each month — last 3 months of volume and zone charts")

### 2. Ask timing for weekly summary (if selected)

- Question: "When do you want your weekly summary?"
- Header: "Schedule"
- Options: "Monday 7am", "Monday 8am", "Sunday 8pm", "Sunday 9pm"

### 3. Create the routines

Use the `schedule` skill to create each selected routine.

**Weekly summary prompt:**
```
Run the weekly-training-summary skill. Focus on triathlon sports (swim, bike, run). Show zone distribution and a coaching note.
```

**Monthly trends prompt:**
```
Run the monthly-trends skill for the last 3 months. Show distance trends by sport with bar charts.
```

**Cron expressions:**
- Monday 7am: `0 7 * * 1`
- Monday 8am: `0 8 * * 1`
- Sunday 8pm: `0 20 * * 0`
- Sunday 9pm: `0 21 * * 0`
- 1st of month 8am: `0 8 1 * *`

### 4. Confirm

> "✓ Routines created. Once you've added the three env vars at claude.ai/settings → Routines, they'll run automatically. Say 'show my routines' to manage them."
