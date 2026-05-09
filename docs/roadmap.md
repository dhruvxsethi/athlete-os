# Athlete OS — Roadmap

## Current Version: 0.1.0 (MVP)

### What's Included

- Strava MCP integration (read-only)
- 9 skills: latest activity, weekly report, YTD, longest activity, race detection, post-workout debrief, team leaderboard, HR/pace analysis, notifications
- 6 slash commands
- Notification scaffolding: Slack, Telegram, email
- Privacy-first defaults

---

## Near-Term (0.2.0)

- [ ] **Garmin Connect integration** — sync activities from Garmin devices (power data, running dynamics, sleep/recovery)
- [ ] **Automated weekly digest** — schedule a weekly report to send automatically every Monday morning
- [ ] **Training load tracking** — TSS/ATL/CTL model for fitness and fatigue trends
- [ ] **Goal tracking** — set annual distance goals and track progress automatically
- [ ] **Pace calculator** — "What pace do I need to run a 4-hour marathon?"

---

## Medium-Term (0.3.0)

- [ ] **Apple Health integration** — pull VO2 max, resting HR, sleep data from Apple Health to enrich analysis
- [ ] **Google Calendar integration** — add upcoming races to calendar, block training days
- [ ] **Weather enrichment** — pull historical weather for each activity (temperature, wind, humidity) to contextualize performance
- [ ] **Strava write support** — update activity descriptions, add kudos, create manual activities
- [ ] **Photo summaries** — include activity photos in shared summaries

---

## Longer-Term

- [ ] **TrainingPeaks sync** — import structured training plans and track compliance
- [ ] **Oura / Whoop integration** — correlate recovery scores with training load
- [ ] **AI coaching mode** — multi-week training plan generation based on goal and current fitness
- [ ] **Segment leaderboard tracking** — monitor KOMs and segment PRs over time
- [ ] **Multi-athlete team dashboards** — aggregate stats for a running group or sports team
- [ ] **Race prediction** — estimate finish time for upcoming races based on recent training
- [ ] **Peloton / indoor trainer integration** — pull power data from indoor sessions
- [ ] **Nutrition logging** — correlate fueling with performance data

---

## Connector Roadmap

| Connector | Status | Notes |
|-----------|--------|-------|
| Strava | ✅ MVP | Read-only via MCP |
| Slack | ✅ MVP | Webhook-based |
| Telegram | ✅ MVP | Bot-based |
| Email | ✅ MVP | SMTP template |
| Garmin Connect | Planned | OAuth API |
| Apple Health | Planned | HealthKit XML export or shortcut |
| Google Calendar | Planned | Google API OAuth |
| TrainingPeaks | Planned | API access required |
| Oura Ring | Planned | Personal API token |
| Whoop | Planned | OAuth API |
| Notion | Planned | Training log database |
| Google Sheets | Planned | Activity log export |

---

## Contributing

Ideas, bug reports, and skill suggestions welcome. Open an issue or PR on GitHub.
