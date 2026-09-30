import Phaser from 'phaser';
import type { Obstacle } from '../sim/world';
import { ATLASES, MAP_ART, OBSTACLE_FOOT } from './artManifest';
import { makeGlowCircle } from './textures';

/**
 * Grafika aren (plan-grafik.md, Etap 2): podłoga z kafla bezszwowego, krawędź areny i przeszkody z atlasu
 * `world`. Źródła: tools/bakeTiles.ts (kafle) i tools/svg_gen/ws_world.py (przeszkody), wypalane przez
 * `npm run bake-art`. Mapa bez wpisu w `MAP_ART` albo brak wypalonych plików → stary wygląd (gwiazdy,
 * neonowa siatka, kółka) — rysuje go dalej GameScene.
 */

const WORLD = ATLASES.world;
const GLOW_KEY = 'world-glow';
const GLOW_RADIUS = 8;

const tileKey = (tile: string): string => `tile-${tile}`;

export function preloadWorldArt(scene: Phaser.Scene): void {
  scene.load.atlas(WORLD.key, `art/${WORLD.key}.png`, `art/${WORLD.key}.json`);
  for (const m of Object.values(MAP_ART)) scene.load.image(tileKey(m.tile), `art/tiles/${m.tile}.png`);
}

/** Czy arena ma komplet grafiki (kafel + wszystkie przeszkody). */
export function hasWorldArt(scene: Phaser.Scene, mapId: string): boolean {
  const art = MAP_ART[mapId];
  if (!art || !scene.textures.exists(tileKey(art.tile)) || !scene.textures.exists(WORLD.key)) return false;
  const tex = scene.textures.get(WORLD.key);
  return art.obstacles.every((f) => tex.has(f));
}

/**
 * Podłoga areny (kafel pod całym światem) i jej krawędź w kolorze akcentu. Poza areną zostają gwiazdy —
 * stacja dryfuje w próżni, krater wisi nad nią jak odłamek.
 */
export function buildArenaFloor(scene: Phaser.Scene, mapId: string, worldW: number, worldH: number): void {
  const art = MAP_ART[mapId];
  scene.add.tileSprite(0, 0, worldW, worldH, tileKey(art.tile)).setOrigin(0, 0).setDepth(-1);
  // krawędź: ciemny kadłub + neon/żar akcentu mapy
  scene.add.rectangle(worldW / 2, worldH / 2, worldW + 20, worldH + 20).setStrokeStyle(20, 0x07080b, 1).setDepth(-0.9);
  scene.add
    .rectangle(worldW / 2, worldH / 2, worldW, worldH)
    .setStrokeStyle(3, art.accent, 0.6)
    .setDepth(-0.9);
}

/**
 * Przeszkody: sprite dopasowany do promienia kolizji (ślad OBSTACLE_FOOT jedn. SVG = `o.r`). Wariant
 * i odbicie zależą od indeksu przeszkody — deterministycznie, bez losowania w renderze (ten sam wygląd
 * u wszystkich graczy co-opu). Poświaty (światła stacji, żar lawy) w kolorze akcentu mapy, statyczne.
 */
export function buildObstacles(scene: Phaser.Scene, mapId: string, obstacles: readonly Obstacle[]): void {
  const art = MAP_ART[mapId];
  const tex = scene.textures.get(WORLD.key);
  makeGlowCircle(scene, GLOW_KEY, GLOW_RADIUS);
  obstacles.forEach((o, i) => {
    const frameName = art.obstacles[(i * 7 + 3) % art.obstacles.length];
    const frame = tex.get(frameName);
    const scale = o.r / (OBSTACLE_FOOT * WORLD.scale);
    const flip = i % 2 === 1 ? -1 : 1;
    scene.add.image(o.x, o.y, WORLD.key, frameName).setScale(scale * flip, scale).setDepth(0);
    const glow = (frame.customData as { glow?: [number, number, number][] }).glow ?? [];
    for (const [gx, gy, gr] of glow) {
      scene.add
        .image(o.x + gx * scale * flip, o.y + gy * scale, GLOW_KEY)
        .setTint(art.accent)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setScale((gr * scale * 1.6) / GLOW_RADIUS)
        .setAlpha(0.55)
        .setDepth(0.1);
    }
  });
}
