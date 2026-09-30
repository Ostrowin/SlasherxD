import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import {
  ATLASES,
  BOSS_ART,
  ENEMY_ART,
  HEROES,
  MAP_ART,
  PLAYER_COLOR_MIN_LUMINANCE,
  PLAYER_COLORS,
  SPRITES,
  SUMMONS,
} from '../src/render/artManifest';
import { DEV_MARKER } from '../src/render/devMarker';
import { ENEMIES } from '../src/sim/enemies';
import { BOSSES } from '../src/sim/bosses';
import { STATUSES } from '../src/sim/statusConfig';

/**
 * Spójność grafiki (plan-grafik.md, Etap 0, D8): manifest ↔ SVG ↔ wypalone atlasy, budżet tekstur,
 * paleta graczy i kontrakt „szybki start nie trafia do buildu”.
 *
 * Wymaga świeżego `npm run bake-art` (atlasy w public/art) i `npm run build` (dist/) — `npm test`
 * uruchamia oba przed tym plikiem. Uruchamiany z katalogu głównego repo.
 */

interface AtlasJson {
  frames: Record<string, { frame: { w: number; h: number }; anchor: { x: number; y: number }; glow: number[][] }>;
  meta: { size: { w: number; h: number }; bakeScale: number; statuses?: string[] };
}

const wyniki: [string, boolean, string][] = [];
const check = (n: string, ok: boolean, i = ''): void => {
  wyniki.push([n, ok, i]);
};

const TEAM_RE = /#([0-9a-fA-F]{2})00\1(?![0-9a-fA-F])/;

// --- atlasy: istnieją, mieszczą się w budżecie, mają skalę z manifestu
const atlases: Record<string, AtlasJson> = {};
for (const atlas of Object.values(ATLASES)) {
  const path = join('public', 'art', `${atlas.key}.json`);
  if (!existsSync(path)) {
    check(`atlas ${atlas.key} istnieje`, false, `brak ${path} — uruchom npm run bake-art`);
    continue;
  }
  const json = JSON.parse(readFileSync(path, 'utf-8')) as AtlasJson;
  atlases[atlas.key] = json;
  const { w, h } = json.meta.size;
  check(`atlas ${atlas.key} w budżecie ${atlas.maxSize}²`, w <= atlas.maxSize && h <= atlas.maxSize, `${w}×${h}`);
  check(`atlas ${atlas.key}: skala wypalenia z manifestu`, json.meta.bakeScale === atlas.scale, `${json.meta.bakeScale} vs ${atlas.scale}`);
}
check('atlas postaci wypalany w skali 0.75 (D2)', ATLASES.heroes?.scale === 0.75, `${ATLASES.heroes?.scale}`);

// --- każdy SVG ma wpis w manifeście, każdy wpis ma SVG
const svgs = readdirSync(join('art', 'svg')).filter((f) => f.endsWith('.svg')).map((f) => f.slice(0, -4));
const orphans = svgs.filter((n) => !SPRITES[n]);
check('każdy SVG ma wpis w SPRITES', orphans.length === 0, orphans.join(', '));
const missing = Object.keys(SPRITES).filter((n) => !svgs.includes(n));
check('każdy wpis SPRITES ma SVG', missing.length === 0, missing.join(', '));

// --- klatki: baza zawsze, #team tylko przy magencie, #rim dokładnie przy fladze; kotwica i neon w klatce
const heroFrames = new Set(
  Object.values(HEROES).flatMap((h) => [h.soldier, ...h.specs].filter((f): f is string => f !== null)),
);
for (const [name, def] of Object.entries(SPRITES)) {
  const json = atlases[def.atlas];
  if (!json) {
    check(`${name}: atlas ${def.atlas}`, false, 'atlas nie istnieje');
    continue;
  }
  const base = json.frames[name];
  check(`${name}: klatka bazowa`, !!base);
  if (!base) continue;
  const svgPath = join('art', 'svg', `${name}.svg`);
  const hasTeam = existsSync(svgPath) && TEAM_RE.test(readFileSync(svgPath, 'utf-8'));
  check(`${name}: #team ⇔ magenta w SVG`, !!json.frames[`${name}#team`] === hasTeam);
  check(`${name}: #rim ⇔ flaga rim`, !!json.frames[`${name}#rim`] === def.rim);
  check(`${name}: obwódka tylko dla postaci graczy (D4)`, !def.rim || heroFrames.has(name));
  const { x, y } = base.anchor;
  check(`${name}: kotwica w klatce`, x >= 0 && x <= 1 && y >= 0 && y <= 1, `${x}, ${y}`);
  const ax = x * base.frame.w;
  const ay = y * base.frame.h;
  const outside = base.glow.filter(([gx, gy]) => ax + gx < 0 || ax + gx > base.frame.w || ay + gy < 0 || ay + gy > base.frame.h);
  check(`${name}: punkty neonu w klatce`, outside.length === 0, JSON.stringify(outside));
}

// --- manifest postaci i przywołańców wskazuje istniejące sprite'y
for (const frame of heroFrames) {
  check(`HEROES → ${frame} w SPRITES`, !!SPRITES[frame]);
}
for (const [id, frame] of Object.entries(SUMMONS)) {
  check(`SUMMONS ${id} → ${frame} w SPRITES`, !!SPRITES[frame]);
  check(`SUMMONS ${id}: bez obwódki (D4)`, !SPRITES[frame]?.rim);
}
// każda gałąź niedźwiedzia ma grafikę (Etap 1)
check('bear: szeregowy + 3 specjalizacje', !!HEROES.bear?.soldier && HEROES.bear.specs.length === 3 && HEROES.bear.specs.every((f) => f !== null));

// --- areny (Etap 2): kafel wypalony, przeszkody w atlasie `world`, bez obwódki
for (const [mapId, art] of Object.entries(MAP_ART)) {
  check(`mapa ${mapId}: kafel public/art/tiles/${art.tile}.png`, existsSync(join('public', 'art', 'tiles', `${art.tile}.png`)));
  check(`mapa ${mapId}: ma przeszkody`, art.obstacles.length > 0);
  for (const frame of art.obstacles) {
    check(`mapa ${mapId}: ${frame} w atlasie world`, SPRITES[frame]?.atlas === 'world' && !!atlases.world?.frames[frame]);
    check(`mapa ${mapId}: ${frame} bez obwódki (D4)`, SPRITES[frame]?.rim === false);
  }
}

// --- najeźdźcy (Etap 3): każdy wróg i boss z gry ma grafikę we właściwym atlasie, bez obwódki
for (const e of ENEMIES) {
  const art = ENEMY_ART[e.id];
  check(`wróg ${e.id}: ma grafikę`, !!art);
  if (art) check(`wróg ${e.id}: ${art.frame} w atlasie invaders`, SPRITES[art.frame]?.atlas === 'invaders' && !!atlases.invaders?.frames[art.frame]);
}
for (const b of BOSSES) {
  const art = BOSS_ART[b.id];
  check(`boss ${b.id}: ma grafikę`, !!art);
  if (art) check(`boss ${b.id}: ${art.frame} w atlasie bosses`, SPRITES[art.frame]?.atlas === 'bosses' && !!atlases.bosses?.frames[art.frame]);
}
// parser kolorów statusów w bakeArt widzi dokładnie statusy gry (inaczej statusFill liczono na złych kolorach)
const statusIds = STATUSES.map((st) => st.id).join(',');
for (const key of ['invaders', 'bosses']) {
  check(`atlas ${key}: statusy jak w grze (D6)`, atlases[key]?.meta.statuses?.join(',') === statusIds, `${atlases[key]?.meta.statuses?.join(',')} vs ${statusIds}`);
}

// --- paleta slotów graczy (D3): 8 kolorów, każdy jasny na tle gry
const luminance = (c: number): number => {
  const lin = (v: number): number => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin((c >> 16) & 255) + 0.7152 * lin((c >> 8) & 255) + 0.0722 * lin(c & 255);
};
check('paleta graczy ma 8 kolorów', PLAYER_COLORS.length === 8, `${PLAYER_COLORS.length}`);
for (const c of PLAYER_COLORS) {
  const l = luminance(c);
  check(`kolor gracza #${c.toString(16).padStart(6, '0')} jasny na tle`, l >= PLAYER_COLOR_MIN_LUMINANCE, l.toFixed(3));
}
check('kolory graczy są różne', new Set(PLAYER_COLORS).size === PLAYER_COLORS.length);

// --- szybki start nie trafia do buildu (D8): znacznik z devStart.ts nie może wystąpić w dist/
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
if (!existsSync('dist')) {
  check('dist/ istnieje (build przed testem)', false, 'uruchom npm run build');
} else {
  const leaks = walk('dist').filter((p) => p.endsWith('.js') && readFileSync(p, 'utf-8').includes(DEV_MARKER));
  check('build bez kodu szybkiego startu', leaks.length === 0, leaks.join(', '));
}

let fail = 0;
for (const [n, ok, info] of wyniki) {
  if (!ok) fail++;
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${n}${info ? ` — ${info}` : ''}`);
}
console.log(`\nartCheck: ${wyniki.length - fail}/${wyniki.length} OK`);
if (fail) process.exitCode = 1;
