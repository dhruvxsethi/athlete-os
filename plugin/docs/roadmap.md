# Athlete OS — Roadmap

## Current Version: 0.3.0

### What's Included

- Strava MCP integration (read-only, zero npm dependencies)
- Weather enrichment via Open-Meteo (no API key required)
- Oura Ring integration (readiness, HRV, sleep)
- Telegram notifications (automated summaries via bot)
- Annual goal tracking with year-end projections
- Performance Management Chart (CTL/ATL/TSB training load model)
- 11 skills: oauth-setup, oura-setup, telegram-setup, latest-activity-analysis, post-workout-debrief, weekly-training-summary, monthly-trends, pace-distribution, training-load, goal-tracking, setup-routines
- 6 slash commands: /athlete-latest, /athlete-debrief, /athlete-weekly, /athlete-load, /athlete-goals, /athlete-status

---

## Near-Term (0.4.0)

- [ ] **Whoop integration** — recovery scores and strain via OAuth API
- [ ] **Year-to-date summary** — full-year breakdown with month-by-month progress bars
- [ ] **Pace calculator** — "What pace do I need to run a 4-hour marathon?"
- [ ] **Race prediction** — estimate finish time for upcoming races based on recent training
- [ ] **Segment leaderboard tracking** — monitor KOMs and segment PRs over time

---

## Medium-Term (0.5.0)

- [ ] **Garmin Connect integration** — sync power data, running dynamics, sleep/recovery
- [ ] **Apple Health integration** — VO2 max, resting HR, sleep data
- [ ] **Strava write support** — update activity descriptions, create manual activities
- [ ] **Google Calendar integration** — block training days, add race events

---

## Longer-Term

- [ ] **TrainingPeaks sync** — import structured training plans and track compliance
- [ ] **AI coaching mode** — multi-week training plan generation based on goal and fitness
- [ ] **Multi-athlete team dashboards** — aggregate stats for a running group or sports team
- [ ] **Peloton / indoor trainer integration** — pull power data from indoor sessions
- [ ] **Notion / Google Sheets export** — training log database sync

---

## Connector Roadmap

| Connector | Status | Notes |
|-----------|--------|-------|
| Strava | ✅ Live | Read-only via custom MCP server |
| Open-Meteo weather | ✅ Live | Historical weather per activity, no API key |
| Oura Ring | ✅ Live | Personal access token, readiness + sleep |
| Telegram | ✅ Live | Bot-based, automated summaries |
| Whoop | Planned | OAuth API |
| Garmin Connect | Planned | OAuth API |
| Apple Health | Planned | HealthKit XML export or shortcut |
| Google Calendar | Planned | Google API OAuth |
| TrainingPeaks | Planned | API access required |
| Slack | Planned | Webhook-based |
| Notion | Planned | Training log database |
| Google Sheets | Planned | Activity log export |

---

## Contributing

Ideas, bug reports, and skill suggestions welcome. Open an issue or PR on GitHub.
