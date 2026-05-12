# Athlete OS

Athlete OS gives Claude access to Strava training data via an MCP server (`athlete-os-strava`).

## CRITICAL: MCP loading

The `athlete-os-strava` MCP server starts on Claude Code startup and takes a few seconds to be ready. Its tools are named `mcp__strava__*`.

**If the user asks anything fitness/training related and the MCP tools are not yet available:**
- Call `ToolSearch` with query `"check-strava-connection"` — this waits for the server to finish loading, then returns the tool schema
- Do NOT attempt workarounds (no Bash, no curl, no direct API calls, no reading credential files)
- Do NOT tell the user the tools are unavailable — just wait via ToolSearch and proceed

This applies to any request about workouts, training, activities, goals, zones, fitness, Strava, or health data.

## Skills

Use these skills for all training requests:

| User says | Skill to invoke |
|-----------|----------------|
| "analyse my workout", "how was my run", "debrief" | `athlete-os:debrief` |
| "what did I do this week", "monthly trends", "training load", "how fit am I" | `athlete-os:summary` |
| "set a goal", "am I on track", "goal progress" | `athlete-os:goal-tracking` |
| "connect Strava/Oura/Telegram" | `athlete-os:connect` |
| "set up routines", "automate my summary" | `athlete-os:setup-routines` |

Always invoke the skill — it contains the output format (Unicode charts, coaching tone). Never format training responses freehand.
