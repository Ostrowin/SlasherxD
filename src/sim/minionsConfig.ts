import { TICK_RATE } from './constants';
import { HIVE_QUEEN } from './bosses/hiveQueen';
import type { RingAttack, SlamAttack } from './bosses/types';

/**
 * ═══════════════════════════════════════════════════════════════════
 *  SOJUSZNICZE JEDNOSTKI — miniony, totemy, przywołańce.
 *
 *  Jeden system pod wszystkie pomysły: nekromanta hieny (dużo słabych),
 *  totemy dzika (nieruchome, trzy różne), przywołaniec zająca (jeden duży
 *  z paskiem HP i atakami bossa). Symulacja zna PRYMITYWY, a konkretne
 *  jednostki są danymi — dokładnie jak przy bossach.
 *
 *  Osie zmienności, które musi pokryć `MinionDef`:
 *   - ruch: `static` (totem) / `follow` (leci za graczem) / `hunt` (poluje sam)
 *   - trwałość: HP (0 = niezniszczalny) + czas życia
 *   - atak: słownik ataków WSPÓLNY z bossami (slam/ring) + `bolt` dla wież
 *   - skala: ile sztuk naraz na gracza
 * ═══════════════════════════════════════════════════════════════════
 */

const secs = (s: number): number => Math.round(s * TICK_RATE);

/** Pojedynczy pocisk w najbliższego wroga — podstawa wieżyczek i dronów. */
export interface BoltAttack {
  kind: 'bolt';
  windupTicks: number;
  projectileSpeed: number;
  damage: number;
  range: number;
  recoverTicks: number;
}

/**
 * Ataki jednostek to te same typy co ataki bossów (`bosses/types.ts`) plus
 * `bolt`. Dzięki temu duży przywołaniec może dosłownie dostać ataki bossa,
 * a nie ich kopię — patrz SUMMONED_BEHEMOTH niżej.
 */
export type MinionAttack = BoltAttack | SlamAttack | RingAttack;

export interface MinionDef {
  id: string;
  /** Nazwa nad paskiem HP (tylko gdy `showHpBar`). */
  name: string;
  color: number;
  /** Liczba boków sylwetki — jednostki mają być odróżnialne od wrogów. */
  shapeSides: number;
  radius: number;

  /**
   * `static` — stoi tam, gdzie postawiony (totemy)
   * `follow` — trzyma się właściciela (drony, ochroniarze)
   * `hunt`   — sam szuka wrogów po całej arenie (wskrzeszeni)
   */
  movement: 'static' | 'follow' | 'hunt';
  speed: number;

  /** 0 = niezniszczalny (v1 dronów i totemów). */
  hp: number;
  /** Czas życia w tickach; -1 = do końca fali. */
  lifetimeTicks: number;

  attacks: MinionAttack[];
  attackIntervalTicks: number;
  /** Obrażenia zadawane przez dotknięcie (jednostki walczące wręcz). */
  contactDamage: number;

  /** Ile sztuk NA GRACZA może istnieć naraz — zawór bezpieczeństwa dla FPS. */
  maxActive: number;
  /** Czy rysować pasek HP i nazwę (duzi przywołańcy). */
  showHpBar: boolean;
}

/**
 * Twardy sufit wszystkich jednostek naraz, niezależny od `maxActive`.
 * Ośmiu graczy × stado to realne ryzyko dla wydajności, a rozmiar poola
 * musi być stały (zero alokacji w trakcie gry).
 */
export const MINION_POOL_SIZE = 220;

export const MINIONS: MinionDef[] = [
  {
    /**
     * WSKRZESZONY — hiena nekromantka. Zabity w pobliżu wróg wstaje po naszej
     * stronie. Słaby i tymczasowy, ale jest ich dużo: siła leży w liczbie,
     * a nie w pojedynczej sztuce.
     */
    id: 'thrall',
    name: 'THRALL',
    color: 0xc9a227,
    shapeSides: 4,
    radius: 11,
    movement: 'hunt',
    speed: 165,
    hp: 0,
    // Wydłużone 12 s → 35 s (2026-07-20): przy 12 s stado nigdy nie zdążyło
    // urosnąć, bo pierwsze sztuki znikały, zanim powstały kolejne.
    lifetimeTicks: secs(35),
    attacks: [],
    attackIntervalTicks: 0,
    contactDamage: 6,
    maxActive: 24,
    showHpBar: false,
  },
  {
    /** WIEŻYCZKA — dzik-inżynier. Szybkie pociski w najbliższego wroga. */
    id: 'totem-turret',
    name: 'TURRET',
    color: 0xffb703,
    shapeSides: 6,
    radius: 16,
    movement: 'static',
    speed: 0,
    hp: 0,
    lifetimeTicks: secs(18),
    attacks: [
      { kind: 'bolt', windupTicks: 0, projectileSpeed: 460, damage: 6, range: 430, recoverTicks: 0 },
    ],
    attackIntervalTicks: secs(0.35),
    contactDamage: 0,
    maxActive: 3,
    showHpBar: false,
  },
  {
    /** TOTEM FALI — puszcza pierścienie pocisków dookoła siebie. */
    id: 'totem-pulse',
    name: 'PULSE TOTEM',
    color: 0x38e8ff,
    shapeSides: 3,
    radius: 18,
    movement: 'static',
    speed: 0,
    hp: 0,
    lifetimeTicks: secs(18),
    attacks: [
      {
        kind: 'ring', windupTicks: secs(0.25), count: 12,
        projectileSpeed: 260, damage: 5, recoverTicks: 0,
      },
    ],
    attackIntervalTicks: secs(1.4),
    contactDamage: 0,
    maxActive: 3,
    showHpBar: false,
  },
  {
    /**
     * TOTEM ODRZUTU — nie zabija, tylko rozpycha. Robi miejsce w hordzie,
     * co przy 400 wrogach bywa cenniejsze niż obrażenia.
     */
    id: 'totem-knock',
    name: 'REPULSOR',
    color: 0xc77dff,
    shapeSides: 8,
    radius: 18,
    movement: 'static',
    speed: 0,
    hp: 0,
    lifetimeTicks: secs(18),
    attacks: [
      {
        kind: 'slam', windupTicks: secs(0.3), hitRadius: 230,
        damage: 2, knockback: 260, recoverTicks: 0,
      },
    ],
    attackIntervalTicks: secs(1.6),
    contactDamage: 0,
    maxActive: 3,
    showHpBar: false,
  },
  {
    /**
     * BEHEMOT — przywołaniec zająca-summonera. Jeden, wielki, z własnym
     * paskiem HP i ATAKAMI PIERWSZEGO BOSSA — dosłownie tymi samymi, bo
     * słownik ataków jest wspólny (patrz `MinionAttack`). Nowy duży
     * przywołaniec to dziś wpis w danych, nie kod w symulacji.
     */
    id: 'behemoth',
    name: 'BEHEMOTH',
    color: 0xff3ea5,
    shapeSides: 10,
    radius: 42,
    movement: 'hunt',
    speed: 155,
    hp: 620,
    /**
     * WIECZNY (2026-07-20): -1 = brak licznika. Ginie wyłącznie od obrażeń,
     * i jako jedyny przeżywa przerwę między falami (patrz `endWave`).
     * Przy 20 s cooldownu i możliwości śmierci to uczciwy koszt gałęzi,
     * w której `Q` przestaje zadawać obrażenia.
     */
    lifetimeTicks: -1,
    attacks: HIVE_QUEEN.phases[0].attacks.filter(
      (a): a is SlamAttack | RingAttack => a.kind === 'slam' || a.kind === 'ring',
    ),
    attackIntervalTicks: secs(1.2),
    contactDamage: 18,
    maxActive: 1,
    showHpBar: true,
  },
];

export function minionById(id: string): MinionDef | null {
  return MINIONS.find((m) => m.id === id) ?? null;
}

export function minionIndexById(id: string): number {
  return MINIONS.findIndex((m) => m.id === id);
}
