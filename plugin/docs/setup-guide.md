# Athlete OS — Setup Guide

Get Athlete OS running in under 5 minutes.

---

## Step 1: Get Your Strava API Credentials

1. Go to **strava.com/settings/api** (must be logged in to Strava).
2. Click **Create App** and fill in:
   - **Application Name:** `Athlete OS` (any name)
   - **Category:** `Data Importer`
   - **Website:** `http://localhost`
   - **Authorization Callback Domain:** `localhost`
3. Click **Create** and agree to the API terms.
4. Copy your **Client ID** (a short number) and **Client Secret** (a long string).

---

## Step 2: Install the Plugin

From the `athlete-os/` directory:

```bash
bash install.sh
```

When it finishes, **fully quit Claude Code** (⌘Q on Mac) and reopen it. Closing a window isn't enough — the MCP server loads on startup.

---

## Step 3: Connect Strava

In Claude, say:

```
Connect my Strava account
```

Claude will ask for your Client ID and Secret, then open your browser for Strava authorization. The OAuth callback is caught locally on port 8888. The whole flow takes about 60 seconds and saves credentials to `~/.config/athlete-os/credentials.json`.

---

## Step 4: Verify

```
Check my Strava connection
```

You should see your name. Then try:

```
What did I do this week?
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Not connected" after setup | Fully quit Claude Code (⌘Q) and reopen — MCP server loads on startup |
| Port 8888 already in use | `lsof -ti :8888 \| xargs kill` then retry connection |
| "Invalid client" error | Double-check Client ID and Secret — no extra spaces |
| "Redirect URI mismatch" | Ensure callback domain in Strava settings is exactly `localhost` |
| Browser doesn't open | Copy the URL printed in the terminal and open it manually |
| Plugin not found | Run `bash install.sh` again from the repo root |

---

## Scheduled Routines (optional)

To get automated weekly summaries and monthly reports, say: **"Set up my training routines"**

Routines run in Claude's cloud, so they need your Strava credentials as environment variables. Run:

```bash
cat ~/.config/athlete-os/credentials.json
```

Then go to **claude.ai/settings → Routines → Environment variables** and add:
- `STRAVA_CLIENT_ID`
- `STRAVA_CLIENT_SECRET`
- `STRAVA_REFRESH_TOKEN`

Skip `STRAVA_ACCESS_TOKEN` — it expires every 6 hours and gets refreshed automatically.
