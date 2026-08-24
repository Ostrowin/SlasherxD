import { secs, type BossDef } from './types';

/**
 * HIVE COLOSSUS — boss fali 9 (dodany 2026-08-22, PRYMITYWY STARTOWE).
 *
 * Zamysł: ŚCIANA tuż przed finałem. Ciężki czołg w szkole Hive Queen (młot +
 * pierścień + przyzwania), ale większy i groźniejszy — ma zmęczyć drużynę przed
 * fałą 10. Faza 2 dokłada szarżę, żeby nie dało się go po prostu obiec w kółko.
 *
 * Plik DEKLARATYWNY. Wartości do STROJENIA.
 */
export const HIVE_COLOSSUS: BossDef = {
  id: 'hive-colossus',
  name: 'HIVE COLOSSUS',
  color: 0xff8c1a,
  shapeSides: 8,
  hp: 860,
  radius: 50,
  speed: 74,
  contactDamage: 16,

  phases: [
    {
      hpFraction: 1,
      announce: 'HIVE COLOSSUS ROLLS IN',
      attackIntervalTicks: secs(2.0),
      speedMult: 1,
      attacks: [
        { kind: 'slam', windupTicks: secs(0.95), hitRadius: 210, damage: 30, recoverTicks: secs(1.1) },
        {
          kind: 'ring', windupTicks: secs(0.85), count: 18,
          projectileSpeed: 202, damage: 13, recoverTicks: secs(0.9),
        },
        { kind: 'summon', windupTicks: secs(0.75), enemyId: 'brute', count: 3, recoverTicks: secs(0.8) },
        { kind: 'slam', windupTicks: secs(0.9), hitRadius: 210, damage: 30, recoverTicks: secs(1.1) },
      ],
    },
    {
      hpFraction: 0.5,
      announce: 'COLOSSUS RAMPAGE',
      attackIntervalTicks: secs(1.4),
      speedMult: 1.3,
      attacks: [
        {
          kind: 'charge', windupTicks: secs(0.65), speed: 445,
          durationTicks: secs(0.85), damage: 32, hitRadius: 62, recoverTicks: secs(1.0),
        },
        { kind: 'slam', windupTicks: secs(0.8), hitRadius: 240, damage: 36, recoverTicks: secs(1.0) },
        {
          kind: 'ring', windupTicks: secs(0.7), count: 24,
          projectileSpeed: 226, damage: 15, recoverTicks: secs(0.8),
        },
        { kind: 'summon', windupTicks: secs(0.7), enemyId: 'demon', count: 6, recoverTicks: secs(0.8) },
      ],
    },
  ],
};
