<p align="right"><a href="README.md">English</a> · <a href="README.zh-CN.md">简体中文</a> · <a href="https://patch-gg.github.io/pixelfx/?lang=en">Gallery EN</a> · <a href="https://patch-gg.github.io/pixelfx/?lang=zh">Gallery 中文</a></p>

# pixelfx.

**244 个高清 2D 特效与动画，每个都是一段小小的代码。** 涵盖火焰、爆炸、魔法、天气、界面、拾取物、生物等类别。可在网页中实时预览、修改配色与朝向，也可导出适用于任意引擎的 4 倍精灵图集。

特效以代码绘制，采用连续透明度与高分辨率帧缓冲，边缘平滑。包含角色的效果还有完整动作：预备、出手、命中定格与收招；目标也会响应攻击。

**[打开 Gallery（中文）](https://patch-gg.github.io/pixelfx/?lang=zh)** · [English Gallery](https://patch-gg.github.io/pixelfx/?lang=en) · [特效目录](docs/CATALOG.md) · [效果编写指南](docs/AUTHORING.md) · [项目技能](skills/pixelfx-hd/SKILL.md)

## 在游戏中使用

浏览器游戏（Canvas、Phaser、PixiJS、Kaplay、three.js）可直接调用，无额外运行时依赖：

```js
import { createFrame, clearFrame, createFx, composite } from "pixelfx";
import * as frostNova from "pixelfx/fx/ice/frost-nova";

const scale = 4;
const frame = createFrame(320 * scale, 180 * scale, 0, 0, scale);
const image = new ImageData(frame.w, frame.h);
const fx = createFx(frostNova, { x: 160, y: 140 });

function tick(dt) {
  fx.update(dt);
  clearFrame(frame);
  fx.draw(frame);
  composite(frame, image.data, null);
  ctx.putImageData(image, 0, 0);
}
```

Godot、Unity、GameMaker、Defold、LÖVE 与 Bevy 等引擎可使用图集：

```bash
node tools/render.mjs ice/frost-nova --sheet
```

默认导出透明 PNG 与 Aseprite 风格 JSON，图集为 4 倍分辨率；使用 `--scale 1` 可导出逻辑尺寸。所有效果 ID、逻辑坐标、时序与动作数据保持稳定。

## 创建特效

```bash
node tools/new.mjs arcane/my-spell
node tools/render.mjs arcane/my-spell
node tools/check.mjs arcane/my-spell
```

先查看联系表，再修复最明显的问题并重新渲染。动画可用 `--gif` 或 `--mp4` 预览；角色动作可用 `node tools/act.mjs <id>` 查看。完整绘制 API 与质量要求见 [docs/AUTHORING.md](docs/AUTHORING.md)。

安装项目 skill：将 `skills/pixelfx-hd` 复制到 `%USERPROFILE%\.agents\skills\pixelfx-hd`（Windows）或 `~/.agents/skills/pixelfx-hd`（macOS/Linux）。

## 安全规则

本仓库公开可见。禁止提交或推送任何真实密钥、令牌、私钥、证书或其他敏感数据。使用环境变量或被 Git 忽略的本地配置，并在提交前运行 `npm run check:secrets`。GitHub Actions 会扫描提交历史中的密钥。

## 许可

MIT。详见 [LICENSE](LICENSE) 与 [NOTICE.md](NOTICE.md)。
