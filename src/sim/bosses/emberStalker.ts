import { secs, type BossDef } from './types';

/**
 * EMBER STALKER — boss fali 5 mapy „Impact Crater", a na fali 9 pojawia się
 * potrójnie (trzej naraz). Dlatego jest RUCHLIWY i niezbyt gruby: ma zmuszać
 * do ciągłego uniku (szarże), nie do długiego młócenia jednego celu.
 *
 * Deklaratywny, jak każdy boss — same liczby i kolejność ataków.
 */
export const EMBER_STALKER: BossDef = {
  id: 'ember-stalker',
  name: 'EMBER STALKER',
  color: 0xff5a2b,
  shapeSides: 4, // ostry, szybki
  hp: 480, // ×3 na fali 9 ≈ 1440 łącznie
  radius: 34,
  speed: 150,
  contactDamage: 12,

  phases: [
    {
      hpFraction: 1,
      announce: 'EMBER STALKER IGNITES',
      attackIntervalTicks: secs(1.3),
      speedMult: 1,
      attacks: [
        { kind: 'charge', windupTicks: secs(0.55), speed: 500, durationTicks: secs(0.7), damage: 20, hitRadius: 46, recoverTicks: secs(0.6) },
        { kind: 'ring', windupTicks: secs(0.6), count: 12, projectileSpeed: 210, damage: 11, recoverTicks: secs(0.7) },
        { kind: 'charge', windupTicks: secs(0.5), speed: 520, durationTicks: secs(0.7), damage: 20, hitRadius: 46, recoverTicks: secs(0.6) },
        { kind: 'summon', windupTicks: secs(0.55), enemyId: 'alien', count: 4, recoverTicks: secs(0.5) },
      ],
    },
    {
      hpFraction: 0.5,
      announce: 'BURNING FRENZY',
      attackIntervalTicks: secs(0.9),
      speedMult: 1.45,
      attacks: [
        { kind: 'charge', windupTicks: secs(0.4), speed: 560, durationTicks: secs(0.6), damage: 24, hitRadius: 50, recoverTicks: secs(0.35) },
        { kind: 'ring', windupTicks: secs(0.5), count: 18, projectileSpeed: 235, damage: 12, recoverTicks: secs(0.6) },
        { kind: 'slam', windupTicks: secs(0.6), hitRadius: 170, damage: 26, recoverTicks: secs(0.7) },
        { kind: 'charge', windupTicks: secs(0.4), speed: 560, durationTicks: secs(0.6), damage: 24, hitRadius: 50, recoverTicks: secs(0.5) },
      ],
    },
  ],
};
