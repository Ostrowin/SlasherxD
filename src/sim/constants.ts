/**
 * Parametry symulacji wspólne dla całej gry (px, sekundy, ticki).
 * Statystyki klas gracza: src/sim/classes.ts. Typy najeźdźców: src/sim/enemies.ts.
 */

/** Ticki symulacji na sekundę — stały krok, niezależny od FPS renderowania. */
export const TICK_RATE = 30;
export const TICK_DT = 1 / TICK_RATE;

export const WORLD_W = 4000;
export const WORLD_H = 4000;

export const PLAYER_RADIUS = 14;
/** Nietykalność po otrzymaniu obrażeń (w tickach) — wspólna dla kontaktu i pocisków. */
export const PLAYER_HURT_COOLDOWN_TICKS = Math.round(0.5 * TICK_RATE);

/** Bazowy promień wroga; konkretne typy nadpisują go w enemies.ts. */
export const MOB_RADIUS = 12;
/** Największy promień wroga w grze — zapas przy szukaniu w spatial hashu. */
export const MOB_RADIUS_MAX = 30;
/** Mobki spawnują się na okręgu o tym promieniu wokół gracza (poza ekranem). */
export const MOB_SPAWN_DISTANCE = 900;
/** Maksymalna liczba mobków żywych jednocześnie (rozmiar poola). */
export const MOB_CAP = 400;
/** Docelowa liczba mobków: start + przyrost na sekundę gry. */
export const MOB_TARGET_BASE = 15;
export const MOB_TARGET_PER_SECOND = 1.5;

/** Pociski (Alien Mage). */
export const PROJECTILE_CAP = 200;
export const PROJECTILE_RADIUS = 6;
export const PROJECTILE_TTL_TICKS = Math.round(4 * TICK_RATE);

/**
 * Power Slash — pierwszy aktywny skill modelu hybrydowego (D10 2026-07-19).
 * Parametry względem statystyk klasy; docelowo skille per klasa + kombinacje klawiszy.
 */
export const SKILL_RANGE_MULT = 1.9;
export const SKILL_DAMAGE_MULT = 3;
/** Cos połowy kąta stożka: 0.5 = stożek 120°. */
export const SKILL_CONE_COS = 0.5;
/** Natychmiastowe odepchnięcie trafionych mobków (px). */
export const SKILL_KNOCKBACK = 70;
export const SKILL_COOLDOWN_TICKS = Math.round(3 * TICK_RATE);

/**
 * Losowe przeszkody na mapie (deterministyczne z seeda — ta sama mapa dla
 * wszystkich graczy w co-opie). Blokują gracza, mobki i pociski (osłony!).
 */
export const OBSTACLE_COUNT = 60;
export const OBSTACLE_RADIUS_MIN = 40;
export const OBSTACLE_RADIUS_MAX = 90;
/** Strefa wolna od przeszkód wokół punktu startu gracza. */
export const OBSTACLE_SPAWN_CLEARANCE = 350;

/** Rozmiar komórki spatial hasha — ~2x promień moba wystarcza. */
export const HASH_CELL_SIZE = 64;

/**
 * Mgła wojny i minimapa (warstwa renderu).
 * Promień odkrywania ~ tyle, ile gracz realnie widzi na ekranie.
 */
export const FOG_CELL_SIZE = 50;
export const FOG_REVEAL_RADIUS = 430;
export const MINIMAP_SIZE = 190;
export const MINIMAP_MARGIN = 14;
