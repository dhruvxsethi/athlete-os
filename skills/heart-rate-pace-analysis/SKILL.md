---
name: heart-rate-pace-analysis
description: Performs a detailed heart rate and pace analysis for one or more activities. Use when the user asks about their training zones, whether they ran in zone 2, pace distribution, aerobic efficiency, cardiac drift, or wants to understand effort levels across a session.
triggers:
  - "was I in zone 2"
  - "heart rate analysis"
  - "pace distribution"
  - "aerobic efficiency"
  - "cardiac drift"
  - "training zones breakdown"
  - "how hard was my run"
  - "HR zones"
  - "what zones did I train in"
---

# Heart Rate & Pace Analysis

Perform a detailed HR and pace breakdown for one or more activities.

## Steps

1. Determine the target activity (latest, specific date, or user-named activity).
2. Call `get-activity-details` to get base metrics.
3. Call `get-athlete-zones` to retrieve the athlete's configured HR zones and pace zones (if set).
4. Call `get-activity-streams` with `keys: ["heartrate", "velocity_smooth", "time", "distance"]` to get second-by-second data.
5. If streams are unavailable, fall back to summary stats from activity details.
6. Calculate:
   - Time spent in each HR zone (Z1–Z5)
   - Average pace per km/mile split
   - Decoupling ratio: compare HR and pace in first vs. second half (cardiac drift indicator)
   - Aerobic efficiency = distance / average HR (simple proxy)
7. Produce the analysis below.

## Output Format

**Heart Rate & Pace Analysis — [Activity Name] ([Date])**

**Heart Rate Zones**
| Zone | Name | Range | Time | % of Session |
|------|------|-------|------|--------------|
| Z1 | Recovery | < X bpm | Xm | X% |
| Z2 | Aerobic | X–X bpm | Xm | X% |
| Z3 | Tempo | X–X bpm | Xm | X% |
| Z4 | Threshold | X–X bpm | Xm | X% |
| Z5 | Max | > X bpm | Xm | X% |

**Pace Breakdown**
- Average pace: X:XX /km
- Best km: X:XX (km N)
- Slowest km: X:XX (km N)
- Pace variance: ±X sec/km (consistent / uneven)

**Cardiac Drift Analysis**
- First half avg HR: X bpm / Second half avg HR: X bpm
- Drift: +X bpm (+X%)
- Interpretation: [No drift = well-fueled and aerobically efficient | Moderate drift = normal for longer efforts | High drift = possible dehydration, pacing issue, or cumulative fatigue]

**Aerobic Efficiency Score**
- X m per bpm (higher is better for easy runs)
- Trend vs. last 3 similar sessions: improving / stable / declining

**Recommendations**
- Zone distribution feedback (e.g., "70% of your run was Z3 — this is too hard for a 'easy' day. Aim for 80%+ in Z2.")
- One actionable adjustment for next session.

## Notes on Data Availability

- HR streams require a heart rate monitor device synced via Strava.
- If `has_heartrate: false`, explain this and offer pace-only analysis.
- If zones are not configured in Strava, estimate using standard age-based formulas (220 − age).

## Example Prompts

- "Was I in zone 2 for my run this morning?"
- "Break down my heart rate zones for yesterday's ride"
- "Is my aerobic efficiency improving?"
- "Show me my pace distribution"
