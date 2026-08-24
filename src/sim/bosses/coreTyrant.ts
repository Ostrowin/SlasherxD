import { secs, type BossDef } from './types';

/**
 * CORE TYRANT — finał mapy „Impact Crater" (fala 10). Trzy fazy, coraz szybsze
 * i coraz gęstsze — ma być NAJBARDZIEJ dynamiczny: często atakuje, miesza
 * szarże, pierścienie, młoty i przyzwania, a w ostatniej fazie („Critical Mass")
 * robi się chaos wymagający ciągłej reakcji.
 */
export const CORE_TYRANT: BossDef = {
  id: 'core-tyrant',
  name: 'CORE TYRANT',
  color: 0xffcf3f,
  shapeSides: 12,
  hp: 1600,
  radius: 50,
  speed: 82,
  contactDamage: 18,

  phases: [
    {
      hpFraction: 1,
      announce: 'THE CORE TYRANT AWAKENS',
      attackIntervalTicks: secs(1.5),
      speedMult: 1,
      attacks: [
        { kind: 'slam', windupTicks: secs(0.9), hitRadius: 200, damage: 28, recoverTicks: secs(0.9) },
        { kind: 'ring', windupTicks: secs(0.8), count: 16, projectileSpeed: 210, damage: 13, recoverTicks: secs(0.8) },
        { kind: 'charge', windupTicks: secs(0.6), speed: 460, durationTicks: secs(0.8), damage: 26, hitRadius: 55, recoverTicks: secs(0.8) },
        { kind: 'summon', windupTicks: secs(0.65), enemyId: 'mage', count: 5, recoverTicks: secs(0.6) },
      ],
    },
    {
      hpFraction: 0.66,
      announce: 'MELTDOWN',
      attackIntervalTicks: secs(1.1),
      speedMult: 1.3,
      attacks: [
        { kind: 'charge', windupTicks: secs(0.45), speed: 520, durationTicks: secs(0.6), damage: 28, hitRadius: 55, recoverTicks: secs(0.35) },
        { kind: 'charge', windupTicks: secs(0.45), speed: 520, durationTicks: secs(0.6), damage: 28, hitRadius: 55, recoverTicks: secs(0.6) },
        { kind: 'ring', windupTicks: secs(0.6), count: 24, projectileSpeed: 235, damage: 15, recoverTicks: secs(0.7) },
        { kind: 'slam', windupTicks: secs(0.7), hitRadius: 240, damage: 34, recoverTicks: secs(0.8) },
        { kind: 'summon', windupTicks: secs(0.6), enemyId: 'brute', count: 3, recoverTicks: secs(0.6) },
      ],
    },
    {
      hpFraction: 0.33,
      announce: 'CRITICAL MASS',
      attackIntervalTicks: secs(0.8),
      speedMult: 1.55,
      attacks: [
        { kind: 'charge', windupTicks: secs(0.35), speed: 580, durationTicks: secs(0.55), damage: 32, hitRadius: 58, recoverTicks: secs(0.3) },
        { kind: 'ring', windupTicks: secs(0.5), count: 30, projectileSpeed: 255, damage: 16, recoverTicks: secs(0.55) },
        { kind: 'slam', windupTicks: secs(0.6), hitRadius: 265, damage: 40, recoverTicks: secs(0.6) },
        { kind: 'charge', windupTicks: secs(0.35), speed: 580, durationTicks: secs(0.55), damage: 32, hitRadius: 58, recoverTicks: secs(0.3) },
        { kind: 'summon', windupTicks: secs(0.5), enemyId: 'demon', count: 8, recoverTicks: secs(0.5) },
      ],
    },
  ],
};
