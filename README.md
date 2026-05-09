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

## Quickstart

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/athlete-os
cd athlete-os
```

### 2. Install the MCP server dependencies

```bash
cd mcp-server && npm install && cd ..
```

### 3. Connect Strava (one-time OAuth)

```bash
node mcp-server/oauth.js
```

This will:
- Ask for your Strava Client ID and Secret (get them free at [strava.com/settings/api](https://www.strava.com/settings/api))
- Open your browser to authorize
- Save tokens automatically to `.env`

### 4. Load tokens into your shell

```bash
set -a && source .env && set +a
```

### 5. Install the plugin into Claude Code

```bash
claude plugin install .
```

### 6. Ask anything

```
What did I do this week?
```

---

## Getting Strava API Credentials

1. Go to [strava.com/settings/api](https://www.strava.com/settings/api)
2. Click **Create App**
3. Fill in: any name, category "Data Importer", website `http://localhost`, callback domain **`localhost`**
4. Copy your **Client ID** (a number) and **Client Secret** (a long string)
5. Run `node mcp-server/oauth.js` — it will ask for these values

That's it. Access and refresh tokens are fetched and managed automatically forever.

---

## Skills

| Skill | Trigger |
|-------|---------|
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
| `oauth-setup` | "connect Strava" |

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

Add any of these to your `.env`:

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
├── .mcp.json                    # MCP server config (points to local server)
├── mcp-server/
│   ├── index.js                 # Your own Strava MCP server (no third parties)
│   ├── oauth.js                 # One-click OAuth helper
│   └── package.json
├── skills/                      # 11 Claude skills
├── commands/                    # 7 slash commands
├── notifications/templates/     # Slack, Telegram, email setup guides
└── docs/                        # Setup guide, demo script, roadmap, privacy
```

---

## Privacy

- GPS coordinates never leave your machine
- Private activities require explicit confirmation before sharing
- All credentials in `.env` — gitignored, never committed
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
