import { secs, type BossDef } from './types';

/**
 * HIVE QUEEN — pierwszy boss, koniec runu.
 *
 * Zamysł walki: powolna, ale ciężka. W pierwszej fazie karze za stanie blisko
 * (młot) i za stanie daleko (pierścień pocisków), więc trzeba się ruszać.
 * Po zejściu poniżej połowy HP wpada w furię: szarżuje i przyzywa pomocników.
 *
 * Cały plik jest DEKLARATYWNY — żadnej logiki, tylko liczby i kolejność
 * ataków. Nowy boss = kopiujesz ten plik i zmieniasz wartości.
 */
export const HIVE_QUEEN: BossDef = {
  id: 'hive-queen',
  name: 'HIVE QUEEN',
  color: 0xff3ea5,
  // Dużo boków = ciężka, masywna bryła; pasuje do powolnego czołgu.
  shapeSides: 10,
  hp: 900,
  radius: 46,
  speed: 62,
  contactDamage: 14,

  phases: [
    {
      hpFraction: 1,
      announce: 'HIVE QUEEN AWAKENS',
      attackIntervalTicks: secs(2.2),
      speedMult: 1,
      attacks: [
        // Blisko boli: ciężki młot z czytelnym zamachem.
        { kind: 'slam', windupTicks: secs(1), hitRadius: 190, damage: 26, recoverTicks: secs(1.2) },
        // Daleko też boli: pierścień pocisków wymusza szukanie osłony.
        {
          kind: 'ring', windupTicks: secs(0.9), count: 14,
          projectileSpeed: 190, damage: 12, recoverTicks: secs(1),
        },
        { kind: 'slam', windupTicks: secs(1), hitRadius: 190, damage: 26, recoverTicks: secs(1.2) },
        // Trochę towarzystwa, żeby gracz nie mógł skupić się tylko na bossie.
        { kind: 'summon', windupTicks: secs(0.8), enemyId: 'demon', count: 6, recoverTicks: secs(0.8) },
      ],
    },
    {
      hpFraction: 0.5,
      announce: 'THE QUEEN IS ENRAGED',
      attackIntervalTicks: secs(1.5),
      speedMult: 1.35,
      attacks: [
        // Faza furii: szarża zmusza do uników w bok, nie do ucieczki w tył.
        {
          kind: 'charge', windupTicks: secs(0.7), speed: 430,
          durationTicks: secs(0.85), damage: 30, hitRadius: 60, recoverTicks: secs(1.1),
        },
        {
          kind: 'ring', windupTicks: secs(0.7), count: 20,
          projectileSpeed: 220, damage: 14, recoverTicks: secs(0.8),
        },
        { kind: 'slam', windupTicks: secs(0.8), hitRadius: 220, damage: 32, recoverTicks: secs(1) },
        { kind: 'summon', windupTicks: secs(0.7), enemyId: 'brute', count: 2, recoverTicks: secs(0.8) },
      ],
    },
  ],
};
