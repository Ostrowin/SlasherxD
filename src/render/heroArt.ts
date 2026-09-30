import Phaser from 'phaser';
import type { Player } from '../sim/world';
import { makeGlowCircle } from './textures';
import { ATLASES, HEROES, SCREEN_PX_PER_UNIT, SUMMON_SCALE, SUMMONS, heroFrameFor } from './artManifest';

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

/** Przemiana: czas trwania i liczba iskier — krótko, żeby nie zasłaniać walki. */
const MORPH_MS = 420;
const MORPH_SPARKS = 14;

/**
 * Warstwy jednej postaci. `base` to zwykły Image — GameScene trzyma go w `playerSprites`,
 * więc kamera i efekty (które czytają `.x/.y`) działają bez zmian: pozycja obrazka = środek
 * hitboxu, a stopy przesuwamy przez origin.
 *
 * Zestaw klatek zmienia się w trakcie runu (szeregowy → specjalizacja, plan Etap 1): `setSpec`
 * przelicza origin, wysokość paska HP, obwódkę, pas drużyny i punkty neonu nowej klatki.
 */
export class HeroRig {
  readonly base: Phaser.GameObjects.Image;
  private readonly rim: Phaser.GameObjects.Image;
  private readonly team: Phaser.GameObjects.Image;
  private readonly shadow: Phaser.GameObjects.Ellipse;
  private readonly scene: Phaser.Scene;
  private readonly classId: string;
  private readonly energy: number;
  private glows: { img: Phaser.GameObjects.Image; x: number; y: number; r: number }[] = [];
  private originX = 0.5;
  private originY = 0.5;
  private facing = 1;
  private frameName = '';
  /** Wysokość postaci nad środkiem hitboxu — tam idą paski HP kolegów. */
  topOffset = 0;

  /**
   * @param playerColor kolor slotu gracza (`PLAYER_COLORS`) — obwódka i pas drużyny (D3 w planie).
   * @param specIndex specjalizacja na starcie (-1 = szeregowy).
   */
  constructor(scene: Phaser.Scene, classId: string, playerColor: number, specIndex: number) {
    this.scene = scene;
    this.classId = classId;
    this.energy = HEROES[classId].energy;
    const first = heroFrameFor(classId, specIndex)!;
    this.shadow = scene.add.ellipse(0, 0, 40, 12, 0x000000, 0.4).setDepth(2.9);
    // obwódka POD postacią i nad cieniem — inaczej przykryłaby rysunek
    this.rim = scene.add.image(0, 0, ATLAS_KEY, first).setTint(playerColor).setDepth(2.95);
    this.base = scene.add.image(0, 0, ATLAS_KEY, first).setDepth(3);
    this.team = scene.add.image(0, 0, ATLAS_KEY, first).setTint(playerColor).setDepth(3.01);
    makeGlowCircle(scene, GLOW_KEY, GLOW_RADIUS);
    this.setFrameSet(first);
  }

  /** Klatka dla specjalizacji; `playEffect` = błysk i iskry (zwykły wybór w trakcie walki). */
  setSpec(specIndex: number, playEffect: boolean): void {
    const next = heroFrameFor(this.classId, specIndex);
    if (!next || next === this.frameName) return;
    this.setFrameSet(next);
    if (playEffect) this.playMorph();
  }

  private setFrameSet(frameName: string): void {
    const tex = this.scene.textures.get(ATLAS_KEY);
    const frame = tex.get(frameName);
    this.frameName = frameName;
    this.base.setFrame(frameName);
    // obwódka i pas są opcjonalne per klatka (np. rysunek bez magenty) — brak = warstwa ukryta
    const layers: [Phaser.GameObjects.Image, string][] = [
      [this.rim, '#rim'],
      [this.team, '#team'],
    ];
    for (const [img, suffix] of layers) {
      const has = tex.has(frameName + suffix);
      img.setVisible(has);
      if (has) img.setFrame(frameName + suffix);
    }
    // origin z pivota stóp, przesunięty w górę o FEET_OFFSET — pozycja Image = środek hitboxu
    this.originX = frame.pivotX;
    this.originY = frame.pivotY - FEET_OFFSET / DISPLAY_SCALE / frame.height;
    for (const img of [this.rim, this.base, this.team]) img.setOrigin(this.originX, this.originY);
    this.topOffset = frame.pivotY * frame.height * DISPLAY_SCALE - FEET_OFFSET;

    for (const g of this.glows) g.img.destroy();
    const data = frame.customData as { glow?: [number, number, number][] };
    this.glows = (data.glow ?? []).map(([x, y, r]) => ({
      img: this.scene.add
        .image(0, 0, GLOW_KEY)
        .setTint(this.energy)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(3.02),
      x,
      y,
      r,
    }));
  }

  /**
   * Przemiana przy wyborze specjalizacji: biały błysk sylwetki, pierścień i iskry w kolorze energii rasy.
   * Obiekty jednorazowe, sprzątane po ~0,4 s — raz na run na gracza, więc bez poolingu.
   */
  private playMorph(): void {
    const { scene, base } = this;
    const flash = scene.add
      .image(base.x, base.y, ATLAS_KEY, this.frameName)
      .setOrigin(this.originX, this.originY)
      .setScale(base.scaleX, base.scaleY)
      .setTintFill(0xffffff)
      .setDepth(3.05);
    scene.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: base.scaleX * 1.25,
      scaleY: base.scaleY * 1.25,
      duration: MORPH_MS,
      ease: 'Quad.easeOut',
      onComplete: () => flash.destroy(),
    });
    const ring = scene.add
      .circle(base.x, base.y, 18, this.energy, 0)
      .setStrokeStyle(3, this.energy, 1)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(3.04);
    scene.tweens.add({
      targets: ring,
      scale: 4,
      alpha: 0,
      duration: MORPH_MS,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy(),
    });
    for (let i = 0; i < MORPH_SPARKS; i++) {
      const a = (i / MORPH_SPARKS) * Math.PI * 2;
      const dist = 40 + (i % 3) * 14;
      const spark = scene.add
        .image(base.x, base.y, GLOW_KEY)
        .setTint(this.energy)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setScale(0.5)
        .setDepth(3.04);
      scene.tweens.add({
        targets: spark,
        x: base.x + Math.cos(a) * dist,
        y: base.y + Math.sin(a) * dist,
        alpha: 0,
        scale: 0.15,
        duration: MORPH_MS + (i % 4) * 60,
        ease: 'Quad.easeOut',
        onComplete: () => spark.destroy(),
      });
    }
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
        .setPosition(x, y + bob)
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

/**
 * Przywołaniec z atlasu (`SUMMONS` w manifeście) albo `null` = zostaje świecący wielokąt.
 * Sprite z atlasu NIE dostaje `setTint(def.color)` — kolor przemalowałby rysunek (plan, Etap 1).
 */
export function summonFrameFor(scene: Phaser.Scene, minionId: string): string | null {
  const frame = SUMMONS[minionId];
  return frame && scene.textures.exists(ATLAS_KEY) && scene.textures.get(ATLAS_KEY).has(frame) ? frame : null;
}

/** Skala wyświetlania przywołańców z atlasu (`SUMMON_SCALE` w manifeście × gęstość postaci). */
export const SUMMON_DISPLAY_SCALE = DISPLAY_SCALE * SUMMON_SCALE;
