/**
 * Kafle podłoża aren (plan-grafik.md, Etap 2): bezszwowe tekstury pod `tileSprite`, wypalane z szumu —
 * port idei `_bake_tiles` z TowerDefense (tools/bake_art.gd) do Node. Wywołuje je `tools/bakeArt.ts`.
 *
 * Szum jest okresowy (siatka zawinięta modulo okres), więc brzegi kafla stykają się bez szwu.
 * Jasność podłoża celowo niska, ale wyraźnie wyższa niż tło gry `#0a0a12` — sprite'y mają kontur INK,
 * a obwódkę gracza stroimy pod te kafle.
 */
import { PNG } from 'pngjs';

export const TILE = 512;

function hash3(seed: number, x: number, y: number): number {
  let h = (seed ^ Math.imul(x, 374761393) ^ Math.imul(y, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}

const mod = (a: number, n: number): number => ((a % n) + n) % n;

/** Szum wartości zawinięty w okresie `period` komórek siatki → wynik bezszwowy w [-1, 1]. */
function periodicNoise(seed: number, x: number, y: number, period: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = x - xi;
  const fy = y - yi;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const h = (ix: number, iy: number): number => hash3(seed, mod(ix, period), mod(iy, period));
  const a = h(xi, yi);
  const b = h(xi + 1, yi);
  const c = h(xi, yi + 1);
  const d = h(xi + 1, yi + 1);
  return (a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy) * 2 - 1;
}

/** fBm bezszwowe na kaflu TILE×TILE: `cells` = liczba komórek najniższej oktawy na bok kafla. */
function tileFbm(seed: number, px: number, py: number, cells: number, octaves: number): number {
  let sum = 0;
  let amp = 1;
  let norm = 0;
  let c = cells;
  for (let o = 0; o < octaves; o++) {
    sum += periodicNoise(seed + o * 97, (px / TILE) * c, (py / TILE) * c, c) * amp;
    norm += amp;
    amp *= 0.5;
    c *= 2;
  }
  return sum / norm;
}

const clamp = (v: number, lo = 0, hi = 1): number => Math.min(hi, Math.max(lo, v));
type RGB = [number, number, number];
const hex = (c: number): RGB => [((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255];
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const shade = (c: RGB, f: number): RGB => (f >= 0 ? mix(c, [1, 1, 1], f) : mix(c, [0, 0, 0], -f));

function toPng(color: (x: number, y: number) => RGB): Buffer {
  const png = new PNG({ width: TILE, height: TILE });
  for (let y = 0; y < TILE; y++)
    for (let x = 0; x < TILE; x++) {
      const [r, g, b] = color(x, y);
      const i = (y * TILE + x) * 4;
      png.data[i] = clamp(r) * 255;
      png.data[i + 1] = clamp(g) * 255;
      png.data[i + 2] = clamp(b) * 255;
      png.data[i + 3] = 255;
    }
  return PNG.sync.write(png);
}

/**
 * Komórki Woronoja zawinięte w okresie `cells` (bezszwowe): zwraca [F1, F2] — odległości do dwóch
 * najbliższych punktów, w jednostkach komórki. `F2 - F1` bliskie zera = granica komórek (pęknięcie).
 */
function periodicVoronoi(seed: number, px: number, py: number, cells: number): [number, number, number] {
  const x = (px / TILE) * cells;
  const y = (py / TILE) * cells;
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  let f1 = Infinity;
  let f2 = Infinity;
  let id = 0;
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      const cx = xi + dx;
      const cy = yi + dy;
      const wx = mod(cx, cells);
      const wy = mod(cy, cells);
      const fx = cx + 0.15 + hash3(seed, wx, wy) * 0.7;
      const fy = cy + 0.15 + hash3(seed + 1, wx, wy) * 0.7;
      const d = Math.hypot(x - fx, y - fy);
      if (d < f1) {
        f2 = f1;
        f1 = d;
        id = wx + wy * 131;
      } else if (d < f2) f2 = d;
    }
  return [f1, f2, id];
}

/**
 * Derelict Station: pokład z płyt 128×128 (4×4 na kafel), każda z innej blachy. Szczeliny z przygaszonym
 * neonem stacji, nity z rdzą, plamy smaru, łaty i wytarte pasy ostrzegawcze.
 */
export function stationTile(): Buffer {
  const steel = hex(0x2c323a);
  const steelD = hex(0x1f242b);
  const rust = hex(0x4a3223);
  const oil = hex(0x121518);
  const neon = hex(0x3d8bff);
  const hazardY = hex(0x8a6a1e);
  const PLATE = 128;
  return toPng((x, y) => {
    const px = mod(x, PLATE);
    const py = mod(y, PLATE);
    const gx = Math.floor(x / PLATE);
    const gy = Math.floor(y / PLATE);
    const plateId = gx + gy * 7;
    const kind = hash3(11, gx, gy);
    let c = mix(steel, steelD, hash3(12, gx, gy));
    // blacha: szczotkowanie w kierunku zależnym od płyty
    const along = hash3(13, gx, gy) > 0.5;
    c = shade(c, tileFbm(21, along ? x : x * 0.2, along ? y * 0.2 : y, 32, 2) * 0.05);
    // łata: mniejsza płyta z innej blachy, przyspawana na krzywo
    if (kind > 0.8) {
      const inPatch = px > 30 && px < 98 && py > 40 && py < 100;
      if (inPatch) c = shade(mix(c, rust, 0.35), 0.03);
      if (inPatch && (px < 33 || px > 95 || py < 43 || py > 97)) c = shade(c, -0.35);
    }
    // wytarty pas ostrzegawczy przy krawędzi płyty
    if (kind < 0.14 && py > 104 && py < 122) {
      const stripe = mod(px + py, 24) < 12;
      const wear = tileFbm(24, x, y, 64, 2) * 0.5 + 0.5;
      if (stripe && wear > 0.35) c = mix(c, hazardY, 0.55);
    }
    // plamy smaru i brud (bezszwowe, duże)
    const blot = tileFbm(22, x, y, 3, 4) * 0.5 + 0.5;
    c = mix(c, oil, clamp((blot - 0.5) * 2.4) * 0.8);
    // rysy
    if (tileFbm(23, x * 0.1, y * 2.5, 48, 1) > 0.74) c = shade(c, 0.1);
    // fazowanie krawędzi płyty: światło z lewej-góry
    const edge = Math.min(px, py, PLATE - 1 - px, PLATE - 1 - py);
    if (edge < 3) c = shade(c, px < 3 || py < 3 ? 0.1 : -0.35);
    // szczelina między płytami; część szczelin świeci neonem stacji
    if (edge < 1) c = mix(hex(0x0a0d11), neon, py < 1 && hash3(14, plateId, 5) > 0.45 ? 0.4 : 0.04);
    // nity w narożnikach z zaciekami rdzy
    for (const [rx, ry] of [
      [9, 9],
      [PLATE - 10, 9],
      [9, PLATE - 10],
      [PLATE - 10, PLATE - 10],
    ]) {
      const d = Math.hypot(px - rx, py - ry);
      if (d < 3.2) c = shade(steel, px < rx && py < ry ? 0.22 : -0.05);
      else if (d < 4.2) c = shade(c, -0.3);
      else if (d < 9 && py > ry && Math.abs(px - rx) < 2.5 && hash3(15, plateId, rx) > 0.5) c = mix(c, rust, 0.35);
    }
    return c;
  });
}

/**
 * Impact Crater: spękany bazalt — wielokątne płyty (komórki Woronoja) z ciemnymi szczelinami. Najgłębsze
 * szczeliny żarzą się lawą (kolor mapy `0xff6b1a`), wokół nich przygaszona poświata. Popiół w zagłębieniach.
 */
export function craterTile(): Buffer {
  const basalt = hex(0x2c2624);
  const basaltD = hex(0x1c1817);
  const ash = hex(0x3c3532);
  const lava = hex(0xff6b1a);
  const lavaD = hex(0x6e240a);
  return toPng((x, y) => {
    // lekkie zniekształcenie, żeby płyty nie były idealnymi wielokątami
    const wx = x + tileFbm(41, x, y, 8, 2) * 10;
    const wy = y + tileFbm(42, x, y, 8, 2) * 10;
    const [f1, f2, id] = periodicVoronoi(43, wx, wy, 7);
    let c = mix(basaltD, basalt, 0.35 + hash3(44, id, 0) * 0.65);
    // każda płyta nachylona inaczej: jaśniej od lewej-góry
    c = shade(c, (0.5 - f1) * 0.12);
    c = shade(c, tileFbm(32, x, y, 48, 2) * 0.07);
    const ashN = tileFbm(33, x, y, 6, 3) * 0.5 + 0.5;
    c = mix(c, ash, clamp((ashN - 0.6) * 3) * 0.55);
    // szczeliny między płytami, część z żarem
    const gap = f2 - f1;
    const heat = clamp(((tileFbm(35, x, y, 2, 2) * 0.5 + 0.5) - 0.52) * 3.5);
    if (gap < 0.06) {
      const core = clamp(1 - gap / 0.06);
      c = mix(c, mix(hex(0x0b0808), mix(lavaD, lava, heat * core), heat), core);
    } else if (gap < 0.16) {
      c = mix(c, lavaD, heat * (1 - (gap - 0.06) / 0.1) * 0.35);
    }
    // drobne okruchy i kamyczki
    const peb = tileFbm(36, x, y, 96, 1);
    if (peb > 0.78) c = shade(c, 0.12);
    return c;
  });
}

export const TILES: Record<string, () => Buffer> = {
  station: stationTile,
  crater: craterTile,
};
