#!/usr/bin/env node
/**
 * Athlete OS — Strava OAuth Helper
 * Zero npm dependencies. Pure Node.js built-ins only.
 *
 * Called by the oauth-setup skill from within Claude.
 * Saves credentials to ~/.config/athlete-os/credentials.json
 */

import http from "http";
import { exec } from "child_process";
import { writeFileSync, readFileSync, mkdirSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { createInterface } from "readline";

const CREDS_DIR = join(homedir(), ".config", "athlete-os");
const CREDS_FILE = join(CREDS_DIR, "credentials.json");
const PORT = 8888;
const REDIRECT_URI = `http://localhost:${PORT}/callback`;
const SCOPE = "read,activity:read_all,profile:read_all";

function loadExisting() {
  try {
    if (existsSync(CREDS_FILE)) return JSON.parse(readFileSync(CREDS_FILE, "utf8"));
  } catch {}
  return {};
}

function save(creds) {
  mkdirSync(CREDS_DIR, { recursive: true });
  writeFileSync(CREDS_FILE, JSON.stringify(creds, null, 2), "utf8");
}

function openBrowser(url) {
  const cmd =
    process.platform === "darwin" ? `open "${url}"` :
    process.platform === "win32" ? `start "" "${url}"` :
    `xdg-open "${url}"`;
  exec(cmd);
}

function ask(rl, q) {
  return new Promise(resolve => rl.question(q, resolve));
}

async function run() {
  // If called with --check, just verify existing credentials work
  if (process.argv.includes("--check")) {
    const creds = loadExisting();
    if (!creds.access_token) { console.log("not_connected"); process.exit(1); }
    const res = await fetch("https://www.strava.com/api/v3/athlete", {
      headers: { Authorization: `Bearer ${creds.access_token}` },
    });
    if (res.ok) {
      const a = await res.json();
      console.log(`connected:${a.firstname} ${a.lastname}`);
    } else {
      console.log("token_expired");
      process.exit(1);
    }
    return;
  }

  console.log("\n🏃 Athlete OS — Strava Connection\n");

  const existing = loadExisting();
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  // Client ID
  let clientId = existing.client_id || process.env.STRAVA_CLIENT_ID || "";
  if (clientId) {
    console.log(`✓ Client ID: ${clientId}`);
    const change = await ask(rl, "  Use this? (Y/n): ");
    if (change.toLowerCase() === "n") clientId = "";
  }
  if (!clientId) clientId = (await ask(rl, "Strava Client ID: ")).trim();

  // Client Secret
  let clientSecret = existing.client_secret || process.env.STRAVA_CLIENT_SECRET || "";
  if (clientSecret) {
    console.log(`✓ Client Secret: ${clientSecret.slice(0, 6)}...`);
    const change = await ask(rl, "  Use this? (Y/n): ");
    if (change.toLowerCase() === "n") clientSecret = "";
  }
  if (!clientSecret) clientSecret = (await ask(rl, "Strava Client Secret: ")).trim();

  rl.close();

  if (!clientId || !clientSecret) {
    console.error("\n✗ Client ID and Secret are both required.\n");
    process.exit(1);
  }

  const authUrl =
    `https://www.strava.com/oauth/authorize` +
    `?client_id=${clientId}` +
    `&response_type=code` +
    `&redirect_uri=${REDIRECT_URI}` +
    `&approval_prompt=force` +
    `&scope=${SCOPE}`;

  console.log("\n📡 Starting local callback server on port " + PORT + "...");

  const code = await new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, `http://localhost:${PORT}`);
      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error");

      if (error) {
        res.writeHead(400);
        res.end(`<h2>Denied: ${error}</h2><p>Close this tab.</p>`);
        server.close();
        reject(new Error(`Denied: ${error}`));
        return;
      }

      if (code) {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(`
          <html><body style="font-family:system-ui;text-align:center;padding:80px;background:#080808;color:#fff">
            <div style="font-size:56px;margin-bottom:20px">✅</div>
            <h2 style="color:#FC4C02;margin-bottom:8px">Athlete OS connected!</h2>
            <p style="color:rgba(255,255,255,0.4)">You can close this tab and return to Claude.</p>
          </body></html>
        `);
        server.close();
        resolve(code);
      }
    });

    server.listen(PORT, () => {
      console.log("✓ Callback server ready");
      console.log("\n🌐 Opening Strava in your browser...");
      console.log("   (If it doesn't open, visit the URL printed below)\n");
      console.log("   " + authUrl + "\n");
      openBrowser(authUrl);
    });

    server.on("error", reject);
    setTimeout(() => { server.close(); reject(new Error("Timed out after 5 min")); }, 300_000);
  });

  console.log("✓ Authorized. Exchanging for tokens...");

  const tokenRes = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    throw new Error(`Token exchange failed: ${tokenRes.status} — ${await tokenRes.text()}`);
  }

  const data = await tokenRes.json();
  const athlete = data.athlete;

  save({
    client_id: clientId,
    client_secret: clientSecret,
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    athlete_name: `${athlete.firstname} ${athlete.lastname}`,
    athlete_id: athlete.id,
    connected_at: new Date().toISOString(),
  });

  console.log(`\n✅  Connected as: ${athlete.firstname} ${athlete.lastname}`);
  console.log(`✅  Credentials saved to: ${CREDS_FILE}`);
  console.log("\n   Return to Claude and ask: \"What did I do this week?\"\n");
}

run().catch(err => {
  console.error("\n✗ OAuth failed:", err.message, "\n");
  process.exit(1);
});
