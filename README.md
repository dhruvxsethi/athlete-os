# Athlete OS

**Triathlon training intelligence inside Claude. Powered by Strava.**

Ask Claude things like:
- *"How was my long ride yesterday?"*
- *"What did I do this week — show me by sport."*
- *"Am I spending enough time in zone 2?"*
- *"How has my run volume changed over the last 3 months?"*
- *"Set up a weekly summary every Monday morning."*

---

## Install

> Requires Node.js 18+. Zero dependencies — no npm install.

```bash
git clone https://github.com/dhruvxsethi/athlete-os && cd athlete-os && bash install.sh
```

Restart Claude Code, then say: **"Connect my Strava account"**

Claude will ask for your Client ID and Secret and handle the OAuth flow in-chat. Done in 2 minutes.

---

## Updates

```bash
cd athlete-os && git pull
```

No reinstall needed.

---

## Getting Strava API Credentials

1. Go to [strava.com/settings/api](https://www.strava.com/settings/api)
2. Click **Create App**
3. Fill in: any name, category "Data Importer", website `http://localhost`, callback domain **`localhost`**
4. Copy your **Client ID** and **Client Secret**

---

## Skills

| Skill | What to say |
|-------|-------------|
| Connect Strava | "connect my Strava account" |
| Latest activity | "how was my ride yesterday" |
| Weekly summary | "what did I do this week" |
| Pace & zone distribution | "am I in zone 2 enough" |
| Monthly trends | "show me my last 3 months" |
| Setup routines | "automate my weekly summary" |

## Commands

| Command | Action |
|---------|--------|
| `/athlete-status` | Connection health check |
| `/athlete-latest` | Analyze most recent activity |
| `/athlete-weekly` | This week's training report |

---

## Automated Routines

Say **"set up my weekly routine"** and Claude will schedule:
- Weekly training summary — every Monday morning
- Monthly trends — 1st of each month

Runs automatically in Claude Code. No prompting needed.

---

## Privacy

- Credentials saved to `~/.config/athlete-os/credentials.json` — never committed
- Read-only Strava access
- No telemetry, no third-party data collection

---

## License

MIT
