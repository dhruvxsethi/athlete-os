# Telegram Bot Template

Send workout summaries to yourself or a group via a Telegram bot.

## Setup

1. Open Telegram and message **@BotFather**.
2. Send `/newbot` and follow the prompts to name your bot.
3. BotFather will give you a **Bot Token** — copy it.
4. To find your **Chat ID**:
   - Start a conversation with your bot.
   - Visit: `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates`
   - Find `"chat":{"id":XXXXXXX}` in the response.
5. Add to your environment:

```bash
export TELEGRAM_BOT_TOKEN="1234567890:ABCdef..."
export TELEGRAM_CHAT_ID="987654321"
```

Or add to your `.env` file (see `docs/.env.example`).

## Message Format

Athlete OS sends Telegram messages using Markdown:

```
🏃 *Run* | 10.2 km | 52:14 | 5:07/km
📅 May 9, 2026
❤️ Avg HR: 152 bpm
⛰️ Elevation: +85 m
✅ Solid aerobic effort — negative split in the final 3km.
```

## Sending via curl (manual test)

```bash
curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -d "chat_id=${TELEGRAM_CHAT_ID}" \
  -d "parse_mode=Markdown" \
  -d "text=🏃 *Run* | 10.2 km | 52:14 | 5:07/km%0A📅 Today%0A✅ Great session."
```

## Group Channels

To send to a Telegram group or channel:
- Add your bot to the group as an admin.
- Use the group's chat ID (starts with `-100...` for supergroups).
- For public channels: use `@channelname` as the chat ID.

## Privacy Notes

- Telegram messages in group chats are visible to all members. Never include GPS coordinates.
- Your `TELEGRAM_BOT_TOKEN` is equivalent to a password — store it in env vars, never in code.
- If the activity is flagged `private` on Strava, Athlete OS will ask for confirmation before sending.
