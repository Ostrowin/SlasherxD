import * as C from './constants';

/**
 * ═══════════════════════════════════════════════════════════════════
 *  SKILLE AKTYWNE — to, co siedzi pod klawiszem (dziś: Q).
 *
 *  Umiejętność jest DANYMI, nie kodem: symulacja umie wykonać „stożek
 *  obrażeń o zadanym zasięgu i rozwarciu", a plik poniżej mówi tylko,
 *  jakie ma mieć liczby. Dzięki temu talent może PODMIENIĆ umiejętność
 *  (`TalentDef.grantsSkill`), zamiast dokładać nowy kod do symulacji —
 *  a tego samego ruchu potrzebujemy potem 35 razy, po jednym na gałąź.
 *
 *  Ten sam wzorzec co przy bossach (src/sim/bosses/): prymitywy w kodzie,
 *  konkretne ataki w danych.
 * ═══════════════════════════════════════════════════════════════════
 */

interface SkillBase {
  id: string;
  /** Nazwa na HUD-zie (EN — teksty w grze). */
  name: string;
  cooldownTicks: number;
  /**
   * Trafienie tą umiejętnością ZERUJE cooldown doskoku.
   *
   * To jest silnik buildu skoczka: `Q` i `W` odnawiają skok, więc łańcuch
   * skok → cios → skok kręci się dopóty, dopóki trafiasz. UWAGA: sam doskok
   * NIGDY nie może mieć tej flagi — resetowałby siebie i dałby nieskończoną
   * mobilność bez przestoju. Pętlę ograniczają cooldowny `Q` i `W`.
   */
  resetsDash?: boolean;
}

/** Cios w stożku przed graczem — Power Slash i jego warianty. */
export interface ConeSkill extends SkillBase {
  kind: 'cone';
  /** Zasięg = zasięg zwarcia gracza × ten mnożnik. */
  rangeMult: number;
  /**
   * Rozwarcie stożka jako cosinus połowy kąta.
   * 0.5 = szeroki wachlarz (120°), 0.98 = wąska wiązka (~22°).
   */
  coneCos: number;
  /** Obrażenia = obrażenia zwarcia gracza × ten mnożnik. */
  damageMult: number;
  knockback: number;
  /** Czy trafia także sojuszników (gdd.md 5.12 — friendly fire). */
  friendlyFire: boolean;
  /**
   * Sojusznicze jednostki POWTARZAJĄ ten cios ze swojej pozycji (Swipe alfy).
   * Dzięki temu „wilki tną razem z tobą" nie jest osobnym typem umiejętności,
   * tylko flagą na zwykłym stożku.
   */
  packEcho?: boolean;
  /**
   * Status nakładany trafionym (`STATUSES`). Pusty = żaden.
   *
   * Do tej pory status umiały nałożyć wyłącznie ataki jednostek (`slam`)
   * i aury — czyli rzeczy stawiane na ziemi. Cios w zwarciu nie miał jak,
   * więc każde „uderzenie, które podpala/moczy/spowalnia" musiało udawać
   * minionem. To jest ta luka: jedno pole, z którego korzystają od razu obie
   * gałęzie wydry, a przy okazji każdy przyszły cios gorylia czy dzika.
   */
  status?: string;
  /**
   * Cios ZOSTAWIA jednostkę w miejscu, z którego padł.
   *
   * Klony wydry-asasyna: `Q` jednocześnie tnie i odbija wodną kopię gracza,
   * więc budowanie stada nie kosztuje osobnego przycisku — rośnie samo z tego,
   * że grasz. Stawiamy PO echu (`packEcho`), inaczej świeży klon powtórzyłby
   * ten sam cios z tego samego punktu, w którym stoi gracz.
   */
  spawns?: { minionId: string; count: number };
  /**
   * Po powtórzeniu ciosu jednostki, które go powtórzyły, ZNIKAJĄ.
   *
   * Zamienia `packEcho` z pasywnej premii w zasób do wydania: SHATTER wydry
   * rozbija wszystkie klony naraz za jeden potężny wybuch, a `Q` odbudowuje
   * je od zera. Bez tego gałąź byłaby wyłącznie narastaniem, bez decyzji
   * „zbieram dalej czy spieniężam teraz".
   */
  consumesEcho?: boolean;
  /**
   * FLING (pinball wydry PLAYFUL): mnożnik obrażeń zwarcia zadawanych ODEPCHNIĘTEMU
   * wrogowi, gdy wpadnie na INNEGO wroga albo w ścianę/przeszkodę/granicę. Pominięte
   * = zwykły knockback bez bonusu. To zamienia odrzut z narzędzia kontroli
   * w źródło obrażeń — im ciaśniej i im bliżej ściany, tym mocniej boli.
   */
  fling?: number;
}

/**
 * Włączenie AURY na czas (`AURAS` w statusConfig.ts). Różni się od aury
 * nadanej talentem tym, że trwa chwilę i ma cooldown — dlatego może być
 * mocniejsza niż coś, co wisi na graczu przez cały run.
 */
export interface AuraSkill extends SkillBase {
  kind: 'aura';
  auraId: string;
  durationTicks: number;
}

/**
 * Skok bojowy — umiejętność, która odpala DOSKOK z `DASHES`.
 * Dzięki temu „Q jest Power Jumpem" nie dubluje kodu skoku: skill wskazuje
 * po prostu ten sam wariant doskoku, którego używa spacja.
 */
export interface LeapSkill extends SkillBase {
  kind: 'leap';
  dashId: string;
}

/** Postawienie sojuszniczej jednostki (`minionsConfig.ts`). */
export interface SummonSkill extends SkillBase {
  kind: 'summon';
  minionId: string;
  count: number;
  /** Gdzie stawiamy: przy kursorze, ale nie dalej niż tyle od gracza. */
  placeRange: number;
  /**
   * CELOWANIE DWUETAPOWE: klawisz nie odpala umiejętności, tylko włącza
   * podgląd miejsca; dopiero LMB stawia. Do umiejętności, w których miejsce
   * jest decyzją, a nie odruchem — pole postawione o 100 px za blisko jest
   * bezużyteczne, w przeciwieństwie do totemu rzuconego byle gdzie.
   *
   * Flaga jest per UMIEJĘTNOŚĆ, a nie per klasa, żeby dzik i lis zachowali
   * dotychczasowy quick cast.
   */
  aimed?: boolean;
  /**
   * Skill „summon-lub-komenda": jeśli gracz NIE ma jeszcze żywej jednostki
   * `minionId`, stawia ją; jeśli MA — wydaje jej komendę w stronę kursora
   * (`MinionDef.command`). Generyczne pod przyszłe skille summonów.
   */
  commandsMinion?: boolean;
  /**
   * Skill „summon-lub-PRZENIEŚ": jeśli jednostka `minionId` już żyje, to
   * zamiast stawiać drugą — PRZESUWA istniejącą pod kursor (z zachowaniem jej
   * stanu: cyklu ataku, czasu życia). Silnik jednego przenośnego turreta
   * buildera (BASTION): gracz repozycjonuje działko, ale nigdy nie ma dwóch.
   * Różni się od `commandsMinion` tym, że nie wydaje komendy, tylko teleportuje.
   */
  relocates?: boolean;
}

/**
 * STRZAŁ — pocisk lecący w kursor, opcjonalnie wybuchający przy trafieniu
 * i ODBIJAJĄCY się na kolejnych wrogów.
 *
 * Jeden opis pokrywa arcane volley lisa, pasywny rykoszet wilka, łańcuch ×20
 * z combo i błyskawice thunder novy — różnią się wyłącznie liczbami. Silnik
 * odbić siedzi w `Projectile` (world.ts) i jest wspólny dla wszystkich.
 */
export interface ProjectileSkill extends SkillBase {
  kind: 'projectile';
  speed: number;
  /** Obrażenia = obrażenia zwarcia gracza × ten mnożnik. */
  damageMult: number;
  /** Ile pocisków naraz — talenty `projectileCount` dokładają kolejne. */
  count: number;
  /** Rozrzut wachlarza w radianach (0 = wszystkie w jednej linii). */
  spreadRad: number;
  /** Ile razy pocisk przeskakuje dalej — talenty `chainCount` dokładają. */
  chains: number;
  /** W jakim promieniu szuka kolejnego celu przy odbiciu. */
  chainRange: number;
  /** Mnożnik obrażeń po KAŻDYM odbiciu (1 = łańcuch nie słabnie). */
  chainFalloff: number;
  /** Promień wybuchu przy trafieniu (0 = rani tylko trafionego). */
  blastRadius: number;
}

/**
 * WZMOCNIENIE NA CZAS — nie zadaje obrażeń, tylko na kilkanaście sekund
 * zmienia to, co robią zwykłe ciosy. Stąd `chain`: przez cały czas trwania
 * KAŻDE trafienie wypuszcza odbijający się pocisk, tym samym mechanizmem
 * co pasywny rykoszet wilka.
 */
export interface EmpowerSkill extends SkillBase {
  kind: 'empower';
  durationTicks: number;
  /** +% prędkości ataku na czas trwania. */
  attackSpeed: number;
  chain: { chains: number; range: number; falloff: number; damageMult: number };
}

/**
 * STRZAŁA Z TELEPORTEM — jedyna umiejętność o cascie DWUETAPOWYM.
 * Pierwsze wciśnięcie wbija strzałę w wybrany punkt, drugie (w oknie
 * `windowTicks`) przenosi tam gracza. Po pierwszym etapie cooldown jest
 * zerowany, żeby drugie wciśnięcie było natychmiastowe.
 */
export interface BlinkSkill extends SkillBase {
  kind: 'blink';
  /** Maksymalna odległość, na jaką da się wbić strzałę. */
  range: number;
  speed: number;
  /** Obrażenia strzały = obrażenia zwarcia gracza × to. */
  damageMult: number;
  /** Ile ticków po strzale można jeszcze skoczyć. */
  windowTicks: number;
}

/**
 * STOP CZASU — na kilka sekund wrogowie przestają się ruszać, atakować
 * i strzelać, a ich pociski zawisają w powietrzu. Gracz, jego jednostki
 * i JEGO pociski działają dalej — na tym polega cała fantazja.
 *
 * Zamrożenie jest GLOBALNE, nie „wokół gracza": w co-opie zatrzymanie czasu
 * tylko w promieniu jednego gracza byłoby nieczytelne dla reszty drużyny.
 */
export interface TimeStopSkill extends SkillBase {
  kind: 'timestop';
  durationTicks: number;
}

/**
 * ZAMIANA MIEJSC Z WŁASNĄ JEDNOSTKĄ — wydra MIRROR TIDE, `E`.
 * Gracz ląduje tam, gdzie stał klon najbliżej kursora, a klon w miejscu,
 * z którego gracz zniknął. Jeden przycisk jest jednocześnie wejściem
 * i ucieczką, bo wybór celu należy do gracza: skoczysz do klona w środku
 * hordy albo do tego, którego zostawiłeś z tyłu.
 *
 * Osobny typ, a nie portal lisa: portale działają PARAMI i wciągają przy
 * wejściu na nie, więc przy ośmiu klonach nie dałoby się wskazać, o który
 * chodzi. Tu celem jest kursor, a jednostek może być dowolnie wiele.
 */
export interface PhaseSwapSkill extends SkillBase {
  kind: 'phaseSwap';
  /** Tylko jednostki tego typu są celem zamiany. */
  minionId: string;
  /** Jak daleko od KURSORA szukamy klona; brak = skill się nie odpala. */
  pickRadius: number;
}

/**
 * DOCIĄGNIĘCIE (hook) — lina wystrzelona w kursor, która CHWYTA pierwszą
 * trafioną jednostkę i albo ściąga ją do gracza (Pudge), albo ściąga gracza
 * do niej (Clockwerk Hookshot).
 *
 * To jedyny prymityw, który PRZEMIESZCZA cudzą jednostkę: `projectile` tylko
 * rani i leci dalej, a `phaseSwap` zamienia się wyłącznie z własnym klonem.
 * Silnik lotu i zwijania siedzi w `stepHooks` (world.ts).
 */
export interface HookSkill extends SkillBase {
  kind: 'hook';
  /** Jak daleko sięga lina, zanim wróci pusta. */
  range: number;
  /** Prędkość lotu i zwijania (px/s). */
  speed: number;
  /** Grubość liny — margines trafienia wokół jej czubka. */
  width: number;
  /** Obrażenia chwyconego = obrażenia zwarcia gracza × to. */
  damageMult: number;
  /**
   * `pullTarget` — ściągasz WROGA do siebie (Pudge Meat Hook).
   * `pullSelf`   — ściągasz SIEBIE do wroga (Hookshot), zwykle z ogłuszeniem
   *               na dojściu (`status`).
   */
  mode: 'pullTarget' | 'pullSelf';
  /** Status nakładany chwyconemu (`STATUSES`); pusty = żaden. */
  status?: string;
  /** Lina łapie też sojuszników — wariant ratunkowy w co-opie (jeszcze stub). */
  grabsAllies?: boolean;
}

/**
 * PROWOKACJA (taunt) — wszyscy wrogowie w promieniu są ZMUSZENI atakować
 * gracza przez chwilę, niezależnie od tego, kto stoi bliżej (Axe Berserker's
 * Call).
 *
 * Nowy haczyk: nadpisuje celowanie AI wroga (`Mob.targetPlayer`), czego nie
 * robi żaden dotychczasowy prymityw. Silnik tanka-kotwicy — w co-opie jeden
 * gracz ściąga napór z reszty drużyny.
 */
export interface TauntSkill extends SkillBase {
  kind: 'taunt';
  radius: number;
  durationTicks: number;
  /** Wrogowie są przy okazji ściągani do gracza o tyle px (0 = tylko aggro). */
  pullIn?: number;
  /** Aura włączana na czas prowokacji (np. pancerz), reuse `AURAS`; pusta = żadna. */
  auraId?: string;
}

/**
 * KANAŁOWANIE (channel) — jedyny prymityw, w którym gracz STOI i RYZYKUJE:
 * efekt sączy się przez `channelTicks`, a RUCH przerywa kanał. Wszystko inne
 * w grze jest fire-and-forget — to otwiera oś ryzyko/nagroda.
 *
 * Dwa ładunki pod jednym mechanizmem stania w miejscu:
 *  - `drain`  — sączysz HP z celu do siebie (Pugna Life Drain),
 *  - `vortex` — wsysasz i ranisz wrogów wokół punktu (Enigma Black Hole).
 */
export interface ChannelSkill extends SkillBase {
  kind: 'channel';
  channelTicks: number;
  /** Co ile ticków kanał odpala swój efekt. */
  tickEveryTicks: number;
  payload:
    | {
        /**
         * REST (sen niedźwiedzia HIBERNATION): czyste leczenie na tyknięcie,
         * bez obrażeń. Kanał przerywa ruch, więc to sustain za cenę STANIA —
         * najpierw robisz sobie miejsce (E slam), potem śpisz i się odbudowujesz.
         */
        type: 'rest';
        /** Ile HP leczy jedno tyknięcie snu. */
        healPerTick: number;
      }
    | {
        type: 'drain';
        /** W jakim promieniu od gracza szukamy celu do sączenia. */
        targetRadius: number;
        /** Obrażenia jednego tyknięcia = obrażenia zwarcia gracza × to. */
        damageMult: number;
        /** Ułamek zadanych obrażeń, który wraca graczowi jako leczenie (0-1). */
        healPct: number;
      }
    | {
        type: 'vortex';
        /** Promień wsysania wokół celowanego punktu. */
        radius: number;
        /** O ile px na tyknięcie wróg jest ciągnięty do środka. */
        pull: number;
        /** Obrażenia tyknięcia = obrażenia zwarcia gracza × to. */
        damageMult: number;
      }
    | {
        /**
         * AoE-drain (pierścień grozy nietoperza): co tyknięcie rani WSZYSTKICH
         * wokół GRACZA, leczy go z sumy zadanych obrażeń i nakłada status.
         * Różni się od `drain` tym, że jest obszarowy, a od `vortex` tym, że
         * nie wsysa, tylko leczy i straszy.
         */
        type: 'drainNova';
        /** Promień rażenia wokół gracza. */
        radius: number;
        /** Obrażenia tyknięcia każdego wroga = obrażenia zwarcia gracza × to. */
        damageMult: number;
        /** Ułamek CAŁYCH zadanych obrażeń, który wraca graczowi jako leczenie (0-1). */
        healPct: number;
        /** Status nakładany trafionym (`STATUSES`), np. `fear`; pusty = żaden. */
        status?: string;
      };
}

/**
 * BARIERA (wall) — tymczasowa geometria kolizji stawiana przez gracza
 * (Earthshaker Fissure / Mars Arena / Disruptor Kinetic Field).
 *
 * Masz statyczne głazy w danych mapy (`OBSTACLE_*`); to pierwszy sposób, żeby
 * gracz TWORZYŁ przeszkodę w locie. Ściana BLOKUJE RUCH — mobki i gracz nie
 * przechodzą (`pushOutOfWalls` w world.ts) — ma czas trwania i ogłusza linią
 * przy stawianiu. `blocksProjectiles` czeka jeszcze na wpięcie w lot pocisków.
 */
export interface WallSkill extends SkillBase {
  kind: 'wall';
  /** `line` — odcinek w poprzek celowania; `ring` — pierścień wokół punktu. */
  shape: 'line' | 'ring';
  /** Długość odcinka (line) albo promień pierścienia (ring). */
  length: number;
  /** Grubość ściany — margines kolizji. */
  thickness: number;
  durationTicks: number;
  /** Czy zatrzymuje też pociski wrogów, czy tylko ruch. */
  blocksProjectiles: boolean;
  /** Jak daleko od gracza wolno postawić. */
  placeRange: number;
  /** Celowanie dwuetapowe (jak pola) — miejsce jest decyzją, nie odruchem. */
  aimed?: boolean;
  /** Status dla wrogów złapanych linią przy stawianiu (`STATUSES`); pusty = żaden. */
  status?: string;
}

/**
 * DETONACJA — zjada nałożony status (zaraza) z wrogów w promieniu WOKÓŁ GRACZA
 * i zamienia SUMĘ STACKÓW na jednorazowy burst. Payoff gałęzi SWARM: INFEST
 * i rój nabijają stacki po całej hordzie, RUPTURE spienięża je jednym
 * wciśnięciem. Wyśrodkowane na graczu (dowódca stoi w zarażonej hordzie), więc
 * cast jest bezcelownikowy — jak nova.
 */
export interface DetonateSkill extends SkillBase {
  kind: 'detonate';
  /** Który status detonujemy (`STATUSES`) — dla SWARM to `plague`. */
  status: string;
  radius: number;
  /** Obrażenia na JEDEN stack = obrażenia zwarcia gracza × to. */
  damagePerStackMult: number;
}

/**
 * TRANSFORMACJA — czasowa FORMA, która NADPISUJE staty gracza (obrażenia,
 * prędkość, prędkość ataku, pancerz) na `durationTicks`. Pierwsza z „form":
 * niedźwiedzia COLOSSUS. Nadpisania wchodzą TĄ SAMĄ warstwą co aury (liczoną
 * od zera co tick w `stepAuras`), więc forma znika sama po wygaśnięciu — zero
 * księgowania i cofania. Podmiana Q/W/E/R i rozmiar sylwetki: świadomie później
 * (patrz TODO `transform` — to jest jego pierwsza, statowa wersja).
 */
export interface TransformSkill extends SkillBase {
  kind: 'transform';
  durationTicks: number;
  /** Mnożnik obrażeń w formie (2 = podwójne). */
  damageMult: number;
  /** Mnożnik prędkości ruchu (kolos jest ociężały: <1). */
  speedMult: number;
  /** Mnożnik prędkości ataku. */
  attackSpeedMult: number;
  /** Płaski pancerz doliczany na czas formy. */
  armorBonus: number;
  /**
   * PRZEDŁUŻENIE NA ZABÓJSTWO (ticki). Każdy zabity wróg w formie dokłada tyle
   * czasu, do sufitu = czas bazowy. To zamienia formę z „na zegar" (COLOSSUS,
   * `killExtendTicks` pominięte = 0) w formę PODTRZYMYWANĄ RZEZIĄ (WEREWOLF):
   * w hordzie wilkołak trwa bez końca, w pustce gaśnie. Ramp z kill-chain.
   */
  killExtendTicks?: number;
}

export type SkillDef =
  | ConeSkill | SummonSkill | LeapSkill | ProjectileSkill | AuraSkill
  | EmpowerSkill | BlinkSkill | TimeStopSkill | PhaseSwapSkill
  | HookSkill | TauntSkill | ChannelSkill | WallSkill | DetonateSkill
  | TransformSkill;

/** Ile slotów umiejętności ma gracz: Q, W, E, R. */
export const SKILL_SLOTS = 4;
/** Etykiety klawiszy — render czyta je z jednego miejsca. */
export const SKILL_KEYS = ['Q', 'W', 'E', 'R'];

export const SKILLS: SkillDef[] = [
  {
    // Domyślna umiejętność każdej klasy, dopóki nie wybierze specjalizacji.
    id: 'power-slash',
    kind: 'cone',
    name: 'SLASH',
    rangeMult: C.SKILL_RANGE_MULT,
    coneCos: C.SKILL_CONE_COS,
    damageMult: C.SKILL_DAMAGE_MULT,
    knockback: C.SKILL_KNOCKBACK,
    cooldownTicks: C.SKILL_COOLDOWN_TICKS,
    friendlyFire: false,
  },
  {
    /**
     * SNIPER SHOT — nagroda za wybór specjalizacji snajpera na 2. poziomie.
     * Bardzo daleki i bardzo wąski: zasięg ponad trzykrotnie większy niż
     * u slasha, ale rozwarcie ~11°, więc trzeba celować, a nie machać.
     * Mocniejszy od slasha właśnie dlatego, że łatwo spudłować.
     */
    id: 'sniper-shot',
    kind: 'cone',
    name: 'SNIPER SHOT',
    rangeMult: 6.5,
    coneCos: 0.995,
    damageMult: 6,
    knockback: 40,
    cooldownTicks: Math.round(3.5 * C.TICK_RATE),
    friendlyFire: false,
  },
];

/* ── Skille przywołujące ────────────────────────────────────────────────
 * Każdy z nich to WYŁĄCZNIE dane: symulacja umie „postaw jednostkę o tym id",
 * a co ta jednostka robi, opisuje `minionsConfig.ts`. Kolejny przywoływacz
 * nie wymaga więc ani linijki w symulacji.
 */
SKILLS.push(
  {
    id: 'totem-turret', kind: 'summon', name: 'TURRET',
    minionId: 'totem-turret', count: 1, placeRange: 260,
    cooldownTicks: Math.round(6 * C.TICK_RATE),
  },
  {
    id: 'totem-pulse', kind: 'summon', name: 'PULSE TOTEM',
    minionId: 'totem-pulse', count: 1, placeRange: 260,
    cooldownTicks: Math.round(8 * C.TICK_RATE),
  },
  {
    id: 'totem-knock', kind: 'summon', name: 'REPULSOR',
    minionId: 'totem-knock', count: 1, placeRange: 260,
    cooldownTicks: Math.round(9 * C.TICK_RATE),
  },
  {
    id: 'summon-behemoth', kind: 'summon', name: 'BEHEMOTH',
    minionId: 'behemoth', count: 1, placeRange: 220,
    cooldownTicks: Math.round(20 * C.TICK_RATE),
  },
  /* ── Zając SUMMONER: cztery przywołania (Q/W/E/R) ─────────────────────── */
  {
    /** `Q` — Golem: wielki melee tank, stawiany blisko gracza. */
    id: 'sm-golem', kind: 'summon', name: 'GOLEM',
    minionId: 'sm-golem', count: 1, placeRange: 240,
    cooldownTicks: Math.round(12 * C.TICK_RATE),
  },
  {
    /** `W` — Hydra: pluj dystansowy, stawiany dalej. */
    id: 'sm-hydra', kind: 'summon', name: 'HYDRA',
    minionId: 'sm-hydra', count: 1, placeRange: 300,
    cooldownTicks: Math.round(12 * C.TICK_RATE),
  },
  {
    /**
     * `E` — Duch: pierwsze wciśnięcie stawia go (aura obronna), kolejne
     * kierują go w stronę kursora, siejąc strach (`commandsMinion`).
     */
    id: 'sm-ghost', kind: 'summon', name: 'SPIRIT',
    minionId: 'sm-ghost', count: 1, placeRange: 200,
    cooldownTicks: Math.round(14 * C.TICK_RATE),
    commandsMinion: true,
  },
  {
    /** `R` — ultimate: rój chochlików, kilka naraz, na krótko. */
    id: 'sm-swarm', kind: 'summon', name: 'SWARM',
    minionId: 'sm-imp', count: 6, placeRange: 260,
    cooldownTicks: Math.round(30 * C.TICK_RATE),
  },
  {
    /**
     * GRAVITY MAGE — `Q`: pole wstrząsu w punkcie na mapie. Krótki cooldown,
     * bo to podstawowe źródło obrażeń tej gałęzi, a nie okazjonalny wybuch.
     */
    id: 'quake-field', kind: 'summon', name: 'EARTHSHAKE',
    minionId: 'quake-field', count: 1, placeRange: 500,
    cooldownTicks: Math.round(5 * C.TICK_RATE),
    aimed: true,
  },
  {
    /**
     * GRAVITY MAGE — `W`: zapaść z 2,2 s zamachu. Zasięg stawiania większy
     * niż u `Q`, bo przy takim opóźnieniu i tak trzeba celować z wyprzedzeniem.
     */
    id: 'gravity-collapse', kind: 'summon', name: 'COLLAPSE',
    minionId: 'gravity-collapse', count: 1, placeRange: 560,
    cooldownTicks: Math.round(9 * C.TICK_RATE),
    aimed: true,
  },
  {
    /**
     * CHRONOMANCER — `Q`: pułapka. Najkrótszy cooldown w grze, bo gałąź stoi
     * na liczbie pułapek, a nie na sile jednej.
     */
    id: 'chrono-trap', kind: 'summon', name: 'TEMPORAL TRAP',
    minionId: 'chrono-trap', count: 1, placeRange: 300,
    cooldownTicks: Math.round(3 * C.TICK_RATE),
  },
  {
    /**
     * ARCANE ARCHER — `Q`: strzała, która wybucha i przeskakuje dalej.
     * Bazowo JEDNA strzała i DWA odbicia; cała gałąź polega na tym, że
     * talenty `projectileCount` i `chainCount` zamieniają to w wachlarz
     * odbijający się po całej hordzie. Lekkie wytracanie obrażeń na odbicie
     * (0,85) jest zaworem: bez niego łańcuch w gęstej fali nie ma sufitu.
     */
    id: 'arcane-volley', kind: 'projectile', name: 'ARCANE VOLLEY',
    speed: 520,
    damageMult: 2.2,
    count: 1,
    spreadRad: 0.16,
    chains: 2,
    chainRange: 260,
    chainFalloff: 0.85,
    blastRadius: 90,
    cooldownTicks: Math.round(1.6 * C.TICK_RATE),
  },
  {
    /**
     * GRAVITY MAGE — `E`: pole spowalniające. Trzy warianty tego samego
     * skilla; talenty w drzewku podmieniają go na kolejny (patrz
     * `gravity-field*` w minionsConfig.ts).
     */
    id: 'gravity-field', kind: 'summon', name: 'GRAVITY WELL',
    minionId: 'gravity-field', count: 1, placeRange: 520,
    cooldownTicks: Math.round(10 * C.TICK_RATE),
    aimed: true,
  },
  {
    id: 'gravity-field-crush', kind: 'summon', name: 'CRUSHING WELL',
    minionId: 'gravity-field-crush', count: 1, placeRange: 520,
    cooldownTicks: Math.round(10 * C.TICK_RATE),
    aimed: true,
  },
  {
    id: 'gravity-field-singularity', kind: 'summon', name: 'SINGULARITY',
    minionId: 'gravity-field-singularity', count: 1, placeRange: 520,
    cooldownTicks: Math.round(10 * C.TICK_RATE),
    aimed: true,
  },
  {
    /**
     * CHRONOMANCER — `W`: portal. Zawsze dwa; trzeci kasuje najstarszy.
     * Zasięg stawiania duży, bo sens portalu to skrót przez arenę, a nie
     * przeskoczenie o krok.
     */
    id: 'chrono-portal', kind: 'summon', name: 'PORTAL',
    minionId: 'chrono-portal', count: 1, placeRange: 460,
    cooldownTicks: Math.round(2.5 * C.TICK_RATE),
  },
  {
    /**
     * CHRONOMANCER — `E`: stop czasu. Bardzo długi cooldown, bo to jest
     * przycisk ratunkowy i okno na ustawienie pułapek, a nie element rotacji.
     */
    id: 'chrono-timestop', kind: 'timestop', name: 'TIME STOP',
    durationTicks: Math.round(4 * C.TICK_RATE),
    cooldownTicks: Math.round(34 * C.TICK_RATE),
  },
  {
    /**
     * ARCANE ARCHER — `W`: strzała, za którą można skoczyć. Zasięg większy
     * niż jakikolwiek doskok, ale wymaga dwóch wciśnięć i decyzji w locie:
     * strzała już poleciała, więc skok jest zobowiązaniem, nie odruchem.
     */
    id: 'blink-arrow', kind: 'blink', name: 'BLINK ARROW',
    range: 520,
    speed: 780,
    damageMult: 2,
    windowTicks: Math.round(3 * C.TICK_RATE),
    cooldownTicks: Math.round(8 * C.TICK_RATE),
  },
  {
    /**
     * ARCANE ARCHER — `E`: 20 s, w czasie których lis bije szybciej, a KAŻDE
     * trafienie wypuszcza odbijającą się strzałę. Sam z siebie nie zadaje
     * obrażeń — mnoży to, co gracz i tak robi, więc opłaca się go włączyć
     * w tłumie, a nie na pustej arenie.
     */
    id: 'arcane-surge', kind: 'empower', name: 'ARCANE SURGE',
    durationTicks: Math.round(20 * C.TICK_RATE),
    attackSpeed: 45,
    chain: { chains: 2, range: 240, falloff: 0.85, damageMult: 1 },
    cooldownTicks: Math.round(28 * C.TICK_RATE),
  },
  {
    /**
     * ALPHA PACK — `Q`: cios, który POWTARZAJĄ wszystkie twoje wilki.
     * Sam w sobie tylko trochę mocniejszy od slasha; siła bierze się z tego,
     * ilu masz przy sobie swoich (`packEcho`) i z licznika Pack Instinct.
     */
    id: 'pack-swipe', kind: 'cone', name: 'SWIPE',
    rangeMult: 1.6, coneCos: 0.35, damageMult: 3.4, knockback: 90,
    cooldownTicks: Math.round(3.2 * C.TICK_RATE),
    friendlyFire: false,
    packEcho: true,
  },
  {
    /** ALPHA PACK — `W`: aura wściekłości na 8 s, rośnie z Pack Instinct. */
    id: 'pack-fury', kind: 'aura', name: 'PACK FURY',
    auraId: 'pack-fury',
    durationTicks: Math.round(8 * C.TICK_RATE),
    cooldownTicks: Math.round(16 * C.TICK_RATE),
  },
  {
    /** ALPHA PACK — `E`: dokłada wilka do watahy. */
    id: 'summon-wolf', kind: 'summon', name: 'CALL WOLF',
    minionId: 'pack-wolf', count: 1, placeRange: 240,
    cooldownTicks: Math.round(7 * C.TICK_RATE),
  },
  {
    /** SLIPSTREAM — `Q`: skok w kursor z falą uderzeniową przy lądowaniu. */
    id: 'leap-strike', kind: 'leap', name: 'LEAP STRIKE',
    dashId: 'power-jump',
    cooldownTicks: Math.round(2.6 * C.TICK_RATE),
    resetsDash: true,
  },
  {
    /**
     * SLIPSTREAM — `W`: nova w miejscu. To zwykły stożek o rozwarciu 360°
     * (`coneCos: -1`), więc nie wymagał ani linijki nowego kodu w symulacji.
     * Rola inna niż `Q`: `Q` to wejście, `W` to przycisk paniki bez ruchu.
     */
    id: 'shock-nova', kind: 'cone', name: 'SHOCK NOVA',
    rangeMult: 3.4, coneCos: -1, damageMult: 5, knockback: 190,
    cooldownTicks: Math.round(5 * C.TICK_RATE),
    friendlyFire: false,
    resetsDash: true,
  },
);

/* ── WYDRA TIDECALLER (support: fale, ogłuszenia, trochę obrażeń) ────────── */
SKILLS.push(
  {
    /**
     * `Q` — wsiadasz na falę. To `leap` wskazujący doskok z blokiem `ride`,
     * więc cała mechanika jazdy siedzi w `DASHES` i nie dubluje kodu skoku
     * (dokładnie jak Leap Strike zająca). Drugie wciśnięcie `Q` ZSIADA.
     */
    id: 'tidal-surf', kind: 'leap', name: 'TIDAL SURF',
    dashId: 'tidal-surf',
    cooldownTicks: Math.round(7 * C.TICK_RATE),
  },
  {
    /** `Q` po talencie `Breakwater` — ta sama fala, ale ogłuszająca. */
    id: 'tidal-surf-crash', kind: 'leap', name: 'BREAKWATER SURF',
    dashId: 'tidal-surf-crash',
    cooldownTicks: Math.round(7 * C.TICK_RATE),
  },
  {
    /**
     * `W` — wir. Celowanie dwuetapowe, bo o wartości wiru decyduje MIEJSCE:
     * postawiony o 100 px za daleko nie łapie nikogo, a to on jest jedynym
     * pewnym ogłuszeniem gałęzi.
     */
    id: 'tide-whirl', kind: 'summon', name: 'WHIRLPOOL',
    minionId: 'tide-whirl', count: 1, placeRange: 480,
    cooldownTicks: Math.round(9 * C.TICK_RATE),
    aimed: true,
  },
  {
    /** `E` — aura na 10 s: pancerz i leczenie swoim, SOAKED obcym. */
    id: 'tide-guard', kind: 'aura', name: 'TIDE GUARD',
    auraId: 'tideguard',
    durationTicks: Math.round(10 * C.TICK_RATE),
    cooldownTicks: Math.round(20 * C.TICK_RATE),
  },
  {
    /** `R` — ultimate: maelstrom, pierścienie pocisków plus ogłuszenia. */
    id: 'tide-maelstrom', kind: 'summon', name: 'MAELSTROM',
    minionId: 'tide-maelstrom', count: 1, placeRange: 520,
    cooldownTicks: Math.round(35 * C.TICK_RATE),
    aimed: true,
  },
);

/* ── WYDRA MIRROR TIDE (asasyn na klonach) ──────────────────────────────── */
SKILLS.push(
  {
    /**
     * `Q` — DALEKO i WĄSKO. Zasięg jak u snajpera kreta, rozwarcie ~25°, więc
     * trzeba celować. Robi trzy rzeczy naraz i dopiero razem tworzą gałąź:
     *  1. tnie w linii i moczy trafionych (`status`),
     *  2. KAŻDY klon powtarza to cięcie ze swojej pozycji w kierunku kursora
     *     (`packEcho`) — osiem klonów to dziewięć linii cięcia naraz,
     *  3. zostawia kolejnego klona tam, gdzie stałeś (`spawns`).
     *
     * Dlatego stado buduje się samo z grania, a nie z osobnego przycisku,
     * i dlatego pozycja gracza przed każdym `Q` jest decyzją: to jest miejsce,
     * z którego będziesz ciął przez resztę walki.
     */
    id: 'mirror-lance', kind: 'cone', name: 'MIRROR LANCE',
    rangeMult: 5.5, coneCos: 0.94, damageMult: 3.5, knockback: 30,
    cooldownTicks: Math.round(2.5 * C.TICK_RATE),
    friendlyFire: false,
    packEcho: true,
    status: 'soaked',
    spawns: { minionId: 'mirror-clone', count: 1 },
  },
  {
    /**
     * `Q` po zwieńczeniu gałęzi (`HALL OF MIRRORS`) — to samo cięcie, ale
     * zostawia DWA klony na raz. Stado przestaje narastać liniowo i zaczyna
     * podwajać się co wciśnięcie, aż do sufitu z `maxActive`.
     */
    id: 'mirror-lance-twin', kind: 'cone', name: 'MIRROR LANCE',
    rangeMult: 5.5, coneCos: 0.94, damageMult: 3.5, knockback: 30,
    cooldownTicks: Math.round(2.5 * C.TICK_RATE),
    friendlyFire: false,
    packEcho: true,
    status: 'soaked',
    spawns: { minionId: 'mirror-clone', count: 2 },
  },
  {
    /**
     * `W` — SPIENIĘŻENIE STADA. Nova 360° powtórzona przez każdy klon, po
     * czym wszystkie klony pękają (`consumesEcho`). Obrażenia wysokie właśnie
     * dlatego, że kasuje zasób budowany kilkanaście sekund.
     *
     * To jest rytm gałęzi: `Q` zbiera, `W` wydaje. Bez `consumesEcho` byłoby
     * to po prostu drugie AoE i decyzja „kiedy" przestałaby istnieć.
     */
    id: 'mirror-shatter', kind: 'cone', name: 'SHATTER',
    rangeMult: 2.6, coneCos: -1, damageMult: 4.5, knockback: 140,
    cooldownTicks: Math.round(8 * C.TICK_RATE),
    friendlyFire: false,
    packEcho: true,
    consumesEcho: true,
    status: 'soaked',
  },
  {
    /** `E` — zamiana miejsc z klonem najbliżej kursora. Wejście i ucieczka. */
    id: 'phase-swap', kind: 'phaseSwap', name: 'PHASE SWAP',
    minionId: 'mirror-clone',
    pickRadius: 260,
    cooldownTicks: Math.round(6 * C.TICK_RATE),
  },
  {
    /**
     * `R` — cztery klony naraz wokół gracza. Ustawia całe pole ostrzału jednym
     * wciśnięciem albo od ręki uzbraja `W` na pełny SHATTER.
     */
    id: 'thousand-mirrors', kind: 'summon', name: 'THOUSAND MIRRORS',
    minionId: 'mirror-clone', count: 4, placeRange: 200,
    cooldownTicks: Math.round(30 * C.TICK_RATE),
  },
);

/* ── SZKIELETY NOWYCH PRYMITYWÓW (jeszcze NIEPODPIĘTE pod talenty) ─────────
 * Po jednej-dwie przykładowe umiejętności na każdy nowy prymityw. Siedzą
 * w SKILLS, żeby dało się je odpalić (bench / ręczne `grantsSkills`) i zobaczyć
 * zachowanie silnika; obsadzenie w gałęziach drzewka przyjdzie razem z nowymi
 * klasami. Liczby są zgrubne — do wybalansowania po pierwszym benchu.
 */
SKILLS.push(
  {
    // Pudge: ściągasz wroga do siebie.
    id: 'meat-hook', kind: 'hook', name: 'MEAT HOOK',
    range: 620, speed: 1100, width: 26, damageMult: 2.5,
    mode: 'pullTarget',
    cooldownTicks: Math.round(8 * C.TICK_RATE),
  },
  {
    // Hookshot: ściągasz SIEBIE do wroga, z ogłuszeniem na dojściu.
    id: 'grapple-shot', kind: 'hook', name: 'GRAPPLE',
    range: 560, speed: 1400, width: 22, damageMult: 2,
    mode: 'pullSelf', status: 'stun',
    cooldownTicks: Math.round(7 * C.TICK_RATE),
  },
  {
    id: 'berserk-call', kind: 'taunt', name: "BERSERKER'S CALL",
    radius: 300, durationTicks: Math.round(2.6 * C.TICK_RATE), pullIn: 40,
    cooldownTicks: Math.round(11 * C.TICK_RATE),
  },
  {
    // Pugna Life Drain: sączysz HP z najbliższego wroga do siebie.
    id: 'life-drain', kind: 'channel', name: 'LIFE DRAIN',
    channelTicks: Math.round(4 * C.TICK_RATE),
    tickEveryTicks: Math.round(0.2 * C.TICK_RATE),
    payload: { type: 'drain', targetRadius: 340, damageMult: 0.6, healPct: 0.6 },
    cooldownTicks: Math.round(10 * C.TICK_RATE),
  },
  {
    // Enigma Black Hole: wsysasz i miażdżysz wrogów wokół punktu.
    id: 'black-hole', kind: 'channel', name: 'BLACK HOLE',
    channelTicks: Math.round(3 * C.TICK_RATE),
    tickEveryTicks: Math.round(0.15 * C.TICK_RATE),
    payload: { type: 'vortex', radius: 260, pull: 22, damageMult: 0.5 },
    cooldownTicks: Math.round(26 * C.TICK_RATE),
  },
  {
    // Earthshaker Fissure: linia, która ogłusza złapanych w chwili stawiania.
    id: 'fissure', kind: 'wall', name: 'FISSURE',
    shape: 'line', length: 420, thickness: 26,
    durationTicks: Math.round(6 * C.TICK_RATE),
    blocksProjectiles: true, placeRange: 360, aimed: true, status: 'stun',
    cooldownTicks: Math.round(13 * C.TICK_RATE),
  },
);

/* ── GORYL — IRON GRIP (chwytak-kotwica) ─────────────────────────────────── */
SKILLS.push(
  {
    /** `Q` — wyrywasz elitkę z hordy prosto pod swój cios. */
    id: 'gor-grip', kind: 'hook', name: 'IRON GRIP',
    range: 560, speed: 1150, width: 30, damageMult: 2,
    mode: 'pullTarget',
    cooldownTicks: Math.round(7 * C.TICK_RATE),
  },
  {
    /** `Q` po zwieńczeniu (`CRUSHING GRIP`) — ten sam chwyt, ale OGŁUSZA. */
    id: 'gor-grip-stun', kind: 'hook', name: 'CRUSHING GRIP',
    range: 560, speed: 1150, width: 30, damageMult: 2,
    mode: 'pullTarget', status: 'stun',
    cooldownTicks: Math.round(7 * C.TICK_RATE),
  },
  {
    /** `W` — ryk: ściąga aggro całej hordy na siebie + pancerz (aura `ironhide`). */
    id: 'gor-roar', kind: 'taunt', name: 'WAR ROAR',
    radius: 320, durationTicks: Math.round(2.6 * C.TICK_RATE), pullIn: 60,
    auraId: 'ironhide',
    cooldownTicks: Math.round(12 * C.TICK_RATE),
  },
  {
    /** `E` — grzmotnięcie w ziemię: nova 360° z wielkim odrzutem (peel). */
    id: 'gor-slam', kind: 'cone', name: 'GROUND SLAM',
    rangeMult: 3, coneCos: -1, damageMult: 4, knockback: 210,
    cooldownTicks: Math.round(6 * C.TICK_RATE),
    friendlyFire: false,
  },
  {
    /**
     * `R` — TITAN SMASH: sygnaturowy WIELKI cios tanka. Wąski, potężny frontalny
     * grzmot — mnożnik dużo wyższy niż jakikolwiek inny skill w grze (×12), żeby
     * goryl mimo roli tanka realnie groził elicie i bossowi, zwłaszcza celowi
     * chwyconemu wcześniej `Q` (a po `CRUSHING GRIP` — ogłuszonemu).
     */
    id: 'gor-smash', kind: 'cone', name: 'TITAN SMASH',
    rangeMult: 2.4, coneCos: 0.2, damageMult: 12, knockback: 120,
    cooldownTicks: Math.round(13 * C.TICK_RATE),
    friendlyFire: false,
  },
);

/* ── NIETOPERZ — NIGHT TERROR (wampir) ───────────────────────────────────── */
SKILLS.push(
  {
    /** `Q` — sączysz HP z jednego celu do siebie (Pugna Life Drain). */
    id: 'bat-drain', kind: 'channel', name: 'LIFE SIPHON',
    channelTicks: Math.round(3.5 * C.TICK_RATE),
    tickEveryTicks: Math.round(0.2 * C.TICK_RATE),
    payload: { type: 'drain', targetRadius: 360, damageMult: 0.7, healPct: 0.7 },
    cooldownTicks: Math.round(8 * C.TICK_RATE),
  },
  {
    /**
     * `W` — NIGHTMARE: AoE-channel zamiast stożka. Stoisz i pulsujesz grozą —
     * co tyknięcie ranisz WSZYSTKICH wokół, LECZYSZ się z zadanych obrażeń
     * i PRZERAŻASZ trafionych (rozganiasz hordę). Krucha klasa (75 HP), która
     * odzyskuje życie tylko wtedy, gdy stoi w tłumie i sączy — czyste ryzyko.
     */
    id: 'bat-nightmare', kind: 'channel', name: 'NIGHTMARE',
    channelTicks: Math.round(3 * C.TICK_RATE),
    tickEveryTicks: Math.round(0.25 * C.TICK_RATE),
    payload: { type: 'drainNova', radius: 280, damageMult: 0.9, healPct: 0.5, status: 'fear' },
    cooldownTicks: Math.round(14 * C.TICK_RATE),
  },
  {
    /** `W` po zwieńczeniu (`BLOOD MOON`) — Nightmare leczący z PEŁNI obrażeń. */
    id: 'bat-nightmare-blood', kind: 'channel', name: 'BLOOD MOON',
    channelTicks: Math.round(3 * C.TICK_RATE),
    tickEveryTicks: Math.round(0.25 * C.TICK_RATE),
    payload: { type: 'drainNova', radius: 300, damageMult: 0.9, healPct: 1, status: 'fear' },
    cooldownTicks: Math.round(14 * C.TICK_RATE),
  },
  {
    /** `E` — Blood Frenzy: krwawy szał, +prędkość ataku (mnoży leech BLOODSONG). */
    id: 'bat-frenzy', kind: 'empower', name: 'BLOOD FRENZY',
    durationTicks: Math.round(6 * C.TICK_RATE),
    attackSpeed: 60,
    chain: { chains: 0, range: 0, falloff: 1, damageMult: 0 },
    cooldownTicks: Math.round(16 * C.TICK_RATE),
  },
  {
    /** `R` — rój nietoperzy: kilka słabych, krótko żyjących, polują same. */
    id: 'bat-swarm', kind: 'summon', name: 'BAT SWARM',
    minionId: 'bat-swarmling', count: 6, placeRange: 200,
    cooldownTicks: Math.round(26 * C.TICK_RATE),
  },
);

/* ── JEŻ — BASTION (builder: jeden skalujący turret + mury) ──────────────── */
SKILLS.push(
  {
    /**
     * `Q` — postaw turret; jeśli już stoi, PRZENIEŚ go pod kursor. Zawsze jeden
     * (`maxActive:1` na jednostce), a jego DPS skaluje się TWOIMI statystykami
     * (`scalesWithOwner`), nie statem sumonera. Krótki cooldown, bo to działko
     * się repozycjonuje przez całą walkę, a nie stawia raz.
     */
    id: 'deploy-sentry', kind: 'summon', name: 'DEPLOY SENTRY',
    minionId: 'bastion-turret', count: 1, placeRange: 320, relocates: true,
    cooldownTicks: Math.round(2 * C.TICK_RATE),
  },
  {
    /** `W` — mur kolców: kanalizuje hordę w ostrzał turreta, ogłusza na linii. */
    id: 'spike-wall', kind: 'wall', name: 'SPIKE WALL',
    shape: 'line', length: 380, thickness: 24,
    durationTicks: Math.round(16 * C.TICK_RATE),
    blocksProjectiles: true, placeRange: 340, aimed: true, status: 'stun',
    cooldownTicks: Math.round(9 * C.TICK_RATE),
  },
  {
    /**
     * `E` — OVERCLOCK: +prędkość ataku na czas. Ponieważ turret skaluje się
     * atak speedem gracza, ten jeden przycisk przyspiesza JEDNOCZEŚNIE ciebie
     * i działko — bez ani jednej linijki kodu specyficznego dla turreta.
     */
    id: 'overclock', kind: 'empower', name: 'OVERCLOCK',
    durationTicks: Math.round(6 * C.TICK_RATE),
    attackSpeed: 70,
    chain: { chains: 0, range: 0, falloff: 1, damageMult: 0 },
    cooldownTicks: Math.round(14 * C.TICK_RATE),
  },
  {
    /**
     * `R` — LOCKDOWN: pierścień muru wokół celu. Zamyka hordę w klatce, w której
     * siedzi turret — killbox. Pierwsze użycie prymitywu `wall` w kształcie
     * `ring`. Ogłusza wchodzących w pierścień.
     */
    id: 'lockdown', kind: 'wall', name: 'LOCKDOWN',
    shape: 'ring', length: 220, thickness: 22,
    durationTicks: Math.round(12 * C.TICK_RATE),
    blocksProjectiles: true, placeRange: 360, aimed: true, status: 'stun',
    cooldownTicks: Math.round(22 * C.TICK_RATE),
  },
);

/* ── JEŻ — SONIC (DPS: prędkość → obrażenia) ─────────────────────────────── */
SKILLS.push(
  {
    /** `Q` — kula kolców: roll orzący hordę; obrażenia rosną z prędkością. */
    id: 'sonic-spin-dash', kind: 'leap', name: 'SPIN DASH',
    dashId: 'spin-dash',
    cooldownTicks: Math.round(3 * C.TICK_RATE),
    resetsDash: true,
  },
  {
    /**
     * `W` — SPIN ATTACK: nova 360° wokół gracza (`coneCos: -1`). Skaluje się
     * prędkością przez `meleeDamageOf`. Dla chwil, gdy jesteś w środku hordy
     * i nie chcesz z niej wyjeżdżać rollem. Zeruje doskok — Sonic ma zostać
     * w ruchu.
     */
    id: 'sonic-spin-attack', kind: 'cone', name: 'SPIN ATTACK',
    rangeMult: 2.6, coneCos: -1, damageMult: 3, knockback: 120,
    cooldownTicks: Math.round(4 * C.TICK_RATE),
    friendlyFire: false,
    resetsDash: true,
  },
  {
    /**
     * `E` — MOMENTUM: aura prędkości na czas. Skoro prędkość = obrażenia, ten
     * jeden przycisk podbija JEDNOCZEŚNIE mobilność i DPS — bez kodu
     * specyficznego dla gałęzi (zwykła aura `speed` wchodzi w `auraSpeedMult`,
     * a ten w speed→damage).
     */
    id: 'sonic-momentum', kind: 'aura', name: 'MOMENTUM',
    auraId: 'momentum',
    durationTicks: Math.round(6 * C.TICK_RATE),
    cooldownTicks: Math.round(14 * C.TICK_RATE),
  },
  {
    /** `R` — SONIC BOOM: ultymatywny roll przez całą arenę (doskok `sonic-boom`). */
    id: 'sonic-boom', kind: 'leap', name: 'SONIC BOOM',
    dashId: 'sonic-boom',
    cooldownTicks: Math.round(24 * C.TICK_RATE),
  },
);

/* ── JEŻ — CURL (tank, który NAPRAWDĘ bije: HP → obrażenia) ───────────────── */
SKILLS.push(
  {
    /** `Q` — SPIKE NOVA: wachlarz kolców 360° wokół gracza (peel + dmg z HP). */
    id: 'curl-nova', kind: 'cone', name: 'SPIKE NOVA',
    rangeMult: 2.2, coneCos: -1, damageMult: 3, knockback: 160,
    cooldownTicks: Math.round(4 * C.TICK_RATE),
    friendlyFire: false,
  },
  {
    /**
     * `W` — IRON CURL: zwijasz się w kolczastą kulę. Aura na czas: pancerz
     * (twardniejesz) + kolce raniące WSZYSTKO, co blisko (`enemyDamage`). To
     * jest „touch me and regret it" — stoisz w hordzie i ją mielisz dotknięciem.
     */
    id: 'iron-curl', kind: 'aura', name: 'IRON CURL',
    auraId: 'ironcurl',
    durationTicks: Math.round(5 * C.TICK_RATE),
    cooldownTicks: Math.round(14 * C.TICK_RATE),
  },
  {
    /**
     * `E` — PROVOKE: ściągasz aggro całej hordy na siebie i przyciągasz ją
     * bliżej. Zbierasz tłum pod IRON CURL i TECTONIC SLAM — pętla tanka:
     * zwołaj, przetrzymaj, zmiażdż.
     */
    id: 'curl-provoke', kind: 'taunt', name: 'PROVOKE',
    radius: 340, durationTicks: Math.round(3 * C.TICK_RATE), pullIn: 70,
    cooldownTicks: Math.round(10 * C.TICK_RATE),
  },
  {
    /**
     * `R` — TECTONIC SLAM: sygnaturowy WIELKI cios tanka. Szeroki frontalny
     * grzmot o mnożniku ×10, który — przez HP → obrażenia — rośnie razem z twoją
     * wytrzymałością. Im więcej życia nabijesz, tym bardziej boli.
     */
    id: 'tectonic-slam', kind: 'cone', name: 'TECTONIC SLAM',
    rangeMult: 2.6, coneCos: 0.15, damageMult: 10, knockback: 140,
    cooldownTicks: Math.round(12 * C.TICK_RATE),
    friendlyFire: false,
  },
);

/* ── NIETOPERZ — SONAR (echolokacyjny kaster kontroli/dźwięku) ────────────── */
SKILLS.push(
  {
    /**
     * `Q` — SONIC WAVE: fala dźwięku, która ODBIJA się (echo) na kolejnych
     * wrogów. Rdzeń dystansowy gałęzi; talenty `chainCount` (echa) i
     * `projectileCount` (więcej fal) zamieniają jeden pisk w kaskadę po hordzie.
     * `damageMult` PODBITY (2.2 → 3.2) — baza nietoperza to `meleeDamage 2`,
     * połowa lisa (4), więc bez tego SONAR bił o połowę słabiej niż jego
     * bliźniaczy silnik ech (ARCANE VOLLEY). `blastRadius` (0 → 80) daje echu
     * małe AoE na każdym odbiciu — pasuje do fantazji dźwięku i domyka lukę
     * DPS w hordzie (bench: bez tego SONAR ginął na fali 2).
     */
    id: 'sonic-wave', kind: 'projectile', name: 'SONIC WAVE',
    speed: 600,
    damageMult: 3.2,
    count: 1,
    spreadRad: 0.14,
    chains: 2,
    chainRange: 280,
    chainFalloff: 0.85,
    blastRadius: 80,
    cooldownTicks: Math.round(1.4 * C.TICK_RATE),
  },
  {
    /** `W` — SCREECH: stożek dźwięku w przód, rani i PRZERAŻA (rozgania grupę). */
    id: 'screech', kind: 'cone', name: 'SCREECH',
    rangeMult: 2.4, coneCos: 0.3, damageMult: 3, knockback: 100,
    cooldownTicks: Math.round(6 * C.TICK_RATE),
    friendlyFire: false,
    status: 'fear',
  },
  {
    /**
     * `E` — SHRIEK: aura rezonansu. Wrogowie w zasięgu są OSŁABIENI (`weaken`),
     * czyli obrywają mocniej od wszystkiego — od twoich fal i od reszty drużyny.
     * SONAR podnosi obrażenia bez bycia damage-dealerem w liczbach.
     */
    id: 'shriek', kind: 'aura', name: 'SHRIEK',
    auraId: 'shriek',
    durationTicks: Math.round(6 * C.TICK_RATE),
    cooldownTicks: Math.round(16 * C.TICK_RATE),
  },
  {
    /**
     * `R` — DEAFENING SCREAM: potężny pisk 360° (`coneCos: -1`). Wielkie
     * obrażenia, wielki odrzut i FEAR na wszystkim dookoła — rozbija otoczenie
     * i daje kruchemu nietoperzowi okno na oddech.
     */
    id: 'deafening-scream', kind: 'cone', name: 'DEAFENING SCREAM',
    rangeMult: 3.4, coneCos: -1, damageMult: 6, knockback: 200,
    cooldownTicks: Math.round(20 * C.TICK_RATE),
    friendlyFire: false,
    status: 'fear',
  },
);

/* ── NIEDŹWIEDŹ — RAMPAGE (berserker: brak HP → obrażenia) ────────────────── */
SKILLS.push(
  {
    /** `Q` — MAUL: szeroki, szybki zamach łapą. Rdzeń dmg, skaluje się z brakiem HP. */
    id: 'maul', kind: 'cone', name: 'MAUL',
    rangeMult: 1.9, coneCos: 0.4, damageMult: 3, knockback: 80,
    cooldownTicks: Math.round(2.5 * C.TICK_RATE),
    friendlyFire: false,
  },
  {
    /**
     * `W` — BLOODLUST: krwawy szał na czas. Aura leczy Cię i przyspiesza atak —
     * to jest silnik grania nisko: dorzucasz sustain, żeby przetrwać na pasku,
     * na którym bijesz najmocniej. Solo działa na samego niedźwiedzia.
     */
    id: 'bloodlust', kind: 'aura', name: 'BLOODLUST',
    auraId: 'bloodlust',
    durationTicks: Math.round(6 * C.TICK_RATE),
    cooldownTicks: Math.round(14 * C.TICK_RATE),
  },
  {
    /** `E` — RAVAGE: szarża w hordę z uderzeniem (doskok `ravage-charge`). Wejście. */
    id: 'ravage', kind: 'leap', name: 'RAVAGE',
    dashId: 'ravage-charge',
    cooldownTicks: Math.round(5 * C.TICK_RATE),
    resetsDash: true,
  },
  {
    /**
     * `R` — CATACLYSM: potężny grzmot 360° o mnożniku ×7. Przy niskim HP
     * (brak-HP → obrażenia) staje się rzezią — nagroda za granie na krawędzi.
     */
    id: 'cataclysm', kind: 'cone', name: 'CATACLYSM',
    rangeMult: 3, coneCos: -1, damageMult: 7, knockback: 200,
    cooldownTicks: Math.round(16 * C.TICK_RATE),
    friendlyFire: false,
  },
);

/* ── HIENA — CACKLE (egzekutor: bonus vs ranni) ──────────────────────────── */
SKILLS.push(
  {
    /** `Q` — RAVENOUS BITE: szybki kęs. Rdzeń dmg, dobija rannych (execute). */
    id: 'ravenous-bite', kind: 'cone', name: 'RAVENOUS BITE',
    rangeMult: 1.9, coneCos: 0.4, damageMult: 3, knockback: 60,
    cooldownTicks: Math.round(2.5 * C.TICK_RATE),
    friendlyFire: false,
  },
  {
    /** `W` — POUNCE: skok na ofiarę z uderzeniem (doskok `pounce`). Dopadasz rannego. */
    id: 'cackle-pounce', kind: 'leap', name: 'POUNCE',
    dashId: 'pounce',
    cooldownTicks: Math.round(4 * C.TICK_RATE),
    resetsDash: true,
  },
  {
    /**
     * `E` — CACKLE: obłąkany rechot 360°. Rani i OSŁABIA wszystkich dookoła
     * (`weaken` — obrywają mocniej). Zmiękcza hordę i dokłada się do egzekucji:
     * osłabiony ranny wróg znika od jednego kęsa.
     */
    id: 'cackle', kind: 'cone', name: 'CACKLE',
    rangeMult: 2.6, coneCos: -1, damageMult: 2.5, knockback: 60,
    cooldownTicks: Math.round(7 * C.TICK_RATE),
    friendlyFire: false,
    status: 'weaken',
  },
  {
    /**
     * `R` — FEEDING FRENZY: uczta. +prędkość ataku na czas — z leech (pasywka
     * SCAVENGER / drzewko) każdy dobity wróg leczy, więc rzucasz się na
     * poranioną hordę i wychodzisz z niej pełny. Uwolnienie egzekutora.
     */
    id: 'feeding-frenzy', kind: 'empower', name: 'FEEDING FRENZY',
    durationTicks: Math.round(7 * C.TICK_RATE),
    attackSpeed: 70,
    chain: { chains: 0, range: 0, falloff: 1, damageMult: 0 },
    cooldownTicks: Math.round(18 * C.TICK_RATE),
  },
);

/* ── SZCZUR — SWARM (dowódca zarazy: zainfekuj → zdetonuj) ────────────────── */
SKILLS.push(
  {
    /**
     * `Q` — INFEST: krótki natrysk zarazy w przód. Sam ledwie drapie — jego
     * treścią jest STATUS `plague`, który potem SAM skacze z wroga na wroga.
     * Tani i częsty, bo to on nabija stacki pod RUPTURE.
     */
    id: 'rat-infest', kind: 'cone', name: 'INFEST',
    rangeMult: 2.4, coneCos: 0.25, damageMult: 1.2, knockback: 0,
    cooldownTicks: Math.round(2 * C.TICK_RATE),
    friendlyFire: false,
    status: 'plague',
  },
  {
    /**
     * `W` — RUPTURE: detonacja. Każdy zarażony wróg w promieniu obrywa burst
     * PROPORCJONALNY do liczby stacków zarazy, po czym zaraza z niego znika.
     * To jest wypłata dowódcy: im dłużej „hodowałeś" hordę, tym większy huk.
     */
    id: 'rat-rupture', kind: 'detonate', name: 'RUPTURE',
    status: 'plague', radius: 320, damagePerStackMult: 2.8,
    cooldownTicks: Math.round(7 * C.TICK_RATE),
  },
  {
    /**
     * `E` — SWARM: wypuszcza rój szczurów (`rat-swarmling`), które gonią,
     * gryzą i ROZNOSZĄ zarazę dotykiem. Wpina się w hak `summonCount`, więc
     * talenty realnie pogrubiają rój — ruchome źródło stacków pod RUPTURE.
     */
    id: 'rat-vermin-swarm', kind: 'summon', name: 'SWARM',
    minionId: 'rat-swarmling', count: 5, placeRange: 260,
    cooldownTicks: Math.round(12 * C.TICK_RATE),
  },
  {
    /**
     * `R` — OUTBREAK: ognisko na całą arenę. Wielka nowa 360° (`coneCos: -1`),
     * która zaraża i lekko rani WSZYSTKO dookoła — natychmiastowy setup pod
     * gigantyczne RUPTURE. Zaraza i tak potem sama dosięgnie spóźnialskich.
     */
    id: 'rat-outbreak', kind: 'cone', name: 'OUTBREAK',
    rangeMult: 4, coneCos: -1, damageMult: 2, knockback: 40,
    cooldownTicks: Math.round(18 * C.TICK_RATE),
    friendlyFire: false,
    status: 'plague',
  },
);

/* ── SZCZUR — SCURRY (truciciel hit-and-run: onHit jad + lifesteal) ───────── */
SKILLS.push(
  {
    /** `Q` — SCAMPER: krótki, częsty doskok przez wrogów. Silnik hit-and-run. */
    id: 'scurry-scamper', kind: 'leap', name: 'SCAMPER',
    dashId: 'scamper',
    cooldownTicks: Math.round(2.5 * C.TICK_RATE),
    resetsDash: true,
  },
  {
    /**
     * `W` — GNAW FRENZY: szał gryzienia. Duży attack-speed na czas — a że
     * KAŻDY cios truje i leczy (`onHit`), ten jeden guzik zalewa cel stackami
     * jadu i odbija szczura na życiu. Bez własnych obrażeń: mnoży to, co robisz.
     */
    id: 'scurry-frenzy', kind: 'empower', name: 'GNAW FRENZY',
    durationTicks: Math.round(5 * C.TICK_RATE),
    attackSpeed: 80,
    chain: { chains: 0, range: 0, falloff: 1, damageMult: 0 },
    cooldownTicks: Math.round(13 * C.TICK_RATE),
  },
  {
    /**
     * `E` — VENOM SPRAY: natrysk jadu w przód. Nakłada `venom` GRUPIE naraz —
     * awaryjny zasiew, gdy Cię otoczą i nie zdążysz obejść wszystkich zębami.
     */
    id: 'scurry-venom-spray', kind: 'cone', name: 'VENOM SPRAY',
    rangeMult: 2.4, coneCos: 0.2, damageMult: 2.5, knockback: 40,
    cooldownTicks: Math.round(6 * C.TICK_RATE),
    friendlyFire: false,
    status: 'venom',
  },
  {
    /**
     * `R` — RABID: wściekłość. Ogromny attack-speed na dłuższe okno — z `onHit`
     * to lawina jadu i lifesteala naraz: stajesz się nieuchwytnym rozmyciem,
     * które wysysa hordę. Uwolnienie truciciela.
     */
    id: 'scurry-rabid', kind: 'empower', name: 'RABID',
    durationTicks: Math.round(8 * C.TICK_RATE),
    attackSpeed: 120,
    chain: { chains: 0, range: 0, falloff: 1, damageMult: 0 },
    cooldownTicks: Math.round(22 * C.TICK_RATE),
  },
);

/* ── KRET — SAPPER (kop + buduj: burrow na spacji, miny, wieżyczka, ładunek) ─ */
SKILLS.push(
  {
    /** `Q` — LAND MINE: stawia minę zbliżeniową. Spam buduje pole minowe. */
    id: 'sapper-mine', kind: 'summon', name: 'LAND MINE',
    minionId: 'mole-mine', count: 1, placeRange: 300, aimed: true,
    cooldownTicks: Math.round(2.5 * C.TICK_RATE),
  },
  {
    /** `W` — DRILL TURRET: stawia auto-strzelające działko (klon totemu). */
    id: 'sapper-turret', kind: 'summon', name: 'DRILL TURRET',
    minionId: 'drill-turret', count: 1, placeRange: 320, aimed: true,
    cooldownTicks: Math.round(9 * C.TICK_RATE),
  },
  {
    /** `E` — DEMOLITION CHARGE: wielki ładunek z długim tellem i ogłuszeniem. */
    id: 'sapper-charge', kind: 'summon', name: 'DEMO CHARGE',
    minionId: 'demolition-charge', count: 1, placeRange: 340, aimed: true,
    cooldownTicks: Math.round(11 * C.TICK_RATE),
  },
  {
    /**
     * `R` — EARTHQUAKE: wstrząs 360° wokół sapera. Wielki promień, mocny odrzut
     * i ogłuszenie — czyści otoczenie i daje oddech, gdy pole minowe nie starcza.
     */
    id: 'sapper-earthquake', kind: 'cone', name: 'EARTHQUAKE',
    rangeMult: 3.4, coneCos: -1, damageMult: 5, knockback: 200,
    cooldownTicks: Math.round(16 * C.TICK_RATE),
    friendlyFire: false,
    status: 'stun',
  },
);

/* ── KRET — MAGMA (mag ognia: pociski, lawa, WULKAN) ──────────────────────── */
SKILLS.push(
  {
    /**
     * `Q` — MAGMA BOLT: ognista kula, która WYBUCHA przy trafieniu (AoE) i
     * podpala (`burn` niosą wybuchy/erupcje). Rdzeń dystansowy — bije grupę.
     */
    id: 'magma-bolt', kind: 'projectile', name: 'MAGMA BOLT',
    speed: 520, damageMult: 2.4, count: 1, spreadRad: 0.1,
    chains: 0, chainRange: 0, chainFalloff: 1, blastRadius: 110,
    cooldownTicks: Math.round(1.4 * C.TICK_RATE),
  },
  {
    /** `W` — LAVA POOL: kałuża lawy w punkcie — cyklicznie podpala stojących. */
    id: 'magma-lava', kind: 'summon', name: 'LAVA POOL',
    minionId: 'lava-pool', count: 1, placeRange: 460, aimed: true,
    cooldownTicks: Math.round(8 * C.TICK_RATE),
  },
  {
    /**
     * `E` — ERUPTION: erupcja 360° wokół maga — burst ognia + podpalenie +
     * odrzut. Guzik „zejdź ze mnie", gdy kruchy mag zostanie otoczony.
     */
    id: 'magma-eruption', kind: 'cone', name: 'ERUPTION',
    rangeMult: 2.6, coneCos: -1, damageMult: 3.5, knockback: 140,
    cooldownTicks: Math.round(9 * C.TICK_RATE),
    friendlyFire: false,
    status: 'burn',
  },
  {
    /**
     * `R` — VOLCANO: stawia wulkan (`volcano`), który przez ~45 s zrzuca meteory
     * na LOSOWE miejsca całej areny. Każdy meteor jest TELEGRAFOWANY (zamach),
     * więc to nie kara, tylko ciągły przymus ruchu — popieprzony opad ogniowy
     * pracujący długo po wciśnięciu. Silnik: minion-spawner (`spews`).
     */
    id: 'magma-volcano', kind: 'summon', name: 'VOLCANO',
    minionId: 'volcano', count: 1, placeRange: 420, aimed: true,
    cooldownTicks: Math.round(40 * C.TICK_RATE),
  },
);

/* ── NIEDŹWIEDŹ — HIBERNATION (transform obronny: śpij → obudź się kolosem) ── */
SKILLS.push(
  {
    /** `Q` — SWIPE: szeroki zamach łapą. Rdzeń zwarcia; w formie bije podwójnie. */
    id: 'bear-swipe', kind: 'cone', name: 'SWIPE',
    rangeMult: 1.8, coneCos: 0.4, damageMult: 3, knockback: 60,
    cooldownTicks: Math.round(2 * C.TICK_RATE),
    friendlyFire: false,
  },
  {
    /**
     * `W` — HIBERNATE: sen. Kanał, który szybko leczy (`rest`), ale przerywa go
     * ruch — sustain za cenę stania w miejscu. Fundament grania obronnego:
     * odbudowujesz się do pełna, żeby móc znów wejść w wymianę.
     */
    id: 'bear-hibernate', kind: 'channel', name: 'HIBERNATE',
    channelTicks: Math.round(2.5 * C.TICK_RATE),
    tickEveryTicks: Math.round(0.25 * C.TICK_RATE),
    payload: { type: 'rest', healPerTick: 8 },
    cooldownTicks: Math.round(11 * C.TICK_RATE),
  },
  {
    /**
     * `E` — GROUND SLAM: grzmot 360° z mocnym odrzutem i ogłuszeniem. Robi
     * MIEJSCE — rozpycha i ogłusza hordę, żeby dało się bezpiecznie zasnąć (W)
     * albo obudzić w spokoju.
     */
    id: 'bear-slam', kind: 'cone', name: 'GROUND SLAM',
    rangeMult: 2.6, coneCos: -1, damageMult: 3, knockback: 180,
    cooldownTicks: Math.round(8 * C.TICK_RATE),
    friendlyFire: false,
    status: 'stun',
  },
  {
    /**
     * `R` — COLOSSUS: przebudzenie. Na 14 s stajesz się kolosem — bijesz
     * potężnie, twardniejesz (pancerz) i zamachujesz się szybciej, tracąc
     * trochę prędkości ruchu (ociężałość). Pierwsza FORMA w grze (`transform`):
     * staty nadpisane na czas, znikają same. Płynie z drzewkiem — `strength`
     * i `armor` z gałęzi wzmacniają formę bez żadnego dodatkowego kodu.
     */
    id: 'bear-colossus', kind: 'transform', name: 'COLOSSUS',
    durationTicks: Math.round(14 * C.TICK_RATE),
    damageMult: 2.4,
    speedMult: 0.9,
    attackSpeedMult: 1.15,
    armorBonus: 25,
    cooldownTicks: Math.round(28 * C.TICK_RATE),
  },
);

/* ── WILK — HOWL (forma agresywna: wilkołak podtrzymywany rzezią) ─────────── */
SKILLS.push(
  {
    /**
     * `Q` — SLASH: błyskawiczny zamach pazurów. Niziutko na cios, ale bardzo
     * krótki cooldown — rdzeń, który w formie wilkołaka (attack-speed) zamienia
     * się w maszynkę do mielenia.
     */
    id: 'wolf-slash', kind: 'cone', name: 'SLASH',
    rangeMult: 1.7, coneCos: 0.4, damageMult: 2.5, knockback: 40,
    cooldownTicks: Math.round(1.5 * C.TICK_RATE),
    friendlyFire: false,
  },
  {
    /** `W` — LUNGE: rzut na ofiarę z uderzeniem. Gap-closer łowcy (doskok). */
    id: 'wolf-lunge', kind: 'leap', name: 'LUNGE',
    dashId: 'wolf-lunge',
    cooldownTicks: Math.round(4 * C.TICK_RATE),
    resetsDash: true,
  },
  {
    /**
     * `E` — SAVAGE HOWL: wycie grozy 360°. Rani i PRZERAŻA (`fear`) — rozgania
     * hordę, robi miejsce i rozbija otoczenie kruchego (90 HP) wilka.
     */
    id: 'savage-howl', kind: 'cone', name: 'SAVAGE HOWL',
    rangeMult: 2.6, coneCos: -1, damageMult: 2.5, knockback: 120,
    cooldownTicks: Math.round(9 * C.TICK_RATE),
    friendlyFire: false,
    status: 'fear',
  },
  {
    /**
     * `R` — WEREWOLF: wycie przemiany. Forma wilkołaka — mocniejsze ciosy,
     * dużo szybszy atak i większa prędkość. KLUCZ: `killExtendTicks` — każde
     * zabójstwo dolewa formie czasu (do sufitu), więc w hordzie trwa BEZ KOŃCA,
     * a gaśnie dopiero, gdy przestajesz zabijać. Druga twarz `transform`:
     * agresywny ramp z kill-chain, przeciwieństwo tanka COLOSSUS na zegar.
     * Płynie z drzewkiem — `strength` mnoży cios, `attackSpeed` stackuje z formą.
     */
    id: 'wolf-howl', kind: 'transform', name: 'WEREWOLF',
    durationTicks: Math.round(10 * C.TICK_RATE),
    damageMult: 1.8,
    speedMult: 1.25,
    attackSpeedMult: 1.5,
    armorBonus: 0,
    killExtendTicks: Math.round(1.5 * C.TICK_RATE),
    cooldownTicks: Math.round(22 * C.TICK_RATE),
  },
);

/* ── WYDRA — PLAYFUL (trickster na krótkich cooldownach: pinball `fling`) ──── */
SKILLS.push(
  {
    /** `Q` — SKIP SHOT: kamień skaczący po wrogach (chains). Tani, częsty poke. */
    id: 'otter-skip', kind: 'projectile', name: 'SKIP SHOT',
    speed: 560, damageMult: 1.8, count: 1, spreadRad: 0.08,
    chains: 3, chainRange: 260, chainFalloff: 0.9, blastRadius: 0,
    cooldownTicks: Math.round(0.8 * C.TICK_RATE),
  },
  {
    /** `W` — TUMBLE: przewrót — nietykalny doskok z odepchnięciem. Mobilność w pętli. */
    id: 'otter-tumble', kind: 'leap', name: 'TUMBLE',
    dashId: 'otter-tumble',
    cooldownTicks: Math.round(2.5 * C.TICK_RATE),
    resetsDash: true,
  },
  {
    /**
     * `E` — TAIL SLAP: klaps 360° z mocnym odrzutem. Guzik-pinball: `fling`
     * daje bonus wrogom wbitym na siebie lub w ścianę. Ciasny tłum = rzeź.
     */
    id: 'otter-tailslap', kind: 'cone', name: 'TAIL SLAP',
    rangeMult: 2.2, coneCos: -1, damageMult: 2, knockback: 220,
    cooldownTicks: Math.round(1.4 * C.TICK_RATE),
    friendlyFire: false,
    fling: 2.5,
  },
  {
    /**
     * `R` — RIPTIDE: potężny wybuch 360° — ogromny odrzut, `fling` ×4 i
     * ogłuszenie. Rozrzuca całą hordę, mieląc ją o siebie i o ściany. Jak na
     * ultimate krótki cooldown — bo PLAYFUL ma nie przestawać grać.
     */
    id: 'otter-riptide', kind: 'cone', name: 'RIPTIDE',
    rangeMult: 3, coneCos: -1, damageMult: 3, knockback: 320,
    cooldownTicks: Math.round(7 * C.TICK_RATE),
    friendlyFire: false,
    fling: 4,
    status: 'stun',
  },
);

/* ── ZAJĄC — AURA MASTER (stacja buffów; aura slotu gaśnie na czas cooldownu) ─
 * Każdy slot ma PASYWNĄ aurę (`slotAuras`, aktywną gdy slot gotowy) plus AKTYWNY
 * BURST poniżej. Wciśnięcie odpala burst i startuje cooldown — a wtedy pasywna
 * aura tego slotu milknie. Grasz wartością AUR (nie naciskaj = wszystkie up),
 * a burst to ratunek za cenę chwilowej ciszy. `cooldown` (E + drzewko) skraca
 * ciemne okna. */
SKILLS.push(
  {
    /** `Q` — RESTORE: burst leczenia (pasywna aura MEND gaśnie na czas cd). */
    id: 'am-restore', kind: 'aura', name: 'RESTORE',
    auraId: 'am-mend-burst',
    durationTicks: Math.round(1.5 * C.TICK_RATE),
    cooldownTicks: Math.round(7 * C.TICK_RATE),
  },
  {
    /**
     * `W` — REPULSE: klaps 360° z mocnym odrzutem — robi miejsce drużynie.
     * Na czas cd milknie pasywna aura pancerza (WARD): rozpychasz hordę kosztem
     * chwilowej utraty tarczy.
     */
    id: 'am-repulse', kind: 'cone', name: 'REPULSE',
    rangeMult: 2.4, coneCos: -1, damageMult: 2, knockback: 200,
    cooldownTicks: Math.round(8 * C.TICK_RATE),
    friendlyFire: false,
  },
  {
    /** `E` — QUICKEN: burst prędkości ataku (pasywna aura TEMPO/cd gaśnie na cd). */
    id: 'am-quicken', kind: 'aura', name: 'QUICKEN',
    auraId: 'am-haste-burst',
    durationTicks: Math.round(2 * C.TICK_RATE),
    cooldownTicks: Math.round(9 * C.TICK_RATE),
  },
  {
    /**
     * `R` — RADIANCE NOVA: wielki wybuch obrażeń 360°. Na czas cd milknie
     * pasywny damage-field RADIANCE (Twój wybór: R też się wygasza) — burst
     * kosztem ciszy pola. Promień × `rangeMult`, więc z drzewkiem robi się
     * ogromny.
     */
    id: 'am-radiance-nova', kind: 'cone', name: 'RADIANCE NOVA',
    rangeMult: 3.2, coneCos: -1, damageMult: 5, knockback: 80,
    cooldownTicks: Math.round(11 * C.TICK_RATE),
    friendlyFire: false,
  },
);

export const DEFAULT_SKILL_ID = SKILLS[0].id;

export function skillById(id: string): SkillDef {
  return SKILLS.find((s) => s.id === id) ?? SKILLS[0];
}

/* ── Doskoki (spacja) ───────────────────────────────────────────────────── */

/**
 * Doskok jest DRUGIM slotem umiejętności i działa dokładnie tak samo jak Q:
 * klasa wskazuje wariant po id, a talent może go podmienić. Dzięki temu
 * „zając dostaje Power Jump" nie wymaga nowego mechanizmu — to ten sam ruch,
 * co „kret dostaje Sniper Shot", tylko w innym slocie.
 */
export interface DashDef {
  id: string;
  /** Nazwa na HUD-zie (EN). */
  name: string;
  distance: number;
  durationTicks: number;
  cooldownTicks: number;
  /** Czy przelatuje NAD przeszkodami (skok) zamiast zatrzymywać się o nie. */
  passesObstacles: boolean;
  /** Czy w locie gracz jest nietykalny. */
  invulnerable: boolean;
  /**
   * Mobki o promieniu >= tej wartości zatrzymują doskok (0 = wyłączone).
   * Skok przelatuje nad TERENEM, ale wielki wróg jest zbyt wysoki — odbijasz
   * się od niego. Gdy doskok zadaje obrażenia (`impactDamageMult` > 0),
   * zderzenie od razu w niego uderza.
   */
  bounceMobRadius: number;
  /** Obrażenia obszarowe w miejscu lądowania (0 = brak). */
  impactRadius: number;
  /** Mnożnik obrażeń zwarcia gracza zadawanych przy lądowaniu. */
  impactDamageMult: number;
  impactKnockback: number;
  /**
   * SURFOWANIE — doskok, który nie jest szarpnięciem, tylko JAZDĄ.
   *
   * Wszystkie dotychczasowe doskoki są krótkie (0,18-0,23 s) i cała ich treść
   * dzieje się na końcu: lądowanie bije, reszta to przemieszczenie. Fala
   * wydry jest odwrotnością — trwa półtorej sekundy, a liczy się DROGA:
   * co `hitEveryTicks` uderza wszystko w promieniu `hitRadius` wokół gracza,
   * odpycha i moczy. Dlatego to nie jest wariant `impactRadius`, tylko osobny
   * blok: tam obrażenia padają RAZ, tutaj cyklicznie przez cały lot.
   *
   * Jazdę można PRZERWAĆ, wciskając ponownie ten sam klawisz (patrz
   * `applySkill`) — bez tego fala niosłaby gracza na drugi koniec areny
   * także wtedy, gdy przeciął już to, co chciał przeciąć. To jest jedyny
   * doskok w grze, z którego da się zejść wcześniej.
   */
  ride?: {
    /** Co ile ticków lotu fala uderza. */
    hitEveryTicks: number;
    /** Promień uderzenia; skalowany `range` gracza, więc talenty go poszerzają. */
    hitRadius: number;
    /** Obrażenia jednego uderzenia = obrażenia zwarcia gracza × to. */
    damageMult: number;
    knockback: number;
    /** Status nakładany po drodze (`STATUSES`). */
    status?: string;
  };
}

export const DASHES: DashDef[] = [
  {
    // Domyślny doskok: szarpnięcie po ziemi, zatrzymuje się o przeszkody.
    id: 'dash',
    name: 'DASH',
    distance: C.DASH_DISTANCE,
    durationTicks: C.DASH_TICKS,
    cooldownTicks: C.DASH_COOLDOWN_TICKS,
    passesObstacles: false,
    invulnerable: false,
    bounceMobRadius: 20,
    impactRadius: 0,
    impactDamageMult: 0,
    impactKnockback: 0,
  },
  {
    // Sygnatura zająca: przeskok nad przeszkodami, nietykalność w locie.
    id: 'jump',
    name: 'JUMP',
    distance: C.DASH_DISTANCE,
    durationTicks: C.DASH_TICKS,
    cooldownTicks: C.DASH_COOLDOWN_TICKS,
    passesObstacles: true,
    invulnerable: true,
    bounceMobRadius: 20,
    impactRadius: 0,
    impactDamageMult: 0,
    impactKnockback: 0,
  },
  {
    /**
     * POWER JUMP — nagroda za specjalizację SLIPSTREAM u zająca.
     * Ten sam skok, ale lądowanie rozbija wszystko dookoła. Zamienia
     * ucieczkę w wejście: skaczesz W hordę, a nie od niej.
     * Dłuższy i wolniejszy niż zwykły skok, żeby uderzenie było czytelne.
     */
    id: 'power-jump',
    name: 'POWER JUMP',
    distance: C.DASH_DISTANCE * 1.25,
    durationTicks: Math.round(C.DASH_TICKS * 1.3),
    cooldownTicks: Math.round(4 * C.TICK_RATE),
    passesObstacles: true,
    invulnerable: true,
    bounceMobRadius: 20,
    impactRadius: 165,
    impactDamageMult: 4,
    impactKnockback: 120,
  },
];

DASHES.push({
  /**
   * BŁYSKAWICA — wilk Thunder Fang, combo `Q→W→Q`. Ponad dwa razy dłuższy
   * od zwykłego doskoku, nietykalny i przelatujący nad przeszkodami, bo ma
   * być przemieszczeniem, a nie szarpnięciem. Obrażeń NIE zadaje lądowaniem
   * — sypie je po drodze rykoszetami (patrz `DashComboEffect` w comboConfig).
   */
  id: 'lightning-dash',
  name: 'LIGHTNING RUSH',
  distance: C.DASH_DISTANCE * 2.4,
  durationTicks: Math.round(C.DASH_TICKS * 1.6),
  cooldownTicks: 0,
  passesObstacles: true,
  invulnerable: true,
  bounceMobRadius: 0,
  impactRadius: 0,
  impactDamageMult: 0,
  impactKnockback: 0,
});

DASHES.push(
  {
    /**
     * FALA PRZYPŁYWU — wydra TIDECALLER, `Q`. Sygnatura gałęzi: gracz WSIADA
     * na falę i jedzie przez arenę, orząc wszystko po drodze.
     *
     * 1500 px przez 1,5 s to ponad sześć razy dłużej niż zwykły doskok
     * i dłużej niż widać ekran — fala ma przecinać całe pole bitwy, a nie
     * przeskakiwać hordę. Dlatego też `invulnerable: false`: półtorasekundowa
     * nietykalność na 7 s cooldownu byłaby przyciskiem „nie umieraj",
     * a wydra ma ratować drużynę, nie siebie. Odrzut na każdym tyknięciu
     * i tak rozgania to, co stoi na trasie.
     *
     * `passesObstacles: true`, bo na mapie leży 60 głazów — fala zatrzymująca
     * się na pierwszym z nich nigdy nie przejechałaby swojego dystansu.
     */
    id: 'tidal-surf',
    name: 'TIDAL SURF',
    distance: 1500,
    durationTicks: Math.round(1.5 * C.TICK_RATE),
    cooldownTicks: Math.round(9 * C.TICK_RATE),
    passesObstacles: true,
    invulnerable: false,
    bounceMobRadius: 0,
    impactRadius: 0,
    impactDamageMult: 0,
    impactKnockback: 0,
    /**
     * OSŁABIONE PO BENCHU (pierwsza wersja: 1,1 obrażeń co 3 ticki, 7 s cd).
     * Fala orze korytarz 1500 × 400 px, więc nawet mały mnożnik mnoży się
     * przez liczbę trafionych — przy 400 wrogach na arenie to była zdecydowanie
     * największa liczba obrażeń w grze. Jedenaście tyknięć zamiast piętnastu
     * i dwie sekundy dłuższy cooldown zostawiają rolę (przecięcie hordy
     * i zmoczenie jej), a odbierają bycie głównym źródłem zabójstw.
     */
    ride: { hitEveryTicks: 4, hitRadius: 200, damageMult: 0.7, knockback: 130, status: 'soaked' },
  },
  {
    /**
     * FALA ROZBIJAJĄCA — ten sam surf po talencie `Breakwater`, ale zamiast
     * moczyć OGŁUSZA. Ten sam ruch co „E niedźwiedzia zaczyna ogłuszać":
     * talent podmienia wariant, a symulacja nie wie o niczym.
     *
     * Stun z `STATUSES` trwa 0,7 s i nie stackuje się, a fala tyka co 0,1 s —
     * przejazd zostawia więc za sobą korytarz ogłuszonych na chwilę wrogów,
     * nie stałe zamrożenie. Obrażenia nieco niższe niż w `tidal-surf`:
     * kontrola jest tu nagrodą, damage schodzi na drugi plan.
     */
    id: 'tidal-surf-crash',
    name: 'BREAKWATER SURF',
    distance: 1500,
    durationTicks: Math.round(1.5 * C.TICK_RATE),
    cooldownTicks: Math.round(9 * C.TICK_RATE),
    passesObstacles: true,
    invulnerable: false,
    bounceMobRadius: 0,
    impactRadius: 0,
    impactDamageMult: 0,
    impactKnockback: 0,
    ride: { hitEveryTicks: 4, hitRadius: 200, damageMult: 0.5, knockback: 130, status: 'stun' },
  },
);

DASHES.push(
  {
    /**
     * SPIN DASH — jeż SONIC, `Q`. Krótki, częsty roll, który orze wszystko po
     * trasie. Obrażenia tyknięcia lecą z `meleeDamageOf`, więc skalują się
     * PRĘDKOŚCIĄ Sonica (speed → damage). Przelatuje nad przeszkodami (kula),
     * ale nie jest nietykalny — to broń, nie ucieczka.
     */
    id: 'spin-dash',
    name: 'SPIN DASH',
    distance: 620,
    durationTicks: Math.round(0.55 * C.TICK_RATE),
    cooldownTicks: Math.round(3 * C.TICK_RATE),
    passesObstacles: true,
    invulnerable: false,
    bounceMobRadius: 0,
    impactRadius: 0,
    impactDamageMult: 0,
    impactKnockback: 0,
    ride: { hitEveryTicks: 3, hitRadius: 130, damageMult: 0.9, knockback: 60 },
  },
  {
    /**
     * SONIC BOOM — jeż SONIC, `R`. Ultymatywny roll przez CAŁĄ arenę: długi,
     * szeroki, mocny i NIETYKALNY w locie. Największe okno obrażeń gałęzi —
     * przy wysokiej prędkości każde tyknięcie bije potężnie i trafia wszystko.
     */
    id: 'sonic-boom',
    name: 'SONIC BOOM',
    distance: 1600,
    durationTicks: Math.round(1.1 * C.TICK_RATE),
    cooldownTicks: Math.round(24 * C.TICK_RATE),
    passesObstacles: true,
    invulnerable: true,
    bounceMobRadius: 0,
    impactRadius: 0,
    impactDamageMult: 0,
    impactKnockback: 0,
    ride: { hitEveryTicks: 3, hitRadius: 200, damageMult: 1.6, knockback: 120 },
  },
);

DASHES.push({
  /**
   * RAVAGE — niedźwiedź RAMPAGE, `E`. Szarża w hordę z uderzeniem przy
   * dobiegnięciu. Przelatuje nad przeszkodami (rozpędzony miś), ale NIE jest
   * nietykalny — berserker wchodzi w ryzyko. Obrażenia uderzenia lecą
   * z `meleeDamageOf`, więc przy niskim HP walą tym mocniej.
   */
  id: 'ravage-charge',
  name: 'RAVAGE',
  distance: C.DASH_DISTANCE * 1.3,
  durationTicks: Math.round(C.DASH_TICKS * 1.2),
  cooldownTicks: Math.round(5 * C.TICK_RATE),
  passesObstacles: true,
  invulnerable: false,
  bounceMobRadius: 0,
  impactRadius: 150,
  impactDamageMult: 3,
  impactKnockback: 100,
});

DASHES.push({
  /**
   * POUNCE — hiena CACKLE, `W`. Szybki skok na ofiarę z uderzeniem przy
   * lądowaniu. Nietykalny w locie (dopadasz rannego, nie wystawiając się),
   * przelatuje nad przeszkodami. Obrażenia uderzenia lecą z `meleeDamageOf`
   * i przez `rollDamage` łapią bonus egzekucji vs ranni.
   */
  id: 'pounce',
  name: 'POUNCE',
  distance: C.DASH_DISTANCE * 1.15,
  durationTicks: Math.round(C.DASH_TICKS * 1.1),
  cooldownTicks: Math.round(4 * C.TICK_RATE),
  passesObstacles: true,
  invulnerable: true,
  bounceMobRadius: 0,
  impactRadius: 120,
  impactDamageMult: 3,
  impactKnockback: 60,
});

DASHES.push({
  /**
   * SCAMPER — szczur SCURRY, `Q`. Krótki, częsty doskok przez wrogów: silnik
   * hit-and-run. Przelatuje nad przeszkodami (zwinny) i jest nietykalny w locie
   * (wpadasz i wypadasz), z lekkim uderzeniem przy lądowaniu. Sam jadu nie
   * nakłada — od tego jest `onHit` na auto-atakach, które SCAMPER ustawia
   * w zasięgu ukąszeń.
   */
  id: 'scamper',
  name: 'SCAMPER',
  distance: C.DASH_DISTANCE * 0.95,
  durationTicks: Math.round(C.DASH_TICKS * 0.9),
  cooldownTicks: Math.round(2.5 * C.TICK_RATE),
  passesObstacles: true,
  invulnerable: true,
  bounceMobRadius: 0,
  impactRadius: 90,
  impactDamageMult: 1.5,
  impactKnockback: 40,
});

DASHES.push({
  /**
   * BURROW — kret SAPPER, spacja (podmienia doskok). Zakopujesz się:
   * przelatujesz NAD wszystkim (przeszkody i wrogowie), jesteś NIETYKALNY,
   * a wynurzenie = EPICENTER — wstrząs z odrzutem w miejscu lądowania. Dłuższy
   * i mocniejszy od zwykłego doskoku: jednocześnie ucieczka pod ziemię i wejście
   * z hukiem. Wzorzec `pounce` (nietykalny doskok z impaktem), tylko większy.
   */
  id: 'burrow',
  name: 'BURROW',
  distance: C.DASH_DISTANCE * 1.6,
  durationTicks: Math.round(C.DASH_TICKS * 1.6),
  cooldownTicks: Math.round(6 * C.TICK_RATE),
  passesObstacles: true,
  invulnerable: true,
  bounceMobRadius: 0,
  impactRadius: 200,
  impactDamageMult: 3,
  impactKnockback: 130,
});

DASHES.push({
  /**
   * LUNGE — wilk HOWL, `W`. Rzut łowcy na ofiarę z uderzeniem przy dopadnięciu.
   * Przelatuje nad przeszkodami (zwinny), ale NIE jest nietykalny — wilkołak
   * wchodzi w ryzyko, nie ucieka od niego. Obrażenia uderzenia lecą
   * z `meleeDamageOf`, więc w formie (damageMult) walą mocniej.
   */
  id: 'wolf-lunge',
  name: 'LUNGE',
  distance: C.DASH_DISTANCE * 1.25,
  durationTicks: Math.round(C.DASH_TICKS * 1.1),
  cooldownTicks: Math.round(4 * C.TICK_RATE),
  passesObstacles: true,
  invulnerable: false,
  bounceMobRadius: 0,
  impactRadius: 110,
  impactDamageMult: 2,
  impactKnockback: 50,
});

DASHES.push({
  /**
   * TUMBLE — wydra PLAYFUL, `W`. Zwinny przewrót: nietykalny w locie, przelatuje
   * nad przeszkodami, z odepchnięciem przy lądowaniu. Krótki cooldown — element
   * nieustannej rotacji, nie rzadki „wielki wjazd".
   */
  id: 'otter-tumble',
  name: 'TUMBLE',
  distance: C.DASH_DISTANCE * 1.1,
  durationTicks: Math.round(C.DASH_TICKS),
  cooldownTicks: Math.round(2.5 * C.TICK_RATE),
  passesObstacles: true,
  invulnerable: true,
  bounceMobRadius: 0,
  impactRadius: 120,
  impactDamageMult: 1.5,
  impactKnockback: 140,
});

export const DEFAULT_DASH_ID = DASHES[0].id;

export function dashById(id: string): DashDef {
  return DASHES.find((d) => d.id === id) ?? DASHES[0];
}
