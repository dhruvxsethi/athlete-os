---
name: summary
description: Training overview across any time window — this week, monthly trends, or current fitness/fatigue (CTL/ATL/TSB). Use when the user asks what they did this week, how their training has changed over months, their training load, whether they're overtraining, or how fit they are right now.
triggers:
  - "what did I do this week"
  - "weekly summary"
  - "how was my week"
  - "weekly recap"
  - "monthly trends"
  - "how has my training changed"
  - "last 3 months"
  - "training load"
  - "how fit am I"
  - "am I overtraining"
  - "am I fresh"
  - "CTL"
  - "ATL"
  - "TSB"
  - "fitness and fatigue"
  - "show me my training"
---

# Training Summary

Handles everything about training over time. Read what the user is asking and pick the right mode:

- **"this week" / "last 7 days"** → Weekly report
- **"last month" / "last 3 months" / "how has my training changed"** → Monthly trends
- **"training load" / "how fit am I" / "CTL/ATL" / "overtraining" / "am I fresh"** → PMC model

## MCP check

Call `check-strava-connection` first. If not available:
> "The Strava connection isn't active yet. Fully quit Claude Code (⌘Q) and reopen it — the MCP server loads on startup."

---

## Weekly Report

### Steps

1. If the user hasn't mentioned a sport, ask (skip if they said "my running this week" etc):
   - Question: "Focus on a specific sport or show everything?"
   - Options: "All sports", "Run", "Bike", "Swim"

2. Call `get-all-activities` with `after` = Unix timestamp 7 days ago (current time − 604800).

3. Group by sport. Aggregate per type: total distance, duration, elevation, count.

4. **PR / achievement scan** — check every activity for `pr_count > 0` or `achievement_count > 0`.

5. **HR snapshot (optional)** — if 3+ activities have `has_heartrate: true`, pick the longest run or ride, call `get-activity-streams` with `keys: "heartrate,time"` and `resolution: "low"`. Use it for one sentence in the coaching reflection only.

6. **Weather** — for the day-by-day section, call `get-weather-for-activity` for activities with a non-empty `start_latlng`. Use `start_latlng[0]` as lat and `start_latlng[1]` as lng. Skip silently if no data.

### Output

**Header line:** "Week of MM/DD–MM/DD · X activities · Y km · Z hrs"

**Chart:** Call `generate-chart` with:
- type: "bar"
- title: "THIS WEEK BY SPORT"
- labels: sport names active this week (e.g. ["RUN", "RIDE", "SWIM"])
- series: [{ name: "Distance (km)", values: [dist_per_sport], color: sport color (run/ride/swim) }]
  Use one series per sport with its own color if multi-sport, or a single series if one sport.
- unit: "km"

Read `chart_path` to display inline.

**Highlights (2–3 bullets):** longest activity, hardest, any PRs.

**Day-by-day (one line each):** "Mon: 8km easy run · 14°C clear"

**Coaching reflection (2 sentences):** load level + one recommendation.

**Telegram:** if interactive (not a routine), offer to send. If yes, call `send-telegram-photo` with the chart, then `send-telegram` with the text summary (plain text, no markdown).

---

## Monthly Trends

### Steps

1. If timeframe not specified, ask:
   - Question: "How far back do you want to look?"
   - Options: "3 months", "6 months", "12 months"
   - (3m = −7,776,000s · 6m = −15,768,000s · 12m = −31,536,000s from now)

2. Call `get-all-activities` with the `after` timestamp.

3. Group by calendar month (YYYY-MM). Per month, per sport: total distance, time, elevation, count.

### Output

**Chart (multi-series bar):** Call `generate-chart` with:
- type: "bar"
- title: "TRAINING VOLUME BY MONTH"
- labels: month abbreviations e.g. ["NOV", "DEC", "JAN", "FEB", "MAR", "APR", "MAY"]
- series: one per active sport — e.g.
  [
    { name: "Run", values: [km_per_month…], color: "run" },
    { name: "Ride", values: [km_per_month…], color: "ride" },
    { name: "Swim", values: [km_per_month…], color: "swim" },
  ]
  Omit sports with zero total volume.
- unit: "km"

Read `chart_path` to display inline.

**Trend analysis (3–5 sentences):** volume trend, most active month, biggest month-over-month jump (flag if >40%), consistency, one coaching note.

**Telegram:** if interactive, offer to send. Call `send-telegram-photo` with the chart, then `send-telegram` with the trend analysis as plain text.

---

## Training Load (PMC Model)

### Steps

#### 1. Fetch 90 days

Call `get-all-activities` with `after` = Unix time − 7,776,000 (90 days).

#### 2. Compute daily TSS

For each activity:
- **Primary:** use `suffer_score` if > 0 (roughly equivalent to TSS)
- **Fallback — with HR:** `hours × clamp(average_heartrate / 170, 0.4, 1.4)² × 100`
- **Fallback — type defaults:**
  - Run / TrailRun: `hours × 60`
  - Ride / VirtualRide: `hours × 55`
  - Swim: `hours × 70`
  - Walk / Hike: `hours × 35`
  - WeightTraining / Workout: `hours × 40`
  - Other: `hours × 50`

Group by calendar day (`start_date_local` date portion). Sum TSS for multiple activities on the same day. Days with no activity = 0.

#### 3. Compute CTL and ATL

Constants:
- `k_ctl = 0.02326` (42-day time constant)
- `k_atl = 0.13353` (7-day time constant)

Starting at CTL₀ = 0, ATL₀ = 0, iterate from oldest to today:
```
CTL_d = CTL_{d-1} + (TSS_d − CTL_{d-1}) × k_ctl
ATL_d = ATL_{d-1} + (TSS_d − ATL_{d-1}) × k_atl
TSB_d = CTL_d − ATL_d
```

Also track weekly average CTL for the last 6 weeks.

#### 4. Oura context

Call `check-oura-connection`. If connected, call `get-oura-readiness` for today. Show readiness alongside TSB.

### Output

**PMC line chart:** Call `generate-chart` with:
- type: "line"
- title: "FITNESS AND FATIGUE — LAST 6 WEEKS"
- labels: weekly date labels e.g. ["APR 1", "APR 8", "APR 15", "APR 22", "APR 29", "MAY 6"]
  Use 6 points, one per week (weekly average CTL/ATL/TSB).
- series:
  [
    { name: "CTL Fitness", values: [weekly_ctl…], color: "ctl" },
    { name: "ATL Fatigue", values: [weekly_atl…], color: "atl" },
    { name: "TSB Form",    values: [weekly_tsb…], color: "tsb" },
  ]
- unit: "pts"

Read `chart_path` to display inline.

**After the chart — one status block:**
```
CTL (Fitness)  XX pts
ATL (Fatigue)  XX pts
TSB (Form)     ±XX pts  →  [state]
Oura readiness: XX/100  (if connected)
```

TSB states: >+25 Very fresh · +10 to +25 Fresh · −10 to +10 Neutral · −20 to −10 Building · <−20 Fatigued

**Coaching note (2–3 sentences):** name the phase, flag if ATL > CTL × 1.3 (overreaching risk), one concrete action.

**Telegram:** if interactive, call `send-telegram-photo` with the chart, then `send-telegram` with the status block + coaching note.

Note: suffer_score-based TSS is an approximation. Flag if fewer than 14 days of data.
