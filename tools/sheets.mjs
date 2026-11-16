#!/usr/bin/env node
// Export sprite sheets for every effect (or some): sheets/<category>/<name>.png + .json, and sheets/index.json.
//
//   node tools/sheets.mjs            everything, rendered at 4x
//   node tools/sheets.mjs fire ice   some categories
//   node tools/sheets.mjs --scale 1  original logical size

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, allIds, resolveIds, loadEffect, renderFrames, spriteSheet, save } from "./lib/fxlib.mjs";
import { actTiming } from "../src/core/index.js";

const args = process.argv.slice(2), flags = {}, patterns = [];
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith("--")) flags[args[i].slice(2)] = args[++i];
  else patterns.push(args[i]);
}
const scale = +(flags.scale ?? 4);
const ids = patterns.length ? resolveIds(patterns) : allIds();
const out = join(ROOT, "sheets"), index = [];
for (const id of ids) {
  const fx = await loadEffect(id), r = renderFrames(fx, { bg: "none", scale }), name = id.split("/")[1];
  const s = spriteSheet(fx, r, name);
  save(join(out, id + ".png"), s.png);
  save(join(out, id + ".json"), JSON.stringify(s.json, null, 1));
  const m = fx.meta;
  index.push({ id, name: m.name, desc: m.desc, tags: m.tags, loop: m.loop, fps: r.fps, frames: r.n, frameSize: s.json.meta.pixelfx.frameSize, logicalFrameSize: m.size, pivot: s.json.meta.pixelfx.pivot, logicalPivot: m.origin, scale, columns: s.json.meta.pixelfx.columns, image: `${id}.png`, ...(fx.mod.act ? { act: actTiming(fx.mod) } : {}) });
  process.stdout.write(".");
}
if (!patterns.length) writeFileSync(join(out, "index.json"), JSON.stringify(index, null, 1));
console.log(`\n${ids.length} sheets at ${scale}x -> sheets/`);
