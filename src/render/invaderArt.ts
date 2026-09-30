import Phaser from 'phaser';
import { ATLASES, BOSS_ART, ENEMY_ART, INVADER_SIZE, type InvaderArtDef } from './artManifest';

/**
 * Najeźdźcy z atlasu (plan-grafik.md, Etap 3): horda w atlasie `invaders`, bossowie w `bosses`.
 * Źródła: tools/svg_gen/ws_invaders.py → `npm run bake-art`. Brak atlasu albo klatki = stary świecący wielokąt.
 *
 * Kolory typu siedzą w rysunku (oczy, rdzenie), więc sprite NIE dostaje `setTint(def.color)`. Sygnały stanu
 * (trafienie, zamach, odpoczynek, status) mają nowe nośniki — patrz `mobTint` i tabela w planie.
 */

export interface InvaderLook {
  atlasKey: string;
  frame: string;
  /** Skala Image: piksele ekranu na piksel atlasu, żeby ciało = promień z symulacji × INVADER_SIZE. */
  scale: number;
  /** `true` pod indeksem statusu = miganie jednolitym kolorem (tint ginie na tym rysunku, D6). */
  statusFill: boolean[];
  /** Punkty neonu bossów (px atlasu względem kotwicy). Horda: pusto — 0 dodatkowych obiektów na wroga. */
  glow: [number, number, number][];
}

export function preloadInvaderArt(scene: Phaser.Scene): void {
  for (const a of [ATLASES.invaders, ATLASES.bosses]) scene.load.atlas(a.key, `art/${a.key}.png`, `art/${a.key}.json`);
}

function lookFor(
  scene: Phaser.Scene,
  art: InvaderArtDef | undefined,
  atlasKey: string,
  radius: number,
  statusIds: string[],
): InvaderLook | null {
  if (!art || !scene.textures.exists(atlasKey)) return null;
  const tex = scene.textures.get(atlasKey);
  if (!tex.has(art.frame)) return null;
  const data = tex.get(art.frame).customData as { statusFill?: string[]; glow?: [number, number, number][] };
  const atlasScale = atlasKey === ATLASES.bosses.key ? ATLASES.bosses.scale : ATLASES.invaders.scale;
  return {
    atlasKey,
    frame: art.frame,
    scale: (radius * INVADER_SIZE) / (art.body * atlasScale),
    statusFill: statusIds.map((id) => data.statusFill?.includes(id) ?? false),
    glow: data.glow ?? [],
  };
}

/** Wygląd każdego typu hordy (indeks = `ENEMIES`). */
export function enemyLooks(
  scene: Phaser.Scene,
  enemies: readonly { id: string; radius: number }[],
  statusIds: string[],
): (InvaderLook | null)[] {
  return enemies.map((e) => lookFor(scene, ENEMY_ART[e.id], ATLASES.invaders.key, e.radius, statusIds));
}

/** Wygląd każdego bossa (indeks = `BOSSES`). */
export function bossLooks(
  scene: Phaser.Scene,
  bosses: readonly { id: string; radius: number }[],
  statusIds: string[],
): (InvaderLook | null)[] {
  return bosses.map((b) => lookFor(scene, BOSS_ART[b.id], ATLASES.bosses.key, b.radius, statusIds));
}

export interface MobSignal {
  hit: boolean;
  windup: boolean;
  recover: boolean;
  /** Indeks statusu, gdy status właśnie „mignął” (co 4 ticki), inaczej -1. */
  statusBlink: number;
  statusColor: number;
  /** Kolor energii typu — zamach miga nim zamiast bieli (zapowiedź ataku w kolorze wroga). */
  energy: number;
  tick: number;
}

/**
 * Nośniki sygnałów dla wroga z grafiką (D6 + tabela Etapu 3). Kolejność jak dawniej:
 * trafienie > zamach > odpoczynek > status > nic. Zero nowych obiektów — tylko tint i alfa.
 */
export function applyMobSignal(s: Phaser.GameObjects.Image, look: InvaderLook, sig: MobSignal): void {
  if (sig.hit) s.setTintFill(0xffffff).setAlpha(1);
  else if (sig.windup) {
    // pulsujące wypełnienie kolorem energii: sylwetka „ładuje się” i miga w rytmie ~5 Hz
    if (Math.floor(sig.tick / 3) % 2 === 0) s.setTintFill(sig.energy);
    else s.clearTint();
    s.setAlpha(1);
  } else if (sig.recover) s.setTint(0xb0b0b8).setAlpha(0.7);
  else if (sig.statusBlink >= 0) {
    if (look.statusFill[sig.statusBlink]) s.setTintFill(sig.statusColor);
    else s.setTint(sig.statusColor);
    s.setAlpha(1);
  } else s.clearTint().setAlpha(1);
}
