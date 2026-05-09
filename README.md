# Athlete OS

**Strava-powered fitness intelligence for Claude Code.**

Ask Claude things like:
- *"What did I do this week?"*
- *"Analyze my last run."*
- *"How far have I cycled this year?"*
- *"What was the weather like during my ride?"*
- *"What's my half marathon PR?"*

---

## Install

> Requires Node.js 18+. No npm install — zero dependencies.

```bash
git clone https://github.com/dhruvxsethi/athlete-os && cd athlete-os && bash install.sh
```

Then in Claude, say: **"Connect my Strava account"**

Claude will ask for your Client ID and Secret, open your browser to authorize, and save everything automatically. Done in under 2 minutes.

---

## Updates

```bash
cd athlete-os && git pull
```

No reinstall needed — Claude picks up changes immediately.

---

## Getting Strava API Credentials

1. Go to [strava.com/settings/api](https://www.strava.com/settings/api)
2. Click **Create App**
3. Fill in: any name, category "Data Importer", website `http://localhost`, callback domain **`localhost`**
4. Copy your **Client ID** (a number) and **Client Secret** (a long string)

Claude will ask for these when you say "Connect my Strava account."

---

## Skills

| Skill | What to say |
|-------|-------------|
| Connect Strava | "connect my Strava account" |
| Latest activity | "analyze my last run" |
| Weekly summary | "what did I do this week" |
| Year-to-date | "how far have I run this year" |
| Longest effort | "what was my longest ride" |
| Race history | "show me my races" |
| Post-workout debrief | "I just finished a workout" |
| Heart rate & pace | "was I in zone 2" |
| Weather enrichment | "what was the weather like during my ride" |

## Commands

| Command | Action |
|---------|--------|
| `/athlete-status` | Connection health check |
| `/athlete-latest` | Analyze most recent activity |
| `/athlete-weekly` | This week's training report |
| `/athlete-ytd` | Year-to-date totals |
| `/athlete-longest` | Your biggest effort |
| `/athlete-race` | Race history and PRs |

---

## Privacy

- Credentials saved to `~/.config/athlete-os/credentials.json` — gitignored, never committed
- GPS coordinates never leave your machine
- Read-only Strava access
- No telemetry, no third-party data collection

---

## What's Inside

```
athlete-os/
├── .claude-plugin/plugin.json   # Plugin manifest
├── .mcp.json                    # MCP server (points to local server)
├── mcp-server/
│   ├── index.js                 # Strava MCP server — zero dependencies
│   └── oauth.js                 # OAuth helper — zero dependencies
├── skills/                      # Claude skills
└── commands/                    # Slash commands
```

---

## License

MIT — fork it, make it yours.
