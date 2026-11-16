// Helpers shared by the weather loops. Weather fills its whole canvas edge to edge, so: clip() keeps every pixel
// and every bit of light inside the canvas; pass() is a fast per-pixel shader over the canvas; field() bakes a
// tiling noise that scrolls a whole tile a loop; trips() rains particles that fall a whole number of times a
// loop, somewhere new each time; tree() is a branching lightning path. All of it is a pure function of t.
// The noise bake and the branching bolt are adapted from Sprite Fusion's open-source fog and lightning
// (https://www.spritefusion.com/pixel-art-vfx/fog), MIT License, Copyright (c) 2026 Hugo Duprez.

import { rand, wrap, TAU } from "../../core/index.js";

/** The canvas in local coordinates: x0 <= x < x1, y0 <= y < y1. */
export function box(meta) {
  const [W, H] = meta.size, [OX, OY] = meta.origin;
  return { x0: -OX, y0: -OY, x1: W - OX, y1: H - OY, w: W, h: H };
}

/**
 * A painter that draws only inside the effect's canvas: the same API, with color, blends and light outside it
 * dropped. Exact under the painter's flip and rotation.
 */
export function clip(p, meta) {
  const B = box(meta), q = Object.create(p);
  let ok;
  if (p.sn === 0) {
    const a = p.toX(B.x0, 0), b = p.toX(B.x1, 0), sx0 = Math.round(Math.min(a, b)), sx1 = Math.round(Math.max(a, b));
    const sy0 = Math.round(p.toY(0, B.y0)), sy1 = Math.round(p.toY(0, B.y1));
    ok = (sx, sy) => sx >= sx0 && sx < sx1 && sy >= sy0 && sy < sy1;
  } else
    ok = (sx, sy) => {
      const lx = p.fromX(sx + 0.5, sy + 0.5), ly = p.fromY(sx + 0.5, sy + 0.5);
      return lx >= B.x0 && lx < B.x1 && ly >= B.y0 && ly < B.y1;
    };
  q.put = (sx, sy, c, a) => ok(sx, sy) && p.put(sx, sy, c, a);
  q.add = (sx, sy, c, k) => ok(sx, sy) && p.add(sx, sy, c, k);
  q.blendPx = (sx, sy, c, a) => ok(sx, sy) && p.blendPx(sx, sy, c, a);
  q.glow = (x, y, r, c, k) => glow(q, B, x, y, r, c, k);
  return q;
}

// the painter's glow, with its box cut to the canvas first (big soft lights stay cheap)
function glow(q, B, x, y, r, c, k) {
  if (r < 1 || k <= 0.004) return;
  const cx = q.toX(x, y), cy = q.toY(x, y);
  r *= q.scale;
  const x0 = Math.max(q.ox, Math.floor(cx - r)), x1 = Math.min(q.ox + q.w - 1, Math.ceil(cx + r));
  const y0 = Math.max(q.oy, Math.floor(cy - r)), y1 = Math.min(q.oy + q.h - 1, Math.ceil(cy + r));
  for (let sy = y0; sy <= y1; sy++) {
    const dy = (sy + 0.5 - cy) / r;
    for (let sx = x0; sx <= x1; sx++) {
      const dx = (sx + 0.5 - cx) / r, d = dx * dx + dy * dy;
      if (d >= 1) continue;
      const f = 1 - Math.sqrt(d);
      q.add(sx, sy, c, f * f * k);
    }
  }
}

const OUT = { c: 0, a: 1, b: 0, l: 0, k: 0 };
/**
 * A bulk shader over canvas rows y0..y1 (local, clipped to the canvas). fn(x, y, out) sets color, continuous
 * alpha and optional light. It keeps 1x weather passes inexpensive while routing scaled frames through Painter.
 */
export function pass(p, meta, y0, y1, fn) {
  const B = box(meta), o = OUT;
  y0 = Math.max(B.y0, Math.floor(y0));
  y1 = Math.min(B.y1 - 1, Math.ceil(y1));
  if (y0 > y1) return;
  const q = clip(p, meta);
  if (p.sn !== 0 || p.scale > 1) {
    for (let y = y0; y <= y1; y++)
      for (let x = B.x0; x < B.x1; x++) {
        o.c = 0; o.a = 1; o.b = 0; o.l = 0; o.k = 0;
        fn(x + 0.5, y + 0.5, o);
        if (o.c) q.dot(x, y, o.c, o.a);
        if (o.k > 0) q.light(x, y, o.l || o.c, o.k);
      }
    return;
  }
  const W = p.w, fx = p.fx, tx = p.tx;
  for (let y = y0; y <= y1; y++) {
    const sy = Math.floor(p.ty + y + 0.5), ry = sy - p.oy;
    if (ry < 0 || ry >= p.h) continue;
    let sxf = tx + (B.x0 + 0.5) * fx;
    for (let x = B.x0; x < B.x1; x++, sxf += fx) {
      const sx = Math.floor(sxf), rx = sx - p.ox;
      if (rx < 0 || rx >= W) continue;
      o.c = 0; o.a = 1; o.b = 0; o.l = 0; o.k = 0;
      fn(x + 0.5, y + 0.5, o);
      if (o.c) q.put(sx, sy, o.c, o.a);
      if (o.k > 0) q.add(sx, sy, o.l || o.c, o.k);
    }
  }
}

const ROW = { w: 0, c: null, a: null, b: null, l: null, k: null };
/**
 * The fastest whole-sky shader: fn(y, R) fills one canvas row at a time (y the row's logical center), writing
 * R.c[i] (color, 0 for none), R.a[i] (continuous alpha, default 1), R.b[i] (legacy blend hint), R.l[i] / R.k[i] (light
 * color and amount) for column i = x - box.x0. One call a row, so the effect's inner loop stays tight.
 */
export function rows(p, meta, y0, y1, fn) {
  const B = box(meta), w = B.w, R = ROW;
  if (R.w !== w) Object.assign(R, { w, c: new Uint32Array(w), a: new Float32Array(w), b: new Uint8Array(w), l: new Uint32Array(w), k: new Float32Array(w) });
  y0 = Math.max(B.y0, Math.floor(y0));
  y1 = Math.min(B.y1 - 1, Math.ceil(y1));
  const smooth = p.sn !== 0 || p.scale > 1, q = clip(p, meta), W = p.w, fx = p.fx;
  for (let y = y0; y <= y1; y++) {
    R.c.fill(0);
    R.k.fill(0);
    R.a.fill(1);
    R.b.fill(0);
    fn(y + 0.5, R);
    if (smooth) {
      for (let i = 0; i < w; i++) {
        if (R.c[i]) q.dot(B.x0 + i, y, R.c[i], R.a[i]);
        if (R.k[i] > 0) q.light(B.x0 + i, y, R.l[i] || R.c[i], R.k[i]);
      }
      continue;
    }
    const sy = Math.floor(p.ty + y + 0.5), ry = sy - p.oy;
    if (ry < 0 || ry >= p.h) continue;
    let sxf = p.tx + (B.x0 + 0.5) * fx;
    for (let i = 0; i < w; i++, sxf += fx) {
      const c = R.c[i], kk = R.k[i];
      if (!c && !(kk > 0)) continue;
      const sx = Math.floor(sxf), rx = sx - p.ox;
      if (rx < 0 || rx >= W) continue;
      if (c) q.put(sx, sy, c, R.a[i]);
      if (kk > 0) q.add(sx, sy, R.l[i] || c, kk);
    }
  }
}

const FIELDS = new Map();
/**
 * A baked fractal noise that tiles: w x h cells (powers of two), octaves of `cells` lattice squares across.
 * Values 0..1, mostly near 0.5. Scroll it a whole number of tiles a loop and the loop has no seam.
 */
export function field(seed, w = 256, h = 128, cells = [4, 8, 16, 32]) {
  const key = `${seed}|${w}|${h}|${cells}`;
  let F = FIELDS.get(key);
  if (F) return F;
  const d = new Float32Array(w * h);
  let amp = 0.5, total = 0;
  for (const n of cells) {
    const cs = w / n, rows = Math.max(1, Math.round(h / cs));
    const at = (a, b) => rand(wrap(a, n), wrap(b, rows), seed, n);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const gx = x / cs, gy = (y / h) * rows, ix = Math.floor(gx), iy = Math.floor(gy), u = gx - ix, v = gy - iy;
        const su = u * u * (3 - 2 * u), sv = v * v * (3 - 2 * v);
        const top = at(ix, iy) + (at(ix + 1, iy) - at(ix, iy)) * su, bot = at(ix, iy + 1) + (at(ix + 1, iy + 1) - at(ix, iy + 1)) * su;
        d[y * w + x] += (top + (bot - top) * sv) * amp;
      }
    total += amp;
    amp *= 0.5;
  }
  for (let i = 0; i < d.length; i++) d[i] /= total;
  FIELDS.set(key, (F = { w, h, d }));
  return F;
}
/** A field at (u, v) in its own cells, wrapping, smooth between cells. */
export function sample(F, u, v) {
  const x = Math.floor(u), y = Math.floor(v), fx = u - x, fy = v - y, m = F.w - 1, n = F.h - 1, D = F.d;
  const x0 = x & m, x1 = (x + 1) & m, y0 = (y & n) * F.w, y1 = ((y + 1) & n) * F.w;
  const a = D[y0 + x0], b = D[y0 + x1], c = D[y1 + x0], e = D[y1 + x1];
  return a + (b - a) * fx + (c - a + (a - b - c + e) * fx) * fy;
}

/**
 * Falling particles for a loop of D seconds: n slots, each falling m times a loop (m whole, from m0 to m1), each
 * fall somewhere new. fn(u, k, m, i): u 0..1 through the current fall, k its number (wrap(k, m) names it: use
 * rand(seed, i, wrap(k, m), ...) for its own randoms, the same every loop), m, the slot i. A fall lasts D / m s.
 */
export function trips(t, D, n, seed, m0, m1, fn) {
  for (let i = 0; i < n; i++) {
    const m = m0 + Math.floor(rand(seed, i, 72) * (m1 - m0 + 1)), s = (t / D) * m + rand(seed, i, 71), k = Math.floor(s);
    fn(s - k, k, m, i);
  }
}

/**
 * A branching lightning path from (x0, y0) to (x1, y1): midpoint displacement down to ~3 px segments, with
 * forks (and forks of forks) peeling off. Returns [{ pts: [[x, y], ...], w }], the trunk first with w = 1,
 * forks thinner (w < 1). R is an Rng.
 */
export function tree(R, x0, y0, x1, y1, jag = 0.3, forks = 0.4, w = 1, depth = 0) {
  const out = [], L = Math.hypot(x1 - x0, y1 - y0);
  let pts = [[x0, y0], [x1, y1]], off = L * jag;
  while (pts.length < 2 + L / 3) {
    const nxt = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[i + 1], l = Math.hypot(bx - ax, by - ay) || 1, o = R.range(-off, off);
      nxt.push([(ax + bx) / 2 + (-(by - ay) / l) * o, (ay + by) / 2 + ((bx - ax) / l) * o], [bx, by]);
    }
    pts = nxt;
    off *= 0.52;
  }
  out.push({ pts, w, depth });
  if (depth < 2)
    for (let i = 2; i < pts.length - 3; i++)
      if (R.chance(forks / (1 + depth) / Math.max(4, pts.length / 6))) {
        const [ax, ay] = pts[i], [bx, by] = pts[Math.min(pts.length - 1, i + 3)];
        const a = Math.atan2(by - ay, bx - ax) + R.sign() * R.range(0.35, 0.95), l = (L - (i / pts.length) * L) * R.range(0.25, 0.55);
        out.push(...tree(R, ax, ay, ax + Math.cos(a) * l, ay + Math.sin(a) * l, jag * 1.1, forks, w * 0.55, depth + 1));
      }
  return out;
}

/** Whole cycles per loop: a sine with c full turns in D seconds, phase ph (radians). Seamless by construction. */
export const wave = (t, D, c, ph = 0) => Math.sin((TAU * c * t) / D + ph);

/**
 * A raindrop's splash on the floor, age seconds after it lands at (x, z): a white crown for a frame or two, a
 * flat ring spreading (its near arc brighter), and droplets thrown up that fall back. size 0..1 (far to near),
 * c = { hot, cool } colors, h a number unique to this drop. Adapted from Sprite Fusion's rain.
 */
export function splash(q, x, z, age, size, c, h) {
  const L = 0.3 + 0.12 * size, u = age / L;
  if (u >= 1) return;
  if (age < 0.07) {
    q.px(x, z - 1, c.hot);
    if (size > 0.3) (q.px(x - 1, z - 1 - (age > 0.035 ? 1 : 0), c.hot), q.px(x + 1, z - 1 - (age > 0.035 ? 1 : 0), c.hot));
    if (size > 0.65 && age > 0.03) (q.px(x - 2, z - 2, c.cool), q.px(x + 2, z - 2, c.cool));
  }
  const rx = 1 + (1.2 + 3.6 * size) * Math.sqrt(u), ry = Math.max(0.5, rx * 0.26), n = Math.ceil(rx * 6.5);
  for (let j = 0; j < n; j++) {
    const a = (j / n) * TAU, s = Math.sin(a);
    if (s < -0.25) continue;
    q.dot(x + Math.cos(a) * rx, z + s * ry, u < 0.3 && s > 0 ? c.hot : c.cool, u < 0.45 ? (s > 0.2 ? 1 : 0.7) : (1 - u) * 1.6 * (s > 0.2 ? 1 : 0.6));
  }
  const nd = size > 0.55 ? 3 : 2, H = Math.floor(h * 1e6);
  for (let d = 0; d < nd; d++) {
    const vx = (rand(H, d, 1) - 0.5) * 2 * (25 + 35 * size), vy = -(55 + rand(H, d, 2) * 70 * (0.5 + size)), y = z - 1 + vy * age + 475 * age * age;
    if (y > z - 0.5 || age > 0.34) continue;
    const xx = x + vx * age;
    q.px(xx, y, age < 0.12 ? c.hot : c.cool);
    if (vy + 950 * age < -40) q.dot(xx - vx * 0.012, y + 1, c.cool, 0.7);
  }
}

/**
 * A crisp splash on a floor line, age seconds after a drop lands at (x, z): a crown for a few frames (a white
 * point, two arms rising), then a flat dash that spreads and breaks into two end dashes, and a droplet or two
 * arcing up and back. Solid marks with continuous coverage keep the line clean. size 0..1, c = { hot, cool,
 * white }, h a number unique to the drop. Returns false once it's over.
 */
export function crown(q, x, z, age, size, c, h) {
  const L = 0.22 + 0.14 * size, u = age / L, X = Math.round(x), Z = Math.round(z);
  if (u >= 1) return false;
  if (age < 0.1) {
    const up = age < 0.033 ? 1 : age < 0.067 ? 2 : 2 + (size > 0.5 ? 1 : 0);
    q.px(X, Z - 1, age < 0.05 ? c.white : c.hot);
    for (let d = 1; d <= Math.min(up, size > 0.5 ? 3 : 1); d++) (q.px(X - d, Z - 1 - (d > 1 ? d - 1 : 0), d === 1 ? c.hot : c.cool), q.px(X + d, Z - 1 - (d > 1 ? d - 1 : 0), d === 1 ? c.hot : c.cool));
  }
  if (u > 0.15) {
    const w = Math.round(1 + (1.5 + 3.5 * size) * Math.sqrt(u)), gap = u > 0.55 ? Math.max(0, w - 2) : -1;
    for (let d = -w; d <= w; d++) if (Math.abs(d) > gap) q.px(X + d, Z, Math.abs(d) >= w - 1 && u < 0.6 ? c.hot : c.cool);
  }
  const nd = size > 0.5 ? 2 : 1, H = Math.floor(h * 1e6);
  for (let d = 0; d < nd; d++) {
    const vx = (rand(H, d, 1) - 0.5) * 2 * (20 + 30 * size), vy = -(50 + rand(H, d, 2) * 60 * (0.4 + size)), y = Z - 1 + vy * age + 475 * age * age;
    if (y < Z - 0.5 && age < 0.3) q.px(x + vx * age, y, age < 0.1 ? c.white : c.hot);
  }
  return true;
}
