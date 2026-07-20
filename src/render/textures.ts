import Phaser from 'phaser';
import { Rng } from '../sim/rng';

/**
 * Generator tekstur z wypaloną poświatą (neon sci-fi).
 *
 * Dlaczego wypalamy glow w teksturze, a nie shaderem per-sprite:
 * przy 400 wrogach na ekranie efekt glow jako osobny przebieg shadera zabiłby
 * wydajność. Tekstura z gotową poświatą kosztuje tyle samo co zwykła, a wygląda
 * praktycznie tak samo. Wszystkie tekstury są białe — kolor nadaje tint.
 */

/** Warstwy poświaty: od największej i najsłabszej do rdzenia. */
const GLOW_LAYERS = [
  { scale: 2.0, alpha: 0.07 },
  { scale: 1.6, alpha: 0.12 },
  { scale: 1.3, alpha: 0.22 },
  { scale: 1.0, alpha: 1.0 },
];

/** Wielokąt foremny ze świecącą aureolą. `rotation` w radianach. */
export function makeGlowPolygon(
  scene: Phaser.Scene,
  key: string,
  sides: number,
  radius: number,
  rotation = 0,
): void {
  if (scene.textures.exists(key)) return;
  const maxScale = GLOW_LAYERS[0].scale;
  const size = Math.ceil(radius * maxScale * 2);
  const c = size / 2;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);

  for (const layer of GLOW_LAYERS) {
    const r = radius * layer.scale;
    const points: Phaser.Geom.Point[] = [];
    for (let i = 0; i < sides; i++) {
      const a = rotation + (i / sides) * Math.PI * 2;
      points.push(new Phaser.Geom.Point(c + Math.cos(a) * r, c + Math.sin(a) * r));
    }
    g.fillStyle(0xffffff, layer.alpha);
    g.fillPoints(points, true);
  }

  g.generateTexture(key, size, size);
  g.destroy();
}

/** Świecące koło (pociski, cząsteczki). */
export function makeGlowCircle(scene: Phaser.Scene, key: string, radius: number): void {
  if (scene.textures.exists(key)) return;
  const maxScale = GLOW_LAYERS[0].scale;
  const size = Math.ceil(radius * maxScale * 2);
  const c = size / 2;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  for (const layer of GLOW_LAYERS) {
    g.fillStyle(0xffffff, layer.alpha);
    g.fillCircle(c, c, radius * layer.scale);
  }
  g.generateTexture(key, size, size);
  g.destroy();
}

/**
 * Kafelek gwiazd do tła (parallax).
 * Losowanie idzie przez seedowany Rng z symulacji — `Math.random()` jest
 * zablokowane ESLint-em w całym projekcie (strażnik determinizmu).
 */
export function makeStarfield(
  scene: Phaser.Scene,
  key: string,
  size: number,
  count: number,
  seed: number,
  maxAlpha: number,
): void {
  if (scene.textures.exists(key)) return;
  const rng = new Rng(seed);
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  for (let i = 0; i < count; i++) {
    const x = rng.range(0, size);
    const y = rng.range(0, size);
    const r = rng.range(0.6, 1.9);
    const a = rng.range(maxAlpha * 0.35, maxAlpha);
    g.fillStyle(0xffffff, a);
    g.fillCircle(x, y, r);
  }
  g.generateTexture(key, size, size);
  g.destroy();
}

/** Siatka technologiczna — delikatny „podłoga stacji" pod gwiazdami. */
export function makeNeonGrid(scene: Phaser.Scene, key: string, cell: number): void {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.lineStyle(1, 0x2a6ad4, 0.5).strokeRect(0, 0, cell, cell);
  g.lineStyle(1, 0x2a6ad4, 0.22).beginPath();
  g.moveTo(cell / 2, 0);
  g.lineTo(cell / 2, cell);
  g.moveTo(0, cell / 2);
  g.lineTo(cell, cell / 2);
  g.strokePath();
  g.generateTexture(key, cell, cell);
  g.destroy();
}
