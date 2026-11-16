// The gallery: every effect playing live from its own code. Tiles start when they scroll into view; a click
// opens one effect with its options, a sprite sheet and the code to use it.

import { effects, categories } from "../src/fx/index.js";
import { createFrame, clearFrame, createFx, createAct, actBounds, composite, backdrop, drawActor, painterFor, stockActor, actorAlphaOf, PAL, BACKDROPS } from "../src/core/index.js";
import { ui, localizeCategory, localizeEffect, localizeTags, resolveLanguage, urlWithLanguage } from "./i18n.js";

const REPO = "https://github.com/patch-gg/pixelfx";
const FX = Object.entries(effects).map(([id, mod]) => {
  const meta = { fps: 30, bg: "dark", loop: false, duration: 1, tags: [], options: {}, ...mod.meta };
  return { id, cat: id.split("/")[0], name: meta.name, mod: { ...mod, meta }, meta };
});
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
let storedLanguage = "";
try { storedLanguage = localStorage.getItem("pixelfx.language") || ""; } catch {}
let language = resolveLanguage(location.search, storedLanguage, navigator.language);
const msg = () => ui[language];
// full-screen effects (transitions, weather, impact frames) fill a 16:9 stage edge to edge instead of floating in it
const isScreen = (fx) => fx.meta.size[0] >= 320 && Math.abs(fx.meta.size[0] / fx.meta.size[1] - 16 / 9) < 0.05;
const $ = (s) => document.querySelector(s);
function el(tag, props = {}, kids = []) {
  const e = Object.assign(document.createElement(tag), props);
  for (const k of [].concat(kids)) e.append(k);
  return e;
}

// ---- a live effect on a high-density canvas that fits the stage
class Player {
  constructor(canvas, fx, aspect, pad) {
    Object.assign(this, { canvas, fx, ctx: canvas.getContext("2d"), opts: {}, flip: false, actor: true, speed: 1, playing: true });
    this.bg = fx.meta.bg;
    this.layout(aspect, pad);
  }
  // The logical stage keeps the effect's coordinate system; the backing canvas adds detail for high-DPI screens.
  layout(aspect, pad) {
    Object.assign(this, { aspect, pad });
    // an act needs room for the whole performance, not just the effect's canvas
    const acted = this.acted, b = acted ? { ...actBounds(this.fx.mod) } : null;
    // an act happens above the floor: don't spend the tile on bricks
    if (b) b.y1 = Math.min(b.y1, 22);
    const [w, h] = acted ? [b.x1 - b.x0, b.y1 - b.y0] : this.fx.meta.size, [ox, oy] = acted ? [-b.x0, -b.y0] : this.fx.meta.origin;
    this.W = Math.ceil(Math.max(w * (acted ? Math.min(pad, 1.1) : pad), h * (acted ? Math.min(pad, 1.1) : pad) * aspect));
    this.H = Math.ceil(this.W / aspect);
    this.x = Math.floor((this.W - w) / 2) + ox;
    // an act stands near the bottom of its tile, with the room above it
    this.y = acted ? Math.max(oy + 2, this.H - b.y1 - 2) : Math.floor((this.H - h) / 2) + oy;
    this.renderScale = Math.max(2, Math.min(3, Math.ceil(devicePixelRatio || 1)));
    this.canvas.width = this.W * this.renderScale;
    this.canvas.height = this.H * this.renderScale;
    this.ctx.imageSmoothingEnabled = true;
    this.frame = createFrame(this.canvas.width, this.canvas.height, 0, 0, this.renderScale);
    this.img = this.ctx.createImageData(this.frame.w, this.frame.h);
    this.setBg(this.bg);
    this.restart();
  }
  setBg(kind) {
    this.bg = kind;
    this.bgBuf = kind === "none" ? null : backdrop(kind, this.frame.w, this.frame.h, this.y * this.renderScale, this.renderScale);
    this.dirty = true;
  }
  // an effect with an act plays it, unless the character is switched off
  get acted() {
    return !!this.fx.mod.act && this.actor;
  }
  restart() {
    this.inst = (this.acted ? createAct : createFx)(this.fx.mod, { x: this.x, y: this.y, flip: this.flip, ...this.opts });
    this.acc = 0;
    this.wait = 0;
    this.dirty = true;
  }
  tick(dt) {
    const m = this.fx.meta, step = 1 / m.fps;
    if (this.playing) this.acc = Math.min(this.acc + dt * this.speed, 0.25);
    let moved = false;
    while (this.acc >= step) {
      this.acc -= step;
      if (!m.loop && (this.acted ? this.inst.done() : this.inst.t >= m.duration)) {
        this.wait += step;
        if (this.wait > 0.45) this.restart();
      } else this.inst.update(step);
      moved = true;
    }
    if (moved || this.dirty) this.render();
  }
  seek(t) {
    this.restart();
    this.inst.update(t);
    this.render();
  }
  render() {
    const f = clearFrame(this.frame);
    if (this.acted) {
      this.inst.draw(f);
      composite(f, this.img.data, this.bgBuf);
      const [sx, sy] = this.inst.shake;
      if (sx || sy) this.ctx.clearRect(0, 0, this.frame.w, this.frame.h);
      this.ctx.putImageData(this.img, sx * this.renderScale, sy * this.renderScale);
      this.dirty = false;
      return;
    }
    this.inst.draw(f, "back");
    const m = this.fx.meta, tt = m.loop ? this.inst.t % m.duration : Math.min(this.inst.t, m.duration);
    if (m.actor && this.actor) drawActor(painterFor(f).place(this.x, this.y, this.flip), this.inst.options.actor ?? stockActor(), actorAlphaOf(this.fx.mod, tt, this.inst.options));
    this.inst.draw(f, "front");
    composite(f, this.img.data, this.bgBuf);
    this.ctx.putImageData(this.img, 0, 0);
    this.dirty = false;
  }
}

// ---- tiles
const tiles = [];
const sections = [];
function build() {
  $("#count").textContent = FX.length;
  const main = $("#grid");
  for (const c of categories) {
    const list = FX.filter((f) => f.cat === c.id);
    if (!list.length) continue;
    const grid = el("div", { className: "grid" });
    const title = el("h2", {}), blurb = el("p", {});
    const sec = el("section", { id: c.id }, [el("div", { className: "section-head" }, [title, blurb]), grid]);
    sections.push({ c, sec, list, title, blurb });
    for (const fx of list) {
      const copy = localizeEffect(fx, language);
      const cv = el("canvas", { ariaLabel: copy.name, lang: language === "zh" ? "zh-CN" : "en" });
      const b = fx.mod.act ? actBounds(fx.mod) : null, [fw, fh] = b ? [b.x1 - b.x0, b.y1 - b.y0] : fx.meta.size;
      const name = el("b", { textContent: copy.name });
      const fig = el("figure", { className: isScreen(fx) ? "tile big screen" : fw > 200 || fh > 170 || (b && (fw > 130 || fx.mod.act.target || fx.mod.act.targets)) ? "tile big" : "tile", tabIndex: 0 }, [
        el("div", { className: "stage" }, cv),
        el("figcaption", {}, [name, el("small", { textContent: fx.meta.loop ? msg().loop : `${+fx.meta.duration.toFixed(2)}${language === "zh" ? "秒" : "s"}` })]),
      ]);
      const t = { fx, fig, cv, name, player: null, visible: false, hover: false };
      fig.addEventListener("click", () => openDetail(fx));
      fig.addEventListener("keydown", (e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), openDetail(fx)));
      fig.addEventListener("pointerenter", () => (t.hover = true));
      fig.addEventListener("pointerleave", () => (t.hover = false));
      grid.append(fig);
      tiles.push(t);
    }
    main.append(sec);
  }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const t = tiles.find((x) => x.fig === e.target);
      t.visible = e.isIntersecting;
      if (t.visible && !t.player) {
        t.player = isScreen(t.fx) ? new Player(t.cv, t.fx, 16 / 9, 1) : new Player(t.cv, t.fx, 6 / 5, 1.25);
        if (reduced) t.player.seek(t.fx.meta.duration * 0.4);
      }
    }
  }, { rootMargin: "200px" });
  tiles.forEach((t) => io.observe(t.fig));
}

// ---- filters
const state = { cat: "all", q: "" };
function chips() {
  const box = $("#chips");
  box.replaceChildren();
  const mk = (id, label, n) => {
    const b = el("button", { className: "chip", type: "button" }, [label, el("span", { textContent: n })]);
    b.dataset.cat = id;
    b.setAttribute("aria-pressed", String(id === state.cat));
    b.addEventListener("click", () => setCat(id));
    box.append(b);
  };
  mk("all", msg().all, FX.length);
  for (const s of sections) mk(s.c.id, localizeCategory(s.c, language).name, s.list.length);
}
function setCat(id, fromHash = false) {
  state.cat = sections.some((s) => s.c.id === id) ? id : "all";
  document.querySelectorAll(".chip").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.cat === state.cat)));
  if (!fromHash) {
    const url = new URL(location.href);
    url.hash = state.cat === "all" ? "" : state.cat;
    history.replaceState(null, "", url);
  }
  filter();
  if (!fromHash) window.scrollTo({ top: 0 });
}
function filter() {
  const q = state.q.trim().toLowerCase();
  let shown = 0;
  for (const s of sections) {
    let any = false;
    for (const fx of s.list) {
      const t = tiles.find((x) => x.fx === fx);
      const hit = (state.cat === "all" || state.cat === s.c.id) && (!q || [fx.id, localizeEffect(fx, language).search].join(" ").toLowerCase().includes(q));
      t.fig.hidden = !hit;
      any ||= hit;
      shown += hit;
    }
    s.sec.hidden = !any;
  }
  $("#none").hidden = shown > 0;
}

// ---- detail
let detail = null;
function openDetail(fx) {
  const d = $("#detail");
  const big = $("#big"), screen = isScreen(fx);
  big.parentElement.classList.toggle("screen", screen);
  detail = screen ? new Player(big, fx, 16 / 9, 1) : new Player(big, fx, 16 / 10, 1.6);
  detail.fx = fx;
  detail.opts = {};
  detail.flip = false;
  detail.actor = true;
  detail.speed = 1;
  detail.playing = true;
  detail.setBg(fx.meta.bg);
  sheetInfo = null;
  renderDetailCopy();
  $("#d-sheet").replaceChildren();
  code(fx);
  d.showModal();
  d.scrollTop = 0;
}
let sheetInfo = null;
function renderDetailCopy() {
  if (!detail) return;
  const { fx } = detail, m = fx.meta, locale = msg(), copy = localizeEffect(fx, language);
  $("#d-name").textContent = copy.name;
  $("#d-name").lang = language === "zh" ? "zh-CN" : "en";
  $("#d-desc").textContent = copy.desc;
  $("#d-desc").lang = language === "zh" ? "zh-CN" : "en";
  $("#d-facts").replaceChildren(
    ...[["kind", m.loop ? locale.loop : locale.oneShot], ["length", locale.durationInfo({ duration: +m.duration.toFixed(2), frames: Math.round(m.duration * m.fps) + (m.loop ? 0 : 1), fps: m.fps })], ...(fx.mod.act ? [["acted", actFacts(fx.mod)]] : []), ["canvas", `${m.size[0]} × ${m.size[1]} px`], ["tags", copy.tags.join(", ")]].flatMap(([key, value]) => [el("dt", { textContent: locale[key] }), el("dd", { textContent: value })]),
  );
  $("#d-bg").replaceChildren(...BACKDROPS.concat("none").map((b) => btn(locale.backdrops[b], () => detail.setBg(b), b === detail.bg, "bg")));
  $("#d-speed").replaceChildren(...[0.25, 0.5, 1].map((s) => btn(`${s}×`, () => (detail.speed = s), s === detail.speed, "speed")));
  const pal = $("#d-pal"), selected = pal.value;
  pal.replaceChildren(el("option", { value: "", textContent: locale.ownPalette }), ...Object.keys(PAL).map((key) => el("option", { value: key, textContent: localizeTags([key], language)[0] })));
  pal.value = selected;
  $("#d-actor").hidden = !m.actor;
  $("#d-actor").setAttribute("aria-pressed", String(detail.actor));
  $("#d-flip").setAttribute("aria-pressed", String(detail.flip));
  $("#d-play").setAttribute("aria-pressed", String(detail.playing));
  $("#d-play").textContent = detail.playing ? locale.pause : locale.play;
  if (sheetInfo) {
    sheetInfo.name = copy.name;
    renderSheetInfo();
  }
}
// what the body does around the effect, in a line: the wind-up, the freeze, the recovery
function actFacts(mod) {
  const locale = msg();
  const k = mod.act.poses, lead = Math.max(0, -k[0][0]), end = k[k.length - 1][0] - mod.meta.duration, hits = (mod.act.hits ?? []).filter((h) => h.stop);
  const parts = [];
  if (lead > 0) parts.push(language === "zh" ? `${lead.toFixed(2)} 秒蓄力` : `${lead.toFixed(2)} s ${locale.windup}`);
  if (hits.length) parts.push(language === "zh" ? `${hits.length === 1 ? `${Math.round(hits[0].stop * 1000)} 毫秒定格` : `${hits.length} 次定格`}（${hits[0].t.toFixed(2)} 秒）` : `${hits.length === 1 ? `${Math.round(hits[0].stop * 1000)} ms ${locale.freeze}` : `${hits.length} ${locale.freezes}`} at ${hits[0].t.toFixed(2)} s`);
  if (!mod.meta.loop && end > 0.02) parts.push(language === "zh" ? `${end.toFixed(2)} 秒收招` : `${end.toFixed(2)} s ${locale.recovery}`);
  return parts.join(language === "zh" ? "，" : ", ") || locale.bodyMoves;
}
function btn(label, fn, on, group) {
  const b = el("button", { className: "btn", type: "button", textContent: label });
  b.setAttribute("aria-pressed", String(!!on));
  b.addEventListener("click", () => {
    if (group) b.parentElement.querySelectorAll(".btn").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    fn();
  });
  return b;
}
function code(fx) {
  const v = fx.id.split("/")[1].replace(/-(\w)/g, (_, c) => c.toUpperCase());
  const opts = { x: 160, y: 120, ...(detail.opts.palette ? { palette: "[…]" } : {}), ...(detail.flip ? { flip: true } : {}) };
  const acted = !!fx.mod.act, make = acted ? "createAct" : "createFx";
  $("#d-code").textContent = [
    `import { createFrame, ${make}, composite } from "pixelfx";`,
    `import * as ${v} from "pixelfx/fx/${fx.id}";`,
    ``,
    `const scale = 4;`,
    `const frame = createFrame(320 * scale, 180 * scale, 0, 0, scale);`,
    `const canvas = document.querySelector("canvas");`,
    `const ctx = canvas.getContext("2d");`,
    `const imageData = ctx.createImageData(frame.w, frame.h);`,
    `const fx = ${make}(${v}, ${JSON.stringify(opts).replace(/"\[…\]"/, "[…]").replace(/"(\w+)":/g, "$1: ").replace(/,/g, ", ")});`,
    ``,
    `// every tick`,
    `fx.update(dt);`,
    `fx.draw(frame);          // color + light buffers`,
    `composite(frame, imageData.data, null);`,
    `ctx.putImageData(imageData, 0, 0);`,
    ...(acted ? [``, `// your own character? read the timing: ${v}.act (poses, hits, freezes)`] : []),
  ].join("\n");
  $("#d-src").href = `${REPO}/blob/main/src/fx/${fx.id}.js`;
}
function renderSheetInfo() {
  const image = $("#d-sheet img");
  if (image && sheetInfo) image.alt = msg().sheetAlt(sheetInfo.name, sheetInfo.scale);
  const text = $("#d-sheet p");
  if (text && sheetInfo) text.textContent = msg().sheetInfo(sheetInfo);
}
function sheet() {
  const fx = detail.fx, m = fx.meta, [w, h] = m.size, n = Math.max(1, Math.round(m.duration * m.fps) + (m.loop ? 0 : 1));
  const k = 4;
  const cols = Math.min(n, Math.max(1, Math.ceil(Math.sqrt((n * h) / w)))), rows = Math.ceil(n / cols);
  const cv = el("canvas", { width: cols * w * k, height: rows * h * k }), ctx = cv.getContext("2d");
  const frame = createFrame(w * k, h * k, 0, 0, k), img = ctx.createImageData(frame.w, frame.h);
  const inst = createFx(fx.mod, { x: m.origin[0], y: m.origin[1], ...detail.opts, flip: detail.flip });
  for (let i = 0; i < n; i++) {
    if (i) inst.update(1 / m.fps);
    inst.draw(clearFrame(frame));
    composite(frame, img.data, null);
    ctx.putImageData(img, (i % cols) * w * k, Math.floor(i / cols) * h * k);
  }
  const copy = localizeEffect(fx, language);
  sheetInfo = { name: copy.name, count: n, w, h, scale: k, cols, fps: m.fps, loop: m.loop, id: fx.id };
  const pic = el("img", { src: cv.toDataURL("image/png"), alt: msg().sheetAlt(copy.name, k), width: cols * w * k, height: rows * h * k });
  $("#d-sheet").replaceChildren(pic, el("p", { textContent: msg().sheetInfo(sheetInfo) }));
}
function wireDetail() {
  const d = $("#detail");
  $("#lang-en").addEventListener("click", () => setLanguage("en", true));
  $("#lang-zh").addEventListener("click", () => setLanguage("zh", true));
  $("#d-close").addEventListener("click", () => d.close());
  d.addEventListener("close", () => (detail = null));
  d.addEventListener("click", (e) => e.target === d && d.close());
  $("#d-play").addEventListener("click", (e) => {
    detail.playing = !detail.playing;
    e.target.setAttribute("aria-pressed", String(detail.playing));
    e.target.textContent = detail.playing ? msg().pause : msg().play;
  });
  $("#d-again").addEventListener("click", () => detail.restart());
  $("#d-flip").addEventListener("click", (e) => {
    detail.flip = !detail.flip;
    e.target.setAttribute("aria-pressed", String(detail.flip));
    detail.restart();
    code(detail.fx);
  });
  $("#d-actor").addEventListener("click", (e) => {
    detail.actor = !detail.actor;
    e.target.setAttribute("aria-pressed", String(detail.actor));
    // with an act, the character is the performance: off shows the effect alone, as a sprite sheet has it
    if (detail.fx.mod.act) detail.layout(detail.aspect, detail.pad);
    detail.dirty = true;
  });
  $("#d-seed").addEventListener("click", () => {
    detail.opts.seed = 1 + Math.floor(Math.random() * 9999);
    detail.restart();
  });
  $("#d-pal").addEventListener("change", (e) => {
    if (e.target.value) detail.opts.palette = PAL[e.target.value];
    else delete detail.opts.palette;
    detail.restart();
    code(detail.fx);
  });
  $("#d-make").addEventListener("click", sheet);
  $("#d-copy").addEventListener("click", async (e) => {
    const text = $("#d-code").textContent;
    try {
      await navigator.clipboard.writeText(text);
      e.target.textContent = msg().copied;
    } catch {
      getSelection().selectAllChildren($("#d-code"));
      e.target.textContent = msg().selected;
    }
    setTimeout(() => (e.target.textContent = msg().copy), 1400);
  });
}

function applyLanguage() {
  const locale = msg(), pageLang = language === "zh" ? "zh-CN" : "en";
  document.documentElement.lang = pageLang;
  document.title = locale.title;
  $('meta[name="description"]').content = locale.description;
  $("#tagline").textContent = locale.tagline;
  $(".links").setAttribute("aria-label", language === "zh" ? "站点链接" : "Site links");
  $(".language-switch").setAttribute("aria-label", locale.language);
  $("#lang-en").setAttribute("aria-pressed", String(language === "en"));
  $("#lang-zh").setAttribute("aria-pressed", String(language === "zh"));
  $("#chips").setAttribute("aria-label", locale.categories);
  $("#q").placeholder = locale.search;
  $("#q").setAttribute("aria-label", locale.search);
  $("#none").textContent = locale.noResults;
  $("#link-github").textContent = locale.github;
  $("#link-skill").textContent = locale.skill;
  $("#d-pal").setAttribute("aria-label", locale.palette);
  document.querySelectorAll("[data-i18n]").forEach((node) => { node.textContent = locale[node.dataset.i18n]; });
  for (const section of sections) {
    const copy = localizeCategory(section.c, language);
    section.title.textContent = language === "zh" ? copy.name : `${copy.name}.`;
    section.blurb.textContent = copy.blurb;
  }
  chips();
  setCat(state.cat, true);
  for (const tile of tiles) {
    const copy = localizeEffect(tile.fx, language);
    tile.name.textContent = copy.name;
    tile.cv.setAttribute("aria-label", copy.name);
    tile.cv.lang = pageLang;
    tile.fig.lang = pageLang;
    const length = tile.fig.querySelector("small");
    length.textContent = tile.fx.meta.loop ? locale.loop : `${+tile.fx.meta.duration.toFixed(2)}${language === "zh" ? "秒" : "s"}`;
  }
  filter();
  renderDetailCopy();
}

function setLanguage(next, updateUrl = false) {
  language = next === "zh" ? "zh" : "en";
  try { localStorage.setItem("pixelfx.language", language); } catch {}
  if (updateUrl) history.replaceState(null, "", urlWithLanguage(location.href, language));
  applyLanguage();
}

// ---- the clock
let last = performance.now();
function frameLoop(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (detail) detail.tick(dt);
  else for (const t of tiles) if (t.visible && t.player && !t.fig.hidden && (!reduced || t.hover)) t.player.tick(dt);
  requestAnimationFrame(frameLoop);
}

build();
wireDetail();
$("#q").addEventListener("input", (e) => {
  state.q = e.target.value;
  filter();
});
setCat(location.hash.slice(1) || "all", true);
addEventListener("hashchange", () => setCat(location.hash.slice(1) || "all", true));
applyLanguage();
requestAnimationFrame(frameLoop);
