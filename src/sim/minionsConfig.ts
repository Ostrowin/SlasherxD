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
  /**
   * Odbicia pocisku — te same pola co w `ProjectileSkill`, bo silnik odbić
   * jest wspólny. Pominięte = zwykły pocisk ginący na pierwszym celu, więc
   * istniejące wieżyczki nie wymagały żadnej zmiany.
   */
  chains?: number;
  chainRange?: number;
  chainFalloff?: number;
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

  /**
   * Jednostka znika PO PIERWSZYM ataku — ładunek, nie wieżyczka.
   *
   * Bez tego opóźniona detonacja musiałaby być udawana czasem życia dobranym
   * pod czas zamachu, a to pęka przy pierwszym talencie na `minionDuration`:
   * przedłużony ładunek zdąża naliczyć cooldown i wybucha drugi raz.
   * Jeden bool zamyka temat i otwiera drogę minom oraz bombom.
   */
  oneShot?: boolean;

  /**
   * Jednostka jest PORTALEM: gracz, który na nią wejdzie, przenosi się do
   * drugiego swojego portalu. Sama nie walczy i nie znika od obrażeń.
   */
  portal?: boolean;
  /**
   * `maxActive` jest BEZWZGLĘDNE — talenty na `minionCount` go nie ruszają.
   * Potrzebne wszędzie tam, gdzie liczba sztuk jest częścią zasad, a nie
   * siły: portale muszą być dokładnie dwa, inaczej „drugi portal" traci sens.
   */
  fixedCount?: boolean;
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
  {
    /**
     * WSTRZĄS — niedźwiedź Gravity Mage, `Q`. Pole postawione w punkcie na
     * mapie, które cyklicznie tłucze wszystko, co w nim stoi. Zero odrzutu
     * celowo: odrzut wypychałby wrogów z pola, czyli skill zwalczałby sam
     * siebie. Ma zmuszać hordę do przejścia przez strefę, nie rozganiać jej.
     */
    id: 'quake-field',
    name: 'EARTHSHAKE',
    color: 0x7b5cff,
    shapeSides: 4,
    radius: 20,
    movement: 'static',
    speed: 0,
    hp: 0,
    lifetimeTicks: secs(6),
    attacks: [
      { kind: 'slam', windupTicks: 0, hitRadius: 150, damage: 4, knockback: 0, recoverTicks: 0 },
    ],
    attackIntervalTicks: secs(0.6),
    contactDamage: 0,
    maxActive: 2,
    showHpBar: false,
  },
  {
    /**
     * ZAPAŚĆ — niedźwiedź Gravity Mage, `W`. Cała umiejętność to JEDEN cios
     * po długim zamachu: 2,2 s telegrafu, potem bardzo mocne uderzenie.
     * Zamach jest tu mechaniką, a nie ozdobą — daje wrogom czas wyjść,
     * więc trafienie wymaga przewidzenia, gdzie horda BĘDZIE.
     *
     * `attackIntervalTicks: 0`, bo to ono jest opóźnieniem PRZED zamachem
     * (patrz `spawnMinion`) — całe opóźnienie ma siedzieć w `windupTicks`,
     * żeby gracz je widział. Zniknięcie po wybuchu załatwia `oneShot`.
     */
    id: 'gravity-collapse',
    name: 'COLLAPSE',
    color: 0x9d4edd,
    shapeSides: 6,
    radius: 26,
    movement: 'static',
    speed: 0,
    hp: 0,
    lifetimeTicks: secs(4),
    attacks: [
      { kind: 'slam', windupTicks: secs(2.2), hitRadius: 210, damage: 55, knockback: 70, recoverTicks: 0 },
    ],
    attackIntervalTicks: 0,
    oneShot: true,
    contactDamage: 0,
    maxActive: 2,
    showHpBar: false,
  },
  {
    /**
     * PUŁAPKA CZASOWA — lis Chronomancer, `Q`. Mała, tania, długo stoi.
     * Sens gałęzi to ZAGĘSZCZENIE: pojedyncza pułapka jest słaba, ale
     * `minionCount` i `minionDuration` w drzewku zamieniają arenę w pole
     * minowe budowane przez cały run. Dlatego bazowe obrażenia są niskie,
     * a `maxActive` już na starcie wyższe niż u totemów dzika.
     */
    id: 'chrono-trap',
    name: 'TEMPORAL TRAP',
    color: 0x38e8ff,
    shapeSides: 3,
    radius: 11,
    movement: 'static',
    speed: 0,
    hp: 0,
    lifetimeTicks: secs(30),
    attacks: [
      { kind: 'bolt', windupTicks: 0, projectileSpeed: 420, damage: 4, range: 300, recoverTicks: 0 },
    ],
    attackIntervalTicks: secs(1.1),
    contactDamage: 0,
    maxActive: 6,
    showHpBar: false,
  },
  {
    /**
     * BURZA — wilk Thunder Fang, combo `E→W→Q`. Bije LEKKO (3 obrażenia),
     * ale co 0,15 s i z dwoma rykoszetami, więc w tłumie sypie kilkanaście
     * trafień na sekundę. To jest cała jej rola: nie zabija pojedynczego
     * wroga, tylko topi falę.
     *
     * `maxActive: 1` — burza ma być WYDARZENIEM na 13 s cooldownu, a nie
     * czymś, czym zastawia się arenę.
     */
    id: 'thunder-nova',
    name: 'THUNDER NOVA',
    color: 0xffe066,
    shapeSides: 5,
    radius: 22,
    movement: 'static',
    speed: 0,
    hp: 0,
    lifetimeTicks: secs(7),
    attacks: [
      {
        kind: 'bolt', windupTicks: 0, projectileSpeed: 600,
        damage: 3, range: 340, recoverTicks: 0,
        chains: 2, chainRange: 240, chainFalloff: 0.9,
      },
    ],
    attackIntervalTicks: secs(0.15),
    contactDamage: 0,
    maxActive: 1,
    showHpBar: false,
  },
  {
    /**
     * WILK Z WATAHY — alfa, `E`. Poluje sam i bije wręcz, ale prawdziwa
     * wartość jest gdzie indziej: każdy z nich LICZY SIĘ jako sojusznik do
     * bonusów alfy i POWTARZA jego Swipe (`packEcho`). Dlatego pojedynczy
     * wilk jest przeciętny, a szóstka zmienia sposób gry.
     */
    id: 'pack-wolf',
    name: 'WOLF',
    color: 0x9aa5b1,
    shapeSides: 3,
    radius: 13,
    movement: 'hunt',
    speed: 250,
    hp: 0,
    lifetimeTicks: secs(45),
    attacks: [],
    attackIntervalTicks: 0,
    contactDamage: 7,
    maxActive: 4,
    showHpBar: false,
  },
  {
    /**
     * PORTAL — lis Chronomancer, `W`. Zawsze DWA: postawienie trzeciego
     * kasuje najstarszy, co `spawnMinion` robi już z samego `maxActive`
     * (usuwa najstarszą sztukę po przekroczeniu limitu). Stąd `fixedCount` —
     * bez niego talenty na `minionCount` z tej samej gałęzi (pułapki!)
     * pozwoliłyby postawić trzeci i para przestałaby być parą.
     *
     * Długi czas życia, bo portal to element ustawienia areny na całą walkę,
     * a nie chwilowy trik.
     */
    id: 'chrono-portal',
    name: 'PORTAL',
    color: 0xc77dff,
    shapeSides: 8,
    radius: 20,
    movement: 'static',
    speed: 0,
    hp: 0,
    lifetimeTicks: secs(40),
    attacks: [],
    attackIntervalTicks: 0,
    contactDamage: 0,
    maxActive: 2,
    showHpBar: false,
    portal: true,
    fixedCount: true,
  },

  /* ── Pola grawitacyjne niedźwiedzia (`E`) ──────────────────────────────
   * Trzy warianty tego samego pola. Talenty w drzewku PODMIENIAJĄ skill na
   * kolejny, więc ulepszenie jest widoczne od razu i nie wymaga ani jednej
   * linijki w symulacji — dokładnie ten sam ruch co „snajper podmienia Q".
   *
   * Bazowe pole nie zadaje obrażeń celowo: `minionDamage` z drzewka mnoży
   * damage, a 0 × cokolwiek dalej jest zerem. Obrażenia wchodzą dopiero
   * z ulepszeniem, i dopiero od tego momentu talenty na nie działają.
   */
  {
    /** POLE GRAWITACYJNE — samo spowolnienie, zero obrażeń. */
    id: 'gravity-field',
    name: 'GRAVITY WELL',
    color: 0x7b5cff,
    shapeSides: 6,
    radius: 22,
    movement: 'static',
    speed: 0,
    hp: 0,
    lifetimeTicks: secs(8),
    attacks: [
      {
        kind: 'slam', windupTicks: 0, hitRadius: 200,
        damage: 0, knockback: 0, status: 'gravity-drag', recoverTicks: 0,
      },
    ],
    attackIntervalTicks: secs(0.4),
    contactDamage: 0,
    maxActive: 1,
    showHpBar: false,
  },
  {
    /** CRUSHING WELL — to samo pole, ale już podgryza (talent `grav-crush`). */
    id: 'gravity-field-crush',
    name: 'CRUSHING WELL',
    color: 0x9d4edd,
    shapeSides: 6,
    radius: 24,
    movement: 'static',
    speed: 0,
    hp: 0,
    lifetimeTicks: secs(8),
    attacks: [
      {
        kind: 'slam', windupTicks: 0, hitRadius: 200,
        damage: 5, knockback: 0, status: 'gravity-drag', recoverTicks: 0,
      },
    ],
    attackIntervalTicks: secs(0.4),
    contactDamage: 0,
    maxActive: 1,
    showHpBar: false,
  },
  {
    /**
     * SINGULARITY — zwieńczenie gałęzi. DWA ataki na przemian: spowolnienie
     * i ogłuszenie. Dzięki naprzemienności stun pulsuje co drugie tyknięcie,
     * zamiast trzymać hordę zamrożoną bez przerwy.
     */
    id: 'gravity-field-singularity',
    name: 'SINGULARITY',
    color: 0xff3ea5,
    shapeSides: 8,
    radius: 26,
    movement: 'static',
    speed: 0,
    hp: 0,
    lifetimeTicks: secs(8),
    attacks: [
      {
        kind: 'slam', windupTicks: 0, hitRadius: 210,
        damage: 8, knockback: 0, status: 'gravity-drag', recoverTicks: 0,
      },
      {
        kind: 'slam', windupTicks: 0, hitRadius: 210,
        damage: 8, knockback: 0, status: 'stun', recoverTicks: 0,
      },
    ],
    attackIntervalTicks: secs(0.4),
    contactDamage: 0,
    maxActive: 1,
    showHpBar: false,
  },
];

export function minionById(id: string): MinionDef | null {
  return MINIONS.find((m) => m.id === id) ?? null;
}

export function minionIndexById(id: string): number {
  return MINIONS.findIndex((m) => m.id === id);
}
