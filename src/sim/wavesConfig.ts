import { TICK_RATE } from './constants';
import type { ItemKind } from './itemsConfig';

/**
 * ═══════════════════════════════════════════════════════════════════
 *  KONFIGURACJA FAL I ULEPSZEŃ — tu ustawiasz strukturę runu.
 *  Edytuj śmiało, Vite przeładuje grę po zapisie.
 *
 *  Rytm runu: FALA (walka) → PRZERWA (wybór ulepszenia) → kolejna fala...
 *  Po ostatniej fali: zwycięstwo.
 * ═══════════════════════════════════════════════════════════════════
 */

export const WAVE_CONFIG = {
  /** Ile fal trzeba przetrwać, żeby wygrać run. */
  totalWaves: 10,
  /** Ile sekund trwa jedna fala. */
  waveDurationSeconds: 45,
  /**
   * Co ile fal robimy dłuższą falę-wyzwanie (0 = wyłączone).
   * Taka fala trwa `eliteWaveMultiplier` razy dłużej i ma więcej wrogów.
   */
  eliteEveryNWaves: 5,
  eliteWaveMultiplier: 1.5,

  /** Ilu wrogów naraz w 1. fali. */
  mobsBase: 24,
  /** O ilu wrogów więcej z każdą kolejną falą. */
  mobsPerWave: 12,

  /**
   * Wrogowie rosną w siłę z każdą falą — bez tego gra była „albo giniesz na
   * fali 2, albo wygrywasz na spokojnie", bo moc gracza rosła wykładniczo
   * (ulepszenia + itemy), a wrogowie tylko się mnożyli.
   * Wartości to procent PONAD bazę z enemies.ts, za każdą falę po pierwszej.
   */
  enemyHpPercentPerWave: 15,
  enemyDamagePercentPerWave: 7,

  /**
   * O ile procent więcej wrogów za KAŻDEGO dodatkowego gracza w co-opie.
   * Bez tego ośmioosobowa drużyna rozkładałaby tę samą hordę na ośmiu
   * i gra byłaby banalna. 60 = przy 2 graczach jest 1.6x wrogów.
   */
  mobsPercentPerExtraPlayer: 60,
  /** Ile ulepszeń do wyboru w przerwie (max 4 — tyle mieści się na ekranie). */
  upgradeChoices: 3,
  /**
   * Czy po zakończeniu fali czyścić żywych wrogów i pociski.
   * true = prawdziwy oddech w przerwie (jak w Brotato).
   */
  clearMobsBetweenWaves: true,

  /**
   * Ile procent zwykłych wrogów zostaje na fali z bossem — walka ma być
   * o bossa, nie o przeciskanie się przez hordę.
   */
  bossWaveMobsPercent: 45,
  /** O ile procent więcej HP ma boss za każdego dodatkowego gracza w co-opie. */
  bossHpPercentPerExtraPlayer: 70,
};

export const WAVE_DURATION_TICKS = Math.round(WAVE_CONFIG.waveDurationSeconds * TICK_RATE);

/**
 * Który boss na której fali (numer fali → id z src/sim/bosses/).
 * Fala z bossem NIE kończy się na czas — trwa, dopóki boss żyje.
 */
export const BOSS_WAVES: Record<number, string> = {
  5: 'void-warden',
  10: 'hive-queen',
};

/**
 * Pula ulepszeń do wyboru między falami.
 * Używa tych samych typów efektów co itemy (itemsConfig.ts), ale wartości są
 * WYRAŹNIE mocniejsze — dropy to przypadek, ulepszenie to Twoja decyzja.
 *
 * `weight` = szansa pojawienia się w losowanej trójce.
 */
export interface UpgradeDef {
  kind: ItemKind;
  name: string;
  /** Krótki opis na karcie wyboru (EN — teksty w grze). */
  desc: string;
  color: number;
  weight: number;
  value: number;
}

export const UPGRADES: UpgradeDef[] = [
  { kind: 'strength',    name: 'Plasma Edge',      desc: '+25% damage',            color: 0xff8c42, weight: 10, value: 25 },
  { kind: 'attackSpeed', name: 'Overclock',        desc: '+20% attack speed',      color: 0xffe066, weight: 10, value: 20 },
  { kind: 'maxHp',       name: 'Bio Reinforcement', desc: '+30 max HP',            color: 0xff5db1, weight: 10, value: 30 },
  { kind: 'armor',       name: 'Ablative Plating', desc: '+2 armor',               color: 0x9db4c0, weight: 8,  value: 2 },
  { kind: 'speed',       name: 'Hyper Legs',       desc: '+12% move speed',        color: 0x38e8ff, weight: 8,  value: 12 },
  { kind: 'range',       name: 'Long Reach',       desc: '+18% attack range',      color: 0x74f7b8, weight: 8,  value: 18 },
  { kind: 'cooldown',    name: 'Quantum Capacitor', desc: '-15% skill cooldown',   color: 0xc77dff, weight: 7,  value: 15 },
  { kind: 'regen',       name: 'Nano Weave',       desc: '+1.0 HP per second',     color: 0x7bff9e, weight: 7,  value: 1 },
  { kind: 'leech',       name: 'Blood Protocol',   desc: '+1 HP per kill',         color: 0xb0004d, weight: 6,  value: 1 },
  { kind: 'thorns',      name: 'Spike Array',      desc: '+6 thorns damage',       color: 0x99d98c, weight: 6,  value: 6 },
  { kind: 'critChance',  name: 'Weak Point Scan',  desc: '+8% critical chance',    color: 0xff2e63, weight: 9,  value: 8 },
  { kind: 'critDamage',  name: 'Fracture Payload', desc: '+40% critical damage',   color: 0xff8fa3, weight: 7,  value: 40 },
  { kind: 'overshield',  name: 'Shield Battery',   desc: '+2 overshield charges',  color: 0x4dc9ff, weight: 5,  value: 2 },
  { kind: 'knockback',   name: 'Impact Amplifier', desc: '+50% knockback',         color: 0xffb703, weight: 5,  value: 50 },
  { kind: 'magnet',      name: 'Wide Collector',   desc: '+40 pickup radius',      color: 0xf1f5f9, weight: 5,  value: 40 },
  { kind: 'medkit',      name: 'Field Surgery',    desc: 'heal 60 HP now',         color: 0xff4d6d, weight: 6,  value: 60 },
];
