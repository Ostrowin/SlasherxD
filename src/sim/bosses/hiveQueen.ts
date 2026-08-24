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
  // BUFF finału 2026-08-22: więcej HP/dmg, szybsze ataki, TRZECIA faza furii.
  hp: 1250,
  radius: 46,
  speed: 62,
  contactDamage: 18,

  phases: [
    {
      hpFraction: 1,
      announce: 'HIVE QUEEN AWAKENS',
      attackIntervalTicks: secs(1.9),
      speedMult: 1,
      attacks: [
        // Blisko boli: ciężki młot z czytelnym zamachem.
        { kind: 'slam', windupTicks: secs(0.95), hitRadius: 210, damage: 30, recoverTicks: secs(1.1) },
        // Daleko też boli: pierścień pocisków wymusza szukanie osłony.
        {
          kind: 'ring', windupTicks: secs(0.85), count: 18,
          projectileSpeed: 200, damage: 14, recoverTicks: secs(0.95),
        },
        { kind: 'slam', windupTicks: secs(0.95), hitRadius: 210, damage: 30, recoverTicks: secs(1.1) },
        // Więcej towarzystwa, żeby gracz nie mógł skupić się tylko na bossie.
        { kind: 'summon', windupTicks: secs(0.75), enemyId: 'demon', count: 8, recoverTicks: secs(0.75) },
      ],
    },
    {
      hpFraction: 0.5,
      announce: 'THE QUEEN IS ENRAGED',
      attackIntervalTicks: secs(1.3),
      speedMult: 1.4,
      attacks: [
        // Faza furii: szarża zmusza do uników w bok, nie do ucieczki w tył.
        {
          kind: 'charge', windupTicks: secs(0.6), speed: 470,
          durationTicks: secs(0.85), damage: 34, hitRadius: 62, recoverTicks: secs(1.0),
        },
        {
          kind: 'ring', windupTicks: secs(0.65), count: 26,
          projectileSpeed: 235, damage: 16, recoverTicks: secs(0.75),
        },
        { kind: 'slam', windupTicks: secs(0.75), hitRadius: 245, damage: 38, recoverTicks: secs(0.95) },
        { kind: 'summon', windupTicks: secs(0.65), enemyId: 'brute', count: 3, recoverTicks: secs(0.75) },
      ],
    },
    {
      // TRZECIA faza (nowa): ostatnie 25% HP to prawdziwy finał runu.
      hpFraction: 0.25,
      announce: 'THE HIVE CONSUMES ALL',
      attackIntervalTicks: secs(1.05),
      speedMult: 1.55,
      attacks: [
        // Podwójna szarża — pierwszy unik nie kończy sprawy.
        {
          kind: 'charge', windupTicks: secs(0.45), speed: 520,
          durationTicks: secs(0.7), damage: 36, hitRadius: 64, recoverTicks: secs(0.4),
        },
        {
          kind: 'charge', windupTicks: secs(0.4), speed: 520,
          durationTicks: secs(0.7), damage: 36, hitRadius: 64, recoverTicks: secs(0.7),
        },
        // Ściana pocisków — luk mało, trzeba je wypatrzeć w biegu.
        {
          kind: 'ring', windupTicks: secs(0.55), count: 32,
          projectileSpeed: 250, damage: 17, recoverTicks: secs(0.7),
        },
        { kind: 'slam', windupTicks: secs(0.7), hitRadius: 260, damage: 42, recoverTicks: secs(0.85) },
        { kind: 'summon', windupTicks: secs(0.6), enemyId: 'demon', count: 8, recoverTicks: secs(0.7) },
      ],
    },
  ],
};
