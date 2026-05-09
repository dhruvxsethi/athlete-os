---
name: monthly-trends
description: Shows month-by-month training trends for the past 6 or 12 months. Use when the user asks about their training over time, monthly progress, how their volume has changed, or wants to see trends across months. Renders inline bar charts — no external tools.
triggers:
  - "monthly trends"
  - "how has my training changed"
  - "month by month"
  - "training over the last few months"
  - "am I doing more than last month"
  - "show me my progress"
  - "training volume over time"
---

# Monthly Trends

Show month-by-month training trends entirely inline using unicode bar charts and tables.

## Steps

1. Calculate `after` = Unix timestamp for 6 months ago (current time − 15,768,000 seconds). Use 12 months if the user asks for a longer view.
2. Call `get-all-activities` with that `after` timestamp.
3. Group activities by calendar month (YYYY-MM).
4. For each month, aggregate per sport type:
   - Total distance (km)
   - Total moving time (hours)
   - Total elevation gain (m)
   - Activity count
5. Build the output using unicode bar charts and tables.

## Output Format

### Unicode Bar Chart

Use `█` blocks scaled to the max value in the dataset. Always show the number alongside the bar. 8 blocks = max value.

```
Distance by Month (km)
──────────────────────────────────
Dec  ████░░░░░░  38.4 km  (5 runs)
Jan  ██████░░░░  51.2 km  (7 runs)
Feb  ████████░░  68.9 km  (9 runs)
Mar  ██████████  81.0 km  (11 runs)
Apr  ███████░░░  60.1 km  (8 runs)
May  ████████░░  71.3 km  (9 runs)  ← this month
```

Render one chart per sport that had activity (Run, Ride, Swim separately). Skip sports with only 1 active month.

### Summary Table

After the charts, show a compact table:

| Month | 🏃 km | 🚴 km | 🏊 km | ⏱ hrs | 📈 elev |
|-------|--------|--------|--------|--------|---------|

### Trend Analysis

After the table, write 3–5 observations in plain language:
- Volume trend: growing / declining / plateau
- Most active month and why it might stand out
- Biggest month-over-month jump or drop (flag if >40% change)
- Consistency: how many months had zero activity
- One actionable coaching note based on the trend

## Formatting Rules

- Use `░` for unfilled bar portions so the bar length is consistent
- Always label the current (partial) month with `← this month`
- Convert distances to km (or miles if user preference is clear)
- If a month has zero activity, show it as a flat line: `░░░░░░░░░░  0 km`
- Keep bar chart width consistent — always 10 block characters wide
- Use emojis sparingly — one per sport type in the table header is enough

## Example Prompts

- "Show me my monthly training trends"
- "How has my running volume changed over the last 6 months?"
- "Am I training more than last month?"
- "Monthly breakdown of my cycling"
