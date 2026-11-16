#!/usr/bin/env node
import assert from "node:assert/strict";
import { createFrame, createFx, painterFor } from "../src/core/index.js";
import { upscaleRGBA } from "../src/core/fx.js";
import { fillConvex, pixels, rect } from "../src/fx/transitions/_lib.js";
import { soft, solid } from "../src/fx/fire/_lib.js";
import * as aurora from "../src/fx/weather/aurora.js";
import { tone } from "../src/fx/arcane/_lib.js";
import { renderAct, renderFrames, spriteSheet, loadEffect } from "./lib/fxlib.mjs";

const color = 0xffffffff;
const frame = createFrame(8, 8);
const p = painterFor(frame).place(0, 0);
p.dot(0, 0, color, 0.5);
p.dot(3, 0, color, 0.5);
assert.equal(frame.color[0] >>> 24, frame.color[3] >>> 24, "fractional alpha should not depend on screen-space dither phase");
assert.equal(frame.color[0] >>> 24, 128, "half alpha should stay continuous");

const line = createFrame(8, 8);
painterFor(line).line(1.1, 1, 1.1, 7, color);
assert.ok(line.color.some((v) => (v >>> 24) > 0 && (v >>> 24) < 255), "fractional geometry should have coverage antialiasing");

const hd = createFrame(32, 32, 0, 0, 4);
painterFor(hd).place(0, 0).circle(4, 4, 2, color);
assert.ok(hd.color.some((v) => v >>> 24), "logical geometry should render into the scaled backing frame");

const fastPaths = createFrame(64, 64, 0, 0, 4), fp = painterFor(fastPaths).place(0, 0);
rect(fp, 2, 2, 4, 3, color);
assert.ok(fastPaths.color.slice(8 * 64 + 8, 8 * 64 + 24).every((v) => v >>> 24 === 255), "scaled transition rectangles should fill their logical bounds");
fillConvex(fp, [[10, 2], [14, 2], [12, 6]], color);
assert.ok(fastPaths.color.some((v) => v >>> 24 === 255), "scaled transition polygons should use logical coordinates");
const beforePixels = fastPaths.color.reduce((n, v) => n + (v ? 1 : 0), 0);
const pixelPass = pixels(fp);
pixelPass.at(5 * 320 + 5);
pixelPass.put(color);
assert.ok(fastPaths.color.reduce((n, v) => n + (v ? 1 : 0), 0) > beforePixels, "scaled transition pixel passes should expand logical marks");
solid(fp, 5, 10, 4, color);
soft(fp, 15, 10, 4, color, 0.5);
assert.ok(fastPaths.color.some((v) => (v >>> 24) > 0 && (v >>> 24) < 255), "scaled fire helpers should preserve smooth coverage");
const weather = createFrame(320 * 4, 180 * 4, 0, 0, 4), auroraFx = createFx(aurora, { x: 160, y: 180 });
auroraFx.draw(weather);
assert.ok(weather.color.some((v) => v) && weather.light.some((v) => v & 0xffffff), "scaled clipped weather should render color and light without recursion");
assert.equal(tone([0xff000000, 0xffffffff], 0.5, 0, 0, 0), tone([0xff000000, 0xffffffff], 0.5, 3, 2, 0), "ramp shading must not vary with screen-space dither phase");

const src = new Uint8ClampedArray([255, 0, 0, 0, 0, 0, 255, 255]);
const enlarged = upscaleRGBA(src, 2, 1, 2);
for (let i = 0; i < enlarged.length; i += 4) if (enlarged[i + 3]) assert.equal(enlarged[i], 0, "transparent source RGB must not bleed into scaled edges");

const meta = { size: [8, 8], origin: [4, 4], duration: 0, fps: 1, loop: false, bg: "none", tags: [] };
const fx = { id: "test/shape", meta, mod: { meta, draw(q) { q.circle(0, 0, 2, color); } } };
const rendered = renderFrames(fx, { scale: 4, bg: "none", actor: false });
assert.deepEqual([rendered.w, rendered.h, rendered.logicalW, rendered.logicalH, rendered.scale], [32, 32, 8, 8, 4]);
const sheet = spriteSheet(fx, rendered, "shape").json.meta.pixelfx;
assert.deepEqual(sheet.frameSize, [32, 32]);
assert.deepEqual(sheet.logicalFrameSize, [8, 8]);
assert.deepEqual(sheet.pivot, [16, 16]);
assert.deepEqual(sheet.logicalPivot, [4, 4]);
assert.equal(sheet.scale, 4);

const acted = await loadEffect("status/frozen");
const actRender = renderAct(acted, { fps: 1, seconds: 0, hold: 0, bg: "none", scale: 2 });
assert.equal(actRender.w, actRender.logicalW * 2);
assert.equal(actRender.h, actRender.logicalH * 2);
assert.ok(actRender.frames[0].color.some((v, i) => i % 4 === 3 && v > 0), "scaled body effects should remain visible");

console.log("HD renderer checks passed");
