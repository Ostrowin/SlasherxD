import { TICK_RATE } from './constants';

/**
 * ═══════════════════════════════════════════════════════════════════
 *  KONFIGURACJA NAJEŹDŹCÓW — tu ustawiasz wrogów. Edytuj śmiało.
 * ═══════════════════════════════════════════════════════════════════
 */

/** Obrażenia od tłumu — im więcej wrogów Cię dotyka, tym mocniej boli. */
export const CONTACT_CONFIG = {
  /**
   * O ile procent rosną obrażenia za każdego DODATKOWEGO dotykającego wroga.
   * Bez tego stanie w środku hordy było bezpieczne (globalny cooldown obrażeń
   * sprawiał, że 300 wrogów zadawało tyle samo co jeden).
   */
  crowdDamagePercentPerEnemy: 11,
  /** Sufit mnożnika (2.2 = maksymalnie 2.2x obrażenia bazowe). */
  crowdDamageMaxMultiplier: 2.2,
};

export interface RangedDef {
  /** Wróg zatrzymuje się w tej odległości od gracza i strzela. */
  holdDistance: number;
  cooldownTicks: number;
  /** Telegraf: ile ticków „ładuje" strzał, zanim wypuści pocisk. */
  windupTicks: number;
  projectileSpeed: number;
  projectileDamage: number;
}

/**
 * Ciężki atak z telegrafem: wróg staje, ładuje cios (widoczne ostrzeżenie),
 * uderza w obszarze, po czym jest bezbronny przez chwilę.
 * To tworzy rytm walki: podejdź → uderz → odskocz przed młotem.
 */
export interface SlamDef {
  /** Dystans, na którym wróg rozpoczyna zamach. */
  triggerRange: number;
  /** Ile ticków trwa zamach (czas gracza na ucieczkę). */
  windupTicks: number;
  /** Promień rażenia uderzenia. */
  hitRadius: number;
  damage: number;
  /** Bezbronność po uderzeniu — okno na kontrę. */
  recoverTicks: number;
}

export interface EnemyDef {
  id: string;
  name: string;
  color: number;
  hp: number;
  speedMin: number;
  speedMax: number;
  contactDamage: number;
  /** Promień kolizji; większy = fizycznie większy wróg. */
  radius: number;
  /** Od której sekundy runu ten typ pojawia się w losowaniu spawnu. */
  unlockAtSeconds: number;
  /** Względna waga losowania typu przy spawnie. */
  weight: number;
  /** Twardy limit sztuk tego typu naraz (0 = bez limitu). */
  maxAlive: number;
  ranged?: RangedDef;
  slam?: SlamDef;
}

const secs = (s: number) => Math.round(s * TICK_RATE);

export const ENEMIES: EnemyDef[] = [
  {
    id: 'alien', name: 'Alien', color: 0x00ff88,
    // HP > obrażeń auto-ataku większości klas: podstawowy wróg nie może padać
    // od jednego tyknięcia, bo wtedy stanie w miejscu tworzy bezpieczny pierścień.
    hp: 5, speedMin: 70, speedMax: 110, contactDamage: 5, radius: 12,
    unlockAtSeconds: 0, weight: 10, maxAlive: 0,
  },
  {
    id: 'demon', name: 'Demon', color: 0xff2965,
    hp: 2, speedMin: 120, speedMax: 155, contactDamage: 4, radius: 11,
    unlockAtSeconds: 25, weight: 6, maxAlive: 0,
  },
  {
    id: 'mage', name: 'Alien Mage', color: 0x00ccff,
    hp: 2, speedMin: 60, speedMax: 80, contactDamage: 3, radius: 12,
    // Bliżej gracza, rzadziej i z limitem — wcześniej wisiały poza zasięgiem
    // i ostrzeliwały bezkarnie. Strzał ma teraz telegraf, więc da się uciec.
    unlockAtSeconds: 45, weight: 2, maxAlive: 12,
    ranged: {
      holdDistance: 230, cooldownTicks: secs(2.5), windupTicks: secs(0.6),
      projectileSpeed: 210, projectileDamage: 8,
    },
  },
  {
    id: 'robot', name: 'Robot', color: 0xffcc00,
    hp: 8, speedMin: 45, speedMax: 65, contactDamage: 10, radius: 14,
    unlockAtSeconds: 60, weight: 3, maxAlive: 0,
  },
  {
    id: 'brute', name: 'Brute', color: 0xff6b1a,
    // Wielki, powolny, dużo HP. Nie zabija dotknięciem — zabija MŁOTEM,
    // przed którym trzeba odskoczyć. Serce nowego rytmu walki.
    hp: 45, speedMin: 55, speedMax: 70, contactDamage: 6, radius: 26,
    unlockAtSeconds: 40, weight: 2, maxAlive: 8,
    slam: {
      triggerRange: 105, windupTicks: secs(0.9), hitRadius: 130,
      damage: 18, recoverTicks: secs(1.2),
    },
  },
];
