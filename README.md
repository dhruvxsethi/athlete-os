# Athlete OS

**Your training data, analyzed inside Claude.**

Connect Strava and ask anything — workout breakdowns, weekly reports, training load, goal tracking, automated summaries to Telegram. No dashboards, no browser tabs.

---

## Install

> Requires Node.js 18+. Zero dependencies.

```bash
git clone https://github.com/dhruvxsethi/athlete-os && cd athlete-os && bash install.sh
```

Quit Claude Code fully (⌘Q), reopen it, then say: **"Connect my Strava account"**

## Update

```bash
cd athlete-os && git pull && bash install.sh
```

Quit and reopen Claude Code after.

---

## What you can ask

| | |
|---|---|
| "How was my last run?" | Coaching debrief — splits, HR zones, weather, what to do next |
| "What did I do this week?" | Weekly totals by sport, highlights, coaching reflection |
| "What's my training load?" | CTL/ATL/TSB fitness chart, 6-week trend, recovery state |
| "Show me last 6 months" | Month-by-month volume trends with bar charts |
| "How far toward my annual goal?" | Progress bar + year-end projection |
| "Connect my Oura Ring" | Readiness and HRV woven into every analysis |
| "Set up Telegram" | Summaries and debriefs pushed to your phone |
| "Set up my routines" | Automated daily/weekly/post-workout reports |

One command: `/athlete-status` — connection health check.

---

## Integrations

**Oura Ring** — say "Connect my Oura Ring." Personal access token from [cloud.ouraring.com/personal-access-tokens](https://cloud.ouraring.com/personal-access-tokens). Readiness and HRV show up automatically in training load and weekly summaries.

**Telegram** — say "Set up Telegram." Outbound only — Athlete OS pushes summaries and debriefs to your phone. Ask questions in Claude Code directly.

---

## Automated routines

Say **"Set up my routines"** to pick from:

- **After every workout** — debrief sent to Telegram within an hour of finishing
- **Daily briefing** — training load + Oura readiness + today's recommendation
- **Weekly summary** — every Monday morning
- **Monthly trends** — 1st of each month

For cloud scheduling, add your credentials at **claude.ai/settings → Routines → Environment variables** (see `docs/.env.example`).

---

## Privacy

Read-only Strava access. Credentials stored locally at `~/.config/athlete-os/credentials.json`. No telemetry.
