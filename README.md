# Athlete OS

**Triathlon training intelligence inside Claude. Powered by Strava.**

No dashboards. No browser tabs. Ask Claude anything about your training and get coaching-quality answers in the conversation.

```
"How was my long ride yesterday?"
"What did I do this week — show me by sport."
"Am I spending enough time in zone 2?"
"What's my training load looking like?"
"How far am I toward my annual running goal?"
"Send my weekly summary to Telegram."
```

---

## Install

> Requires **Node.js 18+**. Zero npm dependencies.

```bash
git clone https://github.com/dhruvxsethi/athlete-os && cd athlete-os && bash install.sh
```

Quit Claude Code completely (⌘Q on Mac — closing a window isn't enough), reopen it, then say:

**"Connect my Strava account"**

Claude walks you through the whole thing in-chat. Takes about 2 minutes.

---

## Updates

```bash
cd athlete-os && git pull && bash install.sh
```

Running `install.sh` again cleans up the old version and reinstalls fresh. Quit and reopen Claude Code after.

---

## What's included

### Just say it naturally

| What to say | What happens |
|-------------|--------------|
| "Connect my Strava account" | Full OAuth — Client ID, Secret, browser auth, token saved |
| "Connect my Oura Ring" | Personal access token setup, readiness woven into every analysis |
| "Set up Telegram" | Bot token setup, push notifications to your phone |
| "Just finished a run — how'd it go?" | Quick coaching debrief |
| "Analyze my last ride in detail" | Full breakdown — splits, HR zones, laps, coaching note |
| "What's my pace distribution?" | Zone chart for last 90 days |
| "What did I do this week?" | Weekly sport totals, highlights, coaching reflection |
| "Show me last 6 months" | Month-by-month volume trends with bar charts |
| "What's my training load?" | CTL/ATL/TSB performance chart, 6-week fitness trend |
| "How far am I toward my goal?" | Annual goal progress with year-end projection |
| "Set up my routines" | Automated debriefs, briefings, summaries on a schedule |

### One command

| Command | Action |
|---------|--------|
| `/athlete-status` | Health check — Strava, Oura, Telegram, last activity |

---

## Automated Routines

Say **"set up my routines"** and pick from:

| Routine | Schedule | What it does |
|---------|----------|--------------|
| After every workout | Hourly check | Detects new activities, sends debrief to Telegram |
| Daily briefing | Every morning | Training load + Oura readiness + today's recommendation |
| Weekly summary | Monday morning | Full week breakdown across all sports |
| Monthly trends | 1st of each month | 3-month volume trends with charts |

All routines can optionally deliver to Telegram. For cloud scheduling you'll need to add env vars at **claude.ai/settings → Routines → Environment variables** (see `.env.example`).

---

## Integrations

### Oura Ring
Say **"Connect my Oura Ring"** — you'll need a personal access token from [cloud.ouraring.com/personal-access-tokens](https://cloud.ouraring.com/personal-access-tokens). No OAuth flow, just a token.

Once connected, readiness scores and HRV data are automatically woven into:
- Training load analysis (readiness shown alongside CTL/ATL/TSB)
- Post-workout debrief (flags elevated HR relative to low HRV)
- Weekly summary (recovery quality for the week)
- Daily briefings

### Telegram
Say **"Set up Telegram notifications"** — you'll create a free bot via @BotFather and get your chat ID from @userinfobot.

Telegram is **outbound only** — Athlete OS pushes summaries and debriefs to your phone automatically. To ask questions or dig deeper, use Claude Code directly. No always-on terminal required.

---

## Getting Strava API Credentials

1. Go to [strava.com/settings/api](https://www.strava.com/settings/api)
2. Click **Create App**
3. Fill in: any name, category "Data Importer", website `http://localhost`, callback domain **`localhost`**
4. Copy your **Client ID** (a number) and **Client Secret** (a long string)

---

## Full Reset

To wipe everything and start completely fresh:

```bash
# 1. Remove credentials
rm -f ~/.config/athlete-os/credentials.json

# 2. Uninstall plugin
claude plugin uninstall athlete-os@athlete-os 2>/dev/null || true
claude plugin uninstall athlete-os 2>/dev/null || true
claude plugin marketplace remove athlete-os 2>/dev/null || true

# 3. Remove the repo
cd ~ && rm -rf path/to/athlete-os

# 4. Fresh clone and install
git clone https://github.com/dhruvxsethi/athlete-os && cd athlete-os && bash install.sh

# 5. Quit Claude Code completely (⌘Q), then reopen
# 6. Say: "Connect my Strava account"
```

---

## Privacy

- All credentials saved locally to `~/.config/athlete-os/credentials.json` — never committed, never sent anywhere
- Goals saved to `~/.config/athlete-os/goals.json` — local only
- Read-only Strava access
- No telemetry, no third-party data collection

---

## License

MIT
