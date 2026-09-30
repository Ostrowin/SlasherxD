/**
 * Wypalanie grafiki: art/svg/*.svg → public/art/<atlas>.png + <atlas>.json (Phaser JSON hash).
 * Odpowiednik tools/bake_art.gd z TowerDefense (grafika.md p. 5). Gra czyta tylko wyniki — SVG to źródła.
 *
 *   npm run bake-art              — wypala atlasy z manifestu (src/render/artManifest.ts)
 *   npm run bake-art -- --sheet   — to samo + karta kontrolna art/sheet.png (też art/preview/*.svg)
 *   node tools/bakeArt.ts --selftest   — autotest rasteryzacji i maski drużyny (część `npm test`)
 *
 * Każdy SVG musi mieć wpis w `SPRITES` manifestu: stamtąd atlas (a więc skala wypalenia) i flaga obwódki.
 *
 * Atrybuty korzenia <svg> (opcjonalne):
 *   data-anchor="x y"        — punkt stóp w jednostkach SVG (domyślnie środek dołu) → `anchor` klatki (pivot)
 *   data-grime="g"           — siła brudu 0..1 (domyślnie 1)
 *   data-glow="x y r; ..."   — punkty neonu (gra dokłada poświatę) → `glow` klatki, w px względem stóp
 *
 * Kolor drużyny: wypełnienia w odcieniach magenty #RR00RR. Z nich powstaje druga klatka `<nazwa>#team`
 * (szara, jasność = RR), którą gra barwi `setTint`. W klatce bazowej magenta staje się szarością #RRRRRR.
 * Obwódka: klatka `<nazwa>#rim` (biała, gra barwi kolorem gracza) — tylko po ZEWNĘTRZNEJ stronie sylwetki,
 * więc dziury z wyszczerbień (maski `grit.chipped`) zostają dziurami.
 *
 * Brud jak w TD: plamy z szumu i błoto od dołu sylwetki; niskie nasycenie = metal (ziarno, rysy),
 * wysokie = sierść/tkanina (włos); odpryski krawędzi. Tylko wewnątrz alfy sprite'a.
 */
import { Resvg } from '@resvg/resvg-js';
import { PNG } from 'pngjs';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import {
  ATLASES,
  PLAYER_COLORS,
  RIM_SCREEN_PX,
  SCREEN_PX_PER_UNIT,
  SPRITES,
  type AtlasDef,
} from '../src/render/artManifest.ts';

const SRC = 'art/svg';
const PREVIEW = 'art/preview';
const OUT = 'public/art';
const SHEET = 'art/sheet.png';
const PAD = 4;
const TEAM_RE = /#([0-9a-fA-F]{2})00\1(?![0-9a-fA-F])/g;
/** Tło gry (`src/main.ts`) i neonowa siatka areny — karta pokazuje sprite'y na tym, na czym stoją w grze. */
const BG = [0x0a, 0x0a, 0x12];
const GRID = [0x2a, 0x6a, 0xd4];

interface Layer {
  w: number;
  h: number;
  /** RGBA, alfa prosta (nie premultiplied), 0..255. */
  px: Uint8ClampedArray;
}

interface Baked {
  name: string;
  atlas: AtlasDef;
  base: Layer;
  team: Layer | null;
  rim: Layer | null;
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


/** Dokłada przezroczysty margines — obwódka wychodzi poza sylwetkę i nie może uciec za brzeg płótna. */
function pad(layer: Layer, p: number): Layer {
  const w = layer.w + p * 2;
  const h = layer.h + p * 2;
  const px = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < layer.h; y++) px.set(layer.px.subarray(y * layer.w * 4, (y + 1) * layer.w * 4), ((y + p) * w + p) * 4);
  return { w, h, px };
}

/**
 * Obwódka: biały pierścień o promieniu `r` px wokół sylwetki, z miękką krawędzią (antyaliasing z odległości).
 * Tylko piksele osiągalne z brzegu płótna po przezroczystych — wewnętrzne dziury się nie wypełniają.
 */
function rimOf(base: Layer, r: number): Layer {
  const { w, h } = base;
  const solid = (i: number): boolean => base.px[i * 4 + 3] >= 128;
  const outside = new Uint8Array(w * h);
  const stack: number[] = [];
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
  while (stack.length) {
    const i = stack.pop()!;
    if (outside[i] || solid(i)) continue;
    outside[i] = 1;
    const x = i % w;
    const y = (i - x) / w;
    if (x > 0) stack.push(i - 1);
    if (x < w - 1) stack.push(i + 1);
    if (y > 0) stack.push(i - w);
    if (y < h - 1) stack.push(i + w);
  }
  const px = new Uint8ClampedArray(w * h * 4);
  const R = Math.ceil(r + 1);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!outside[i]) continue;
      let best = Infinity;
      for (let dy = -R; dy <= R; dy++)
        for (let dx = -R; dx <= R; dx++) {
          const qx = x + dx;
          const qy = y + dy;
          if (qx < 0 || qy < 0 || qx >= w || qy >= h || !solid(qy * w + qx)) continue;
          best = Math.min(best, Math.hypot(dx, dy));
        }
      const a = clamp(r + 0.5 - best, 0, 1);
      if (a <= 0) continue;
      px[i * 4] = px[i * 4 + 1] = px[i * 4 + 2] = 255;
      px[i * 4 + 3] = a * 255;
    }
  return { w, h, px };
}

function bake(name: string, svg: string, atlas: AtlasDef, withRim: boolean): Baked {
  const scale = atlas.scale;
  const grimeS = parseFloat(attr(svg, 'data-grime') ?? '1');
  const vb = (attr(svg, 'viewBox') ?? '0 0 128 128').split(/\s+/).map(Number);
  const anchorV = (attr(svg, 'data-anchor') ?? `${vb[2] / 2} ${vb[3] - 4}`).split(/\s+/).map(Number);
  const glowV = (attr(svg, 'data-glow') ?? '')
    .split(';')
    .map((s) => s.trim().split(/\s+/).map(Number))
    .filter((a) => a.length === 3);
  // margines na obwódkę: jej promień w px atlasu (grubość ekranowa przeliczona przez skalę wyświetlania)
  const rimR = (RIM_SCREEN_PX * scale) / SCREEN_PX_PER_UNIT;
  const margin = Math.ceil(rimR) + 2;

  let base: Layer;
  let team: Layer | null = null;
  if (svg.search(TEAM_RE) >= 0) {
    // Trzy przebiegi jak w TD: czarny/biały dają pokrycie magenty, szary (#RRRRRR) jej jasność.
    const black = pad(render(svg.replace(TEAM_RE, '#000000'), scale), margin);
    const white = pad(render(svg.replace(TEAM_RE, '#ffffff'), scale), margin);
    base = pad(render(svg.replace(TEAM_RE, '#$1$1$1'), scale), margin);
    team = { w: base.w, h: base.h, px: new Uint8ClampedArray(base.px.length) };
    for (let i = 0; i < base.px.length; i += 4) {
      const cov = clamp((white.px[i] - black.px[i]) / 255, 0, 1);
      if (cov < 0.02) continue;
      const v = clamp((base.px[i] - black.px[i]) / 255 / cov, 0, 1) * 255;
      team.px[i] = team.px[i + 1] = team.px[i + 2] = v;
      team.px[i + 3] = cov * white.px[i + 3];
    }
  } else {
    base = pad(render(svg, scale), margin);
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

  const rim = withRim ? rimOf({ w, h, px: dirty }, rimR) : null;

  // przycięcie pustych brzegów (wspólne dla wszystkich warstw — ta sama kotwica)
  let x0 = w;
  let y0 = h;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4 + 3;
      if (dirty[i] > 0 || (team && team.px[i] > 0) || (rim && rim.px[i] > 0)) {
        x0 = Math.min(x0, x);
        y0 = Math.min(y0, y);
        x1 = Math.max(x1, x);
        y1 = Math.max(y1, y);
      }
    }
  if (x1 < 0) throw new Error(`bakeArt: ${name} — pusty rysunek`);
  const crop = (px: Uint8ClampedArray): Layer => {
    const cw = x1 - x0 + 1;
    const ch = y1 - y0 + 1;
    const out = new Uint8ClampedArray(cw * ch * 4);
    for (let y = 0; y < ch; y++) out.set(px.subarray(((y + y0) * w + x0) * 4, ((y + y0) * w + x1 + 1) * 4), y * cw * 4);
    return { w: cw, h: ch, px: out };
  };
  const ax = anchorV[0] * scale + margin - x0;
  const ay = anchorV[1] * scale + margin - y0;
  return {
    name,
    atlas,
    base: crop(dirty),
    team: team ? crop(team.px) : null,
    rim: rim ? crop(rim.px) : null,
    anchor: [ax, ay],
    glow: glowV.map(([gx, gy, gr]) => [gx * scale + margin - x0 - ax, gy * scale + margin - y0 - ay, gr * scale]),
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

/** Pakowanie półkowe (od najwyższych) jednego atlasu; błąd, gdy nie mieści się w `maxSize`. */
function writeAtlas(atlas: AtlasDef, items: Baked[]): void {
  const width = atlas.maxSize;
  const rects: { key: string; layer: Layer; item: Baked; x: number; y: number }[] = [];
  for (const it of items) {
    rects.push({ key: it.name, layer: it.base, item: it, x: 0, y: 0 });
    if (it.team) rects.push({ key: `${it.name}#team`, layer: it.team, item: it, x: 0, y: 0 });
    if (it.rim) rects.push({ key: `${it.name}#rim`, layer: it.rim, item: it, x: 0, y: 0 });
  }
  rects.sort((a, b) => b.layer.h - a.layer.h);
  let x = PAD;
  let y = PAD;
  let shelf = 0;
  let used = 0;
  for (const r of rects) {
    if (x + r.layer.w + PAD > width) {
      x = PAD;
      y += shelf + PAD * 2;
      shelf = 0;
    }
    r.x = x;
    r.y = y;
    x += r.layer.w + PAD * 2;
    shelf = Math.max(shelf, r.layer.h);
    used += r.layer.w * r.layer.h;
  }
  let height = 64;
  while (height < y + shelf + PAD) height *= 2;
  if (height > atlas.maxSize) {
    throw new Error(`bakeArt: atlas "${atlas.key}" potrzebuje ${width}×${height} > ${atlas.maxSize} — podziel go w manifeście`);
  }

  const png = new PNG({ width, height });
  const frames: Record<string, unknown> = {};
  for (const r of rects) {
    const { w, h, px } = r.layer;
    for (let row = 0; row < h; row++) png.data.set(px.subarray(row * w * 4, (row + 1) * w * 4), ((r.y + row) * width + r.x) * 4);
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
  writeFileSync(join(OUT, `${atlas.key}.png`), PNG.sync.write(png));
  const meta = { app: 'tools/bakeArt.ts', image: `${atlas.key}.png`, size: { w: width, h: height }, scale: 1, bakeScale: atlas.scale };
  writeFileSync(join(OUT, `${atlas.key}.json`), JSON.stringify({ frames, meta }, null, 1));
  const fill = Math.round((used / (width * atlas.maxSize)) * 100);
  console.log(`bakeArt: atlas ${atlas.key} ${width}×${height}, ${items.length} sprite'ów, ${fill}% budżetu ${atlas.maxSize}²`);
}

// ---------------------------------------------------------------- karta kontrolna

interface Img {
  w: number;
  h: number;
  /** RGBA float, alfa prosta 0..1. */
  px: Float32Array;
}

/** Sprite w rozmiarze z gry: nadpróbkowanie 3×3 na piksel docelowy, warstwy obwódka → baza → pas. */
function composeInGame(it: Baked, color: number, mirror: boolean): Img {
  const f = SCREEN_PX_PER_UNIT / it.atlas.scale;
  const w = Math.ceil(it.base.w * f);
  const h = Math.ceil(it.base.h * f);
  const tint = [((color >> 16) & 255) / 255, ((color >> 8) & 255) / 255, (color & 255) / 255];
  const out = new Float32Array(w * h * 4);
  const layers: [Layer | null, boolean][] = [
    [it.rim, true],
    [it.base, false],
    [it.team, true],
  ];
  const S = 3;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let sy = 0; sy < S; sy++)
        for (let sx = 0; sx < S; sx++) {
          let u = Math.floor((x + (sx + 0.5) / S) / f);
          const v = Math.floor((y + (sy + 0.5) / S) / f);
          if (mirror) u = it.base.w - 1 - u;
          if (u < 0 || v < 0 || u >= it.base.w || v >= it.base.h) continue;
          // „over” kolejnych warstw w jednym punkcie, w przestrzeni premultiplied
          let pr = 0;
          let pg = 0;
          let pb = 0;
          let pa = 0;
          for (const [layer, tinted] of layers) {
            if (!layer) continue;
            const i = (v * layer.w + u) * 4;
            const la = layer.px[i + 3] / 255;
            if (la <= 0) continue;
            pr = (layer.px[i] / 255) * (tinted ? tint[0] : 1) * la + pr * (1 - la);
            pg = (layer.px[i + 1] / 255) * (tinted ? tint[1] : 1) * la + pg * (1 - la);
            pb = (layer.px[i + 2] / 255) * (tinted ? tint[2] : 1) * la + pb * (1 - la);
            pa = la + pa * (1 - la);
          }
          r += pr;
          g += pg;
          b += pb;
          a += pa;
        }
      const i = (y * w + x) * 4;
      if (a > 0) {
        out[i] = r / a;
        out[i + 1] = g / a;
        out[i + 2] = b / a;
      }
      out[i + 3] = a / (S * S);
    }
  return { w, h, px: out };
}

function writeSheet(items: Baked[]): void {
  const colors = PLAYER_COLORS.slice(0, 3);
  const ZOOM = 4;
  const GAP = 16;
  const rows = items.map((it) => ({
    it,
    variants: [...colors.map((c) => composeInGame(it, c, false)), composeInGame(it, colors[0], true)],
  }));
  const cellW = Math.max(...rows.map((r) => r.variants[0].w)) + GAP;
  const zoomW = Math.max(...rows.map((r) => r.variants[0].w * ZOOM)) + GAP;
  const width = GAP + cellW * 4 + zoomW;
  const rowH = rows.map((r) => r.variants[0].h * ZOOM + GAP);
  const height = GAP + rowH.reduce((a, b) => a + b, 0);

  const png = new PNG({ width, height });
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const line = x % 32 === 0 || y % 32 === 0;
      for (let c = 0; c < 3; c++) png.data[i + c] = line ? BG[c] + (GRID[c] - BG[c]) * 0.35 : BG[c];
      png.data[i + 3] = 255;
    }
  const blit = (img: Img, ox: number, oy: number, zoom: number): void => {
    for (let y = 0; y < img.h * zoom; y++)
      for (let x = 0; x < img.w * zoom; x++) {
        const s = (Math.floor(y / zoom) * img.w + Math.floor(x / zoom)) * 4;
        const a = img.px[s + 3];
        if (a <= 0) continue;
        const d = ((oy + y) * width + ox + x) * 4;
        for (let c = 0; c < 3; c++) png.data[d + c] = img.px[s + c] * 255 * a + png.data[d + c] * (1 - a);
      }
  };
  let oy = GAP;
  rows.forEach((r, ri) => {
    r.variants.forEach((v, vi) => blit(v, GAP + vi * cellW, oy, 1));
    blit(r.variants[0], GAP + cellW * 4, oy, ZOOM);
    console.log(`  wiersz ${ri + 1}: ${r.it.name}`);
    oy += rowH[ri];
  });
  writeFileSync(SHEET, PNG.sync.write(png));
  console.log(`bakeArt: karta ${SHEET} — kolumny: 3 kolory graczy, lustro, powiększenie ${ZOOM}×`);
}

// ---------------------------------------------------------------- autotest

/** Mały SVG z magentą i półprzezroczystą czerwienią: maska drużyny, demultiply, obwódka tylko na zewnątrz. */
function selftest(): void {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" data-grime="0" data-anchor="8 16">' +
    '<rect x="0" y="0" width="8" height="16" fill="#c800c8"/>' +
    '<rect x="8" y="0" width="8" height="16" fill="#ff0000" opacity="0.5"/></svg>';
  const b = bake('selftest', svg, { key: 'selftest', scale: 1, maxSize: 64 }, true);
  const fails: string[] = [];
  const at = (l: Layer, x: number, y: number): number[] => Array.from(l.px.subarray((y * l.w + x) * 4, (y * l.w + x) * 4 + 4));
  // współrzędne względem kotwicy (środek dołu), bo kadrowanie przesuwa płótno
  const lx = Math.round(b.anchor[0] - 4);
  const rx = Math.round(b.anchor[0] + 4);
  const my = Math.round(b.anchor[1] - 8);
  if (!b.team) fails.push('brak warstwy #team mimo magenty');
  else {
    const t = at(b.team, lx, my);
    if (t[3] < 250 || Math.abs(t[0] - 0xc8) > 2) fails.push(`#team: oczekiwano szarości c8 przy pełnej alfie, jest ${t}`);
  }
  const lb = at(b.base, lx, my);
  if (!(lb[0] === lb[1] && lb[1] === lb[2])) fails.push(`baza: magenta nie zamieniona na szarość (${lb})`);
  const rb = at(b.base, rx, my);
  if (Math.abs(rb[3] - 128) > 2 || Math.abs(rb[0] - 255) > 2) fails.push(`baza: zły demultiply półprzezroczystej czerwieni (${rb})`);
  if (!b.rim) fails.push('brak #rim mimo flagi');
  else {
    if (at(b.rim, lx, my)[3] !== 0) fails.push('#rim zachodzi na wnętrze sylwetki');
    if (at(b.rim, 0, my)[3] === 0 && at(b.rim, 1, my)[3] === 0) fails.push('#rim nie otacza sylwetki z lewej');
  }
  if (fails.length) {
    console.error('bakeArt --selftest: BŁĄD\n  ' + fails.join('\n  '));
    process.exit(1);
  }
  console.log('bakeArt --selftest: OK (maska drużyny, demultiply, obwódka tylko na zewnątrz)');
}

// ---------------------------------------------------------------- main

function main(): void {
  const args = process.argv.slice(2);
  if (args.includes('--selftest')) {
    selftest();
    return;
  }

  const files = readdirSync(SRC)
    .filter((f) => f.endsWith('.svg'))
    .sort();
  const orphans = files.map((f) => basename(f, '.svg')).filter((n) => !SPRITES[n]);
  if (orphans.length) throw new Error(`bakeArt: SVG bez wpisu w SPRITES (src/render/artManifest.ts): ${orphans.join(', ')}`);

  mkdirSync(OUT, { recursive: true });
  // stary pojedynczy atlas z próbki — dziś atlasy są per kategoria
  for (const old of ['atlas.png', 'atlas.json']) if (existsSync(join(OUT, old))) rmSync(join(OUT, old));

  const baked: Baked[] = [];
  for (const f of files) {
    const name = basename(f, '.svg');
    const def = SPRITES[name];
    const atlas = ATLASES[def.atlas];
    if (!atlas) throw new Error(`bakeArt: ${name} wskazuje nieznany atlas "${def.atlas}"`);
    baked.push(bake(name, readFileSync(join(SRC, f), 'utf-8'), atlas, def.rim));
  }
  for (const atlas of Object.values(ATLASES)) writeAtlas(atlas, baked.filter((b) => b.atlas === atlas));

  if (args.includes('--sheet')) {
    // art/preview/*.svg: próby spoza manifestu (np. warstwa brutalu) — tylko na kartę, nie do atlasu
    const previews = existsSync(PREVIEW)
      ? readdirSync(PREVIEW)
          .filter((f) => f.endsWith('.svg'))
          .sort()
      : [];
    const extra = previews.map((f) =>
      bake(`preview/${basename(f, '.svg')}`, readFileSync(join(PREVIEW, f), 'utf-8'), ATLASES.heroes, true),
    );
    writeSheet([...baked, ...extra]);
  }
}

main();
