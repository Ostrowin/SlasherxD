/**
 * Wypalanie grafiki: art/svg/*.svg → public/art/atlas.png + public/art/atlas.json (Phaser JSON hash).
 * Odpowiednik tools/bake_art.gd z TowerDefense (grafika.md p. 5). Gra czyta tylko wyniki — SVG to źródła.
 *
 *   npm run bake-art
 *
 * Atrybuty korzenia <svg> (opcjonalne):
 *   data-anchor="x y"        — punkt stóp w jednostkach SVG (domyślnie środek dołu) → `anchor` klatki (pivot)
 *   data-scale="s"           — rozdzielczość wypalenia (piksele atlasu na jednostkę SVG, domyślnie 0.75)
 *   data-grime="g"           — siła brudu 0..1 (domyślnie 1)
 *   data-glow="x y r; ..."   — punkty neonu (gra dokłada poświatę) → `glow` klatki, w px względem stóp
 *
 * Kolor drużyny: wypełnienia w odcieniach magenty #RR00RR. Z nich powstaje druga klatka `<nazwa>#team`
 * (szara, jasność = RR), którą gra barwi `setTint`. W klatce bazowej magenta staje się szarością #RRRRRR.
 *
 * Brud jak w TD: plamy z szumu i błoto od dołu sylwetki; niskie nasycenie = metal (ziarno, rysy),
 * wysokie = sierść/tkanina (włos); odpryski krawędzi. Tylko wewnątrz alfy sprite'a.
 */
import { Resvg } from '@resvg/resvg-js';
import { PNG } from 'pngjs';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const SRC = 'art/svg';
const OUT = 'public/art';
const ATLAS_W = 1024;
const PAD = 4;
const TEAM_RE = /#([0-9a-fA-F]{2})00\1(?![0-9a-fA-F])/g;

interface Layer {
  w: number;
  h: number;
  /** RGBA, alfa prosta (nie premultiplied), 0..255. */
  px: Uint8ClampedArray;
}

interface Baked {
  name: string;
  base: Layer;
  team: Layer | null;
  anchor: [number, number];
  glow: [number, number, number][];
}

// ---------------------------------------------------------------- szum (fBm na szumie wartości)

function hash2(seed: number, x: number, y: number): number {
  let h = (seed ^ Math.imul(x, 374761393) ^ Math.imul(y, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}

function valueNoise(seed: number, x: number, y: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = x - xi;
  const fy = y - yi;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = hash2(seed, xi, yi);
  const b = hash2(seed, xi + 1, yi);
  const c = hash2(seed, xi, yi + 1);
  const d = hash2(seed, xi + 1, yi + 1);
  return (a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy) * 2 - 1;
}

/** fBm w zakresie ~[-1, 1], jak FastNoiseLite w Godocie. */
function fbm(seed: number, freq: number, octaves: number, x: number, y: number): number {
  let sum = 0;
  let amp = 1;
  let norm = 0;
  let f = freq;
  for (let o = 0; o < octaves; o++) {
    sum += valueNoise(seed + o * 131, x * f, y * f) * amp;
    norm += amp;
    amp *= 0.5;
    f *= 2;
  }
  return sum / norm;
}

function strHash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function mulberry(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------- brud (port klasy Grime z bake_art.gd)

class Grime {
  private readonly k: number;
  private readonly seed: number;
  readonly strength: number;
  top = 0;
  bottom = 0;

  // bez skróconych pól w konstruktorze — node uruchamia ten plik przez samo wycięcie typów
  constructor(seed: number, scale: number, strength: number) {
    this.seed = seed;
    this.k = 1 / scale;
    this.strength = strength;
  }

  /** Mnożnik brudu w punkcie (plamy + błoto od dołu). */
  dirt(x: number, y: number): number {
    const b = fbm(this.seed, 0.045, 3, x * this.k, y * this.k) * 0.5 + 0.5;
    let d = clamp((b - 0.45) * 1.4, 0, 0.45);
    const down = clamp((y - this.top) / Math.max(1, this.bottom - this.top), 0, 1);
    d += clamp((down - 0.75) * 2, 0, 0.5) * (0.6 + 0.4 * b);
    return d * this.strength;
  }

  apply(px: Uint8ClampedArray, i: number, x: number, y: number, cloth = false): void {
    let r = px[i] / 255;
    let g = px[i + 1] / 255;
    let b = px[i + 2] / 255;
    const [s, v] = satVal(r, g, b);
    const d = this.dirt(x, y);
    r = lerp(r, r * 0.53, d);
    g = lerp(g, g * 0.4, d);
    b = lerp(b, b * 0.26, d);
    let f: number;
    if (!cloth && s < 0.28 && v > 0.12) {
      // metal/kamień: drobne ziarno
      f = fbm(this.seed + 1, 0.5, 1, x * this.k, y * this.k) * this.strength;
      f = f > 0 ? f * 0.06 : f * 0.08;
    } else {
      // sierść/tkanina: włos wydłużony w pionie
      f = fbm(this.seed + 2, 0.3, 2, x * this.k * 1.8, y * this.k * 0.45) * this.strength;
      f = f > 0 ? f * 0.12 : f * 0.18;
    }
    [r, g, b] = shade(r, g, b, f);
    px[i] = r * 255;
    px[i + 1] = g * 255;
    px[i + 2] = b * 255;
  }

  /** Odprysk krawędzi: czy piksel na krawędzi sylwetki wykruszyć. */
  chip(x: number, y: number): boolean {
    return this.strength > 0.3 && fbm(this.seed, 0.18, 3, x * this.k, y * this.k) > 0.4;
  }
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

function satVal(r: number, g: number, b: number): [number, number] {
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  return [mx > 0 ? (mx - mn) / mx : 0, mx];
}

/** Dodatnie = rozjaśnij (Color.lightened), ujemne = przyciemnij (Color.darkened). */
function shade(r: number, g: number, b: number, f: number): [number, number, number] {
  if (f > 0) return [r + (1 - r) * f, g + (1 - g) * f, b + (1 - b) * f];
  return [r * (1 + f), g * (1 + f), b * (1 + f)];
}

// ---------------------------------------------------------------- rasteryzacja

function attr(svg: string, name: string): string | null {
  const head = svg.slice(0, svg.indexOf('>'));
  const m = new RegExp(`${name}="([^"]*)"`).exec(head);
  return m ? m[1] : null;
}

function render(svg: string, scale: number): Layer {
  const img = new Resvg(svg, { fitTo: { mode: 'zoom', value: scale } }).render();
  const px = new Uint8ClampedArray(img.pixels);
  // resvg zwraca alfę premultiplied — odwracamy, bo brud liczy na prawdziwych kolorach
  for (let i = 0; i < px.length; i += 4) {
    const a = px[i + 3];
    if (a > 0 && a < 255) {
      px[i] = (px[i] * 255) / a;
      px[i + 1] = (px[i + 1] * 255) / a;
      px[i + 2] = (px[i + 2] * 255) / a;
    }
  }
  return { w: img.width, h: img.height, px };
}

function bake(name: string, svg: string): Baked {
  const scale = parseFloat(attr(svg, 'data-scale') ?? '0.75');
  const grimeS = parseFloat(attr(svg, 'data-grime') ?? '1');
  const vb = (attr(svg, 'viewBox') ?? '0 0 128 128').split(/\s+/).map(Number);
  const anchorV = (attr(svg, 'data-anchor') ?? `${vb[2] / 2} ${vb[3] - 4}`).split(/\s+/).map(Number);
  const glowV = (attr(svg, 'data-glow') ?? '')
    .split(';')
    .map((s) => s.trim().split(/\s+/).map(Number))
    .filter((a) => a.length === 3);

  let base: Layer;
  let team: Layer | null = null;
  if (svg.search(TEAM_RE) >= 0) {
    // Trzy przebiegi jak w TD: czarny/biały dają pokrycie magenty, szary (#RRRRRR) jej jasność.
    const black = render(svg.replace(TEAM_RE, '#000000'), scale);
    const white = render(svg.replace(TEAM_RE, '#ffffff'), scale);
    base = render(svg.replace(TEAM_RE, '#$1$1$1'), scale);
    team = { w: base.w, h: base.h, px: new Uint8ClampedArray(base.px.length) };
    for (let i = 0; i < base.px.length; i += 4) {
      const cov = clamp((white.px[i] - black.px[i]) / 255, 0, 1);
      if (cov < 0.02) continue;
      const v = clamp((base.px[i] - black.px[i]) / 255 / cov, 0, 1) * 255;
      team.px[i] = team.px[i + 1] = team.px[i + 2] = v;
      team.px[i + 3] = cov * white.px[i + 3];
    }
  } else {
    base = render(svg, scale);
  }

  const { w, h } = base;
  const g = new Grime(strHash(name), scale, grimeS);
  g.top = h;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (base.px[(y * w + x) * 4 + 3] > 127) {
        g.top = Math.min(g.top, y);
        g.bottom = Math.max(g.bottom, y);
      }

  const dirty = new Uint8ClampedArray(base.px);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (dirty[i + 3] > 5) g.apply(dirty, i, x, y);
      if (team && team.px[i + 3] > 0) g.apply(team.px, i, x, y, true);
    }

  // rysy na metalu
  const rng = mulberry(strHash(name));
  if (grimeS > 0.3) {
    const n = Math.floor(((w * h) / 300) * grimeS);
    for (let s = 0; s < n; s++) {
      const px = rng() * w;
      const py = rng() * h;
      const ang = (rng() - 0.5) * 1.2 + (rng() < 0.5 ? Math.PI : 0);
      const len = (2 + rng() * 5) * scale * 1.5;
      for (let t = 0; t < len; t++) {
        const qx = Math.floor(px + Math.cos(ang) * t);
        const qy = Math.floor(py + Math.sin(ang) * t);
        scratch(base, dirty, qx, qy, 0.25);
        scratch(base, dirty, qx, qy + 1, -0.22);
      }
    }
  }

  // odpryski krawędzi
  const alpha = (x: number, y: number): number => base.px[(y * w + x) * 4 + 3];
  for (let y = 1; y < h - 1; y++)
    for (let x = 1; x < w - 1; x++) {
      if (alpha(x, y) < 128) continue;
      const edge = alpha(x - 1, y) < 128 || alpha(x + 1, y) < 128 || alpha(x, y - 1) < 128 || alpha(x, y + 1) < 128;
      if (edge && g.chip(x, y)) {
        const i = (y * w + x) * 4;
        dirty[i + 3] = 0;
        if (team) team.px[i + 3] = 0;
      }
    }

  // przycięcie pustych brzegów (wspólne dla obu warstw — ta sama kotwica)
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4 + 3;
      if (dirty[i] > 0 || (team && team.px[i] > 0)) {
        x0 = Math.min(x0, x); y0 = Math.min(y0, y);
        x1 = Math.max(x1, x); y1 = Math.max(y1, y);
      }
    }
  const crop = (px: Uint8ClampedArray): Layer => {
    const cw = x1 - x0 + 1;
    const ch = y1 - y0 + 1;
    const out = new Uint8ClampedArray(cw * ch * 4);
    for (let y = 0; y < ch; y++) out.set(px.subarray(((y + y0) * w + x0) * 4, ((y + y0) * w + x1 + 1) * 4), y * cw * 4);
    return { w: cw, h: ch, px: out };
  };
  const ax = anchorV[0] * scale - x0;
  const ay = anchorV[1] * scale - y0;
  return {
    name,
    base: crop(dirty),
    team: team ? crop(team.px) : null,
    anchor: [ax, ay],
    glow: glowV.map(([gx, gy, gr]) => [gx * scale - x0 - ax, gy * scale - y0 - ay, gr * scale]),
  };
}

function scratch(src: Layer, out: Uint8ClampedArray, x: number, y: number, amount: number): void {
  if (x < 0 || y < 0 || x >= src.w || y >= src.h) return;
  const i = (y * src.w + x) * 4;
  if (src.px[i + 3] < 230) return;
  const [s, v] = satVal(src.px[i] / 255, src.px[i + 1] / 255, src.px[i + 2] / 255);
  if (s >= 0.28 || v < 0.12) return;
  const [r, g, b] = shade(out[i] / 255, out[i + 1] / 255, out[i + 2] / 255, amount);
  out[i] = r * 255;
  out[i + 1] = g * 255;
  out[i + 2] = b * 255;
}

// ---------------------------------------------------------------- atlas

function main(): void {
  const files = readdirSync(SRC).filter((f) => f.endsWith('.svg')).sort();
  const items = files.map((f) => bake(basename(f, '.svg'), readFileSync(join(SRC, f), 'utf-8')));

  // Pakowanie półkowe (od najwyższych).
  const rects: { key: string; layer: Layer; item: Baked; x: number; y: number }[] = [];
  for (const it of items) {
    rects.push({ key: it.name, layer: it.base, item: it, x: 0, y: 0 });
    if (it.team) rects.push({ key: `${it.name}#team`, layer: it.team, item: it, x: 0, y: 0 });
  }
  rects.sort((a, b) => b.layer.h - a.layer.h);
  let x = PAD;
  let y = PAD;
  let shelf = 0;
  for (const r of rects) {
    if (x + r.layer.w + PAD > ATLAS_W) {
      x = PAD;
      y += shelf + PAD * 2;
      shelf = 0;
    }
    r.x = x;
    r.y = y;
    x += r.layer.w + PAD * 2;
    shelf = Math.max(shelf, r.layer.h);
  }
  let height = 64;
  while (height < y + shelf + PAD) height *= 2;

  const png = new PNG({ width: ATLAS_W, height });
  const frames: Record<string, unknown> = {};
  for (const r of rects) {
    const { w, h, px } = r.layer;
    for (let row = 0; row < h; row++)
      png.data.set(px.subarray(row * w * 4, (row + 1) * w * 4), ((r.y + row) * ATLAS_W + r.x) * 4);
    frames[r.key] = {
      frame: { x: r.x, y: r.y, w, h },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w, h },
      sourceSize: { w, h },
      anchor: { x: r.item.anchor[0] / w, y: r.item.anchor[1] / h },
      glow: r.item.glow.map((a) => a.map((v) => Math.round(v * 10) / 10)),
    };
  }

  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, 'atlas.png'), PNG.sync.write(png));
  writeFileSync(
    join(OUT, 'atlas.json'),
    JSON.stringify({ frames, meta: { app: 'tools/bakeArt.ts', image: 'atlas.png', size: { w: ATLAS_W, h: height }, scale: 1 } }, null, 1),
  );
  console.log(`bakeArt: ${items.length} sprite'ów, atlas ${ATLAS_W}×${height}`);
}

main();
