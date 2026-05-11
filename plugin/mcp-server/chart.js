/**
 * Athlete OS — PNG chart generator
 * Zero npm dependencies. Uses built-in zlib only.
 * Exports: drawBarChart(options), drawLineChart(options)
 */

import { deflateSync } from "zlib";
import { writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

// ── CRC32 ──────────────────────────────────────────────────────────────────

const _crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = _crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// ── PNG encoding ──────────────────────────────────────────────────────────

function pngChunk(type, data) {
  const t = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcVal = Buffer.alloc(4);
  crcVal.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crcVal]);
}

function encodePNG(w, h, pixels) {
  // pixels: Uint8Array, RGB, 3 bytes/pixel, row-major
  const rows = [];
  for (let y = 0; y < h; y++) {
    const row = Buffer.alloc(1 + w * 3);
    row[0] = 0; // filter: None
    pixels.copy(row, 1, (y * w) * 3, (y * w + w) * 3);
    rows.push(row);
  }
  const raw = Buffer.concat(rows);
  const compressed = deflateSync(raw, { level: 6 });

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit RGB

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", compressed),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

// ── Canvas ─────────────────────────────────────────────────────────────────

function createCanvas(w, h, bg = [255, 255, 255]) {
  const pixels = Buffer.alloc(w * h * 3);
  for (let i = 0; i < w * h; i++) {
    pixels[i * 3] = bg[0]; pixels[i * 3 + 1] = bg[1]; pixels[i * 3 + 2] = bg[2];
  }
  return { w, h, pixels };
}

function px(c, x, y, r, g, b) {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || x >= c.w || y < 0 || y >= c.h) return;
  const i = (y * c.w + x) * 3;
  c.pixels[i] = r; c.pixels[i + 1] = g; c.pixels[i + 2] = b;
}

function rect(c, x, y, w, h, r, g, b) {
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  for (let dy = 0; dy < h; dy++)
    for (let dx = 0; dx < w; dx++)
      px(c, x + dx, y + dy, r, g, b);
}

function line(c, x1, y1, x2, y2, r, g, b, thick = 1) {
  x1=Math.round(x1); y1=Math.round(y1); x2=Math.round(x2); y2=Math.round(y2);
  const dx = Math.abs(x2 - x1), dy = Math.abs(y2 - y1);
  const sx = x1 < x2 ? 1 : -1, sy = y1 < y2 ? 1 : -1;
  let err = dx - dy, cx = x1, cy = y1;
  const t = Math.floor((thick - 1) / 2);
  while (true) {
    for (let tx = -t; tx <= thick - 1 - t; tx++)
      for (let ty = -t; ty <= thick - 1 - t; ty++)
        px(c, cx + tx, cy + ty, r, g, b);
    if (cx === x2 && cy === y2) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; cx += sx; }
    if (e2 < dx) { err += dx; cy += sy; }
  }
}

// ── 5×7 Bitmap font (row-major: 7 bytes, bit 4 = leftmost of 5) ──────────

const FONT = {
  " ":[0,0,0,0,0,0,0],
  "!":[0x04,0x04,0x04,0x04,0x00,0x00,0x04],
  "%":[0x18,0x19,0x02,0x04,0x08,0x13,0x03],
  "+":[0x00,0x04,0x04,0x1F,0x04,0x04,0x00],
  "-":[0x00,0x00,0x00,0x1F,0x00,0x00,0x00],
  ".":[0x00,0x00,0x00,0x00,0x00,0x0C,0x0C],
  "/":[0x01,0x02,0x02,0x04,0x08,0x10,0x10],
  ":":[0x00,0x0C,0x0C,0x00,0x0C,0x0C,0x00],
  "(":[0x02,0x04,0x08,0x08,0x08,0x04,0x02],
  ")":[0x08,0x04,0x02,0x02,0x02,0x04,0x08],
  "0":[0x0E,0x11,0x11,0x11,0x11,0x11,0x0E],
  "1":[0x04,0x0C,0x04,0x04,0x04,0x04,0x0E],
  "2":[0x0E,0x11,0x01,0x02,0x04,0x08,0x1F],
  "3":[0x0E,0x11,0x01,0x06,0x01,0x11,0x0E],
  "4":[0x02,0x06,0x0A,0x12,0x1F,0x02,0x02],
  "5":[0x1F,0x10,0x10,0x1E,0x01,0x11,0x0E],
  "6":[0x06,0x08,0x10,0x1E,0x11,0x11,0x0E],
  "7":[0x1F,0x01,0x02,0x04,0x04,0x04,0x04],
  "8":[0x0E,0x11,0x11,0x0E,0x11,0x11,0x0E],
  "9":[0x0E,0x11,0x11,0x0F,0x01,0x02,0x0C],
  "A":[0x04,0x0A,0x11,0x11,0x1F,0x11,0x11],
  "B":[0x1E,0x11,0x11,0x1E,0x11,0x11,0x1E],
  "C":[0x0E,0x11,0x10,0x10,0x10,0x11,0x0E],
  "D":[0x1C,0x12,0x11,0x11,0x11,0x12,0x1C],
  "E":[0x1F,0x10,0x10,0x1E,0x10,0x10,0x1F],
  "F":[0x1F,0x10,0x10,0x1E,0x10,0x10,0x10],
  "G":[0x0E,0x11,0x10,0x13,0x11,0x11,0x0F],
  "H":[0x11,0x11,0x11,0x1F,0x11,0x11,0x11],
  "I":[0x0E,0x04,0x04,0x04,0x04,0x04,0x0E],
  "J":[0x07,0x02,0x02,0x02,0x12,0x12,0x0C],
  "K":[0x11,0x12,0x14,0x18,0x14,0x12,0x11],
  "L":[0x10,0x10,0x10,0x10,0x10,0x10,0x1F],
  "M":[0x11,0x1B,0x15,0x11,0x11,0x11,0x11],
  "N":[0x11,0x19,0x15,0x13,0x11,0x11,0x11],
  "O":[0x0E,0x11,0x11,0x11,0x11,0x11,0x0E],
  "P":[0x1E,0x11,0x11,0x1E,0x10,0x10,0x10],
  "Q":[0x0E,0x11,0x11,0x11,0x15,0x12,0x0D],
  "R":[0x1E,0x11,0x11,0x1E,0x14,0x12,0x11],
  "S":[0x0E,0x11,0x10,0x0E,0x01,0x11,0x0E],
  "T":[0x1F,0x04,0x04,0x04,0x04,0x04,0x04],
  "U":[0x11,0x11,0x11,0x11,0x11,0x11,0x0E],
  "V":[0x11,0x11,0x11,0x11,0x11,0x0A,0x04],
  "W":[0x11,0x11,0x11,0x15,0x15,0x1B,0x11],
  "X":[0x11,0x11,0x0A,0x04,0x0A,0x11,0x11],
  "Y":[0x11,0x11,0x0A,0x04,0x04,0x04,0x04],
  "Z":[0x1F,0x01,0x02,0x04,0x08,0x10,0x1F],
  "a":[0x00,0x00,0x0E,0x01,0x0F,0x11,0x0F],
  "b":[0x10,0x10,0x1E,0x11,0x11,0x11,0x1E],
  "c":[0x00,0x00,0x0E,0x11,0x10,0x11,0x0E],
  "d":[0x01,0x01,0x0F,0x11,0x11,0x11,0x0F],
  "e":[0x00,0x00,0x0E,0x11,0x1F,0x10,0x0E],
  "f":[0x03,0x04,0x0E,0x04,0x04,0x04,0x04],
  "g":[0x00,0x00,0x0F,0x11,0x0F,0x01,0x0E],
  "h":[0x10,0x10,0x16,0x19,0x11,0x11,0x11],
  "i":[0x04,0x00,0x0C,0x04,0x04,0x04,0x0E],
  "j":[0x02,0x00,0x06,0x02,0x02,0x12,0x0C],
  "k":[0x10,0x12,0x14,0x18,0x14,0x12,0x11],
  "l":[0x0C,0x04,0x04,0x04,0x04,0x04,0x0E],
  "m":[0x00,0x00,0x1B,0x15,0x15,0x11,0x11],
  "n":[0x00,0x00,0x16,0x19,0x11,0x11,0x11],
  "o":[0x00,0x00,0x0E,0x11,0x11,0x11,0x0E],
  "p":[0x00,0x00,0x1E,0x11,0x1E,0x10,0x10],
  "q":[0x00,0x00,0x0F,0x11,0x0F,0x01,0x01],
  "r":[0x00,0x00,0x16,0x19,0x10,0x10,0x10],
  "s":[0x00,0x00,0x0E,0x10,0x0E,0x01,0x1E],
  "t":[0x08,0x08,0x1E,0x08,0x08,0x09,0x06],
  "u":[0x00,0x00,0x11,0x11,0x11,0x13,0x0D],
  "v":[0x00,0x00,0x11,0x11,0x11,0x0A,0x04],
  "w":[0x00,0x00,0x11,0x11,0x15,0x15,0x0A],
  "x":[0x00,0x00,0x11,0x0A,0x04,0x0A,0x11],
  "y":[0x00,0x00,0x11,0x11,0x0F,0x01,0x0E],
  "z":[0x00,0x00,0x1F,0x02,0x04,0x08,0x1F],
};

const CW = 5, CH = 7, CG = 1; // char width, height, gap

function drawChar(c, ch, x, y, r, g, b, s = 1) {
  const rows = FONT[ch] || FONT[" "];
  for (let row = 0; row < 7; row++)
    for (let col = 0; col < 5; col++)
      if (rows[row] & (1 << (4 - col)))
        rect(c, x + col * s, y + row * s, s, s, r, g, b);
}

function drawText(c, text, x, y, r, g, b, s = 1) {
  let cx = x;
  for (const ch of String(text)) {
    drawChar(c, ch, cx, y, r, g, b, s);
    cx += (CW + CG) * s;
  }
}

function textW(text, s = 1) {
  return String(text).length * (CW + CG) * s;
}

// ── Color palette ──────────────────────────────────────────────────────────

const C = {
  bg:       [255, 255, 255],
  panel:    [248, 249, 250],
  grid:     [222, 226, 230],
  axis:     [108, 117, 125],
  text:     [ 33,  37,  41],
  muted:    [108, 117, 125],
  run:      [252,  76,   2],   // Strava orange
  ride:     [ 59, 130, 246],   // blue
  swim:     [ 16, 185, 129],   // emerald
  walk:     [161, 161, 161],
  default:  [ 99, 102, 241],   // indigo
  z1:       [134, 197, 139],
  z2:       [ 76, 175,  80],
  z3:       [255, 193,   7],
  z4:       [255,  87,  34],
  z5:       [244,  67,  54],
  ctl:      [ 76, 175,  80],
  atl:      [244,  67,  54],
  tsb:      [ 59, 130, 246],
  goal:     [139,  92, 246],
  progress: [ 59, 130, 246],
};

const COLOR_MAP = {
  run: C.run, ride: C.ride, swim: C.swim, walk: C.walk,
  z1: C.z1, z2: C.z2, z3: C.z3, z4: C.z4, z5: C.z5,
  ctl: C.ctl, atl: C.atl, tsb: C.tsb,
  goal: C.goal, progress: C.progress, default: C.default,
};

export function resolveColor(name) {
  if (Array.isArray(name)) return name;
  return COLOR_MAP[name?.toLowerCase()] || C.default;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function niceMax(v) {
  if (v <= 0) return 10;
  const e = Math.pow(10, Math.floor(Math.log10(v)));
  const f = v / e;
  const n = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  return n * e;
}

function fmtAxis(v) {
  if (Math.abs(v) >= 10000) return Math.round(v / 1000) + "k";
  if (Math.abs(v) >= 1000)  return (v / 1000).toFixed(1) + "k";
  if (Number.isInteger(v) || Math.abs(v) >= 100) return String(Math.round(v));
  if (Math.abs(v) >= 10)  return v.toFixed(1);
  return v.toFixed(1);
}

function fmtLabel(v) {
  if (v === 0) return "0";
  if (Math.abs(v) >= 10000) return Math.round(v / 1000) + "k";
  if (Math.abs(v) >= 1000)  return (v / 1000).toFixed(1) + "k";
  if (Math.abs(v) >= 100) return String(Math.round(v));
  if (Math.abs(v) >= 10) return String(Math.round(v));
  return v.toFixed(1);
}

function saveChart(canvas) {
  const path = join(tmpdir(), `athlete-os-chart-${Date.now()}.png`);
  writeFileSync(path, encodePNG(canvas.w, canvas.h, canvas.pixels));
  return path;
}

function lighten(color, amt = 0.82) {
  return color.map(ch => Math.round(ch + (255 - ch) * amt));
}

// ── Bar Chart ──────────────────────────────────────────────────────────────
/**
 * options:
 *   title: string
 *   labels: string[]
 *   series: [{ name, values: number[], color: string|[r,g,b] }]
 *   unit?: string         e.g. "km", "h", ""
 *   width?, height?
 */
export function drawBarChart(options) {
  const W = options.width  || 800;
  const H = options.height || 440;
  const PAD = { top: 52, right: 28, bottom: 58, left: 62 };

  const { labels, series, title = "", unit = "" } = options;
  const n = labels.length;
  const ns = series.length;

  let maxV = 0;
  for (const s of series) for (const v of s.values) if (v > maxV) maxV = v;
  const yMax = niceMax(maxV || 1);

  const cX = PAD.left, cY = PAD.top;
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;

  const cv = createCanvas(W, H, C.bg);

  // Chart area background
  rect(cv, cX, cY, cW, cH, ...C.panel);

  // Horizontal grid lines + y-axis labels
  const GRIDS = 5;
  for (let i = 0; i <= GRIDS; i++) {
    const v = (yMax / GRIDS) * i;
    const gy = cY + cH - Math.round((v / yMax) * cH);
    // Dashed grid line
    for (let gx = cX; gx < cX + cW; gx += 5) {
      px(cv, gx, gy, ...C.grid); px(cv, gx+1, gy, ...C.grid); px(cv, gx+2, gy, ...C.grid);
    }
    // Y label
    const lbl = fmtAxis(v) + (unit && i === GRIDS ? " " + unit : "");
    const lw = textW(lbl);
    drawText(cv, lbl, cX - lw - 5, gy - 3, ...C.muted);
  }

  // Bars
  const groupW = cW / n;
  const totalBarPad = Math.max(8, groupW * 0.22);
  const gapBetween = ns > 1 ? 2 : 0;
  const barW = Math.max(4, Math.floor((groupW - totalBarPad - gapBetween * (ns - 1)) / ns));

  for (let i = 0; i < n; i++) {
    const gx = cX + Math.round(i * groupW);
    const groupOffset = Math.round((groupW - barW * ns - gapBetween * (ns - 1)) / 2);

    for (let si = 0; si < ns; si++) {
      const v = series[si].values[i] || 0;
      const bH = Math.round((v / yMax) * cH);
      if (bH < 1) continue;

      const bx = gx + groupOffset + si * (barW + gapBetween);
      const by = cY + cH - bH;
      const col = resolveColor(series[si].color);

      // Bar body
      rect(cv, bx, by, barW, bH, ...col);

      // Top highlight strip
      rect(cv, bx, by, barW, Math.min(3, bH), ...lighten(col, 0.35));

      // Round top corners (1px)
      px(cv, bx, by, ...C.panel);
      px(cv, bx + barW - 1, by, ...C.panel);

      // Value label above bar
      if (bH > 14 || ns === 1) {
        const vLbl = fmtLabel(v);
        const vw = textW(vLbl);
        const vlx = bx + Math.round((barW - vw) / 2);
        if (by - 11 >= cY) drawText(cv, vLbl, vlx, by - 11, ...C.text);
      }
    }

    // X-axis label
    const xLbl = labels[i];
    const xlw = textW(xLbl);
    const xlx = gx + Math.round(groupW / 2) - Math.round(xlw / 2);
    drawText(cv, xLbl, xlx, cY + cH + 9, ...C.muted);
  }

  // Axes
  line(cv, cX, cY, cX, cY + cH, ...C.axis, 2);
  line(cv, cX, cY + cH, cX + cW, cY + cH, ...C.axis, 2);

  // Title
  const ts = 2;
  const tw = textW(title, ts);
  drawText(cv, title, Math.round((W - tw) / 2), 12, ...C.text, ts);

  // Legend (multi-series only)
  if (ns > 1) {
    let totalLW = 0;
    for (const s of series) totalLW += textW(s.name) + 22;
    let lx = Math.round((W - totalLW) / 2);
    for (const s of series) {
      const col = resolveColor(s.color);
      rect(cv, lx, H - 19, 10, 9, ...col);
      drawText(cv, s.name, lx + 13, H - 19, ...C.muted);
      lx += textW(s.name) + 22;
    }
  }

  return saveChart(cv);
}

// ── Line Chart ─────────────────────────────────────────────────────────────
/**
 * options:
 *   title: string
 *   labels: string[]
 *   series: [{ name, values: number[], color }]
 *   unit?: string
 *   width?, height?
 */
export function drawLineChart(options) {
  const W = options.width  || 800;
  const H = options.height || 440;
  const PAD = { top: 52, right: 28, bottom: 58, left: 62 };

  const { labels, series, title = "", unit = "" } = options;
  const n = labels.length;

  // Value range (supports negative TSB)
  let minV = Infinity, maxV = -Infinity;
  for (const s of series) for (const v of s.values) {
    if (v < minV) minV = v;
    if (v > maxV) maxV = v;
  }
  if (minV === Infinity) { minV = 0; maxV = 10; }
  const range = maxV - minV;
  const vMin = minV >= 0 ? 0 : minV - range * 0.08;
  const vMax = maxV + range * 0.08;
  const vRange = vMax - vMin || 1;

  const cX = PAD.left, cY = PAD.top;
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;

  const cv = createCanvas(W, H, C.bg);
  rect(cv, cX, cY, cW, cH, ...C.panel);

  // Zero line (if chart crosses zero)
  if (vMin < 0) {
    const y0 = cY + cH - Math.round(((0 - vMin) / vRange) * cH);
    for (let gx = cX; gx < cX + cW; gx += 3) px(cv, gx, y0, ...C.axis);
  }

  // Grid lines + y labels
  const GRIDS = 5;
  for (let i = 0; i <= GRIDS; i++) {
    const v = vMin + (vRange / GRIDS) * i;
    const gy = cY + cH - Math.round(((v - vMin) / vRange) * cH);
    for (let gx = cX; gx < cX + cW; gx += 5) {
      px(cv, gx, gy, ...C.grid); px(cv, gx+1, gy, ...C.grid); px(cv, gx+2, gy, ...C.grid);
    }
    const lbl = fmtAxis(v);
    const lw = textW(lbl);
    drawText(cv, lbl, cX - lw - 5, gy - 3, ...C.muted);
  }

  // Area fill + lines
  for (const s of series) {
    const col = resolveColor(s.color);
    const lightCol = lighten(col, 0.85);
    const y0 = Math.min(cY + cH, cY + cH - Math.round(((0 - vMin) / vRange) * cH));

    const pts = s.values.map((v, i) => [
      cX + Math.round((i / Math.max(n - 1, 1)) * cW),
      cY + cH - Math.round(((v - vMin) / vRange) * cH),
    ]);

    // Area fill
    for (let i = 0; i < pts.length - 1; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
      for (let ax = x1; ax <= x2; ax++) {
        const t = x2 === x1 ? 0 : (ax - x1) / (x2 - x1);
        const ay = Math.round(y1 + (y2 - y1) * t);
        const fillTop = Math.min(ay, y0);
        const fillBot = Math.max(ay, y0);
        for (let fy = fillTop; fy <= fillBot; fy++) px(cv, ax, fy, ...lightCol);
      }
    }

    // Line
    for (let i = 0; i < pts.length - 1; i++)
      line(cv, pts[i][0], pts[i][1], pts[i+1][0], pts[i+1][1], ...col, 2);

    // Dots
    for (const [dx, dy] of pts) {
      rect(cv, dx - 3, dy - 3, 7, 7, ...col);
      rect(cv, dx - 1, dy - 1, 3, 3, ...C.bg);
    }
  }

  // X-axis labels (skip if too dense)
  const step = n <= 14 ? 1 : Math.ceil(n / 14);
  for (let i = 0; i < n; i += step) {
    const ax = cX + Math.round((i / Math.max(n - 1, 1)) * cW);
    const lbl = labels[i];
    const lw = textW(lbl);
    drawText(cv, lbl, ax - Math.round(lw / 2), cY + cH + 9, ...C.muted);
  }

  // Axes
  line(cv, cX, cY, cX, cY + cH, ...C.axis, 2);
  line(cv, cX, cY + cH, cX + cW, cY + cH, ...C.axis, 2);

  // Title
  const ts = 2;
  const tw = textW(title, ts);
  drawText(cv, title, Math.round((W - tw) / 2), 12, ...C.text, ts);

  // Legend
  if (series.length > 1) {
    let totalLW = 0;
    for (const s of series) totalLW += textW(s.name) + 22;
    let lx = Math.round((W - totalLW) / 2);
    for (const s of series) {
      const col = resolveColor(s.color);
      rect(cv, lx, H - 19, 10, 9, ...col);
      drawText(cv, s.name, lx + 13, H - 19, ...C.muted);
      lx += textW(s.name) + 22;
    }
  }

  return saveChart(cv);
}
