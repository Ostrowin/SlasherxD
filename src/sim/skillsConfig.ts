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

export type SkillDef = ConeSkill | SummonSkill | LeapSkill;

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

export const DEFAULT_DASH_ID = DASHES[0].id;

export function dashById(id: string): DashDef {
  return DASHES.find((d) => d.id === id) ?? DASHES[0];
}
