import Phaser from 'phaser';
import type { Player } from '../sim/world';
import { makeGlowCircle } from './textures';
import { ATLASES, HEROES, SCREEN_PX_PER_UNIT, heroFrameFor } from './artManifest';

/**
 * Wektorowe postacie graczy z atlasu (plan: docs/designs/plan-grafik.md): źródła SVG w art/svg, wypalane
 * przez `npm run bake-art` do public/art/heroes.{png,json}. Co ma grafikę, mówi `artManifest.ts`;
 * pozostałe klasy dalej rysują się świecącym pięciokątem.
 *
 * Postać to warstwy z jednego atlasu (jedna tekstura = batching):
 *   - obwódka `<klatka>#rim` pod spodem, barwiona kolorem slotu gracza (kontur z TD ginie na tle gry),
 *   - sprite bazowy (bez tintu — kolory są w rysunku),
 *   - pas drużyny `<klatka>#team` barwiony tym samym kolorem slotu,
 *   - neon: poświata z `textures.ts` (blend ADD) w punktach `glow` klatki — NIE jest wypalana w sprite.
 */

const ATLAS = ATLASES.heroes;
export const ATLAS_KEY = ATLAS.key;

/** Piksele ekranu na piksel atlasu — atlas jest wypalany gęściej (0.75), niż go rysujemy (0.5 px/jedn.). */
const DISPLAY_SCALE = SCREEN_PX_PER_UNIT / ATLAS.scale;
/** Stopy leżą tyle pikseli pod środkiem hitboxu (sim liczy pozycję jako środek koła). */
const FEET_OFFSET = 12;
const GLOW_KEY = 'hero-glow';
const GLOW_RADIUS = 8;

export function preloadHeroArt(scene: Phaser.Scene): void {
  scene.load.atlas(ATLAS_KEY, `art/${ATLAS_KEY}.png`, `art/${ATLAS_KEY}.json`);
}

/** Czy klasa ma wypaloną grafikę. Brak atlasu (bake nieuruchomiony) = `false` i pięciokąt. */
export function hasHeroArt(scene: Phaser.Scene, classId: string): boolean {
  const frame = heroFrameFor(classId, -1);
  return !!frame && scene.textures.exists(ATLAS_KEY) && scene.textures.get(ATLAS_KEY).has(frame);
}

/**
 * Warstwy jednej postaci. `base` to zwykły Image — GameScene trzyma go w `playerSprites`,
 * więc kamera i efekty (które czytają `.x/.y`) działają bez zmian: pozycja obrazka = środek
 * hitboxu, a stopy przesuwamy przez origin.
 */
export class HeroRig {
  readonly base: Phaser.GameObjects.Image;
  private readonly rim: Phaser.GameObjects.Image | null;
  private readonly team: Phaser.GameObjects.Image | null;
  private readonly shadow: Phaser.GameObjects.Ellipse;
  private readonly glows: { img: Phaser.GameObjects.Image; x: number; y: number; r: number }[] = [];
  private readonly originX: number;
  private readonly originY: number;
  private facing = 1;
  /** Wysokość postaci nad środkiem hitboxu — tam idą paski HP kolegów. */
  readonly topOffset: number;

  /**
   * @param playerColor kolor slotu gracza (`PLAYER_COLORS`) — obwódka i pas drużyny (D3 w planie).
   */
  constructor(scene: Phaser.Scene, classId: string, playerColor: number) {
    const frameName = heroFrameFor(classId, -1)!;
    const energy = HEROES[classId].energy;
    const tex = scene.textures.get(ATLAS_KEY);
    const frame = tex.get(frameName);
    const data = frame.customData as { glow?: [number, number, number][] };

    this.shadow = scene.add.ellipse(0, 0, 40, 12, 0x000000, 0.4).setDepth(2.9);
    // obwódka POD postacią i nad cieniem — inaczej przykryłaby rysunek
    this.rim = tex.has(frameName + '#rim')
      ? scene.add.image(0, 0, ATLAS_KEY, frameName + '#rim').setTint(playerColor).setDepth(2.95)
      : null;
    this.base = scene.add.image(0, 0, ATLAS_KEY, frameName).setDepth(3);
    // origin z pivota stóp, przesunięty w górę o FEET_OFFSET — pozycja Image = środek hitboxu
    this.originX = frame.pivotX;
    this.originY = frame.pivotY - FEET_OFFSET / DISPLAY_SCALE / frame.height;
    this.team = tex.has(frameName + '#team')
      ? scene.add.image(0, 0, ATLAS_KEY, frameName + '#team').setTint(playerColor).setDepth(3.01)
      : null;
    for (const img of [this.rim, this.base, this.team]) img?.setOrigin(this.originX, this.originY);

    makeGlowCircle(scene, GLOW_KEY, GLOW_RADIUS);
    for (const [x, y, r] of data.glow ?? []) {
      const img = scene.add
        .image(0, 0, GLOW_KEY)
        .setTint(energy)
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

    for (const img of [this.rim, this.base, this.team]) {
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
