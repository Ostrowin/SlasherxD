import Phaser from 'phaser';
import type { Obstacle, Player } from '../sim/world';
import type { FogOfWar } from './fog';

/**
 * Minimapa w rogu ekranu z mgłą wojny.
 *
 * Wydajność: teren rysujemy PRZYROSTOWO na RenderTexture — tylko komórki
 * odkryte w danej klatce. Przerysowywanie całej siatki (6400 komórek) co
 * klatkę zjadłoby FPS-y bez powodu, bo teren się nie zmienia.
 * Kropki graczy to osobna warstwa, odświeżana co klatkę.
 */
export class Minimap {
  private readonly terrain: Phaser.GameObjects.RenderTexture;
  private readonly dots: Phaser.GameObjects.Graphics;
  private readonly frame: Phaser.GameObjects.Rectangle;
  /** Skala świat → minimapa. */
  private readonly scale: number;
  /** Czy dana komórka siatki leży na przeszkodzie (liczone raz na starcie). */
  private readonly obstacleMask: Uint8Array;

  private static readonly COLOR_FLOOR = 0x16233a;
  private static readonly COLOR_OBSTACLE = 0x3d8bff;

  constructor(
    scene: Phaser.Scene,
    private readonly fog: FogOfWar,
    obstacles: Obstacle[],
    worldWidth: number,
    size: number,
    x: number,
    y: number,
  ) {
    this.scale = size / worldWidth;

    // Tło: całość zaczyna czarna, bo nic nie jest jeszcze odkryte.
    this.terrain = scene.add
      .renderTexture(x, y, size, size)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(20);
    this.terrain.fill(0x05070d);

    this.dots = scene.add.graphics().setScrollFactor(0).setDepth(21);

    this.frame = scene.add
      .rectangle(x, y, size, size)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0x3d8bff, 0.8)
      .setFillStyle(0x000000, 0)
      .setScrollFactor(0)
      .setDepth(22);

    // Maska przeszkód per komórka — dzięki temu odkrywanie od razu wie,
    // czy pomalować kawałek podłogi, czy ściany.
    this.obstacleMask = new Uint8Array(fog.cols * fog.rows);
    for (let row = 0; row < fog.rows; row++) {
      for (let col = 0; col < fog.cols; col++) {
        const cx = (col + 0.5) * fog.cellSize;
        const cy = (row + 0.5) * fog.cellSize;
        for (const o of obstacles) {
          const dx = cx - o.x;
          const dy = cy - o.y;
          if (dx * dx + dy * dy <= o.r * o.r) {
            this.obstacleMask[row * fog.cols + col] = 1;
            break;
          }
        }
      }
    }
  }

  /** Dorysowuje świeżo odkryte komórki (wywoływane co klatkę, zwykle tanie). */
  applyReveals(): void {
    const pending = this.fog.drainPending();
    if (pending.length === 0) return;

    const cellPx = this.fog.cellSize * this.scale;
    // +1 px, żeby sąsiednie komórki nie zostawiały siatki szczelin.
    const drawPx = Math.ceil(cellPx) + 1;
    for (const idx of pending) {
      const col = idx % this.fog.cols;
      const row = Math.floor(idx / this.fog.cols);
      const color = this.obstacleMask[idx]
        ? Minimap.COLOR_OBSTACLE
        : Minimap.COLOR_FLOOR;
      this.terrain.fill(color, 1, col * cellPx, row * cellPx, drawPx, drawPx);
    }
  }

  /** Kropki graczy — lokalny większy i biało obwiedziony, reszta w kolorach klas. */
  update(players: Player[], localIndex: number): void {
    this.dots.clear();
    const ox = this.frame.x;
    const oy = this.frame.y;

    players.forEach((p, i) => {
      const px = ox + p.x * this.scale;
      const py = oy + p.y * this.scale;
      if (p.dead) {
        // Martwy kolega: przygaszony krzyżyk, żeby było wiadomo gdzie padł.
        this.dots.lineStyle(1.5, p.cls.color, 0.5);
        this.dots.beginPath();
        this.dots.moveTo(px - 3, py - 3);
        this.dots.lineTo(px + 3, py + 3);
        this.dots.moveTo(px + 3, py - 3);
        this.dots.lineTo(px - 3, py + 3);
        this.dots.strokePath();
        return;
      }
      const radius = i === localIndex ? 4 : 3;
      this.dots.fillStyle(p.cls.color, 1).fillCircle(px, py, radius);
      if (i === localIndex) {
        this.dots.lineStyle(1.5, 0xffffff, 0.9).strokeCircle(px, py, radius + 1.5);
      }
    });
  }

  destroy(): void {
    this.terrain.destroy();
    this.dots.destroy();
    this.frame.destroy();
  }
}
