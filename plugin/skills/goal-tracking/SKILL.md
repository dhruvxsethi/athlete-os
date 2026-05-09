---
name: goal-tracking
description: Track annual training goals — set a target, then check progress at any time with a unicode progress bar and year-end projection. Use when the user wants to set a goal, check goal progress, or ask if they're on track for the year.
triggers:
  - "set a goal"
  - "training goal"
  - "am I on track"
  - "goal progress"
  - "how close am I"
  - "yearly target"
  - "annual goal"
  - "1000km"
  - "how many km this year"
  - "/athlete-goals"
---

## MCP connection check

Call `check-strava-connection` first. If not available, say:

> "The Strava connection isn't active yet. Please fully quit Claude Code (⌘Q) and reopen it."

# Goal Tracking

Set annual training goals and track progress with projections.

## Setting a Goal

When the user says something like "set my running goal to 1500km for 2026" or "I want to run 1000km this year":

1. Parse sport, metric (distance_km / time_hours / activities), target, and year from the message.
2. Call `set-goal` with those values.
3. Confirm: "✓ Goal saved: [sport] [target] [metric] for [year]. Say '/athlete-goals' to check progress anytime."

If the goal would replace an existing one for the same sport+metric+year, flag this before saving:
> "You already have a [sport] goal of [old_target] [metric] for [year]. Replace it with [new_target]?"

## Checking Progress

When the user asks about goals or runs `/athlete-goals`:

1. Call `get-goals`. If no goals are stored, offer to set one:
   > "No goals set yet. Try: 'Set my running goal to 1000km for 2026'"

2. Call `get-athlete-stats` for YTD totals (use `ytd_run_totals`, `ytd_ride_totals`, `ytd_swim_totals`).

3. For each goal in the current year, compute:
   - `ytd_value`: extract from stats (distance in meters → convert to km or miles, time in seconds → hours, or count)
   - `progress_pct = ytd_value / target × 100`
   - `days_elapsed` = day-of-year today
   - `days_in_year` = 365 (or 366)
   - `expected_pct = days_elapsed / days_in_year × 100`
   - `projected_year_end = ytd_value / days_elapsed × days_in_year`
   - `on_track = projected_year_end >= target × 0.95`

4. Render the report.

## Output Format

```
2026 Training Goals  (Day 130 of 365 — 36% of year)
──────────────────────────────────────────────────────
🏃 Run   1000 km
  ████████░░░░░░░░░░░░  680 / 1000 km  (68%)
  On track ✓  →  projected 1,720 km by Dec 31

🚴 Ride  2000 km
  ████░░░░░░░░░░░░░░░░  580 / 2000 km  (29%)
  Behind ⚠️  →  projected 1,460 km — need +38 km/week to hit 2000

🏊 Swim  50 km
  ████████████████████  48 / 50 km  (96%)
  Almost there 🎯  →  2 km to go
```

Progress bar: 20 blocks wide. Fill proportionally to `progress_pct`. Cap at 20 filled blocks even if over 100%.

Status labels:
- `projected >= target`: "On track ✓"
- `projected >= target × 0.9`: "Close — [X] [unit] to go to stay on track"
- `projected < target × 0.9`: "Behind ⚠️ — need [weekly rate] to hit [target]"
- `progress_pct >= 100`: "Done! 🎯 Goal achieved [N] days early"

Weekly rate needed to catch up: `(target − ytd_value) / weeks_remaining`.

## Deleting a Goal

If the user says "remove my cycling goal" or "delete my swim goal for 2026":
- Call `get-goals`, find the matching goal, remove it from the list, call `set-goal` won't work here — tell the user to say "set my [sport] goal to 0" as a workaround, or handle gracefully by noting goal management is limited to setting/updating for now.

## Example Prompts

- "Set my running goal to 1000km for 2026"
- "Am I on track for my goals?"
- "How close am I to my annual targets?"
- "/athlete-goals"
