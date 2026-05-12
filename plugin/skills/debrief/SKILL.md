---
name: debrief
description: Everything about a single workout — coaching feedback after finishing, deep analysis of any activity, or pace/zone breakdown. Use when the user asks about their last workout, just finished training, wants splits and HR zones, or asks about their pace distribution or training intensity.
triggers:
  - "just finished a run"
  - "just got back from a ride"
  - "just finished training"
  - "how was my last run"
  - "analyze my last workout"
  - "how did my workout go"
  - "debrief my workout"
  - "tell me about my most recent activity"
  - "pace distribution"
  - "am I in zone 2"
  - "training zones"
  - "junk miles"
  - "easy vs hard"
  - "how polarized is my training"
---

# Workout Debrief

Handles everything about a single workout. Read the question to pick the right mode:

- **Just finished / quick feedback** → conversational debrief (short, direct, coach tone)
- **Analyze / deep dive** → full structured breakdown (splits, HR zones, laps, coaching note)
- **Pace distribution / zones / polarized** → zone analysis across 90 days

## Unicode chart helpers

Use these patterns throughout — more charts than text.

**Sparkline** (inline trend, 8 chars): map values to `▁▂▃▄▅▆▇█` by normalizing to 0–7.

**Horizontal bar** (progress/comparison):
```
Label  ████████░░  80%  value
```
Use `█` for filled, `░` for empty, 10 chars wide.

**Lap splits bar chart** (vertical, inline):
```
PACE PER LAP (min/km)
─────────────────────
  5:10 ┤███
  5:20 ┤█████
  5:30 ┤███████████
  5:40 ┤████
       └──────────────
        1  2  3  4  5
```
Or simpler horizontal version:
```
Lap 1  5:10  ████████░░
Lap 2  5:20  ██████░░░░
Lap 3  5:30  █████░░░░░
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

## Post-Workout Debrief (just finished, quick feedback)

### Steps

1. Call `get-recent-activities` with `per_page: 1`.
2. Check recency — if ended more than 4 hours ago, note it briefly but continue.
3. Call `get-activity-details` with the activity ID.
4. If Run or Ride, call `get-activity-laps`.
5. If `start_latlng` is non-empty, call `get-weather-for-activity` using `start_latlng[0]` as latitude and `start_latlng[1]` as longitude. Include weather silently — don't announce you're fetching it.
6. Ask one follow-up before the full debrief (skip if they already stated their goal):
   - Run: "Did you have a target pace or effort for this one, or was it free?"
   - Ride: "Structured ride or just getting out?"
   - Swim: "Technique focus or distance work?"
   - Other: "What were you going for today?"

### Output

**Opening line** — name the activity, lead with one specific observation.
> "Good 10k this morning — you held it together in km 6–8 where your splits tightened instead of falling apart."

**Lap splits chart** — always show if laps exist (even 2 laps). Use a horizontal bar chart normalized to the fastest lap:
```
LAP SPLITS
──────────────────────────────────────────
Lap 1   5:12  ████████░░  5:12/km
Lap 2   5:08  █████████░  5:08/km  ↑ best
Lap 3   5:19  ███████░░░  5:19/km
Lap 4   5:31  █████░░░░░  5:31/km
──────────────────────────────────────────
Split pattern: negative → even → fade
```
Bar width (10 chars): normalized so fastest lap = 10 filled. Annotate best lap.
Label split pattern: negative split / even split / positive split / fade.

**Effort read** (2–3 sentences) — was effort appropriate for the goal? One inline weather note if conditions mattered.

**One thing that went well** — specific, grounded in data.

**One thing to watch** — honest, not harsh.

**PRs / achievements** — if `pr_count > 0` or `achievement_count > 0`, call them out.

**What's next** — one sentence: rest, easy day, or keep building.

**Tone:** Direct like a coach, not a cheerleader. No generic praise. No opening pleasantries.

---

## Deep Activity Analysis (analyze, deep dive, splits)

### Steps

1. Call `get-recent-activities` with `per_page: 1` (or use the activity they specified).
2. Call `get-activity-details`.
3. If `has_heartrate: true`, extract HR data.
4. If Run or Ride, call `get-activity-laps`.
5. Call `get-activity-streams` with `keys: "heartrate,time,velocity_smooth"` and `resolution: "low"` for granular data.
6. If `start_latlng` is non-empty, call `get-weather-for-activity` with `start_latlng[0]` as lat and `start_latlng[1]` as lng.

### Output

**Activity Header** — name, type, date, distance, moving time, elevation.

**Performance Summary** — one line: avg/max pace, avg/max HR, calories, weather.

**Lap / Split Breakdown** — always show as a chart, even if only 2 laps:

```
LAP-BY-LAP BREAKDOWN
──────────────────────────────────────────────────────
       Distance   Pace    HR   Bar (normalized to best)
Lap 1   1.00 km  5:12  148    ████████░░
Lap 2   1.00 km  5:08  151    █████████░  ↑ best lap
Lap 3   1.00 km  5:19  154    ███████░░░
Lap 4   1.00 km  5:31  162    █████░░░░░
Lap 5   0.85 km  5:44  158    ████░░░░░░
──────────────────────────────────────────────────────
```

**HR distribution sparkline** — if heart rate stream data available, bucket into 10 time-segments and show bpm trend:

```
HEART RATE TREND
─────────────────────────────────────────
 165 ┤              ▄▆█▇▆
 155 ┤        ▃▅▇███     ▅▄
 145 ┤   ▂▄▆██
 135 ┤▂▃█
     └─────────────────────────────────
     0%  10%  20%  30%  40%  50%  60%  70%  80%  90%  100%
```
Normalize 10 HR samples to an 8-row ASCII area chart. Show min/max HR on the y-axis (just 3 labels: bottom, middle, top).

**Highlights** — best lap, PRs, achievements, kudos.

**Coaching Note** — one paragraph: was effort appropriate? Signs of fatigue or strong form? One actionable suggestion.

---

## Pace & Zone Distribution (zones, polarized, junk miles)

### Steps

1. Call `get-athlete-zones` to get the athlete's actual configured HR zones. Use these if they exist.
2. Call `get-all-activities` with `after` set to 90 days ago (current Unix time − 7,776,000 seconds).
3. Filter to the sport they're asking about (default: Run; use Ride if they mention cycling).
4. For each activity, use `average_heartrate` for zone classification if available; fall back to pace/speed.
5. Bucket each activity into zones and sum time per zone.

### Zone Definitions

**Running — HR zones**

Preferred: use the athlete's actual zones from `get-athlete-zones` (heart_rate.zones array — each zone has `min` and `max` bpm).

If `get-athlete-zones` returns no heart rate zones, fall back to % of max HR:
| Zone | % Max HR | Label |
|------|----------|-------|
| Z1 | < 68% | Recovery |
| Z2 | 68–75% | Aerobic |
| Z3 | 75–82% | Tempo |
| Z4 | 82–89% | Threshold |
| Z5 | > 89% | VO2 Max |

For the fallback, use max HR from activity data (`max_heartrate` field across recent activities — take the highest value seen). If no max HR data at all, use 185 but note this in the output.

**Running — Pace zones (fallback when no HR data, min/km)**
Z1 > 6:30 / Z2 5:45–6:30 / Z3 5:00–5:45 / Z4 4:20–5:00 / Z5 < 4:20

**Cycling — Power zones (if FTP set in athlete profile)**
If athlete has FTP from `get-athlete-profile`, use standard power zones (% of FTP):
Z1 < 55% / Z2 55–75% / Z3 75–90% / Z4 90–105% / Z5 > 105%

**Cycling — Speed zones (fallback, km/h)**
Z1 < 22 / Z2 22–28 / Z3 28–34 / Z4 34–40 / Z5 > 40

### Output

**Zone distribution horizontal bar chart:**

```
ZONE DISTRIBUTION — LAST 90 DAYS  (23 runs · 187 km)
──────────────────────────────────────────────────────
Z1 Recovery    ░░░░░░░░░░   8%   2h 14m
Z2 Aerobic     █████░░░░░  51%  14h 22m  ✓ aerobic base
Z3 Tempo       ██░░░░░░░░  19%   5h 21m  ⚠ grey zone
Z4 Threshold   █░░░░░░░░░  12%   3h 22m
Z5 VO2 Max     █░░░░░░░░░  10%   2h 48m
──────────────────────────────────────────────────────
Aerobic (Z1+Z2): 59%   Intensity (Z4+Z5): 22%   Grey zone (Z3): 19%
```

Bar width = 10 chars. Each `█` = 10% of total training time.

**80/20 summary line:**
- If Z1+Z2 ≥ 75% and Z4+Z5 ≥ 10%: "Polarized ✓ — textbook 80/20 distribution"
- If Z3 > 25%: "Grey zone warning ⚠ — Z3 is the 'moderately hard' trap that kills adaptation"
- If Z4+Z5 < 10%: "Missing intensity — add one interval session per week"
- If Z1+Z2 < 60%: "Too much volume too hard — increase easy running"

**Weekly volume sparkline** — show training volume per week for the 13 weeks in the window:

```
WEEKLY VOLUME — LAST 13 WEEKS (km)
─────────────────────────────────
Wk  1  ▁  12    Wk  8  ▄  38
Wk  2  ▂  18    Wk  9  ▅  44
Wk  3  ▁   9    Wk 10  ▆  52
Wk  4  ▃  26    Wk 11  ▇  58
Wk  5  ▃  28    Wk 12  ▅  41
Wk  6  ▄  35    Wk 13  ▄  36
Wk  7  ▃  30
─────────────────────────────────
Trend: ▁▂▁▃▃▄▃▄▅▆▇▅▄   ↑ building
```

Compute sparkline: normalize weekly volumes to 0–7, map to `▁▂▃▄▅▆▇█`. Show trend direction.

**Coaching note (2–3 sentences):** name the phase, flag if Z3 > 25% (grey zone), one concrete action.

Note: if fewer than 5 activities in the window, flag low sample size.
