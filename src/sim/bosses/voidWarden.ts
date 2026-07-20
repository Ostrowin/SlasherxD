import { secs, type BossDef } from './types';

/**
 * VOID WARDEN — boss połowy runu (fala 5).
 *
 * Zamysł walki: CELOWO odwrotność Hive Queen. Królowa jest powolna i karze
 * za wybór dystansu (młot z bliska, pierścień z daleka), więc gra się z nią
 * o pozycję. Warden jest szybki i prawie nie ma ataków obszarowych — karze
 * za STANIE W MIEJSCU. Szarże lecą po prostej, więc unik jest zawsze w bok,
 * nigdy w tył: przed Wardenem się nie ucieknie, trzeba go przepuścić.
 *
 * Dlatego ma wyraźnie mniej HP niż Królowa (fala 5, nie 10), ale trafia
 * częściej — walka ma być krótka i nerwowa, nie długa i ciężka.
 *
 * Plik jest DEKLARATYWNY: same liczby i kolejność ataków, zero logiki.
 * Cała mechanika ataków siedzi w world.ts i jest wspólna dla wszystkich bossów.
 */
export const VOID_WARDEN: BossDef = {
  id: 'void-warden',
  name: 'VOID WARDEN',
  color: 0x9d4edd,
  // Ostry trójkąt — na pierwszy rzut oka widać, że to coś szybkiego.
  shapeSides: 3,
  hp: 520,
  radius: 34,
  speed: 118,
  contactDamage: 10,

  phases: [
    {
      hpFraction: 1,
      announce: 'VOID WARDEN PHASES IN',
      // Krótsza przerwa niż u Królowej — Warden nie daje odetchnąć.
      attackIntervalTicks: secs(1.6),
      speedMult: 1,
      attacks: [
        // Szarża jako atak PODSTAWOWY, nie finisher — to jest cała ta walka.
        {
          kind: 'charge', windupTicks: secs(0.65), speed: 460,
          durationTicks: secs(0.7), damage: 20, hitRadius: 46, recoverTicks: secs(0.9),
        },
        // Rzadki pierścień, żeby gracz nie mógł po prostu kręcić kółek w rogu.
        {
          kind: 'ring', windupTicks: secs(0.75), count: 10,
          projectileSpeed: 200, damage: 10, recoverTicks: secs(0.8),
        },
        {
          kind: 'charge', windupTicks: secs(0.6), speed: 480,
          durationTicks: secs(0.7), damage: 20, hitRadius: 46, recoverTicks: secs(0.85),
        },
        // Magowie strzelają z dystansu — zmuszają do ruchu także między szarżami.
        { kind: 'summon', windupTicks: secs(0.7), enemyId: 'mage', count: 4, recoverTicks: secs(0.7) },
      ],
    },
    {
      hpFraction: 0.55,
      announce: 'THE VOID ANSWERS',
      attackIntervalTicks: secs(1.1),
      speedMult: 1.4,
      attacks: [
        // Podwójna szarża: pierwszy unik nie wystarcza, trzeba zaraz drugiego.
        {
          kind: 'charge', windupTicks: secs(0.45), speed: 520,
          durationTicks: secs(0.6), damage: 24, hitRadius: 50, recoverTicks: secs(0.35),
        },
        {
          kind: 'charge', windupTicks: secs(0.4), speed: 520,
          durationTicks: secs(0.6), damage: 24, hitRadius: 50, recoverTicks: secs(0.8),
        },
        // Gęsty pierścień: luk jest mało, więc trzeba je wypatrzeć w biegu.
        {
          kind: 'ring', windupTicks: secs(0.55), count: 22,
          projectileSpeed: 235, damage: 12, recoverTicks: secs(0.7),
        },
        // Jedyny slam w całej walce — kara za przyklejenie się do bossa,
        // gdy gracz nauczy się już unikać szarż.
        { kind: 'slam', windupTicks: secs(0.7), hitRadius: 150, damage: 24, recoverTicks: secs(0.9) },
      ],
    },
  ],
};
