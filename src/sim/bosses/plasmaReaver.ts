import { secs, type BossDef } from './types';

/**
 * PLASMA REAVER — boss fali 7 (dodany 2026-08-22, PRYMITYWY STARTOWE).
 *
 * Zamysł: eskalacja Void Wardena. Ta sama szkoła „karz za stanie" (szarże +
 * gęste pierścienie), ale twardszy i z magami-artylerią, żeby fala 7 nie była
 * łatwiejsza od 5. Faza 2 to overload — podwójne szarże i ściana pocisków.
 *
 * Plik DEKLARATYWNY — same liczby, mechanika ataków siedzi w world.ts.
 * Wartości do STROJENIA (na razie prymitywy startowe).
 */
export const PLASMA_REAVER: BossDef = {
  id: 'plasma-reaver',
  name: 'PLASMA REAVER',
  color: 0x00e5ff,
  shapeSides: 5,
  hp: 640,
  radius: 38,
  speed: 122,
  contactDamage: 13,

  phases: [
    {
      hpFraction: 1,
      announce: 'PLASMA REAVER LOCKS ON',
      attackIntervalTicks: secs(1.5),
      speedMult: 1,
      attacks: [
        {
          kind: 'charge', windupTicks: secs(0.6), speed: 485,
          durationTicks: secs(0.7), damage: 22, hitRadius: 48, recoverTicks: secs(0.7),
        },
        {
          kind: 'ring', windupTicks: secs(0.7), count: 16,
          projectileSpeed: 222, damage: 12, recoverTicks: secs(0.8),
        },
        { kind: 'summon', windupTicks: secs(0.65), enemyId: 'mage', count: 5, recoverTicks: secs(0.6) },
        {
          kind: 'charge', windupTicks: secs(0.55), speed: 505,
          durationTicks: secs(0.7), damage: 22, hitRadius: 48, recoverTicks: secs(0.7),
        },
      ],
    },
    {
      hpFraction: 0.5,
      announce: 'REAVER OVERLOAD',
      attackIntervalTicks: secs(1.0),
      speedMult: 1.45,
      attacks: [
        // Podwójna szarża jak u Wardena, ale mocniejsza — fala 7, nie 5.
        {
          kind: 'charge', windupTicks: secs(0.4), speed: 545,
          durationTicks: secs(0.6), damage: 26, hitRadius: 52, recoverTicks: secs(0.35),
        },
        {
          kind: 'charge', windupTicks: secs(0.4), speed: 545,
          durationTicks: secs(0.6), damage: 26, hitRadius: 52, recoverTicks: secs(0.7),
        },
        {
          kind: 'ring', windupTicks: secs(0.5), count: 26,
          projectileSpeed: 248, damage: 13, recoverTicks: secs(0.7),
        },
        // Jeden slam — kara za przyklejenie się, gdy gracz opanuje uniki szarż.
        { kind: 'slam', windupTicks: secs(0.6), hitRadius: 170, damage: 26, recoverTicks: secs(0.8) },
      ],
    },
  ],
};
