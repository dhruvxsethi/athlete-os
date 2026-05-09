# Athlete OS

**Strava-powered fitness intelligence for Claude Code. Fully yours — own the MCP server, own the code.**

Ask Claude things like:
- *"What did I do this week?"*
- *"Analyze my last cycling ride."*
- *"How far have I run this year?"*
- *"What was the weather like during my run?"*
- *"What's my half marathon PR?"*
- *"Send my workout summary to Slack."*

---

## Install

```bash
claude plugin install https://github.com/dhruvxsethi/athlete-os
```

Then in Claude:

> **"Connect my Strava account"**

Claude will walk you through getting your free API credentials and handle the OAuth flow in-chat. Done in under 2 minutes.

> **Requires Node.js 18+** — no npm install needed, zero external dependencies.

---

## Getting Strava API Credentials

1. Go to [strava.com/settings/api](https://www.strava.com/settings/api)
2. Click **Create App**
3. Fill in: any name, category "Data Importer", website `http://localhost`, callback domain **`localhost`**
4. Copy your **Client ID** (a number) and **Client Secret** (a long string)

Claude will ask for these when you say "Connect my Strava account."

---

## Skills

| Skill | Trigger |
|-------|---------|
| `oauth-setup` | "connect Strava" |
| `latest-activity-analysis` | "analyze my last run" |
| `weekly-training-summary` | "what did I do this week" |
| `year-to-date-summary` | "how far have I run this year" |
| `longest-activity-analysis` | "what was my longest ride" |
| `race-event-detection` | "show me my races" |
| `post-workout-debrief` | "I just finished a run" |
| `heart-rate-pace-analysis` | "was I in zone 2" |
| `weather-enrichment` | "what was the weather like" |
| `team-leaderboard-summary` | "how is my club doing" |
| `notification-summary` | "send to Slack" |

## Commands

| Command | Action |
|---------|--------|
| `/athlete-status` | Health check — connection, tokens, channels |
| `/athlete-latest` | Analyze most recent activity |
| `/athlete-weekly` | This week's training report |
| `/athlete-ytd` | Year-to-date totals |
| `/athlete-longest` | Find your biggest effort |
| `/athlete-race` | Race history and PRs |
| `/athlete-notify` | Send summary to Slack / Telegram / email |

---

## Notification Setup (Optional)

Add any of these to your shell environment or `.env` file:

```bash
# Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# Telegram
TELEGRAM_BOT_TOKEN=1234567890:ABCdef...
TELEGRAM_CHAT_ID=987654321

# Email (Gmail app password)
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_USERNAME=you@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=you@gmail.com
EMAIL_TO=you@gmail.com
```

See `docs/setup-guide.md` for full instructions.

---

## What's Inside

```
athlete-os/
├── .claude-plugin/plugin.json   # Plugin manifest
├── .mcp.json                    # MCP server config
├── mcp-server/
│   ├── index.js                 # Strava MCP server — zero dependencies
│   └── oauth.js                 # OAuth helper — zero dependencies
├── skills/                      # 11 Claude skills
├── commands/                    # 7 slash commands
└── docs/                        # Setup guide, privacy policy, roadmap
```

---

## Privacy

- GPS coordinates never leave your machine
- Credentials saved to `~/.config/athlete-os/credentials.json` — gitignored, never committed
- No telemetry, no analytics, no third-party data collection
- Read-only Strava access

Full details: [docs/privacy-security.md](docs/privacy-security.md)

---

## Roadmap

Garmin, Apple Health, Google Calendar, TrainingPeaks, Oura, race prediction, AI coaching mode.

See [docs/roadmap.md](docs/roadmap.md).

---

## License

MIT — fork it, modify it, make it yours.
