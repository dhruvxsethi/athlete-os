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

## Unicode chart helpers

Use these patterns throughout — every section gets at least one chart.

**Sparkline**: map values to `▁▂▃▄▅▆▇█` by normalizing to 0–7 (0 = `▁`, max = `█`). Empty/zero weeks = `░`.

**Horizontal bar (10 chars)**: `████████░░` — filled `█` proportional to value vs max.

**Mini column chart** (inline, one row of sparkline chars below values):
```
     NOV  DEC  JAN  FEB  MAR  APR
Run   48   63   38   55   71   84
       ▃    █    ▂    ▄    ▆    █
```

## MCP check

Call `check-strava-connection` first.

**If the tool call fails or returns `connected: false`:**

Say exactly this and STOP — do not attempt any workarounds (no Bash, no curl, no Python, no direct API calls, no reading credential files):

> "The Strava tools aren't loaded yet — they start on Claude Code startup.
>
> **Press ⌘Q to fully quit Claude Code** (closing the window isn't enough), then reopen it. Once you're back, ask me the same thing again and it'll work."

That's it. No further steps. The user needs to restart.

---

## Weekly Report

### Steps

1. If the user hasn't mentioned a sport, ask (skip if they said "my running this week" etc):
   - Question: "Focus on a specific sport or show everything?"
   - Options: "All sports", "Run", "Bike", "Swim"

2. Call `get-all-activities` with `after` = Unix timestamp 7 days ago (current time − 604800).

3. Group by sport. Aggregate per type: total distance, duration, elevation, count.

4. **PR / achievement scan** — check every activity for `pr_count > 0` or `achievement_count > 0`.

5. **HR snapshot (optional)** — if 3+ activities have `has_heartrate: true`, pick the longest run or ride, call `get-activity-streams` with `keys: "heartrate,time"` and `resolution: "low"`. Use it for the HR trend sparkline.

6. **Weather** — for the day-by-day section, call `get-weather-for-activity` for activities with a non-empty `start_latlng`. Use `start_latlng[0]` as lat and `start_latlng[1]` as lng. Skip silently if no data.

### Output

**Header line:** "Week of MM/DD–MM/DD · X activities · Y km · Z hrs"

**Volume by sport — horizontal bars:**
```
THIS WEEK BY SPORT
──────────────────────────────────────────
Run    ████████░░  42 km  3 activities
Ride   █████░░░░░  28 km  1 activity
Swim   ██░░░░░░░░   3 km  2 activities
──────────────────────────────────────────
Total  67 km · 6h 42m · 820m elevation
```
Bar width = 10, normalized to highest-volume sport.

**Daily breakdown with activity sparkline:**
```
DAILY ACTIVITY
──────────────────────────────────────────
Mon  Run   8.2 km  5:18/km  ☁ 12°C
Tue  —
Wed  Run   12.0 km  5:31/km  ☀ 16°C
Thu  Swim   1.5 km  open water
Fri  —
Sat  Ride   28 km  24.3 km/h  ☀ 19°C
Sun  Run   22.1 km  5:44/km  ⛅ 14°C
──────────────────────────────────────────
Load:  ░░█░░█░  (days active this week)
```
The load row: `█` = activity day, `░` = rest day, Mon–Sun.

**HR trend sparkline** (if HR data available — only show if ≥ 3 activities with HR):
```
HR TREND (avg bpm per activity)
─────────────────────────────────
148  154  142  158  151
 ▄    ▆    ▂    █    ▅
```

**Highlights (2–3 bullets):** longest activity, hardest, any PRs.

**Coaching reflection (2 sentences):** load level + one recommendation.

**Telegram:** if interactive (not a routine), offer to send. If yes, call `send-telegram` with the full text output (plain text, no markdown).

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

**Volume table with sparkline row — one per active sport:**

```
TRAINING VOLUME BY MONTH (km)
──────────────────────────────────────────────────────
        NOV  DEC  JAN  FEB  MAR  APR  MAY
Run      48   63   38   55   71   84   67
          ▃    █    ▂    ▄    ▆    █    ▅
Ride     92  111   65   88  124  146  118
          ▄    ▅    ▂    ▄    ▆    █    ▅
Swim      4    0    6    4    8   10    7
          ▂    ░    ▃    ▂    ▄    █    ▃
──────────────────────────────────────────────────────
```
Each sport gets its own sparkline row. `░` = zero volume month. Normalize each sport's sparkline independently (its own max = `█`).

**Activity count table:**
```
ACTIVITY COUNT
──────────────────────────────────────────────────────
        NOV  DEC  JAN  FEB  MAR  APR  MAY
Run       8   10    6    9   12   13   11
Ride      4    5    3    4    6    7    5
Total    12   15    9   13   18   20   16
──────────────────────────────────────────────────────
```

**Month-over-month change sparkline** (total volume):
```
TOTAL VOLUME TREND
─────────────────────────────────────
NOV → DEC: +24%  ↑
DEC → JAN: −40%  ↓↓  (recovery block?)
JAN → FEB: +45%  ↑↑  ⚠ big jump
FEB → MAR: +29%  ↑
MAR → APR: +18%  ↑
APR → MAY: −20%  ↓
─────────────────────────────────────
```
Flag any month-over-month jump > 40% with ⚠.

**Trend analysis (3–5 sentences):** volume trend, most active month, biggest jump, consistency, one coaching note.

**Telegram:** if interactive, call `send-telegram` with the full text output.

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

Also compute weekly CTL, ATL, TSB averages for the last 6 weeks (use last day of each week).

#### 4. Oura context

Call `check-oura-connection`. If connected, call `get-oura-readiness` for today. Show readiness alongside TSB.

### Output

**Current status block:**
```
FITNESS & FATIGUE — TODAY
──────────────────────────────────────────
CTL  Fitness   ██████████  58 pts
ATL  Fatigue   ████████░░  47 pts
TSB  Form      ███░░░░░░░  +11 pts  → Fresh
──────────────────────────────────────────
Oura readiness: 74/100  █████████░░░░░░  (if connected)
```
TSB bar: center it at 0. Positive TSB = filled right. Negative TSB = filled left.
TSB states: > +25 Very fresh · +10 to +25 Fresh · −10 to +10 Neutral · −20 to −10 Building · < −20 Fatigued

**6-week trend table with sparklines:**
```
6-WEEK FITNESS TREND
──────────────────────────────────────────────────
       Wk-5  Wk-4  Wk-3  Wk-2  Wk-1  Now
CTL     42    46    49    53    56    58
         ▁     ▃     ▄     ▆     ▇     █
ATL     38    51    44    62    59    47
         ▁     ▅     ▃     █     ▇     ▅
TSB     +4    -5    +5    -9    -3   +11
         ▄     ▂     ▄     ▁     ▃     █
──────────────────────────────────────────────────
```
Normalize each row's sparkline independently. TSB: map −25…+25 to 0–7.

**Weekly TSS bar chart (13 weeks):**
```
WEEKLY TRAINING LOAD (TSS)
─────────────────────────────────────────────────────────────────
Wk -12  ▂  180    Wk  -6  ▄  340    Wk  -1  ▆  480
Wk -11  ▂  195    Wk  -5  ▃  290    Wk   0  ▅  420
Wk -10  ▃  240    Wk  -4  ▅  380
Wk  -9  ▁  140    Wk  -3  ▆  450
Wk  -8  ▃  260    Wk  -2  ▇  510
Wk  -7  ▄  310    Wk  -1  ▆  480
─────────────────────────────────────────────────────────────────
Trend: ▂▂▃▁▃▄▄▃▅▆▇▆▅
```

**Coaching note (2–3 sentences):** name the phase (base / build / peak / recovery), flag if ATL > CTL × 1.3 (overreaching risk), one concrete action.

**Telegram:** if interactive, call `send-telegram` with the full status block + coaching note.

Note: suffer_score-based TSS is an approximation. Flag if fewer than 14 days of data.
