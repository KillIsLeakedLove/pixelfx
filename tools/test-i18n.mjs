#!/usr/bin/env node
import assert from "node:assert/strict";
import { categories, effects } from "../src/fx/index.js";
import { effectsZh } from "../gallery/effects-zh.js";
import { categoriesZh, localizeCategory, localizeEffect, localizeTags, resolveLanguage, ui, urlWithLanguage } from "../gallery/i18n.js";

assert.equal(resolveLanguage("?lang=zh", "en", "en-US"), "zh", "URL language takes precedence");
assert.equal(resolveLanguage("", "zh", "en-US"), "zh", "stored language is retained");
assert.equal(resolveLanguage("", "", "zh-CN"), "zh", "Chinese browser language is detected");
assert.equal(resolveLanguage("?lang=fr", "", "en-US"), "en", "unsupported languages fall back to English");
assert.equal(urlWithLanguage("https://example.github.io/pixelfx/?q=fire#weather", "zh").href, "https://example.github.io/pixelfx/?q=fire&lang=zh#weather", "language URL keeps static Pages path, query and category hash");
assert.deepEqual(Object.keys(ui.en).sort(), Object.keys(ui.zh).sort(), "English and Chinese UI dictionaries have the same keys");
assert.deepEqual(categories.map((category) => category.id).sort(), Object.keys(categoriesZh).sort(), "every category has a Chinese translation");
assert.deepEqual(Object.keys(effects).sort(), Object.keys(effectsZh).sort(), "every effect has a Chinese translation");
for (const [id, translation] of Object.entries(effectsZh)) {
  assert.ok(translation.name && translation.desc, `${id} has a Chinese name and description`);
}
assert.equal(localizeCategory(categories.find((category) => category.id === "weather"), "zh").name, "天气");
assert.equal(localizeTags(["fire", "loop"], "zh").join("/"), "火焰/循环");
const sample = { id: "test/example", name: "Example", meta: { desc: "An example effect.", tags: ["fire"] } };
assert.equal(localizeEffect(sample, "en").name, "Example");
assert.equal(localizeEffect(sample, "zh").desc, sample.meta.desc, "untranslated metadata keeps its source text rather than disappearing");

console.log("Bilingual locale checks passed");
