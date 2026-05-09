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

Help the athlete set up scheduled routines so their training intel arrives automatically — no prompting needed.

## How Routines Work in Claude Code

Claude Code has a built-in scheduler. Routines run as scheduled agents at whatever cadence the user sets. Use the `schedule` skill (invoke it) to create them.

## Steps

### 1. Ask what they want to automate

Use AskUserQuestion:
- Question: "Which routines do you want to run automatically?"
- Header: "Routines"
- multiSelect: true
- Options:
  - "Weekly training summary" (description: "Every Monday morning — full week breakdown by sport")
  - "Monthly trends" (description: "1st of each month — volume and zone charts for the past 3 months")
  - "Post-activity debrief" (description: "After every logged activity — automatic analysis")

### 2. Ask when for each selected routine

For **weekly summary**, ask:
- Question: "What day and time for your weekly summary?"
- Header: "Schedule"
- Options: "Monday 7am", "Monday 8am", "Sunday evening 8pm", "Sunday evening 9pm"

For **monthly trends**, no need to ask — always runs on the 1st at 8am.

### 3. Create the scheduled tasks

Invoke the `schedule` skill and create each selected routine with the appropriate cron expression and prompt.

Use these prompts for each routine:

**Weekly summary prompt:**
```
Run the weekly-training-summary skill for my Strava training. Focus on triathlon sports (swim, bike, run). Show zone distribution and coaching notes.
```

**Monthly trends prompt:**
```
Run the monthly-trends skill for my Strava training over the last 3 months. Show distance trends by sport with unicode bar charts.
```

**Cron expressions:**
- Monday 7am: `0 7 * * 1`
- Monday 8am: `0 8 * * 1`
- Sunday 8pm: `0 20 * * 0`
- Sunday 9pm: `0 21 * * 0`
- 1st of month 8am: `0 8 1 * *`

### 4. Confirm setup

After creating each routine, tell the user:
- What will run and when (in plain English, not cron)
- That they can say "show my scheduled routines" to see them or "cancel my weekly summary" to remove one

## Example Output

> ✓ Two routines scheduled:
> - **Weekly summary** — every Monday at 8am
> - **Monthly trends** — 1st of each month at 8am
>
> They'll appear in your Claude Code session automatically. Say "show my routines" to manage them.
