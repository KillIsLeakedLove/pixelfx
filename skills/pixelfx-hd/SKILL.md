---
name: pixelfx-hd
description: Build, use and export pixelfx effects in a smooth high-definition 2D style. Use for game VFX, sprite sheets, visual cleanup, or adapting the library in Godot, Unity, Phaser and canvas games.
license: MIT
compatibility: Node 18 or newer; ffmpeg is optional for GIF and MP4 previews.
---

# pixelfx HD

Use this skill with a pixelfx checkout. Start with `README.md` for integration and `docs/AUTHORING.md` before adding
or changing effects. The effect library keeps its public IDs, timing and logical coordinate system while rendering
continuous alpha coverage into higher-resolution frames.

## Render and integrate

- `node tools/render.mjs <id> --sheet` writes a transparent 4x PNG and Aseprite-style JSON by default.
- `node tools/render.mjs <id> --sheet --scale 1` writes a sheet at logical size; `node tools/sheets.mjs --scale 1` does the same for the whole library.
- Read `meta.pixelfx.scale`, `frameSize`, `logicalFrameSize`, `pivot` and `logicalPivot` from the JSON. Use the physical pivot and frame size when importing the PNG.
- Use linear filtering and a lossless RGBA texture. Do not set pixelated/nearest filtering or re-quantize the PNG.
- For live canvas rendering, choose a backing scale (normally 2x to 4x), allocate `createFrame(w * scale, h * scale, 0, 0, scale)`, and allocate `ImageData(frame.w, frame.h)`. Coordinates, options, timing and effect IDs remain logical.

## Art direction

- Favor smooth contours, continuous alpha, broad clean forms and a clear focal point.
- Do not add Bayer dithering, stipple, decorative grain or isolated noise to imitate texture. Keep particles when they communicate material, motion or impact; reduce purely decorative speckle.
- Preserve named motifs and authored choreography such as sparks, shards, rain, snow, embers, debris and pixel-dissolve blocks. Improve their rendering without changing their meaning or timing.
- Keep gradients and palette ramps controlled. Smooth edges do not require a soft or blurry image; reserve broad blur for emitted light, smoke and vapor.
- Keep tests and docs consistent when changing shared drawing behavior. Run `npm test`, `npm run check`, and render representative static and animated effects before finishing.

## Compatibility

Keep each effect's ID, logical `meta.size`, `meta.origin`, duration, loop behavior, fps and act timing stable unless the request explicitly asks to change them. New renderer fields must remain optional at scale 1. When changing an export format, retain both logical and physical dimensions and pivots in metadata.
