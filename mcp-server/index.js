#!/usr/bin/env node
/**
 * Athlete OS — Strava MCP Server
 * Your own fully-owned Strava integration for Claude Code.
 * No third-party dependency: this IS the server.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// ─── Strava API client ────────────────────────────────────────────────────────

const BASE = "https://www.strava.com/api/v3";

class StravaClient {
  constructor() {
    this.clientId = process.env.STRAVA_CLIENT_ID;
    this.clientSecret = process.env.STRAVA_CLIENT_SECRET;
    this.accessToken = process.env.STRAVA_ACCESS_TOKEN;
    this.refreshToken = process.env.STRAVA_REFRESH_TOKEN;

    if (!this.accessToken && !this.refreshToken) {
      throw new Error(
        "Missing Strava credentials. Set STRAVA_ACCESS_TOKEN and STRAVA_REFRESH_TOKEN. " +
        "Run: node mcp-server/oauth.js to get them."
      );
    }
  }

  async refreshAccessToken() {
    const res = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: "refresh_token",
        refresh_token: this.refreshToken,
      }),
    });
    if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`);
    const data = await res.json();
    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token;
    // Persist new tokens to environment (best effort)
    process.env.STRAVA_ACCESS_TOKEN = this.accessToken;
    process.env.STRAVA_REFRESH_TOKEN = this.refreshToken;
    return data;
  }

  async get(path, params = {}) {
    const url = new URL(`${BASE}${path}`);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });

    let res = await fetch(url, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });

    // Token expired — refresh and retry once
    if (res.status === 401) {
      await this.refreshAccessToken();
      res = await fetch(url, {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });
    }

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Strava API error ${res.status} for ${path}: ${err}`);
    }
    return res.json();
  }
}

// ─── Tool definitions ─────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: "check-strava-connection",
    description: "Verify the Strava connection is working and return the authenticated athlete's name.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "get-athlete-profile",
    description: "Get the authenticated athlete's full profile: name, location, sport type, follower counts, weight, FTP.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "get-athlete-stats",
    description: "Get the athlete's all-time and YTD totals for running, cycling, and swimming.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "get-athlete-zones",
    description: "Get the athlete's configured heart rate zones and power zones.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "get-recent-activities",
    description: "Get the N most recent activities. Returns summary data for each.",
    inputSchema: {
      type: "object",
      properties: {
        per_page: { type: "number", description: "Number of activities to return (default 10, max 200)" },
        page: { type: "number", description: "Page number (default 1)" },
      },
      required: [],
    },
  },
  {
    name: "get-all-activities",
    description: "Get all activities within an optional date range. Handles pagination automatically.",
    inputSchema: {
      type: "object",
      properties: {
        after: { type: "number", description: "Unix timestamp — only return activities after this time" },
        before: { type: "number", description: "Unix timestamp — only return activities before this time" },
        per_page: { type: "number", description: "Activities per page (default 200)" },
      },
      required: [],
    },
  },
  {
    name: "get-activity-details",
    description: "Get full details for a specific activity by ID, including segment efforts, photos, and metrics.",
    inputSchema: {
      type: "object",
      properties: {
        activity_id: { type: "number", description: "The Strava activity ID" },
      },
      required: ["activity_id"],
    },
  },
  {
    name: "get-activity-laps",
    description: "Get lap/split data for a specific activity.",
    inputSchema: {
      type: "object",
      properties: {
        activity_id: { type: "number", description: "The Strava activity ID" },
      },
      required: ["activity_id"],
    },
  },
  {
    name: "get-activity-streams",
    description: "Get time-series stream data for an activity (heartrate, velocity, distance, altitude, watts, cadence).",
    inputSchema: {
      type: "object",
      properties: {
        activity_id: { type: "number", description: "The Strava activity ID" },
        keys: {
          type: "string",
          description: "Comma-separated stream types: heartrate,velocity_smooth,distance,altitude,watts,cadence,time",
          default: "heartrate,velocity_smooth,distance,time",
        },
        resolution: {
          type: "string",
          enum: ["low", "medium", "high"],
          description: "Data resolution (default: medium)",
          default: "medium",
        },
      },
      required: ["activity_id"],
    },
  },
  {
    name: "list-athlete-clubs",
    description: "List all Strava clubs the athlete is a member of.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "list-starred-segments",
    description: "List the athlete's starred segments.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "get-segment",
    description: "Get details about a specific Strava segment.",
    inputSchema: {
      type: "object",
      properties: {
        segment_id: { type: "number", description: "The Strava segment ID" },
      },
      required: ["segment_id"],
    },
  },
  {
    name: "list-segment-efforts",
    description: "List all efforts on a segment for the authenticated athlete, optionally filtered by date range.",
    inputSchema: {
      type: "object",
      properties: {
        segment_id: { type: "number", description: "The Strava segment ID" },
        per_page: { type: "number", description: "Results per page (default 30)" },
      },
      required: ["segment_id"],
    },
  },
  {
    name: "list-athlete-routes",
    description: "List routes created or saved by the athlete.",
    inputSchema: {
      type: "object",
      properties: {
        per_page: { type: "number", description: "Results per page (default 30)" },
      },
      required: [],
    },
  },
  {
    name: "get-weather-for-activity",
    description: "Fetch historical weather data for an activity using its start coordinates and date. Uses Open-Meteo (free, no API key needed).",
    inputSchema: {
      type: "object",
      properties: {
        latitude: { type: "number", description: "Activity start latitude" },
        longitude: { type: "number", description: "Activity start longitude" },
        date: { type: "string", description: "Activity date in YYYY-MM-DD format" },
        hour: { type: "number", description: "Hour of day (0-23) when activity started" },
      },
      required: ["latitude", "longitude", "date"],
    },
  },
];

// ─── Tool handlers ────────────────────────────────────────────────────────────

async function handleTool(client, name, args) {
  switch (name) {
    case "check-strava-connection": {
      const athlete = await client.get("/athlete");
      return { connected: true, athlete: `${athlete.firstname} ${athlete.lastname}`, id: athlete.id };
    }

    case "get-athlete-profile":
      return client.get("/athlete");

    case "get-athlete-stats": {
      const athlete = await client.get("/athlete");
      return client.get(`/athletes/${athlete.id}/stats`);
    }

    case "get-athlete-zones":
      return client.get("/athlete/zones");

    case "get-recent-activities":
      return client.get("/athlete/activities", {
        per_page: args.per_page ?? 10,
        page: args.page ?? 1,
      });

    case "get-all-activities": {
      const perPage = args.per_page ?? 200;
      let page = 1;
      const all = [];
      while (true) {
        const batch = await client.get("/athlete/activities", {
          after: args.after,
          before: args.before,
          per_page: perPage,
          page,
        });
        if (!batch.length) break;
        all.push(...batch);
        if (batch.length < perPage) break;
        page++;
      }
      return all;
    }

    case "get-activity-details":
      return client.get(`/activities/${args.activity_id}`);

    case "get-activity-laps":
      return client.get(`/activities/${args.activity_id}/laps`);

    case "get-activity-streams": {
      const keys = args.keys ?? "heartrate,velocity_smooth,distance,time";
      const resolution = args.resolution ?? "medium";
      return client.get(`/activities/${args.activity_id}/streams`, {
        keys,
        key_by_type: true,
        resolution,
      });
    }

    case "list-athlete-clubs":
      return client.get("/athlete/clubs");

    case "list-starred-segments":
      return client.get("/segments/starred");

    case "get-segment":
      return client.get(`/segments/${args.segment_id}`);

    case "list-segment-efforts":
      return client.get("/segment_efforts", {
        segment_id: args.segment_id,
        per_page: args.per_page ?? 30,
      });

    case "list-athlete-routes":
      return client.get("/athletes/routes", {
        per_page: args.per_page ?? 30,
      });

    case "get-weather-for-activity": {
      const { latitude, longitude, date, hour = 12 } = args;
      const url = new URL("https://archive-api.open-meteo.com/v1/archive");
      url.searchParams.set("latitude", latitude);
      url.searchParams.set("longitude", longitude);
      url.searchParams.set("start_date", date);
      url.searchParams.set("end_date", date);
      url.searchParams.set("hourly", "temperature_2m,apparent_temperature,wind_speed_10m,weathercode,precipitation");
      url.searchParams.set("timezone", "auto");
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Weather API error: ${res.status}`);
      const data = await res.json();
      // Extract the specific hour
      const idx = data.hourly.time?.findIndex(t => t.includes(`T${String(hour).padStart(2, "0")}:00`)) ?? hour;
      return {
        date,
        hour,
        temperature_c: data.hourly.temperature_2m?.[idx],
        feels_like_c: data.hourly.apparent_temperature?.[idx],
        wind_speed_kmh: data.hourly.wind_speed_10m?.[idx],
        weather_code: data.hourly.weathercode?.[idx],
        precipitation_mm: data.hourly.precipitation?.[idx],
        weather_description: describeWeatherCode(data.hourly.weathercode?.[idx]),
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function describeWeatherCode(code) {
  if (code === undefined) return "Unknown";
  if (code === 0) return "Clear sky";
  if (code <= 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code <= 49) return "Foggy";
  if (code <= 59) return "Drizzle";
  if (code <= 69) return "Rain";
  if (code <= 79) return "Snow";
  if (code <= 82) return "Rain showers";
  if (code <= 86) return "Snow showers";
  if (code >= 95) return "Thunderstorm";
  return "Mixed conditions";
}

// ─── Server setup ─────────────────────────────────────────────────────────────

const server = new Server(
  { name: "athlete-os-strava", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

let stravaClient;
try {
  stravaClient = new StravaClient();
} catch (err) {
  // Will surface as a tool error rather than crashing the server
  console.error("[athlete-os] Warning:", err.message);
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;
  try {
    if (!stravaClient) throw new Error("Strava not connected. Run: node mcp-server/oauth.js");
    const result = await handleTool(stravaClient, name, args);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  } catch (err) {
    return {
      content: [{ type: "text", text: `Error: ${err.message}` }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
