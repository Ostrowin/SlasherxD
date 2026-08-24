import { secs, type BossDef } from './types';

/**
 * OBSIDIAN COLOSSUS — boss fali 7 mapy „Impact Crater". Ciężki, powolny czołg:
 * karze stanie blisko (młot) i daleko (pierścień), dorzuca pomocników. Po
 * połowie HP dochodzi szarża, żeby nie dało się go po prostu okrążać.
 */
export const OBSIDIAN_COLOSSUS: BossDef = {
  id: 'obsidian-colossus',
  name: 'OBSIDIAN COLOSSUS',
  color: 0x7a4fa0,
  shapeSides: 8,
  hp: 950,
  radius: 48,
  speed: 74,
  contactDamage: 16,

  phases: [
    {
      hpFraction: 1,
      announce: 'OBSIDIAN COLOSSUS RISES',
      attackIntervalTicks: secs(1.6),
      speedMult: 1,
      attacks: [
        { kind: 'slam', windupTicks: secs(0.9), hitRadius: 205, damage: 28, recoverTicks: secs(1.0) },
        { kind: 'ring', windupTicks: secs(0.8), count: 16, projectileSpeed: 200, damage: 13, recoverTicks: secs(0.8) },
        { kind: 'summon', windupTicks: secs(0.7), enemyId: 'brute', count: 3, recoverTicks: secs(0.7) },
        { kind: 'slam', windupTicks: secs(0.85), hitRadius: 205, damage: 28, recoverTicks: secs(1.0) },
      ],
    },
    {
      hpFraction: 0.5,
      announce: 'MOLTEN WRATH',
      attackIntervalTicks: secs(1.2),
      speedMult: 1.3,
      attacks: [
        { kind: 'slam', windupTicks: secs(0.75), hitRadius: 235, damage: 34, recoverTicks: secs(0.9) },
        { kind: 'charge', windupTicks: secs(0.6), speed: 430, durationTicks: secs(0.8), damage: 30, hitRadius: 60, recoverTicks: secs(0.9) },
        { kind: 'ring', windupTicks: secs(0.65), count: 22, projectileSpeed: 225, damage: 15, recoverTicks: secs(0.7) },
        { kind: 'summon', windupTicks: secs(0.65), enemyId: 'demon', count: 6, recoverTicks: secs(0.7) },
      ],
    },
  ],
};
