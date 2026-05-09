---
name: pace-distribution
description: Analyzes where the athlete actually spends their training time — by pace zone for runners or speed zone for cyclists. Use when the user asks about their pace distribution, training zones, whether they're doing too much junk mileage, easy vs hard split, or polarized training. Renders inline — no external tools.
triggers:
  - "pace distribution"
  - "where do I spend my time"
  - "am I running too easy"
  - "am I in zone 2"
  - "junk miles"
  - "easy vs hard"
  - "polarized training"
  - "what pace do I usually run"
  - "speed distribution"
  - "training intensity breakdown"
---
## MCP connection check

Before doing anything, call `check-strava-connection`. If the tool isn't available, say:

> "The Strava connection isn't active yet. Please fully quit Claude Code (⌘Q) and reopen it — the MCP server loads on startup."

Do NOT attempt to work around missing MCP tools.



# Pace Distribution Analysis

Show where the athlete actually spends their training time across intensity zones. Everything renders inline.

## Steps

1. Call `get-all-activities` with `after` set to 90 days ago (current time − 7,776,000 seconds).
2. Filter to the sport type the user is asking about (default: Run). If they mention cycling, use Ride.
3. For each activity, extract `moving_time` (seconds) and `distance` (meters) to calculate average pace.
4. Also use `average_heartrate` if available — it's more accurate than pace for zone classification.
5. Bucket each activity into a zone based on pace or HR (see zone definitions below).
6. Calculate total time in each zone across all activities.

## Zone Definitions

### Running Pace Zones (min/km)
| Zone | Label | Pace Range | Purpose |
|------|-------|------------|---------|
| Z1 | Recovery | > 6:30/km | Very easy, active recovery |
| Z2 | Aerobic | 5:45–6:30/km | Base building, long runs |
| Z3 | Tempo | 5:00–5:45/km | Comfortably hard, threshold |
| Z4 | Threshold | 4:20–5:00/km | Race pace (half marathon–10k) |
| Z5 | VO2 Max | < 4:20/km | Intervals, 5k race pace |

### Running HR Zones (% of max HR, estimated max = 220 − age if known)
Prefer HR zones if `average_heartrate` is available on most activities.
| Zone | % Max HR |
|------|----------|
| Z1 | < 68% |
| Z2 | 68–75% |
| Z3 | 75–82% |
| Z4 | 82–89% |
| Z5 | > 89% |

### Cycling Speed Zones (km/h)
| Zone | Label | Speed |
|------|-------|-------|
| Z1 | Easy | < 22 km/h |
| Z2 | Endurance | 22–28 km/h |
| Z3 | Tempo | 28–34 km/h |
| Z4 | Threshold | 34–40 km/h |
| Z5 | Racing | > 40 km/h |

Note: If the athlete has power data (`average_watts`), mention it but don't over-rely on it without FTP context.

## Output Format

### Zone Distribution Chart

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

Bars are always 10 blocks wide, scaled to the highest zone's percentage.

### Interpretation

After the chart, give a 3–5 line plain-language read:

- **80/20 check**: Polarized training targets ~80% easy (Z1+Z2), ~20% hard (Z4+Z5). State where they sit.
- **Junk miles flag**: If Z3 is > 25%, flag it — this is the "moderately hard" trap that's too hard for recovery and too easy for adaptation.
- **Aerobic base**: Comment on whether Z2 volume is sufficient for their goals.
- **One specific suggestion**: e.g. "Your Z2 is strong but you have very little Z4/Z5 — if you want to get faster, add one interval session per week."

## Notes

- If HR data is missing on most activities, fall back to pace zones and note the limitation.
- Activities shorter than 10 minutes should be excluded from the analysis.
- Swimming uses a different pace scale — if the user asks about swimming, convert to per-100m pace and use general effort descriptors (easy / moderate / hard) rather than strict zones.
- Don't show decimal places on percentages — round to nearest whole number.

## Example Prompts

- "What's my pace distribution?"
- "Am I doing too many junk miles?"
- "Show me my training zone breakdown"
- "How polarized is my training?"
