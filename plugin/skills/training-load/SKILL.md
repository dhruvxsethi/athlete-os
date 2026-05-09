---
name: training-load
description: Shows current fitness (CTL), fatigue (ATL), and form (TSB) — the three numbers serious endurance athletes live by. Computes the PMC model from your last 90 days of Strava activities. Use when the user asks about training load, fitness trends, if they're overtraining, or whether they're fresh for a race.
triggers:
  - "training load"
  - "am I overtraining"
  - "how fit am I"
  - "fitness and fatigue"
  - "am I fresh"
  - "CTL"
  - "ATL"
  - "TSB"
  - "form"
  - "performance management"
  - "/athlete-load"
---

## MCP connection check

Before doing anything, call `check-strava-connection`. If not available, say:

> "The Strava connection isn't active yet. Please fully quit Claude Code (⌘Q) and reopen it."

# Training Load (PMC Model)

Compute Chronic Training Load (CTL / fitness), Acute Training Load (ATL / fatigue), and Training Stress Balance (TSB / form) from the last 90 days of activities.

## Steps

### 1. Fetch activities

Call `get-all-activities` with `after` set to 90 days ago (current Unix time − 7,776,000 seconds).

### 2. Compute daily TSS for each activity

For each activity, estimate Training Stress Score (TSS):

**Primary:** Use `suffer_score` directly if it exists and is > 0. Strava's suffer_score is roughly equivalent to TSS.

**Fallback (no suffer_score):**
- `hours = moving_time / 3600`
- If `average_heartrate` is available:
  - `intensity = clamp(average_heartrate / 170, 0.4, 1.4)`
  - `tss = hours × intensity² × 100`
- Else use type defaults:
  - Run / TrailRun: `tss = hours × 60`
  - Ride / VirtualRide / EBikeRide: `tss = hours × 55`
  - Swim: `tss = hours × 70`
  - Walk / Hike: `tss = hours × 35`
  - WeightTraining / Workout: `tss = hours × 40`
  - Other: `tss = hours × 50`

Group activities by calendar day (use `start_date_local` date portion). Sum TSS for multiple activities on the same day. Days with no activity = TSS 0.

### 3. Compute CTL and ATL

Use these decay constants:
- `k_ctl = 0.02326` (= 1 − e^(−1/42), 42-day time constant)
- `k_atl = 0.13353` (= 1 − e^(−1/7), 7-day time constant)

Starting from day 1 of your 90-day window with CTL₀ = 0, ATL₀ = 0:

```
for each day d from oldest to today:
  CTL_d = CTL_{d-1} + (TSS_d − CTL_{d-1}) × k_ctl
  ATL_d = ATL_{d-1} + (TSS_d − ATL_{d-1}) × k_atl
  TSB_d = CTL_d − ATL_d
```

The first 48 days "warm up" the model. Extract today's CTL, ATL, TSB as the final values.

Also record the weekly average CTL for the last 6 weeks (for the trend chart).

### 4. Oura context (if connected)

Call `check-oura-connection`. If connected, call `get-oura-readiness` with `start_date` = today. Show today's readiness score alongside TSB — together they give a fuller picture of how ready the athlete is.

## Output Format

**Current State**
```
Fitness & Fatigue  (as of [today's date])
──────────────────────────────────────────
CTL  (Fitness)   [bar]  XX  pts
ATL  (Fatigue)   [bar]  XX  pts
TSB  (Form)      [bar] ±XX  pts  → [state label]

Oura readiness: XX/100  (if connected)
```

TSB state labels:
- TSB > +25: Very fresh — peak form, race-ready
- TSB +10 to +25: Fresh — good for a hard effort or race
- TSB −10 to +10: Neutral — steady state training
- TSB −20 to −10: Building — under load, adaptation happening
- TSB < −20: Fatigued — ease off, risk of overreaching

Bars use `█` scaled to max of CTL/ATL. TSB bar uses `+` prefix if positive, `−` if negative.

**6-Week CTL Trend**
```
6-Week Fitness Trend
──────────────────────────────────────────
Week −5  [bar]  XX pts
Week −4  [bar]  XX pts
Week −3  [bar]  XX pts
Week −2  [bar]  XX pts
Week −1  [bar]  XX pts
Now      [bar]  XX pts  ← today
```

Arrow direction: ↗ growing, → plateau, ↘ declining — compare now to 3 weeks ago.

**Coaching Note**

2–4 sentences:
- Name the current phase (building, peaking, recovering, maintaining)
- Flag if ATL is dangerously high relative to CTL (ATL > CTL × 1.3 = overreaching risk)
- If they have an upcoming race, flag TSB relative to race readiness (TSB of +5 to +20 on race day is ideal)
- One concrete action: rest day, hard session, taper, or stay the course

## Notes

- Be upfront that suffer_score-based TSS is an approximation — power meter data would be more precise
- If fewer than 14 days of activities are found, note that the model needs more history to be reliable
- Don't show decimal places on CTL/ATL; round TSB to nearest integer

## Example Prompts

- "What's my training load?"
- "Am I overtraining?"
- "How fit am I right now?"
- "Am I fresh enough to race this weekend?"
- "/athlete-load"
