import Phaser from 'phaser';
import type { Player } from '../sim/world';
import { makeGlowCircle } from './textures';

/**
 * Wektorowe postacie graczy z atlasu (grafika.md p. 5): źródła SVG w art/svg, wypalane przez
 * `npm run bake-art` do public/art/atlas.{png,json}. Na razie próbka — tylko niedźwiedź (Grawitant);
 * pozostałe klasy dalej rysują się świecącym pięciokątem.
 *
 * Postać to trzy warstwy w jednym atlasie (jedna tekstura = batching):
 *   - sprite bazowy (bez tintu — kolory są w rysunku),
 *   - maska drużyny `<klatka>#team` barwiona kolorem klasy,
 *   - neon: poświata z `textures.ts` (blend ADD) w punktach `glow` klatki — NIE jest wypalana w sprite.
 */

export const ATLAS_KEY = 'art';

/** Klasa → klatka atlasu. Próbka: niedźwiedź zawsze jako Grawitant, niezależnie od specjalizacji. */
const HERO_FRAMES: Record<string, { frame: string; glow: number }> = {
  bear: { frame: 'hero_bear_gravity', glow: 0xb070ff },
};

/** Piksele ekranu na piksel atlasu — postać ~60 px wzrostu, wyraźnie większa niż hitbox. */
const DISPLAY_SCALE = 0.5;
/** Stopy leżą tyle pikseli pod środkiem hitboxu (sim liczy pozycję jako środek koła). */
const FEET_OFFSET = 12;
const GLOW_KEY = 'hero-glow';
const GLOW_RADIUS = 8;

export function preloadHeroArt(scene: Phaser.Scene): void {
  scene.load.atlas(ATLAS_KEY, 'art/atlas.png', 'art/atlas.json');
}

export function hasHeroArt(scene: Phaser.Scene, classId: string): boolean {
  const def = HERO_FRAMES[classId];
  return !!def && scene.textures.exists(ATLAS_KEY) && scene.textures.get(ATLAS_KEY).has(def.frame);
}

/**
 * Warstwy jednej postaci. `base` to zwykły Image — GameScene trzyma go w `playerSprites`,
 * więc kamera i efekty (które czytają `.x/.y`) działają bez zmian: pozycja obrazka = środek
 * hitboxu, a stopy przesuwamy przez origin.
 */
export class HeroRig {
  readonly base: Phaser.GameObjects.Image;
  private readonly team: Phaser.GameObjects.Image | null;
  private readonly shadow: Phaser.GameObjects.Ellipse;
  private readonly glows: { img: Phaser.GameObjects.Image; x: number; y: number; r: number }[] = [];
  private readonly originX: number;
  private readonly originY: number;
  private facing = 1;
  /** Wysokość postaci nad środkiem hitboxu — tam idą paski HP kolegów. */
  readonly topOffset: number;

  constructor(scene: Phaser.Scene, classId: string, teamColor: number) {
    const def = HERO_FRAMES[classId];
    const tex = scene.textures.get(ATLAS_KEY);
    const frame = tex.get(def.frame);
    const data = frame.customData as { glow?: [number, number, number][] };

    this.shadow = scene.add.ellipse(0, 0, 40, 12, 0x000000, 0.4).setDepth(2.9);
    this.base = scene.add.image(0, 0, ATLAS_KEY, def.frame).setDepth(3);
    // origin z pivota stóp, przesunięty w górę o FEET_OFFSET — pozycja Image = środek hitboxu
    this.originX = frame.pivotX;
    this.originY = frame.pivotY - FEET_OFFSET / DISPLAY_SCALE / frame.height;
    this.team = tex.has(def.frame + '#team')
      ? scene.add.image(0, 0, ATLAS_KEY, def.frame + '#team').setTint(teamColor).setDepth(3.01)
      : null;
    for (const img of [this.base, this.team]) img?.setOrigin(this.originX, this.originY);

    makeGlowCircle(scene, GLOW_KEY, GLOW_RADIUS);
    for (const [x, y, r] of data.glow ?? []) {
      const img = scene.add
        .image(0, 0, GLOW_KEY)
        .setTint(def.glow)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(3.02);
      this.glows.push({ img, x, y, r });
    }
    this.topOffset = frame.pivotY * frame.height * DISPLAY_SCALE - FEET_OFFSET;
  }

  /**
   * Ruch z kodu: kołysanie w marszu, obrót za kierunkiem, powiększenie w skoku/doskoku,
   * pulsujący neon. `scale` to mnożnik z GameScene (1 / 1.12 dash / 1.35 skok).
   */
  update(p: Player, x: number, y: number, tick: number, scale: number): void {
    if (Math.abs(p.facingX) > 0.2) this.facing = p.facingX < 0 ? -1 : 1;
    const moving = Math.abs(p.x - p.prevX) + Math.abs(p.y - p.prevY) > 0.3;
    const step = tick * 0.35;
    const bob = moving ? -Math.abs(Math.sin(step)) * 2.5 : Math.sin(tick * 0.06) * 0.6;
    const tilt = moving ? Math.sin(step) * 0.06 : 0;
    const s = DISPLAY_SCALE * scale;
    const alpha = p.dead ? 0.25 : 1;

    for (const img of [this.base, this.team]) {
      img
        ?.setPosition(x, y + bob)
        .setScale(s * this.facing, s)
        .setRotation(tilt)
        .setAlpha(alpha);
    }
    // cień zostaje na ziemi — w skoku maleje, żeby było widać wysokość
    this.shadow
      .setPosition(x, y + FEET_OFFSET)
      .setScale(1 / scale)
      .setAlpha(p.dead ? 0.1 : 0.4 / scale);

    const cos = Math.cos(tilt);
    const sin = Math.sin(tilt);
    const pulse = 0.5 + Math.sin(tick * 0.15) * 0.15;
    for (let i = 0; i < this.glows.length; i++) {
      const g = this.glows[i];
      // punkt względem originu (obrót idzie wokół niego), origin leży FEET_OFFSET nad stopami
      const gx = g.x * s * this.facing;
      const gy = g.y * s + FEET_OFFSET * scale;
      g.img
        .setPosition(x + gx * cos - gy * sin, y + bob + gx * sin + gy * cos)
        .setScale(((g.r * s * 1.5) / GLOW_RADIUS) * (1 + Math.sin(tick * 0.15 + i) * 0.08))
        .setAlpha(alpha * pulse);
    }
  }
}
