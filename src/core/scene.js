// Preview backdrops: what the tools and the gallery draw behind an effect. Sprite sheets stay transparent.

import { hex, mix } from "./color.js";
import { rand } from "./math.js";

const SKY = hex("#15131d"), SKY_TOP = hex("#0d0b14"), SKY_LOW = hex("#221d33");
const FLOOR_EDGE = hex("#4a4263"), FLOOR = hex("#2b2639"), FLOOR_DARK = hex("#211d2d"), MORTAR = hex("#1a1724");
export const BACKDROPS = ["dark", "ground", "sky", "light", "black"];

/**
 * A backdrop as a Uint32Array of w x h colors. kind: "dark" | "ground" (a stone floor from groundY down)
 * | "sky" (night gradient with stars) | "light" | "black".
 */
export function backdrop(kind, w, h, groundY = h, scale = 1) {
  if (!Number.isInteger(scale) || scale < 1) throw new RangeError("backdrop scale must be a positive integer");
  const out = new Uint32Array(w * h);
  if (kind === "light") return out.fill(hex("#ebe8f0"));
  if (kind === "black") return out.fill(hex("#000000"));
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let c = SKY;
      if (kind === "sky") {
        const t = y / Math.max(1, h - 1), lx = Math.floor(x / scale), ly = Math.floor(y / scale);
        c = mix(SKY_TOP, SKY_LOW, t);
        const r = rand(lx, ly, 77);
        if (r > 0.9995) {
          const dx = (x + 0.5) / scale - (lx + 0.5), dy = (y + 0.5) / scale - (ly + 0.5), radius = 0.34 + rand(lx, ly, 79) * 0.18;
          const coverage = Math.max(0, 1 - Math.hypot(dx, dy) / radius);
          if (coverage) c = mix(c, hex("#cfc8ff"), coverage * (0.35 + (r - 0.9995) * 700));
        }
      }
      if (kind === "ground" && y >= groundY) {
        const gy = Math.floor((y - groundY) / scale), lx = Math.floor(x / scale);
        if (gy === 0) c = FLOOR_EDGE;
        else {
          const row = Math.floor((gy - 1) / 5), off = row % 2 ? 6 : 0;
          const mortar = (gy - 1) % 5 === 4 || (lx + off) % 12 === 0;
          c = mortar ? MORTAR : gy < 3 ? FLOOR : FLOOR_DARK;
        }
      }
      out[y * w + x] = c;
    }
  return out;
}
