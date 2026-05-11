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

1. Call `generate-chart` with:
   - type: "bar"
   - title: "ZONE DISTRIBUTION — LAST 90 DAYS" (append sport)
   - labels: ["Z1 RECOVERY", "Z2 AEROBIC", "Z3 TEMPO", "Z4 THRESHOLD", "Z5 VO2"]
   - series: [{ name: "Hours", values: [hours_per_zone…], color: the zone color (z1/z2/z3/z4/z5) }]
     Use one series per zone with its own color so each bar is colored differently:
     series: [
       { name: "Z1", values: [z1_hours, 0, 0, 0, 0], color: "z1" },
       { name: "Z2", values: [0, z2_hours, 0, 0, 0], color: "z2" },
       { name: "Z3", values: [0, 0, z3_hours, 0, 0], color: "z3" },
       { name: "Z4", values: [0, 0, 0, z4_hours, 0], color: "z4" },
       { name: "Z5", values: [0, 0, 0, 0, z5_hours], color: "z5" },
     ]
     (This gives each bar its own zone color.)
   - unit: "h"
2. Read the returned `chart_path` to display the chart inline.
3. If Telegram is configured, call `send-telegram-photo` with the path and a short caption.

**After the chart, one short paragraph:**
- Zone breakdown summary: "X hrs Z1+Z2 (aerobic base), Y hrs Z4+Z5 (intensity)"
- **80/20 check**: polarized training targets ~80% Z1+Z2, ~20% Z4+Z5
- **Junk miles flag**: if Z3 > 25%, flag the "moderately hard" trap
- One concrete suggestion — e.g. "Strong base but little Z4/Z5 — add one interval session per week"

Keep total response concise: chart + 3–5 sentences. Skip activities shorter than 10 minutes.
