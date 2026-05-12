---
name: goal-tracking
description: Track annual training goals — set a target, then check progress at any time with a unicode progress bar and year-end projection. Use when the user wants to set a goal, check goal progress, delete a goal, or ask if they're on track for the year.
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
  - "delete my goal"
  - "remove my goal"
  - "/athlete-goals"
---

## MCP connection check

Call `check-strava-connection` first.

**If the tool call fails or returns `connected: false`:**

Say exactly this and STOP — do not attempt any workarounds:

> "The Strava tools aren't loaded yet — they start on Claude Code startup.
>
> **Press ⌘Q to fully quit Claude Code** (closing the window isn't enough), then reopen it. Once you're back, ask me the same thing again and it'll work."

That's it. No further steps.

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
   - `weeks_remaining = (days_in_year − days_elapsed) / 7`
   - `expected_pct = days_elapsed / days_in_year × 100`
   - `projected_year_end = ytd_value / days_elapsed × days_in_year`
   - `weekly_rate_needed = (target − ytd_value) / weeks_remaining`
   - `on_track = projected_year_end >= target × 0.95`

4. Render the report.

## Output Format

**Goal progress — one block per goal:**

```
2026 TRAINING GOALS
──────────────────────────────────────────────────────────────────
RUN KM
  Actual    ██████░░░░░░░░░░░░░░   680 / 1000 km  (68%)
  Expected  ████████░░░░░░░░░░░░   360 / 1000 km  (36%)  ← pace needed
  ↑ Ahead of pace by 32%  →  On track ✓  projected 1720 km · need 38km/wk

RIDE KM
  Actual    █████░░░░░░░░░░░░░░░░   580 / 2000 km  (29%)
  Expected  ████████░░░░░░░░░░░░   720 / 2000 km  (36%)
  ↓ Behind pace by 7%   →  Behind ⚠    projected 1460 km · need 60km/wk

SWIM KM
  Actual    ███████████████████░   48 / 50 km  (96%)
  Expected  ██████████████████░░   18 / 50 km  (36%)
  ↑ Way ahead           →  Almost there · 2 km to go
──────────────────────────────────────────────────────────────────
```

**Bar construction (20 chars wide):**
- Actual bar: `progress_pct / 5` filled chars (max 20)
- Expected bar: `expected_pct / 5` filled chars
- Both use `█` filled, `░` empty

**Status line rules:**
- `projected >= target`: "On track ✓  projected [X] · need [weekly_rate]/wk"
- `projected >= target × 0.9`: "Close — projected [X] · need [weekly_rate]/wk"
- `projected < target × 0.9`: "Behind ⚠  projected [X] · need [weekly_rate]/wk to catch up"
- `progress_pct >= 100`: "Done! 🎯 Goal achieved — [X]% of target"

**Year progress context line** (shown once at top):
```
Year progress: ██████████░░░░░░░░░░  Day 129 / 365  (35% of year elapsed)
```

**Multi-goal comparison sparkline** (if ≥ 2 goals):
```
PACE COMPARISON (actual vs expected pace)
─────────────────────────────────────────
Run    ████████░░  +32%  ahead ✓
Ride   ██░░░░░░░░   −7%  behind ⚠
Swim   ████████░░  +60%  way ahead ✓
─────────────────────────────────────────
```
Bar = actual/expected ratio (100% = 10 filled). > 10 filled = capped at 10 + ✓.

## Deleting a Goal

If the user says "remove my cycling goal" or "delete my run goal for 2026":

1. Call `get-goals` to confirm the goal exists.
2. If found, confirm with the user: "Delete [sport] goal of [target] [metric] for [year]?"
3. On confirmation, call `delete-goal` with `sport`, `metric`, and `year`.
4. Confirm: "✓ Goal removed."

If not found: "No [sport] goal found for [year]."

## Example Prompts

- "Set my running goal to 1000km for 2026"
- "Am I on track for my goals?"
- "How close am I to my annual targets?"
- "Delete my cycling goal"
- "/athlete-goals"
