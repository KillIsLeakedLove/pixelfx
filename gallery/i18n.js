import { effectsZh } from "./effects-zh.js";

export const ui = {
  en: {
    title: "pixelfx | HD 2D effects",
    description: "Smooth, high-definition 2D effects and animation, drawn in code. Play, recolor and export sprite sheets.",
    tagline: "smooth HD effects, every one a small piece of code.",
    language: "Language",
    github: "github",
    skill: "pixelfx skill",
    categories: "Categories",
    search: "search effects",
    noResults: "Nothing matches that. Try fire, slash or loop.",
    close: "close",
    play: "play",
    pause: "pause",
    again: "again",
    backdrop: "backdrop",
    palette: "palette",
    ownPalette: "effect palette",
    newSeed: "new seed",
    show: "show",
    mirror: "mirror",
    character: "character",
    spriteSheet: "sprite sheet",
    useIt: "use it",
    source: "source",
    copy: "copy",
    copied: "copied",
    selected: "selected",
    kind: "kind",
    length: "length",
    acted: "performance",
    canvas: "canvas",
    tags: "tags",
    loop: "loop",
    oneShot: "one-shot",
    windup: "wind-up",
    freeze: "freeze",
    freezes: "freezes",
    recovery: "recovery",
    bodyMoves: "the body moves with it",
    all: "all",
    backdrops: { dark: "dark", ground: "ground", sky: "sky", light: "light", black: "black", none: "none" },
    sheetAlt: (name, scale) => `${name} sprite sheet at ${scale}x resolution`,
    sheetInfo: ({ count, w, h, scale, cols, fps, loop, id }) => `${count} frames at ${w} × ${h} logical px, exported at ${scale}x HD resolution, ${cols} across, ${fps} fps, ${loop ? "loops" : "plays once"}. Save the image, or run: node tools/render.mjs ${id} --sheet`,
    durationInfo: ({ duration, frames, fps }) => `${duration} s, ${frames} frames at ${fps} fps`,
  },
  zh: {
    title: "pixelfx | 高清 2D 特效",
    description: "以代码绘制的高清 2D 特效与动画。可预览、换色并导出精灵图集。",
    tagline: "每个高清特效，都是一段小小的代码。",
    language: "语言",
    github: "GitHub",
    skill: "pixelfx 技能",
    categories: "分类",
    search: "搜索特效",
    noResults: "没有匹配结果。试试火焰、斩击或循环。",
    close: "关闭",
    play: "播放",
    pause: "暂停",
    again: "重播",
    backdrop: "背景",
    palette: "调色板",
    ownPalette: "特效默认配色",
    newSeed: "新随机种子",
    show: "显示",
    mirror: "镜像",
    character: "角色",
    spriteSheet: "精灵图集",
    useIt: "使用示例",
    source: "源码",
    copy: "复制",
    copied: "已复制",
    selected: "已选中",
    kind: "类型",
    length: "时长",
    acted: "动作表现",
    canvas: "画布",
    tags: "标签",
    loop: "循环",
    oneShot: "单次播放",
    windup: "蓄力",
    freeze: "定格",
    freezes: "次定格",
    recovery: "收招",
    bodyMoves: "角色随特效一起动作",
    all: "全部",
    backdrops: { dark: "暗色", ground: "地面", sky: "夜空", light: "浅色", black: "纯黑", none: "无" },
    sheetAlt: (name, scale) => `${name}精灵图集，${scale} 倍分辨率`,
    sheetInfo: ({ count, w, h, scale, cols, fps, loop, id }) => `${count} 帧，逻辑尺寸 ${w} × ${h} 像素，以 ${scale} 倍高清导出，每行 ${cols} 帧，${fps} 帧/秒，${loop ? "循环播放" : "单次播放"}。可保存图片，或运行：node tools/render.mjs ${id} --sheet`,
    durationInfo: ({ duration, frames, fps }) => `${duration} 秒，${frames} 帧，${fps} 帧/秒`,
  },
};

export const categoriesZh = {
  moves: ["招式", "从蓄力到收招的完整攻击，由下方特效串联而成"],
  fire: ["火焰", "火把、吐息、火柱与火墙"],
  explosions: ["爆炸", "爆破、烟雾、烟花与蘑菇云"],
  water: ["水效", "水花、瀑布、喷泉与波浪"],
  ice: ["冰霜", "冰刺、冰环、冻结与碎裂"],
  lightning: ["雷电", "雷击、电弧、线圈与风暴"],
  scifi: ["科幻", "全息影像、护盾、扫描与跃迁"],
  melee: ["近战", "斩击、残影、重劈与连招"],
  impacts: ["命中", "打击火花、冲击波与落地效果"],
  projectiles: ["投射物", "子弹、火箭、激光与箭矢"],
  spawn: ["登场与消散", "烟尘、传送门、灵魂与碎裂"],
  arcane: ["奥术", "传送门、符文、魔弹与光束"],
  holy: ["神圣", "治疗、光环与光柱"],
  shadow: ["暗影", "诅咒、虚空、触须与灵魂"],
  status: ["状态", "燃烧、冻结、中毒与昏睡"],
  nature: ["自然", "毒雾、藤蔓、荆棘与地震"],
  weather: ["天气", "雨雪、雾气与极光"],
  ui: ["界面", "升级提示、数字、通知与倒计时"],
  pickups: ["拾取物", "金币、宝石、宝箱与药水"],
  transitions: ["转场", "遮罩、光圈与溶解"],
  critters: ["生物", "史莱姆、蝙蝠、幽灵与青蛙"],
};

const tagsZh = {
  ambient: "环境", arcane: "奥术", attack: "攻击", beam: "光束", blast: "爆破", blood: "血液", cold: "寒冷", combo: "连招", fire: "火焰", flame: "火焰", frost: "冰霜", holy: "神圣", ice: "冰", impact: "命中", lightning: "雷电", loop: "循环", magic: "魔法", melee: "近战", nature: "自然", night: "夜晚", projectile: "投射物", rain: "雨", shadow: "暗影", snow: "雪", spell: "法术", status: "状态", water: "水", weather: "天气", wind: "风", ui: "界面", pickup: "拾取", explosion: "爆炸", smoke: "烟雾", spark: "火花", healing: "治疗", poison: "中毒", fireball: "火球", death: "消散", spawn: "登场", transition: "转场", "sci-fi": "科幻", scifi: "科幻", slash: "斩击", sword: "剑", arrow: "箭矢", speed: "速度", hit: "命中", energy: "能量", star: "星辰", stars: "星辰", stone: "岩石", ground: "地面", flight: "飞行", light: "光", glow: "发光", looped: "循环", "one-shot": "单次播放",
};

export function localizeCategory(category, language) {
  const translated = language === "zh" && categoriesZh[category.id];
  return translated ? { name: translated[0], blurb: translated[1] } : category;
}

export function localizeTags(tags, language) {
  if (language !== "zh") return tags;
  return tags.map((tag) => tagsZh[tag.toLowerCase()] ?? tag);
}

export function localizeEffect(effect, language) {
  const translated = language === "zh" ? effectsZh[effect.id] : null;
  return {
    name: translated?.name ?? effect.name,
    desc: translated?.desc ?? effect.meta.desc,
    tags: localizeTags(effect.meta.tags, language),
    search: [effect.name, effect.meta.desc, ...(translated ? [translated.name, translated.desc] : []), ...effect.meta.tags, ...(translated?.tags ?? [])].join(" "),
  };
}

export function resolveLanguage(search = "", stored = "", browser = "") {
  const requested = new URLSearchParams(search).get("lang") || stored || browser;
  return String(requested).toLowerCase().startsWith("zh") ? "zh" : "en";
}

export function urlWithLanguage(href, language) {
  const url = new URL(href);
  url.searchParams.set("lang", language === "zh" ? "zh" : "en");
  return url;
}
