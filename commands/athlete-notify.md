---
name: athlete-notify
description: Format the latest workout or weekly summary as a shareable message and send it to the configured channel (Slack, Telegram, or email). Strips private location data before sending.
---

Format and send a workout summary to an external notification channel.

1. Determine the content to send:
   - Default: latest activity (call `get-recent-activities` with `per_page: 1` and `get-activity-details`).
   - If the user says "weekly" in their prompt, generate the weekly summary first.
2. Apply privacy stripping: remove GPS data, check `private` flag, sanitize activity name if needed.
3. Ask which channel to use if not already specified (Slack / Telegram / email).
4. Apply the `notification-summary` skill to format and deliver the message.

If no connector is configured, output the formatted message as plain text for manual sharing.
