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
  /** Wygląd pocisku dla renderu (pusty = kula). */
  visual?: string;
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
  /**
   * Status nakładany wrogowi PRZY DOTKNIĘCIU (`STATUSES`). Pominięte = żaden.
   * Rój szczurów roznosi tym `plague`: każde ugryzienie zaraża, więc miniony
   * nabijają stacki pod detonację RUPTURE bez ani jednej dużej liczby obrażeń
   * na sobie.
   */
  contactStatus?: string;

  /** Ile sztuk NA GRACZA może istnieć naraz — zawór bezpieczeństwa dla FPS. */
  maxActive: number;
  /** Czy rysować pasek HP i nazwę (duzi przywołańcy). */
  showHpBar: boolean;

  /**
   * Ile razy jednostka może wykonać atak, zanim zniknie. Pominięte = bez
   * limitu (zwykła wieżyczka żyjąca do końca `lifetimeTicks`).
   *
   * `charges: 1` to ładunek jednorazowy — bez tego opóźniona detonacja
   * musiałaby być udawana czasem życia dobranym pod czas zamachu, a to pęka
   * przy pierwszym talencie na `minionDuration`: przedłużony ładunek zdąża
   * naliczyć cooldown i wybucha drugi raz.
   *
   * Większe wartości dają MINĘ WIELOKROTNĄ: między ładunkami obowiązuje
   * `attackIntervalTicks`, więc to ono jest czasem ponownego uzbrojenia.
   */
  charges?: number;

  /**
   * Jednostka jest PORTALEM: gracz, który na nią wejdzie, przenosi się do
   * drugiego swojego portalu. Sama nie walczy i nie znika od obrażeń.
   */
  portal?: boolean;
  /**
   * Aura roztaczana przez jednostkę (`AURAS` w statusConfig.ts). Ten sam
   * mechanizm co aury graczy, tylko źródłem jest minion — dzięki temu
   * przyszłe summony dostają aury jako DANE, bez kodu (duch summonera).
   */
  auraId?: string;

  /**
   * KOMENDA — sterowana przez gracza akcja jednostki (duch: rusz w kursor
   * i siej strach). Zbudowana GENERYCZNIE pod przyszłe skille summonów:
   * skill z `commandsMinion` (skillsConfig) wysyła jednostkę w punkt, ona
   * leci tam przez `durationTicks` z prędkością `speed`, nakładając `status`
   * w promieniu `statusRadius`. `cooldownTicks` to własny cooldown komendy.
   */
  command?: {
    durationTicks: number;
    speed: number;
    status?: string;
    statusRadius?: number;
    cooldownTicks: number;
  };
  /**
   * PUŁAPKA: jednostka nie atakuje na zegar, tylko CZEKA, aż wróg wejdzie
   * w ten promień. Dopiero wtedy rusza jej normalny cykl ataku.
   *
   * Bez tego pola każda jednostka jest wieżyczką — strzela cyklicznie do
   * najbliższego celu. Mina musi leżeć bezczynnie dowolnie długo i odpalić
   * się w reakcji, a nie z własnej inicjatywy.
   */
  triggerRadius?: number;
  /**
   * `maxActive` jest BEZWZGLĘDNE — talenty na `minionCount` go nie ruszają.
   * Potrzebne wszędzie tam, gdzie liczba sztuk jest częścią zasad, a nie
   * siły: portale muszą być dokładnie dwa, inaczej „drugi portal" traci sens.
   */
  fixedCount?: boolean;
  /**
   * Jednostka skaluje się WŁASNYMI statystykami gracza, nie statem sumonera
   * (`minionDamageMult`). Wtedy `attack.damage` jest MNOŻNIKIEM obrażeń zwarcia
   * gracza (a nie liczbą płaską), trafienie łapie kryty gracza (`rollDamage`),
   * a interwał strzału skaluje się jego prędkością ataku. Silnik turreta
   * buildera: to samo drzewko karmi cios gracza i jego działko.
   */
  scalesWithOwner?: boolean;

  /**
   * SPAWNER — jednostka, która co `attackIntervalTicks` WYPLUWA inną jednostkę
   * w LOSOWYM punkcie w promieniu `radius` wokół siebie. Silnik WULKANU maga
   * magmy: sam wulkan nic nie robi, tylko przez cały swój czas życia zrzuca
   * meteory (`magma-meteor`) na losowe miejsca areny. Losowanie idzie
   * z seedowanego RNG symulacji, więc każdy klient zrzuca je identycznie.
   * Generyczne — dowolna „plująca" struktura to wpis w danych.
   */
  spews?: {
    /** Którą jednostkę zrzucamy (`MINIONS`) — dla wulkanu `magma-meteor`. */
    minionId: string;
    /** Promień pola zrzutu wokół spawnera. */
    radius: number;
    /** Ile sztuk na jeden zrzut. */
    count: number;
  };
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
    /**
     * SENTRY — jeż BASTION. JEDEN przenośny turret, którego DPS rośnie
     * WŁASNYMI statystykami gracza (`scalesWithOwner`): `damage` to mnożnik
     * obrażeń zwarcia, a nie liczba płaska. Żyje do końca fali — gracz go
     * repozycjonuje, nie stawia od nowa (patrz `relocates` w skillu).
     */
    id: 'bastion-turret',
    name: 'SENTRY',
    color: 0x8a9a5b,
    shapeSides: 6,
    radius: 16,
    movement: 'static',
    speed: 0,
    hp: 0,
    lifetimeTicks: -1,
    attacks: [
      // `damage` = mnożnik obrażeń zwarcia gracza (`scalesWithOwner`). 1.8 zamiast
      // 1.0 — turret był za słaby, teraz każdy bolt to ~2× cios gracza.
      { kind: 'bolt', windupTicks: 0, projectileSpeed: 560, damage: 1.8, range: 480, recoverTicks: 0 },
    ],
    attackIntervalTicks: secs(0.25),
    contactDamage: 0,
    maxActive: 1,
    fixedCount: true,
    scalesWithOwner: true,
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
     * żeby gracz je widział. Zniknięcie po wybuchu załatwia `charges: 1`.
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
    charges: 1,
    contactDamage: 0,
    maxActive: 2,
    showHpBar: false,
  },
  {
    /**
     * PUŁAPKA CZASOWA — lis Chronomancer, `Q`. MINA WIELOKROTNA, nie
     * wieżyczka: leży bezczynnie dowolnie długo i wybucha obszarowo dopiero
     * wtedy, gdy wróg na nią wejdzie (`triggerRadius`).
     *
     * `attackIntervalTicks` pełni tu DWIE role naraz i dlatego wynosi 3 s:
     * jest czasem UZBRAJANIA po postawieniu (patrz `spawnMinion`, który
     * zaczyna od pełnego cooldownu) i czasem PONOWNEGO uzbrojenia po każdym
     * wybuchu. Bez tego pierwszego pułapkę dałoby się rzucać wrogowi pod nogi
     * jak zwykły atak obszarowy, zamiast zastawiać pole minowe z wyprzedzeniem.
     *
     * 10 ładunków sprawia, że dobrze postawiona mina pracuje przez całą falę,
     * a nie znika po jednym przejściu hordy. Sens gałęzi to ZAGĘSZCZENIE —
     * `minionCount` i `minionDuration` z drzewka zamieniają arenę w pole
     * minowe budowane przez cały run.
     *
     * Krótki zamach (0,15 s) jest wyłącznie tellem: render powiększa
     * jednostkę w stanie `windup`, więc widać moment odpalenia.
     */
    id: 'chrono-trap',
    name: 'TEMPORAL TRAP',
    color: 0x38e8ff,
    shapeSides: 3,
    radius: 12,
    movement: 'static',
    speed: 0,
    hp: 0,
    lifetimeTicks: secs(30),
    attacks: [
      {
        kind: 'slam', windupTicks: secs(0.15), hitRadius: 150,
        damage: 22, knockback: 60, recoverTicks: 0,
      },
    ],
    // Uzbrajanie po postawieniu ORAZ przerwa między ładunkami.
    attackIntervalTicks: secs(3),
    triggerRadius: 60,
    charges: 10,
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
        chains: 2, chainRange: 240, chainFalloff: 0.9, visual: 'lightning',
      },
    ],
    attackIntervalTicks: secs(0.15),
    contactDamage: 0,
    maxActive: 1,
    showHpBar: false,
  },
  {
    /**
     * WILK Z WATAHY — alfa, `E`. Poluje sam i SAM TNIE SWIPEM: własny cios
     * obszarowy co 1,6 s, niezależnie od tego, czy alfa go akurat odpalił.
     * Dodatkowo POWTARZA Swipe alfy (`packEcho`), więc trafienie gracza mnoży
     * się przez całą watahę.
     *
     * Swipe zamiast dawnego gryzienia wręcz, bo kontakt i atak jednostki
     * dzielą jedno pole cooldownu (`mi.attackCooldown`) — trzymanie obu
     * poplątałoby oba. AoE i tak pasuje lepiej: wilki mają topić hordę,
     * a nie wisieć na jednym celu. Zero odrzutu, żeby nie rozganiać własnych
     * ofiar spod łap. Siła rośnie przez `minionDamage` z drzewka.
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
    attacks: [
      {
        kind: 'slam', windupTicks: secs(0.15), hitRadius: 120,
        damage: 9, knockback: 0, recoverTicks: 0,
      },
    ],
    attackIntervalTicks: secs(1.6),
    contactDamage: 0,
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

  /* ── Zwierzyniec zająca SUMMONER (Q/W/E/R) ─────────────────────────────
   * Cztery różne jednostki zamiast jednego Behemota. Wszystkie skalują się
   * talentami gałęzi (`minionHp`/`minionDamage`/`minionCount`), więc ich
   * bazowe liczby są celowo skromne.
   */
  {
    /** GOLEM — `Q`. Wielki melee tank: podchodzi i tłucze obszarowo. */
    id: 'sm-golem',
    name: 'GOLEM',
    color: 0x8d7b6a,
    shapeSides: 6,
    radius: 34,
    movement: 'hunt',
    speed: 150,
    hp: 380,
    // Czasowe, nie wieczne: cztery permanentne summony robiły z zająca
    // niepokonanego (bench: 5/5 wygranych). Downtime po wygaśnięciu to koszt.
    lifetimeTicks: secs(30),
    attacks: [
      { kind: 'slam', windupTicks: secs(0.35), hitRadius: 110, damage: 14, knockback: 40, recoverTicks: secs(0.3) },
    ],
    attackIntervalTicks: secs(1.1),
    contactDamage: 0,
    maxActive: 1,
    showHpBar: true,
  },
  {
    /** HYDRA — `W`. Wielogłowy pluj: szybkie pociski w najbliższego wroga. */
    id: 'sm-hydra',
    name: 'HYDRA',
    color: 0x4caf7d,
    shapeSides: 5,
    radius: 24,
    movement: 'hunt',
    speed: 120,
    hp: 190,
    lifetimeTicks: secs(30),
    attacks: [
      { kind: 'bolt', windupTicks: 0, projectileSpeed: 480, damage: 7, range: 460, recoverTicks: 0 },
    ],
    attackIntervalTicks: secs(0.4),
    contactDamage: 0,
    maxActive: 1,
    showHpBar: true,
  },
  {
    /**
     * DUCH — `E`. Nie walczy: roztacza AURĘ obronną (pancerz + leczenie),
     * a na komendę gracza rusza w stronę kursora, siejąc STRACH. Trzyma się
     * gracza, żeby aura była tam, gdzie on.
     */
    id: 'sm-ghost',
    name: 'SPIRIT',
    color: 0xb99cff,
    shapeSides: 3,
    radius: 20,
    movement: 'follow',
    speed: 240,
    hp: 140,
    lifetimeTicks: secs(20),
    attacks: [],
    attackIntervalTicks: 0,
    contactDamage: 0,
    maxActive: 1,
    showHpBar: true,
    auraId: 'spirit-ward',
    command: {
      durationTicks: secs(1.2),
      speed: 520,
      status: 'fear',
      statusRadius: 150,
      cooldownTicks: secs(7),
    },
  },
  {
    /**
     * CHOCHLIK — rój spod `R`. Wiele słabych, krótko żyjących stworków, jak
     * wskrzeszeni hieny: siła w liczbie. Ultimate stawia ich naraz kilka.
     */
    id: 'sm-imp',
    name: 'IMP',
    color: 0xd08cff,
    shapeSides: 4,
    radius: 10,
    movement: 'hunt',
    speed: 300,
    hp: 0,
    lifetimeTicks: secs(12),
    attacks: [],
    attackIntervalTicks: 0,
    contactDamage: 5,
    maxActive: 24,
    showHpBar: false,
  },
  {
    /**
     * NIETOPERZ Z ROJU — `R` NIGHT TERROR. Wiele słabych, krótko żyjących
     * stworków polujących samodzielnie; siła w liczbie, jak chochliki zająca.
     */
    id: 'bat-swarmling',
    name: 'BAT',
    color: 0x8e44ad,
    shapeSides: 3,
    radius: 9,
    movement: 'hunt',
    speed: 320,
    hp: 0,
    lifetimeTicks: secs(10),
    attacks: [],
    attackIntervalTicks: 0,
    contactDamage: 5,
    // Wysoki sufit, żeby talent R (`summonCount`) realnie zwiększał rój, a nie
    // odbijał się od limitu.
    maxActive: 40,
    showHpBar: false,
  },
  {
    /**
     * SZCZUR Z ROJU — `E` SWARM (spec SWARM). Rój słabych, krótko żyjących
     * szczurów polujących samodzielnie, które ROZNOSZĄ ZARAZĘ dotykiem
     * (`contactStatus: 'plague'`). Sensem nie są obrażenia styku, tylko
     * nabijanie stacków `plague` po całej hordzie pod detonację RUPTURE.
     * Wysoki sufit `maxActive` pod talent `summonCount`.
     */
    id: 'rat-swarmling',
    name: 'RAT',
    color: 0xb6d94c,
    shapeSides: 4,
    radius: 8,
    movement: 'hunt',
    speed: 300,
    hp: 0,
    lifetimeTicks: secs(11),
    attacks: [],
    attackIntervalTicks: 0,
    contactDamage: 3,
    contactStatus: 'plague',
    maxActive: 40,
    showHpBar: false,
  },

  /* ── Wydra TIDECALLER: wiry ────────────────────────────────────────────
   * Oba stoją na tym samym trik co Singularity niedźwiedzia: DWA ataki na
   * przemian, więc ogłuszenie PULSUJE zamiast trzymać hordę zamrożoną.
   * Cała siła gałęzi rośnie przez `minionDamage` — wydra bije terenem,
   * nie łapą, i dlatego support może mieć obrażenia bez bycia damage dealerem.
   */
  {
    /**
     * WIR — `W`. Pierwszy atak moczy i podgryza, drugi ogłusza. Przy 0,5 s
     * interwału daje to stun co sekundę, a między nimi okno na ucieczkę —
     * horda przechodzi przez wir szarpnięciami, zamiast w nim zamarzać.
     */
    id: 'tide-whirl',
    name: 'WHIRLPOOL',
    color: 0x3fa7a0,
    shapeSides: 8,
    radius: 20,
    movement: 'static',
    speed: 0,
    hp: 0,
    lifetimeTicks: secs(8),
    attacks: [
      {
        kind: 'slam', windupTicks: 0, hitRadius: 190,
        damage: 4, knockback: 0, status: 'soaked', recoverTicks: 0,
      },
      {
        kind: 'slam', windupTicks: 0, hitRadius: 190,
        damage: 2, knockback: 0, status: 'stun', recoverTicks: 0,
      },
    ],
    // Zero odrzutu w obu atakach celowo: wypychanie wrogów z wiru sprawiłoby,
    // że skill zwalcza sam siebie (ta sama lekcja co przy `quake-field`).
    //
    // 0,7 s, a nie 0,5 s (bench 2026-07-24): przy pół sekundy ogłuszenie
    // wracało co sekundę, a `Storm Surge` pozwala mieć pięć wirów naraz —
    // nakładały się w stały paraliż całej areny. Teraz stun wraca co 1,4 s,
    // czyli zostaje PULSEM z oknem na ruch, zgodnie z lekcją z `Singularity`.
    attackIntervalTicks: secs(0.7),
    contactDamage: 0,
    maxActive: 2,
    showHpBar: false,
  },
  {
    /**
     * MAELSTROM — `R`. Ten sam wzorzec co wir, ale w skali ultimate: pierścień
     * pocisków na wylot plus ogłuszenie w bardzo dużym promieniu. Jedna sztuka
     * i 10 s życia — ma być WYDARZENIEM, które ratuje drużynę z otoczenia.
     */
    id: 'tide-maelstrom',
    name: 'MAELSTROM',
    color: 0x2a7fa8,
    shapeSides: 10,
    radius: 30,
    movement: 'static',
    speed: 0,
    hp: 0,
    lifetimeTicks: secs(10),
    attacks: [
      {
        kind: 'ring', windupTicks: secs(0.2), count: 16,
        projectileSpeed: 300, damage: 6, recoverTicks: 0,
      },
      {
        kind: 'slam', windupTicks: 0, hitRadius: 300,
        damage: 4, knockback: 0, status: 'stun', recoverTicks: 0,
      },
    ],
    attackIntervalTicks: secs(0.7),
    contactDamage: 0,
    maxActive: 1,
    // Jedyność maelstromu jest ZASADĄ, nie siłą: `Storm Surge` z tej samej
    // gałęzi dokłada wiry spod `W`, a bez tej flagi zwielokrotniłby też
    // ultimate — cztery maelstromy naraz to nie jest ulepszenie, tylko inna gra.
    fixedCount: true,
    showHpBar: false,
  },

  {
    /**
     * KLON — wydra MIRROR TIDE. Rdzeń gałęzi asasyna i najtańsza jednostka
     * w grze pod względem kodu: STOI, sam z siebie kłuje wodną igłą, a całą
     * jego wartość robi `packEcho` na `Q` (patrz `mirror-lance`) — powtarza
     * cios gracza ze swojej pozycji.
     *
     * Dlatego jego własne liczby są celowo skromne: klon ma być ustawieniem
     * kąta ataku, a nie wieżyczką. Osiem klonów rozstawionych po obwodzie
     * tłumu zamienia jedno wciśnięcie `Q` w dziewięć cięć z dziewięciu stron —
     * i to jest fantazja tej gałęzi, nie pasywny DPS.
     *
     * `hp: 0` (niezniszczalny) jak wilki z watahy i pułapki lisa: limitem
     * jest `maxActive` i czas życia, nie zdrowie.
     */
    id: 'mirror-clone',
    name: 'MIRROR',
    color: 0x7fd4d0,
    shapeSides: 5,
    radius: 13,
    movement: 'static',
    speed: 0,
    hp: 0,
    lifetimeTicks: secs(20),
    // Igła podbita po benchu (3 → 5 obrażeń co 0,6 s): gałąź jest POZYCYJNA,
    // więc gracz, który postawi klony źle, i tak traci ich echo z `Q`.
    // Własny ostrzał musi być na tyle sensowny, żeby źle rozstawione stado
    // nie było zerem — inaczej jedyny błąd w gałęzi kosztuje cały build.
    attacks: [
      { kind: 'bolt', windupTicks: 0, projectileSpeed: 520, damage: 5, range: 340, recoverTicks: 0 },
    ],
    attackIntervalTicks: secs(0.6),
    contactDamage: 0,
    // Cztery, a nie trzy: `R` stawia cztery klony naraz, więc przy limicie 3
    // ultimate kasowałby własnego pierwszego klona w tym samym ticku, w którym
    // go postawił. Bazowy limit musi pomieścić to, co obiecuje umiejętność.
    maxActive: 4,
    showHpBar: false,
  },

  /* ── KRET SAPPER: kop + buduj (miny, wieżyczka, ładunek) ─────────────────
   * Wszystko na istniejących wzorcach: mina = `chrono-trap` (pułapka
   * z `triggerRadius` + `slam` + `charges`), wieżyczka = `totem-turret`.
   */
  {
    /**
     * MINA — kret SAPPER, `Q`. Leży, aż wróg wejdzie w `triggerRadius`, potem
     * krótki zamach (tell) i wybuch z ogłuszeniem. `charges: 1` — jednorazowa,
     * znika z hukiem. Spam buduje pole minowe, na które nagania się hordę.
     */
    id: 'mole-mine',
    name: 'MINE',
    color: 0x5d4037,
    shapeSides: 3,
    radius: 11,
    movement: 'static',
    speed: 0,
    hp: 0,
    lifetimeTicks: secs(30),
    attacks: [
      { kind: 'slam', windupTicks: secs(0.2), hitRadius: 150, damage: 26, knockback: 120, status: 'stun', recoverTicks: 0 },
    ],
    // Uzbrojenie po postawieniu — nie wybucha pod nogami stawiającego.
    attackIntervalTicks: secs(0.6),
    triggerRadius: 70,
    charges: 1,
    contactDamage: 0,
    maxActive: 8,
    showHpBar: false,
  },
  {
    /**
     * DRILL TURRET — kret SAPPER, `W`. Nieruchome działko strzelające do
     * najbliższego wroga (klon wzorca `totem-turret`). Płaskie obrażenia ×
     * `minionDamageMult`, więc drzewko sapera (minionDamage/count) je pompuje.
     */
    id: 'drill-turret',
    name: 'DRILL',
    color: 0x8a6d5a,
    shapeSides: 6,
    radius: 16,
    movement: 'static',
    speed: 0,
    hp: 0,
    lifetimeTicks: secs(14),
    attacks: [
      { kind: 'bolt', windupTicks: 0, projectileSpeed: 620, damage: 7, range: 420, recoverTicks: 0 },
    ],
    attackIntervalTicks: secs(0.4),
    contactDamage: 0,
    maxActive: 3,
    showHpBar: false,
  },
  {
    /**
     * DEMOLITION CHARGE — kret SAPPER, `E`. Wielki ładunek: DŁUGI zamach (tell
     * 1 s = wrogowie mają czas wejść, Ty czas ich naganiać), ogromny promień
     * i mocne ogłuszenie. Jednorazowy (`charges: 1`). To „duży guzik" sapera —
     * postaw, ściągnij hordę, patrz jak znika.
     */
    id: 'demolition-charge',
    name: 'CHARGE',
    color: 0xd0662a,
    shapeSides: 3,
    radius: 14,
    movement: 'static',
    speed: 0,
    hp: 0,
    lifetimeTicks: secs(20),
    attacks: [
      { kind: 'slam', windupTicks: secs(1), hitRadius: 280, damage: 70, knockback: 160, status: 'stun', recoverTicks: 0 },
    ],
    attackIntervalTicks: secs(0.6),
    triggerRadius: 120,
    charges: 1,
    contactDamage: 0,
    maxActive: 2,
    showHpBar: false,
  },

  /* ── KRET MAGMA: mag ognia + WULKAN ──────────────────────────────────────
   * Lawa = `quake-field` z `burn`; meteor = `slam`+`burn`+`charges:1`; wulkan
   * = spawner (`spews`), który przez cały czas życia zrzuca meteory losowo.
   */
  {
    /**
     * LAVA POOL — kret MAGMA, `W`. Kałuża lawy postawiona w punkcie: cyklicznie
     * podpala i rani wszystko, co w niej stoi (klon `quake-field` + `burn`).
     * Zero odrzutu — ma zmuszać hordę do przejścia przez ogień, nie rozganiać.
     */
    id: 'lava-pool',
    name: 'LAVA',
    color: 0xff6b1a,
    shapeSides: 4,
    radius: 22,
    movement: 'static',
    speed: 0,
    hp: 0,
    lifetimeTicks: secs(6),
    attacks: [
      { kind: 'slam', windupTicks: 0, hitRadius: 150, damage: 5, knockback: 0, status: 'burn', recoverTicks: 0 },
    ],
    attackIntervalTicks: secs(0.5),
    contactDamage: 0,
    maxActive: 3,
    showHpBar: false,
  },
  {
    /**
     * METEOR — pocisk WULKANU (`R` maga magmy). Statyczny „znacznik" spadający
     * w losowy punkt: `windupTicks` to TELEGRAF (render powiększa jednostkę
     * w zamachu — masz czas odejść), po nim wybuch z `burn` i `charges: 1`
     * kasuje go razem z hukiem. Nie stawiany ręcznie — wypluwa go `volcano`.
     */
    id: 'magma-meteor',
    name: 'METEOR',
    color: 0xff4500,
    shapeSides: 3,
    radius: 10,
    movement: 'static',
    speed: 0,
    hp: 0,
    lifetimeTicks: secs(1.6),
    attacks: [
      { kind: 'slam', windupTicks: secs(0.7), hitRadius: 100, damage: 14, knockback: 30, status: 'burn', recoverTicks: 0 },
    ],
    // 0 — zamach rusza od razu po zrzucie; całe opóźnienie siedzi w `windupTicks`.
    attackIntervalTicks: 0,
    charges: 1,
    contactDamage: 0,
    maxActive: 40,
    showHpBar: false,
  },
  {
    /**
     * VOLCANO — kret MAGMA, `R`. Popieprzony ultimate: postawiona struktura,
     * która przez cały swój czas życia (~45 s) co ~1,1 s ZRZUCA meteor
     * (`spews`) na losowe miejsce w wielkim promieniu. Sam nie atakuje — to
     * fabryka opadu ogniowego, która na minutę zamienia arenę w strzelnicę
     * i zmusza całą drużynę do ciągłego ruchu. `minionDuration` przedłuża opad.
     */
    id: 'volcano',
    name: 'VOLCANO',
    color: 0xb5321a,
    shapeSides: 3,
    radius: 30,
    movement: 'static',
    speed: 0,
    hp: 0,
    lifetimeTicks: secs(45),
    attacks: [],
    // Interwał zrzutu meteorów (spawnMinion ustawia z tego pierwszy odstęp).
    attackIntervalTicks: secs(1.1),
    spews: { minionId: 'magma-meteor', radius: 720, count: 1 },
    contactDamage: 0,
    maxActive: 1,
    showHpBar: true,
  },
];

/**
 * Promień, w jakim jednostka działa OBSZAROWO (`slam`), albo 0.
 *
 * Render rysuje z tego okrąg pola. Bez niego gracz widzi tylko sylwetkę
 * o promieniu `radius` (~20 px) i nie ma pojęcia, że pole spowalnia
 * wszystko w promieniu 200 px — czyli że postawił je w dobrym miejscu.
 * Ataki `bolt` celowo pomijamy: strzelają w POJEDYNCZY cel, więc okrąg
 * zasięgu byłby szumem, a nie informacją.
 */
export function minionEffectRadius(def: MinionDef): number {
  let r = 0;
  for (const a of def.attacks) {
    if (a.kind === 'slam') r = Math.max(r, a.hitRadius);
  }
  return r;
}

export function minionById(id: string): MinionDef | null {
  return MINIONS.find((m) => m.id === id) ?? null;
}

export function minionIndexById(id: string): number {
  return MINIONS.findIndex((m) => m.id === id);
}
