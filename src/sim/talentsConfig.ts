import type { ItemKind } from './itemsConfig';
import { UPGRADES } from './wavesConfig';

/**
 * ═══════════════════════════════════════════════════════════════════
 *  DRZEWKA TALENTÓW — tu projektujesz progresję postaci w runie.
 *  Edytuj śmiało, Vite przeładuje grę po zapisie.
 *
 *  Zasady (gdd.md 5.8):
 *   - Cały postęp mieści się w JEDNYM runie i po nim znika. Zero zapisu.
 *   - Każda klasa ma docelowo 3 GAŁĘZIE = 3 specjalizacje. Na razie każda
 *     klasa ma jedną odblokowaną; pozostałe czekają na projekt.
 *   - Żeby sięgnąć głębiej w gałąź, trzeba w nią wcześniej WŁOŻYĆ punkty
 *     (`requiresInBranch`). Nie ma dostępu do wszystkiego od razu — to jest
 *     źródło decyzji „idę w jedną rzecz czy liznę dwie".
 *
 *  DZIŚ WSZYSTKIE TALENTY SĄ PASYWNE (liczbowe) i korzystają z tego samego
 *  mechanizmu efektów co itemy, karty z przerwy i LAB — dlatego są prawie
 *  darmowe. Talenty ZMIENIAJĄCE ZACHOWANIE (nowe umiejętności) to osobny
 *  koszt: każda wymaga własnego kodu w symulacji. Budżet: 1-2 na gałąź.
 * ═══════════════════════════════════════════════════════════════════
 */

export const PROGRESSION = {
  /**
   * Na którym poziomie gracz musi wybrać specjalizację. Pierwszy punkt
   * talentu wpada właśnie wtedy i można go wydać WYŁĄCZNIE na specjalizację —
   * to jest moment, w którym run dostaje kierunek.
   */
  specLevel: 2,
  /** Maksymalny poziom w runie. Poziom 1 na starcie, więc punktów jest maxLevel-1. */
  maxLevel: 25,
  /**
   * Krzywa: koszt awansu na poziom `n` = round(base * n^exponent).
   * Rosnąca, żeby ostatnie poziomy były wydarzeniem, a nie formalnością.
   */
  xpCurveBase: 42,
  xpCurveExponent: 1.35,
  /**
   * Ile expa za jednego zabitego najeźdźcę.
   *
   * UWAGA — pierwotna kalibracja była BŁĘDNA. Mierzyłem ją na nieśmiertelnym
   * bocie testowym, który robił ~4000 zabójstw na run. Bench na normalnym
   * bocie (`npm run bench`, 2026-07-20) pokazał ~100-270 zabójstw, bo runy
   * kończą się śmiercią w okolicach fali 3-5. Exp z zabójstw jest więc
   * w praktyce marginalny, a całą progresję niosą fale.
   *
   * Zostawione bez zmian świadomie: to jest objaw trudności, nie krzywej.
   * Podbicie tej liczby zamaskowałoby problem, zamiast go rozwiązać.
   */
  xpPerKill: 3,
  /**
   * Na jakim ułamku runu gracz ma osiągnąć maksymalny poziom.
   * 0.8 = mniej więcej na 8. fali z 10 — finał gra się już zmasterowaną postacią.
   *
   * WAŻNE: z tego AUTOMATYCZNIE wyliczamy exp za falę (patrz `xpPerWaveCleared`),
   * więc zmiana długości runu nie wymaga przestrajania krzywej ręcznie.
   */
  maxLevelAtRunFraction: 0.8,
  /**
   * Jaka część progresji ma pochodzić z samego przetrwania fal (reszta z zabójstw).
   *
   * Wysoko celowo: fale są PODŁOGĄ, której nikt nie przegapi, a zabójstwa
   * tylko przyspieszają. Dzięki temu dobry gracz masteruje postać kilka fal
   * wcześniej, ale nawet słaby zdąży przed finałem — zamiast dojść do końca
   * runu z niedokończonym drzewkiem.
   */
  waveXpShare: 0.85,
};

/**
 * ALPHA PACK — strojenie drugiej gałęzi wilka.
 *
 * Trzyma się TUTAJ, a nie w symulacji, bo to są liczby projektowe jednej
 * gałęzi: chcąc ją przebalansować, zagląda się do drzewka, a nie do world.ts.
 *
 * Dwa niezależne źródła siły, celowo:
 *  - LICZBA sojuszników w pobliżu — natychmiastowa, znika gdy zostaniesz sam;
 *  - PACK INSTINCT — narastający przez cały run licznik zabójstw w grupie.
 * Pierwsze nagradza trzymanie się razem TERAZ, drugie premiuje robienie tego
 * konsekwentnie. Sojusznik to każdy: inny gracz i DOWOLNY minion, także cudzy.
 */
export const ALPHA_PACK = {
  /** W jakim promieniu liczymy sojuszników. */
  radius: 420,
  /** +% obrażeń za każdego sojusznika w promieniu. */
  damagePerAlly: 6,
  /** +armor za każdego sojusznika w promieniu (ułamki się sumują). */
  armorPerAlly: 0.5,
  /** Ile punktów licznika daje zabójstwo z sojusznikiem w pobliżu. */
  instinctPerKill: 1,
  /** Sufit licznika — bez niego długi run robi z wilka boga. */
  instinctMax: 100,
  /** +% obrażeń za każdy punkt licznika (przy suficie: +50%). */
  damagePerInstinct: 0.5,
  /** +% do bonusu z aury `pack-fury` za każdy punkt licznika. */
  auraPerInstinct: 1,
};

/** Koszt POJEDYNCZEGO awansu z `level-1` na `level` (nie suma od początku). */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.round(PROGRESSION.xpCurveBase * Math.pow(level, PROGRESSION.xpCurveExponent));
}

/** Suma expa od poziomu 1 do maksymalnego — podstawa do wyliczenia nagród. */
export function totalXpToMaxLevel(): number {
  let sum = 0;
  for (let l = 2; l <= PROGRESSION.maxLevel; l++) sum += xpForLevel(l);
  return sum;
}

/**
 * Exp za ukończoną falę — WYLICZANY z długości runu, nie wpisany na sztywno.
 * Dzięki temu wydłużenie runu (gdd.md 5.8) nie rozstraja całego drzewka:
 * przy 30 falach jedna fala daje po prostu odpowiednio mniej.
 */
export function xpPerWaveCleared(totalWaves: number): number {
  const waves = Math.max(1, Math.round(totalWaves * PROGRESSION.maxLevelAtRunFraction));
  return (totalXpToMaxLevel() * PROGRESSION.waveXpShare) / waves;
}

/* ── Struktura drzewka ──────────────────────────────────────────────────── */

export interface TalentDef {
  /** Unikalne w obrębie klasy. */
  id: string;
  name: string;
  /** Opis JEDNEGO poziomu (EN — teksty w grze). */
  desc: string;
  kind: ItemKind;
  valuePerRank: number;
  maxRank: number;
  /**
   * Obsadza SLOTY umiejętności: indeks 0 = Q, 1 = W, 2 = E. Pusty wpis
   * zostawia slot bez zmian. To jest mechanizm talentów ZMIENIAJĄCYCH
   * ZACHOWANIE: talent nie dokłada kodu do symulacji, tylko wskazuje
   * definicje z `skillsConfig.ts`. Dzik-inżynier obsadza tym trzy sloty
   * naraz, snajper jeden — ten sam mechanizm.
   */
  grantsSkills?: string[];
  /**
   * Podmienia doskok spod spacji na ten o podanym id (`DASHES`).
   * Kolejny slot umiejętności — ten sam mechanizm co `grantsSkills`.
   */
  grantsDash?: string;
  /**
   * OPRÓŻNIA sloty Q/W/E. Dla specjalizacji, w których klawisze same nic nie
   * robią, a liczy się wyłącznie ich KOLEJNOŚĆ (Thunder Fang wilka).
   */
  clearsSkills?: boolean;
  /** Combo z `comboConfig.ts`, których uczy ta specjalizacja. */
  grantsCombos?: string[];
  /**
   * Pasywny rykoszet auto-ataku: trafiony wróg wypuszcza błyskawicę
   * w kolejnego. `chains` = ile razy przeskakuje.
   */
  grantsRicochet?: { chains: number; range: number; falloff: number; damageMult: number };
  /**
   * Włącza mechanikę watahy (`ALPHA_PACK`): bonusy od liczby sojuszników
   * w pobliżu i licznik Pack Instinct rosnący za zabójstwa w grupie.
   */
  grantsPack?: boolean;
  /**
   * Włącza aurę o podanym id (`AURAS` w `statusConfig.ts`). Aury nie mają
   * slotów — gracz może roztaczać kilka naraz i one się sumują.
   */
  grantsAura?: string;
}

export interface TalentTier {
  /** Ile punktów musi być już wydanych W TEJ GAŁĘZI, żeby odblokować ten rząd. */
  requiresInBranch: number;
  /**
   * Rząd WYBORU SPECJALIZACJI — pierwszy punkt talentu (poziom 2) idzie tutaj.
   * Wybór jest nieodwracalny i zamyka pozostałe gałęzie na resztę runu.
   */
  isSpec?: boolean;
  talents: TalentDef[];
}

export interface TalentBranch {
  id: string;
  /** Nazwa specjalizacji pokazywana graczowi. */
  name: string;
  /** Gałąź jeszcze niezaprojektowana — widoczna, ale zablokowana. */
  comingSoon?: boolean;
  tiers: TalentTier[];
}

export interface ClassTalents {
  classId: string;
  branches: TalentBranch[];
}

/* ── Generator gałęzi pasywnych ─────────────────────────────────────────── */

/**
 * Opis pasywnych efektów: skąd brać nazwę i jednostkę w opisie talentu.
 * `medkit` i `overshield` celowo pominięte — jednorazowe leczenie jako talent
 * na stałe byłoby albo bezużyteczne, albo absurdalnie mocne.
 */
const PASSIVE_LABEL: Partial<Record<ItemKind, { label: string; unit: string }>> = {
  strength: { label: 'damage', unit: '%' },
  attackSpeed: { label: 'attack speed', unit: '%' },
  speed: { label: 'move speed', unit: '%' },
  range: { label: 'attack range', unit: '%' },
  armor: { label: 'armor', unit: '' },
  maxHp: { label: 'max HP', unit: '' },
  cooldown: { label: 'skill cooldown', unit: '%' },
  regen: { label: 'HP per second', unit: '' },
  leech: { label: 'HP per kill', unit: '' },
  thorns: { label: 'thorns damage', unit: '' },
  knockback: { label: 'knockback', unit: '%' },
  magnet: { label: 'pickup radius', unit: '' },
  raiseDead: { label: 'raise radius', unit: '' },
  critChance: { label: 'critical chance', unit: '%' },
  critDamage: { label: 'critical damage', unit: '%' },
  minionDamage: { label: 'MINION damage', unit: '%' },
  minionHp: { label: 'MINION health', unit: '%' },
  minionDuration: { label: 'MINION duration', unit: '%' },
  minionCount: { label: 'max MINIONS', unit: '' },
  impactRadius: { label: 'SHOCKWAVE radius', unit: '%' },
  projectileCount: { label: 'PROJECTILES', unit: '' },
  chainCount: { label: 'CHAIN bounces', unit: '' },
};

/**
 * Ile daje JEDNA ranga talentu — wyprowadzone z wartości karty ulepszenia
 * tego samego rodzaju, a nie wpisane z palca.
 *
 * DLACZEGO TAK: pierwsza wersja miała jedną wspólną liczbę dla wszystkich
 * statystyk. Dla obrażeń 5%/rangę jest sensowne, ale dla wampiryzmu 1 HP
 * za zabicie oznaczało ~21 HP/zabicie z pełnej gałęzi — dwudziestokrotność
 * karty. Bench wyłapał to jako „nietoperz wygrywa cały run stojąc w miejscu"
 * (2026-07-20). Każda statystyka ma inną naturalną skalę, więc jedyny
 * sensowny punkt odniesienia to wartości, które ktoś już zaprojektował.
 */
const TALENT_BRANCH_IN_CARDS = 3.2;
/** Ranga jest ułamkiem karty: pełna gałąź ≈ TALENT_BRANCH_IN_CARDS kart. */
function rankValue(kind: ItemKind): number {
  const card = UPGRADES.find((u) => u.kind === kind)?.value ?? 5;
  // ~13 rang na statystykę w gałęzi (5 + 3 + 3 + 2), z narastającymi mnożnikami.
  const v = (card * TALENT_BRANCH_IN_CARDS) / 13;
  return Math.round(v * 100) / 100;
}

function passive(
  id: string, name: string, kind: ItemKind, valuePerRank: number, maxRank: number,
): TalentDef {
  const l = PASSIVE_LABEL[kind];
  const sign = kind === 'cooldown' ? '-' : '+';
  return {
    id, name, kind, valuePerRank, maxRank,
    desc: `${sign}${Math.round(valuePerRank * 100) / 100}${l?.unit ?? ''} ${l?.label ?? kind}`,
  };
}

/**
 * Rząd wyboru specjalizacji — pierwszy punkt talentu (poziom 2) idzie tutaj.
 * Wybór jest NIEODWRACALNY: zamyka pozostałe dwie gałęzie do końca runu.
 * Dlatego każda specjalizacja od razu coś daje, a nie jest samym „kluczem".
 */
function specTier(def: TalentDef): TalentTier {
  return { requiresInBranch: 0, isSpec: true, talents: [def] };
}

function spec(
  id: string, name: string, kind: ItemKind, value: number,
  extraDesc?: string,
  grants?: {
    skills?: string[]; dash?: string; aura?: string;
    combos?: string[]; clearSkills?: boolean;
    ricochet?: { chains: number; range: number; falloff: number; damageMult: number };
    pack?: boolean;
  },
): TalentDef {
  const l = PASSIVE_LABEL[kind];
  const bonus = `+${Math.round(value * 100) / 100}${l?.unit ?? ''} ${l?.label ?? kind}`;
  return {
    id: `${id}-spec`, name, kind, valuePerRank: value, maxRank: 1,
    grantsSkills: grants?.skills, grantsDash: grants?.dash, grantsAura: grants?.aura,
    grantsCombos: grants?.combos, clearsSkills: grants?.clearSkills,
    grantsRicochet: grants?.ricochet, grantsPack: grants?.pack,
    desc: extraDesc ? `${extraDesc} · ${bonus}` : `SPECIALIZE · ${bonus}`,
  };
}

/**
 * Szkielet gałęzi pasywnej: 4 rzędy, łącznie 24 punkty do wydania — czyli
 * dokładnie tyle, ile daje cały run. Zmaksowanie jednej gałęzi zjada więc
 * wszystko; to jest ta decyzja, o którą chodzi.
 *
 * Używane jako PLACEHOLDER dla klas, których specjalizacje nie są jeszcze
 * zaprojektowane — patrz `comingSoon`. Kret ma już gałąź pisaną ręcznie.
 */
function passiveBranch(
  id: string, name: string, primary: ItemKind, secondary: ItemKind,
): TalentBranch {
  const p = PASSIVE_LABEL[primary]?.label ?? primary;
  const s = PASSIVE_LABEL[secondary]?.label ?? secondary;
  const step = rankValue;
  return {
    id, name,
    tiers: [
      specTier(spec(id, name, primary, step(primary) * 2)),
      {
        requiresInBranch: 0,
        talents: [
          passive(`${id}-a1`, `Honed ${p}`, primary, step(primary), 5),
          passive(`${id}-b1`, `Honed ${s}`, secondary, step(secondary), 5),
        ],
      },
      {
        requiresInBranch: 5,
        talents: [
          passive(`${id}-a2`, `Refined ${p}`, primary, step(primary) * 1.6, 3),
          passive(`${id}-b2`, `Refined ${s}`, secondary, step(secondary) * 1.6, 3),
        ],
      },
      {
        requiresInBranch: 10,
        talents: [
          passive(`${id}-a3`, `Mastered ${p}`, primary, step(primary) * 2, 3),
          passive(`${id}-b3`, `Mastered ${s}`, secondary, step(secondary) * 2, 3),
        ],
      },
      {
        requiresInBranch: 15,
        talents: [passive(`${id}-cap`, `Apex ${p}`, primary, step(primary) * 3, 2)],
      },
    ],
  };
}

/** Gałąź-zaślepka: widoczna w drzewku, żeby było wiadomo, że coś tam będzie. */
function comingSoon(id: string, name: string): TalentBranch {
  return { id, name, comingSoon: true, tiers: [] };
}

/* ── Drzewka klas ───────────────────────────────────────────────────────── */

/**
 * KRET — SNIPER. Pierwsza gałąź pisana ręcznie i wzorzec dla pozostałych
 * (gdd.md 5.8). Motyw: zasięg i precyzja zamiast tempa — rośnie zasięg,
 * obrażenia i cooldown, a nie szybkość machania łapą.
 *
 * DOCELOWO ta gałąź dostanie celowany strzał z friendly fire (gdd.md 5.12).
 * Dziś jest w całości pasywna — sama umiejętność to osobny kawałek pracy.
 */
const MOLE_SNIPER: TalentBranch = {
  id: 'mole-sniper',
  name: 'SNIPER',
  tiers: [
    // Wybór tej specjalizacji NATYCHMIAST podmienia Q: zamiast szerokiego
    // wachlarza w zwarciu gracz dostaje bardzo daleką, wąską wiązkę.
    specTier(
      spec('mole-sniper', 'SNIPER', 'range', 20, 'Q becomes a long, narrow shot', { skills: ['sniper-shot'] }),
    ),
    {
      requiresInBranch: 0,
      talents: [
        passive('sniper-aim', 'Steady Aim', 'range', 6, 5),
        passive('sniper-ap', 'Armor Piercing', 'strength', 5, 5),
      ],
    },
    {
      requiresInBranch: 5,
      talents: [
        passive('sniper-barrel', 'Long Barrel', 'range', 8, 3),
        passive('sniper-breath', 'Held Breath', 'cooldown', 6, 3),
      ],
    },
    {
      requiresInBranch: 10,
      talents: [
        passive('sniper-marks', 'Marksman', 'strength', 10, 3),
        passive('sniper-bipod', 'Bipod', 'attackSpeed', 8, 3),
      ],
    },
    {
      requiresInBranch: 15,
      // Zwieńczenie gałęzi: duży skok mocy jako nagroda za pełne wejście w nią.
      talents: [passive('sniper-exec', 'Execution Protocol', 'strength', 18, 2)],
    },
  ],
};

/**
 * ZAJĄC — SLIPSTREAM. Druga gałąź zmieniająca zachowanie, celowo w INNYM
 * slocie niż snajper: tam podmieniamy Q, tutaj doskok spod spacji. To był
 * test, czy mechanizm jest naprawdę ogólny (gdd.md 5.8).
 *
 * Zamysł: zwykły skok zająca to ucieczka. Power Jump zamienia go w wejście —
 * lądowanie rozbija wszystko dookoła, więc skacze się W hordę, a nie od niej.
 */
const HARE_SLIPSTREAM: TalentBranch = {
  id: 'hare-slip',
  name: 'SLIPSTREAM',
  tiers: [
    // Specjalizacja obsadza OBA sloty naraz: Q = skok bojowy, W = nova.
    // Oba zerują cooldown skoku, więc od pierwszej minuty gra się łańcuchem.
    specTier(
      spec('hare-slip', 'SLIPSTREAM', 'impactRadius', 25,
        'Q leaps with a shockwave, W novas — both RESET your jump',
        { skills: ['leap-strike', 'shock-nova'] }),
    ),
    {
      requiresInBranch: 0,
      talents: [
        passive('slip-wave', 'Wider Wave', 'impactRadius', 35, 5),
        passive('slip-legs', 'Spring Legs', 'speed', rankValue('speed'), 5),
      ],
    },
    {
      requiresInBranch: 5,
      talents: [
        passive('slip-quake', 'Quakemaker', 'impactRadius', 60, 3),
        passive('slip-coil', 'Coiled Spring', 'cooldown', rankValue('cooldown') * 1.6, 3),
      ],
    },
    {
      requiresInBranch: 10,
      talents: [
        passive('slip-crater', 'Cratermaker', 'impactRadius', 90, 3),
        passive('slip-heavy', 'Heavy Landing', 'strength', rankValue('strength') * 2, 3),
      ],
    },
    {
      requiresInBranch: 15,
      talents: [
        /**
         * Zwieńczenie gałęzi: spacja przestaje być ucieczką i staje się
         * trzecim uderzeniem. NIE dostaje `resetsDash` — inaczej resetowałaby
         * samą siebie i skoczek nigdy nie musiałby przestać skakać.
         */
        {
          id: 'slip-apex', name: 'TERMINAL VELOCITY',
          desc: 'SPACE becomes a full POWER JUMP · +120% shockwave radius',
          kind: 'impactRadius', valuePerRank: 120, maxRank: 2,
          grantsDash: 'power-jump',
        },
      ],
    },
  ],
};

const HARE_SUMMONER: TalentBranch = {
  id: 'hare-summoner',
  name: 'SUMMONER',
  tiers: [
    specTier(
      spec('hare-summoner', 'SUMMONER', 'cooldown', 8, 'Q summons a BEHEMOTH ally',
        { skills: ['summon-behemoth'] }),
    ),
    {
      requiresInBranch: 0,
      talents: [
        passive('sum-vigor', 'Shared Vigor', 'minionHp', 40, 5),
        passive('sum-fury', 'Fury of the Bound', 'minionDamage', 35, 5),
      ],
    },
    {
      requiresInBranch: 5,
      talents: [
        passive('sum-rite', 'Rite of Power', 'minionDamage', 60, 3),
        passive('sum-ward', 'Warding', 'minionHp', 70, 3),
      ],
    },
    {
      requiresInBranch: 10,
      talents: [
        // Drugi Behemot — tu build zaczyna wyglądać absurdalnie, i o to chodzi.
        passive('sum-echo', 'Echoing Call', 'minionCount', 1, 2),
        passive('sum-titan', 'Titanflesh', 'minionHp', 110, 3),
      ],
    },
    {
      requiresInBranch: 15,
      talents: [passive('sum-apex', 'Grand Summoner', 'minionDamage', 200, 2)],
    },
  ],
};

/**
 * HIENA — NEKROMANTKA. Specjalizacja NIE zmienia `Q` — daje pasywkę:
 * każdy wróg zabity w dużym promieniu wokół gracza wstaje po naszej stronie.
 * Talenty w gałęzi powiększają ten promień, więc build skaluje samą pasywkę.
 */
const HYENA_NECRO: TalentBranch = {
  id: 'hy-necro',
  name: 'NECROMANCER',
  tiers: [
    specTier(
      spec('hy-necro', 'NECROMANCER', 'raiseDead', 960,
        'enemies dying near you RISE AND FIGHT for you'),
    ),
    {
      requiresInBranch: 0,
      talents: [
        passive('necro-reach', 'Grave Reach', 'raiseDead', 120, 5),
        passive('necro-claws', 'Rotten Claws', 'minionDamage', 30, 5),
      ],
    },
    {
      requiresInBranch: 5,
      talents: [
        passive('necro-horde', 'Growing Horde', 'minionCount', 6, 3),
        passive('necro-bind', 'Binding Rites', 'minionDuration', 50, 3),
      ],
    },
    {
      requiresInBranch: 10,
      talents: [
        passive('necro-domain', 'Domain of Death', 'minionDamage', 60, 3),
        passive('necro-swarm', 'Endless Swarm', 'minionCount', 10, 3),
      ],
    },
    {
      requiresInBranch: 15,
      // Zwieńczenie: stado przestaje być dodatkiem, a staje się główną bronią.
      talents: [passive('necro-apex', 'Lord of Bones', 'minionDamage', 150, 2)],
    },
  ],
};

/**
 * DZIK — TOTEM ENGINEER. Jedyna specjalizacja obsadzająca WSZYSTKIE trzy
 * sloty naraz: Q = wieżyczka strzelająca, W = totem pulsujący pierścieniami,
 * E = totem odpychający. Gra staje się o rozstawianie pozycji, nie o bieganie.
 */
const BOAR_ENGINEER: TalentBranch = {
  id: 'boar-eng',
  name: 'TOTEM ENGINEER',
  tiers: [
    specTier(
      spec('boar-eng', 'TOTEM ENGINEER', 'cooldown', 10, 'Q/W/E place three different totems',
        { skills: ['totem-turret', 'totem-pulse', 'totem-knock'] }),
    ),
    {
      requiresInBranch: 0,
      talents: [
        passive('eng-fab', 'Fast Fabrication', 'cooldown', rankValue('cooldown'), 5),
        passive('eng-frame', 'Sturdy Frame', 'maxHp', rankValue('maxHp'), 5),
      ],
    },
    {
      requiresInBranch: 5,
      talents: [
        passive('eng-ammo', 'Hot Ammo', 'minionDamage', 35, 3),
        passive('eng-fuel', 'Deep Reserves', 'minionDuration', 60, 3),
      ],
    },
    {
      requiresInBranch: 10,
      talents: [
        passive('eng-array', 'Totem Array', 'minionCount', 2, 3),
        passive('eng-overdrive', 'Overdrive', 'minionDamage', 70, 3),
      ],
    },
    {
      requiresInBranch: 15,
      talents: [passive('eng-apex', 'Master Engineer', 'minionDamage', 160, 2)],
    },
  ],
};

/**
 * NIEDŹWIEDŹ — GRAVITY MAGE. Odchodzi od zwarcia: obsadza `Q` i `W` polami
 * stawianymi W PUNKCIE NA MAPIE, więc gra się nim o kontrolę terenu, a nie
 * o dystans do wroga. `E` zostaje domyślne — czeka na czarną dziurę.
 *
 * Zamiast pancerza rośnie tu `minionDamage`: pola są jedynym źródłem
 * obrażeń tej gałęzi, więc to ONO jest osią postępu. Niedźwiedź nadal może
 * być tankiem, tylko w pozostałych dwóch gałęziach (gdd.md 5.4).
 */
const BEAR_GRAVITY: TalentBranch = {
  id: 'bear-gravity',
  name: 'GRAVITY MAGE',
  tiers: [
    specTier(
      spec('bear-gravity', 'GRAVITY MAGE', 'cooldown', 10,
        'Q quake · W collapse · E slowing field',
        { skills: ['quake-field', 'gravity-collapse', 'gravity-field'] }),
    ),
    {
      requiresInBranch: 0,
      talents: [
        passive('grav-mass', 'Critical Mass', 'minionDamage', 35, 5),
        passive('grav-anchor', 'Anchored Stance', 'maxHp', rankValue('maxHp'), 5),
      ],
    },
    {
      requiresInBranch: 5,
      talents: [
        passive('grav-cycle', 'Shorter Cycle', 'cooldown', rankValue('cooldown'), 3),
        passive('grav-linger', 'Lingering Field', 'minionDuration', 45, 3),
        {
          // PODMIENIA `E` na wariant zadający obrażenia. Dopiero od tego
          // momentu talenty na `minionDamage` w ogóle mają co mnożyć —
          // bazowe pole ma damage 0.
          id: 'grav-crush',
          name: 'Crushing Weight',
          desc: 'E field also DAMAGES enemies inside',
          kind: 'minionDamage',
          valuePerRank: 20,
          maxRank: 1,
          grantsSkills: ['', '', 'gravity-field-crush'],
        },
      ],
    },
    {
      requiresInBranch: 10,
      talents: [
        passive('grav-fault', 'Fault Lines', 'minionCount', 1, 3),
        passive('grav-density', 'Density', 'minionDamage', 70, 3),
      ],
    },
    {
      requiresInBranch: 15,
      talents: [
        passive('grav-apex', 'Event Horizon', 'minionDamage', 160, 2),
        {
          // Zwieńczenie: pole zaczyna OGŁUSZAĆ. Wariant ma dwa ataki na
          // przemian (spowolnienie / stun), więc horda dostaje przerywane
          // ogłuszenie zamiast zamrożenia na stałe.
          id: 'grav-singularity',
          name: 'Singularity',
          desc: 'E field also STUNS enemies inside',
          kind: 'minionDamage',
          valuePerRank: 40,
          maxRank: 1,
          grantsSkills: ['', '', 'gravity-field-singularity'],
        },
      ],
    },
  ],
};

/**
 * LIS — CHRONOMANCER. Gałąź o ZAGĘSZCZANIU areny: `Q` stawia pułapkę,
 * a drzewko rozwija ich LICZBĘ i CZAS TRWANIA, więc pole minowe narasta
 * przez cały run zamiast być odnawiane co walkę. Stąd nacisk na
 * `minionCount` i `minionDuration` zamiast na obrażenia jednej sztuki.
 *
 * `W` stawia PARĘ portali (trzeci kasuje najstarszy), `E` zatrzymuje czas.
 * Uwaga na interakcję: talenty na `minionCount` z tej gałęzi podbijają
 * liczbę PUŁAPEK, ale nie portali — te mają `fixedCount`, bo „dwa" jest
 * u nich zasadą, a nie parametrem siły.
 */
const FOX_CHRONO: TalentBranch = {
  id: 'fox-chrono',
  name: 'CHRONOMANCER',
  tiers: [
    specTier(
      spec('fox-chrono', 'CHRONOMANCER', 'cooldown', 10,
        'Q trap · W portal pair · E time stop',
        { skills: ['chrono-trap', 'chrono-portal', 'chrono-timestop'] }),
    ),
    {
      requiresInBranch: 0,
      talents: [
        passive('chrono-web', 'Web of Moments', 'minionCount', 1, 5),
        passive('chrono-wind', 'Long Wind', 'minionDuration', 40, 5),
      ],
    },
    {
      requiresInBranch: 5,
      talents: [
        passive('chrono-haste', 'Hastened Rites', 'cooldown', rankValue('cooldown'), 3),
        passive('chrono-sharp', 'Sharpened Instants', 'minionDamage', 40, 3),
      ],
    },
    {
      requiresInBranch: 10,
      talents: [
        passive('chrono-lattice', 'Lattice', 'minionCount', 2, 3),
        passive('chrono-echo', 'Echoing Snare', 'minionDamage', 70, 3),
      ],
    },
    {
      requiresInBranch: 15,
      talents: [passive('chrono-apex', 'Frozen Hour', 'minionDuration', 120, 2)],
    },
  ],
};

/**
 * LIS — ARCANE ARCHER. `Q` staje się strzałą, która WYBUCHA i PRZESKAKUJE
 * na kolejnych wrogów. Cała gałąź rozwija dwie liczby: ile strzał leci naraz
 * i ile razy każda się odbija — z jednej strzały i dwóch odbić robi się pod
 * koniec runu wachlarz pięciu strzał odbijających się kilkanaście razy.
 *
 * `W` (blink arrow) i `E` (pasywka nakładająca volley) czekają na własne
 * prymitywy: cast dwuetapowy i trigger on-hit.
 */
const FOX_ARCANE: TalentBranch = {
  id: 'fox-arcane',
  name: 'ARCANE ARCHER',
  tiers: [
    specTier(
      spec('fox-arcane', 'ARCANE ARCHER', 'strength', 10,
        'Q chaining arrow · W blink · E surge',
        { skills: ['arcane-volley', 'blink-arrow', 'arcane-surge'] }),
    ),
    {
      requiresInBranch: 0,
      talents: [
        passive('arc-quiver', 'Deep Quiver', 'projectileCount', 1, 2),
        passive('arc-arcing', 'Arcing Bolt', 'chainCount', 1, 5),
      ],
    },
    {
      requiresInBranch: 5,
      talents: [
        passive('arc-focus', 'Focused Draw', 'strength', rankValue('strength'), 3),
        passive('arc-conduct', 'Conductive Tips', 'chainCount', 1, 3),
      ],
    },
    {
      requiresInBranch: 10,
      talents: [
        passive('arc-volley', 'Wider Volley', 'projectileCount', 1, 2),
        passive('arc-pierce', 'Piercing Draw', 'strength', rankValue('strength') * 1.6, 3),
      ],
    },
    {
      requiresInBranch: 15,
      // Zwieńczenie idzie w odbicia, bo to ONE są fantazją tej gałęzi.
      talents: [passive('arc-apex', 'Storm of Arrows', 'chainCount', 3, 2)],
    },
  ],
};

/**
 * WILK — THUNDER FANG. Jedyna specjalizacja, która ODBIERA umiejętności:
 * Q, W i E same z siebie nie robią nic, liczy się wyłącznie ich KOLEJNOŚĆ
 * (`comboConfig.ts`). Zamiast trzech przycisków gracz ma trzy sekwencje:
 *
 *   Q→W→E  STORM CHAIN     uzbraja następny cios łańcuchem przez 20 celów
 *   E→W→Q  THUNDER NOVA    burza w wybranym punkcie, bije lekko i szybko
 *   Q→W→Q  LIGHTNING RUSH  przemieszczenie z rykoszetami sypanymi po drodze
 *
 * Do tego pasywnie KAŻDY auto-atak wypuszcza błyskawicę w kolejnego wroga —
 * jednego, ale z daleka. Całe drzewko rozwija `chainCount`, bo odbicia
 * dotyczą naraz pasywki, obu combo z błyskawicami i burzy.
 */
const WOLF_THUNDER: TalentBranch = {
  id: 'wolf-thunder',
  name: 'THUNDER FANG',
  tiers: [
    specTier(
      spec('wolf-thunder', 'THUNDER FANG', 'attackSpeed', 15,
        'Q/W/E become COMBOS · attacks ricochet',
        {
          clearSkills: true,
          combos: ['storm-chain', 'thunder-nova', 'lightning-rush'],
          ricochet: { chains: 1, range: 420, falloff: 0.9, damageMult: 0.6 },
        }),
    ),
    {
      requiresInBranch: 0,
      talents: [
        passive('thf-arc', 'Arc Length', 'chainCount', 1, 5),
        passive('thf-static', 'Static Charge', 'attackSpeed', rankValue('attackSpeed'), 5),
      ],
    },
    {
      requiresInBranch: 5,
      talents: [
        passive('thf-over', 'Overcharge', 'strength', rankValue('strength'), 3),
        passive('thf-quick', 'Quick Fangs', 'cooldown', rankValue('cooldown'), 3),
      ],
    },
    {
      requiresInBranch: 10,
      talents: [
        passive('thf-conduct', 'Conduction', 'chainCount', 2, 3),
        passive('thf-struck', 'Thunderstruck', 'critChance', rankValue('critChance'), 3),
      ],
    },
    {
      requiresInBranch: 15,
      talents: [passive('thf-apex', 'Storm Lord', 'chainCount', 3, 2)],
    },
  ],
};

/**
 * WILK — ALPHA PACK. Druga gałąź: zamiast błyskawic — GRUPA.
 *
 *   Q  SWIPE      szeroki cios, który POWTARZA każdy twój wilk
 *   W  PACK FURY  aura wzmacniająca całą drużynę, rośnie z licznikiem
 *   E  CALL WOLF  dokłada wilka do watahy
 *
 * Do tego pasywnie: bonus do obrażeń i pancerza za KAŻDEGO sojusznika obok
 * (liczy się dowolny minion, także cudzy) oraz PACK INSTINCT — licznik
 * rosnący za zabójstwa w grupie i podbijający obrażenia i aurę. Strojenie
 * siedzi w `ALPHA_PACK` na górze tego pliku.
 *
 * Drzewko idzie w `minionCount` i `minionDuration`, bo liczba wilków jest
 * jednocześnie obrażeniami (echo Swipe'a), pancerzem i tempem licznika.
 */
const WOLF_ALPHA: TalentBranch = {
  id: 'wolf-alpha',
  name: 'ALPHA PACK',
  tiers: [
    specTier(
      // Całkowite, bo maks. HP ląduje wprost na HUD-zie — ułamek dawał
      // brzydkie „HP 105/104.76".
      spec('wolf-alpha', 'ALPHA PACK', 'maxHp', 15,
        'Q/W/E: swipe, fury aura, call wolf · allies empower you',
        { skills: ['pack-swipe', 'pack-fury', 'summon-wolf'], pack: true }),
    ),
    {
      requiresInBranch: 0,
      talents: [
        passive('alp-litter', 'Bigger Litter', 'minionCount', 1, 5),
        passive('alp-bond', 'Blood Bond', 'minionDamage', 30, 5),
      ],
    },
    {
      requiresInBranch: 5,
      talents: [
        passive('alp-endure', 'Endurance', 'minionDuration', 40, 3),
        passive('alp-fang', 'Sharper Fangs', 'strength', rankValue('strength'), 3),
      ],
    },
    {
      requiresInBranch: 10,
      talents: [
        passive('alp-horde', 'Howling Horde', 'minionCount', 2, 3),
        passive('alp-hide', 'Thick Hide', 'armor', rankValue('armor'), 3),
      ],
    },
    {
      requiresInBranch: 15,
      talents: [passive('alp-apex', 'Alpha', 'minionDamage', 120, 2)],
    },
  ],
};

/**
 * Drzewka wszystkich klas. Nazwy gałęzi są tematyczne (gdd.md 5.4), ale poza
 * kretem ich zawartość jest PLACEHOLDEREM z pasywów — do zaprojektowania.
 */
export const CLASS_TALENTS: ClassTalents[] = [
  { classId: 'bear',     branches: [BEAR_GRAVITY,                                                         comingSoon('bear-2', 'RAMPAGE'),    comingSoon('bear-3', 'HIBERNATION')] },
  { classId: 'wolf',     branches: [WOLF_THUNDER, WOLF_ALPHA,                                             comingSoon('wolf-3', 'HOWL')] },
  { classId: 'fox',      branches: [FOX_CHRONO, FOX_ARCANE,                                                comingSoon('fox-3', 'TRICKSTER')] },
  { classId: 'hare',     branches: [HARE_SLIPSTREAM, HARE_SUMMONER,                                      comingSoon('hare-3', 'AURA MASTER')] },
  { classId: 'mole',     branches: [MOLE_SNIPER,                                                          comingSoon('mole-2', 'ENGINEER'),   comingSoon('mole-3', 'BURROWER')] },
  { classId: 'hedgehog', branches: [passiveBranch('hog-bramble', 'BRAMBLE', 'thorns', 'armor'),            comingSoon('hog-2', 'CURL'),        comingSoon('hog-3', 'QUILL STORM')] },
  { classId: 'bat',      branches: [passiveBranch('bat-blood', 'BLOODSONG', 'leech', 'attackSpeed'),       comingSoon('bat-2', 'SONAR'),       comingSoon('bat-3', 'NIGHT TERROR')] },
  { classId: 'gorilla',  branches: [passiveBranch('gor-wreck', 'WRECKER', 'strength', 'knockback'),        comingSoon('gor-2', 'WARBEAT'),     comingSoon('gor-3', 'IRON GRIP')] },
  { classId: 'rat',      branches: [passiveBranch('rat-plague', 'PLAGUEBEARER', 'attackSpeed', 'strength'), comingSoon('rat-2', 'SWARM'),      comingSoon('rat-3', 'SCURRY')] },
  { classId: 'boar',     branches: [BOAR_ENGINEER, passiveBranch('boar-stamp', 'STAMPEDE', 'knockback', 'maxHp'), comingSoon('boar-3', 'TUSKS')] },
  { classId: 'otter',    branches: [passiveBranch('ott-tide', 'LIFETIDE', 'regen', 'maxHp'),               comingSoon('ott-2', 'CURRENT'),     comingSoon('ott-3', 'PLAYFUL')] },
  { classId: 'hyena',    branches: [HYENA_NECRO, passiveBranch('hy-scav', 'SCAVENGER', 'strength', 'leech'), comingSoon('hy-3', 'CACKLE')] },
];

/* ── Dostęp ─────────────────────────────────────────────────────────────── */

/** Pozycja talentu w drzewku — potrzebna i symulacji, i interfejsowi. */
export interface TalentSlot {
  def: TalentDef;
  branchIndex: number;
  tierIndex: number;
  requiresInBranch: number;
  /** Czy to wybór specjalizacji (zamyka pozostałe gałęzie). */
  isSpec: boolean;
}

const FLAT_CACHE = new Map<string, TalentSlot[]>();

/**
 * Talenty klasy spłaszczone do jednej tablicy. INDEKS w tej tablicy jest
 * identyfikatorem talentu w `SimInput.talentPick` — jest stabilny w obrębie
 * jednej sesji, bo wszyscy gracze mają ten sam plik konfiguracyjny.
 */
export function talentSlotsFor(classId: string): TalentSlot[] {
  const cached = FLAT_CACHE.get(classId);
  if (cached) return cached;

  const tree = CLASS_TALENTS.find((t) => t.classId === classId);
  const slots: TalentSlot[] = [];
  tree?.branches.forEach((branch, branchIndex) => {
    branch.tiers.forEach((tier, tierIndex) => {
      for (const def of tier.talents) {
        slots.push({
          def, branchIndex, tierIndex,
          requiresInBranch: tier.requiresInBranch,
          isSpec: tier.isSpec === true,
        });
      }
    });
  });
  FLAT_CACHE.set(classId, slots);
  return slots;
}

export function branchesFor(classId: string): TalentBranch[] {
  return CLASS_TALENTS.find((t) => t.classId === classId)?.branches ?? [];
}
