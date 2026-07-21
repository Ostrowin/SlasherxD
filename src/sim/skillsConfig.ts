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

export type SkillDef =
  | ConeSkill | SummonSkill | LeapSkill | ProjectileSkill | AuraSkill
  | EmpowerSkill | BlinkSkill | TimeStopSkill;

/** Ile slotów umiejętności ma gracz: Q, W, E. */
export const SKILL_SLOTS = 3;
/** Etykiety klawiszy — render czyta je z jednego miejsca. */
export const SKILL_KEYS = ['Q', 'W', 'E'];

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
  {
    /**
     * GRAVITY MAGE — `Q`: pole wstrząsu w punkcie na mapie. Krótki cooldown,
     * bo to podstawowe źródło obrażeń tej gałęzi, a nie okazjonalny wybuch.
     */
    id: 'quake-field', kind: 'summon', name: 'EARTHSHAKE',
    minionId: 'quake-field', count: 1, placeRange: 340,
    cooldownTicks: Math.round(5 * C.TICK_RATE),
  },
  {
    /**
     * GRAVITY MAGE — `W`: zapaść z 2,2 s zamachu. Zasięg stawiania większy
     * niż u `Q`, bo przy takim opóźnieniu i tak trzeba celować z wyprzedzeniem.
     */
    id: 'gravity-collapse', kind: 'summon', name: 'COLLAPSE',
    minionId: 'gravity-collapse', count: 1, placeRange: 400,
    cooldownTicks: Math.round(9 * C.TICK_RATE),
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
    minionId: 'gravity-field', count: 1, placeRange: 380,
    cooldownTicks: Math.round(10 * C.TICK_RATE),
  },
  {
    id: 'gravity-field-crush', kind: 'summon', name: 'CRUSHING WELL',
    minionId: 'gravity-field-crush', count: 1, placeRange: 380,
    cooldownTicks: Math.round(10 * C.TICK_RATE),
  },
  {
    id: 'gravity-field-singularity', kind: 'summon', name: 'SINGULARITY',
    minionId: 'gravity-field-singularity', count: 1, placeRange: 380,
    cooldownTicks: Math.round(10 * C.TICK_RATE),
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

export const DEFAULT_DASH_ID = DASHES[0].id;

export function dashById(id: string): DashDef {
  return DASHES.find((d) => d.id === id) ?? DASHES[0];
}
