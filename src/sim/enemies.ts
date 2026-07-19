import { TICK_RATE } from './constants';

/**
 * Najeźdźcy z kosmosu (decyzja 2026-07-19, gdd.md 5.2).
 * Na razie kolory zamiast grafik. Miks fal zależy od czasu gry
 * (unlockAtSeconds + waga losowania).
 */
export interface RangedDef {
  /** Mag zatrzymuje się w tej odległości od gracza i strzela. */
  holdDistance: number;
  cooldownTicks: number;
  projectileSpeed: number;
  projectileDamage: number;
}

export interface EnemyDef {
  id: string;
  name: string;
  color: number;
  hp: number;
  speedMin: number;
  speedMax: number;
  contactDamage: number;
  /** Od której sekundy runu ten typ pojawia się w losowaniu spawnu. */
  unlockAtSeconds: number;
  /** Względna waga losowania typu przy spawnie. */
  weight: number;
  ranged?: RangedDef;
}

const secs = (s: number) => Math.round(s * TICK_RATE);

export const ENEMIES: EnemyDef[] = [
  {
    id: 'alien', name: 'Alien', color: 0x00ff88,
    hp: 3, speedMin: 70, speedMax: 110, contactDamage: 5,
    unlockAtSeconds: 0, weight: 10,
  },
  {
    id: 'demon', name: 'Demon', color: 0xff2965,
    hp: 2, speedMin: 120, speedMax: 155, contactDamage: 4,
    unlockAtSeconds: 30, weight: 5,
  },
  {
    id: 'mage', name: 'Alien Mage', color: 0x00ccff,
    hp: 2, speedMin: 60, speedMax: 80, contactDamage: 3,
    unlockAtSeconds: 45, weight: 3,
    ranged: { holdDistance: 320, cooldownTicks: secs(2), projectileSpeed: 240, projectileDamage: 8 },
  },
  {
    id: 'robot', name: 'Robot', color: 0xffcc00,
    hp: 8, speedMin: 45, speedMax: 65, contactDamage: 10,
    unlockAtSeconds: 60, weight: 3,
  },
];
