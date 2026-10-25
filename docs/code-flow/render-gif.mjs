/**
 * Renders docs/code-flow/code-flow.html into an animated GIF (plus an MP4
 * and one GIF per flow) by stepping the canvas animation frame by frame —
 * so the output is perfectly smooth regardless of machine speed.
 *
 *   node docs/code-flow/render-gif.mjs            # 12 fps, 1024px wide
 *   FPS=15 WIDTH=1280 node docs/code-flow/render-gif.mjs
 *
 * Requires: Playwright's Chromium (`npx playwright install chromium`) and ffmpeg on PATH.
 */
import { chromium } from 'playwright';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const FPS = Number(process.env.FPS ?? 12);
const WIDTH = Number(process.env.WIDTH ?? 1024);
const framesDir = path.join(dir, '.frames');
const outDir = path.join(dir, 'output');

await rm(framesDir, { recursive: true, force: true });
await mkdir(framesDir, { recursive: true });
await mkdir(outDir, { recursive: true });

// Prefer the locally installed Google Chrome; fall back to Playwright's bundled Chromium.
const browser = await chromium.launch({ channel: 'chrome' }).catch(() => chromium.launch());
const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 1 });
await page.addInitScript(() => { window.__CAPTURE = true; });
await page.goto(pathToFileURL(path.join(dir, 'code-flow.html')).href, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);

const total = await page.evaluate(() => window.TOTAL);
const scenes = await page.evaluate(() => window.SCENES);
const count = Math.ceil(total * FPS);
console.log(`Rendering ${count} frames (${total.toFixed(1)}s @ ${FPS}fps)…`);

for (let i = 0; i < count; i++) {
  const dataUrl = await page.evaluate((t) => {
    window.renderAt(t);
    return document.getElementById('stage').toDataURL('image/png');
  }, i / FPS);
  await writeFile(path.join(framesDir, `f_${String(i).padStart(5, '0')}.png`), Buffer.from(dataUrl.split(',')[1], 'base64'));
  if (i % 100 === 0) console.log(`  frame ${i}/${count}`);
}
await browser.close();

const input = ['-framerate', String(FPS), '-i', path.join(framesDir, 'f_%05d.png')];
const gifFilter = (w) =>
  `scale=${w}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=256:stats_mode=full[p];[b][p]paletteuse=dither=sierra2_4a:diff_mode=rectangle`;
const ff = (args) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...args], { stdio: 'inherit' });

console.log('Encoding full tour GIF…');
ff([...input, '-vf', gifFilter(WIDTH), '-loop', '0', path.join(outDir, 'code-flow.gif')]);

console.log('Encoding MP4…');
ff([...input, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-movflags', '+faststart', path.join(outDir, 'code-flow.mp4')]);

console.log('Encoding per-flow GIFs…');
for (const s of scenes) {
  if (s.name === 'intro' || s.name === 'outro') continue;
  ff([
    ...input,
    '-ss', s.start.toFixed(3), '-t', s.dur.toFixed(3),
    '-vf', gifFilter(WIDTH), '-loop', '0',
    path.join(outDir, `flow-${s.name}.gif`),
  ]);
}

await rm(framesDir, { recursive: true, force: true });
console.log(`Done → ${path.relative(process.cwd(), outDir)}/`);
