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

Handles everything about a single workout. Read the question to pick the right angle:

- **Just finished / quick feedback** → conversational debrief (short, direct, coach tone)
- **Analyze / deep dive** → full structured breakdown (splits, HR zones, laps, coaching note)
- **Pace distribution / zones / polarized** → zone analysis across 90 days

## MCP check

Call `check-strava-connection` first. If not available:
> "The Strava connection isn't active yet. Fully quit Claude Code (⌘Q) and reopen it — the MCP server loads on startup."

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

Keep it conversational. Short paragraphs, not bullet walls.

**Opening line** — name the activity, lead with one specific observation.
> "Good 10k this morning — you held it together in km 6–8 where your splits tightened instead of falling apart."

**Effort read** (2–3 sentences) — was effort appropriate for the goal? Pacing pattern (even, positive, negative split)? One inline weather note if conditions mattered.

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

**Performance Summary** — avg/max pace or speed, avg/max HR, calories, weather (single line: "🌤 18°C, feels 16°C · Wind 12 km/h").

**Lap / Split Breakdown** (if laps exist)
| Lap | Distance | Time | Pace | HR |

**Highlights** — best lap, PRs, achievements, kudos.

**Coaching Note** — one paragraph: was effort appropriate? Signs of fatigue or strong form? One actionable suggestion.

---

## Pace & Zone Distribution (zones, polarized, junk miles)

### Steps

1. Call `get-all-activities` with `after` set to 90 days ago (current Unix time − 7,776,000 seconds).
2. Filter to the sport they're asking about (default: Run; use Ride if they mention cycling).
3. For each activity, use `average_heartrate` for zone classification if available; fall back to pace.
4. Bucket each activity into zones and sum time per zone.

### Zone Definitions

**Running — HR zones (preferred if `average_heartrate` available)**
| Zone | % Max HR | Label |
|------|----------|-------|
| Z1 | < 68% | Recovery |
| Z2 | 68–75% | Aerobic |
| Z3 | 75–82% | Tempo |
| Z4 | 82–89% | Threshold |
| Z5 | > 89% | VO2 Max |

Estimate max HR as 220 − age if known, otherwise 185 as default.

**Running — Pace zones (fallback, min/km)**
Z1 > 6:30 / Z2 5:45–6:30 / Z3 5:00–5:45 / Z4 4:20–5:00 / Z5 < 4:20

**Cycling — Speed zones (km/h)**
Z1 < 22 / Z2 22–28 / Z3 28–34 / Z4 34–40 / Z5 > 40

### Output

```
Training Time by Zone — Last 90 Days (Runs)
────────────────────────────────────────────
Z1 Recovery   ██░░░░░░░░   8%   (2h 14m)
Z2 Aerobic    ██████████  51%  (14h 22m)  ✓ base
Z3 Tempo      ████░░░░░░  19%   (5h 21m)
Z4 Threshold  ██░░░░░░░░  12%   (3h 22m)
Z5 VO2 Max    ██░░░░░░░░  10%   (2h 48m)

Based on 23 runs · 187 km total
```

Bars are 10 blocks wide, scaled to highest zone's percentage.

**Interpretation (3–5 lines):**
- **80/20 check**: polarized training targets ~80% Z1+Z2, ~20% Z4+Z5
- **Junk miles flag**: if Z3 > 25%, flag the "moderately hard" trap
- **One concrete suggestion**: e.g. "Strong Z2 base but very little Z4/Z5 — add one interval session per week to get faster"

Skip activities shorter than 10 minutes. Don't show decimal places on percentages.
