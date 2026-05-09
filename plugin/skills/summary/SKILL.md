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

**Week at a Glance** (MM/DD – MM/DD)
Total activities · Total distance · Total time · Total elevation

**By Sport**
| Sport | Sessions | Distance | Time | Elevation |

**Highlights**
- Longest and hardest activity
- PRs and achievements (or "none")

**Day-by-Day**
One liner per active day — e.g. "Mon: Easy 8km run, 45min · 🌧 14°C, rain"

**Coaching Reflection**
Load assessment (light/moderate/heavy) · Consistency · Balance · One recommendation for next week.

**Telegram offer** (if running interactively, not from a routine):
> "Want me to send this to Telegram?"
If yes, call `send-telegram` with plain text (no markdown, no ** or #).

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

**Bar chart per active sport** (skip sports with only 1 active month):
```
Distance by Month (km)
──────────────────────────────────
Dec  ████░░░░░░  38.4 km  (5 runs)
Jan  ██████░░░░  51.2 km  (7 runs)
Feb  ████████░░  68.9 km  (9 runs)
Mar  ██████████  81.0 km  (11 runs)
May  ████████░░  71.3 km  (9 runs)  ← this month
```

Bars are always 10 blocks wide (`█` filled, `░` empty), scaled to max value. Label current partial month with `← this month`. Zero-activity months show as `░░░░░░░░░░  0 km`.

**Summary table:**
| Month | 🏃 km | 🚴 km | 🏊 km | ⏱ hrs | 📈 elev |

**Trend analysis (3–5 sentences):** volume trend, most active month, biggest month-over-month jump (flag if >40%), consistency, one coaching note.

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

```
Fitness & Fatigue  (as of [today])
──────────────────────────────────────────
CTL  (Fitness)   ████████░░  XX pts
ATL  (Fatigue)   ██████░░░░  XX pts
TSB  (Form)      ±XX pts  → [state]

Oura readiness: XX/100  (if connected)
```

TSB states:
- > +25: Very fresh — race-ready
- +10 to +25: Fresh — good for a hard effort
- −10 to +10: Neutral — steady state
- −20 to −10: Building — adaptation happening
- < −20: Fatigued — ease off

```
6-Week Fitness Trend
──────────────────────────────────────────
Week −5  ████░░░░  XX pts
Week −4  █████░░░  XX pts
Week −3  ███████░  XX pts
Week −2  ████████  XX pts
Week −1  ███████░  XX pts
Now      ██████░░  XX pts  ← today
```

**Coaching note (2–4 sentences):** name the phase (building/peaking/recovering), flag if ATL > CTL × 1.3 (overreaching risk), one concrete action.

Note: suffer_score-based TSS is an approximation — power meter data would be more precise. If fewer than 14 days of data found, note the model needs more history.
