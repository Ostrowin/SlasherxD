/** Parametry symulacji. Wszystkie wartości w px, sekundach i tickach symulacji. */

/** Ticki symulacji na sekundę — stały krok, niezależny od FPS renderowania. */
export const TICK_RATE = 30;
export const TICK_DT = 1 / TICK_RATE;

export const WORLD_W = 4000;
export const WORLD_H = 4000;

export const PLAYER_SPEED = 240;
export const PLAYER_MAX_HP = 100;
export const PLAYER_RADIUS = 14;
/** Nietykalność po otrzymaniu obrażeń (w tickach). */
export const PLAYER_HURT_COOLDOWN_TICKS = Math.round(0.5 * TICK_RATE);

export const MOB_SPEED_MIN = 70;
export const MOB_SPEED_MAX = 110;
export const MOB_HP = 3;
export const MOB_RADIUS = 12;
export const MOB_CONTACT_DAMAGE = 5;
/** Mobki spawnują się na okręgu o tym promieniu wokół gracza (poza ekranem). */
export const MOB_SPAWN_DISTANCE = 900;
/** Maksymalna liczba mobków żywych jednocześnie (rozmiar poola). */
export const MOB_CAP = 400;
/** Docelowa liczba mobków: start + przyrost na sekundę gry. */
export const MOB_TARGET_BASE = 15;
export const MOB_TARGET_PER_SECOND = 1.5;

/**
 * PLACEHOLDER auto-ataku: pełne koło co pół sekundy.
 * Docelowy model walki (aktywna/auto/hybryda) to otwarta decyzja — gdd.md 5.1, TODOS.md.
 */
export const MELEE_INTERVAL_TICKS = Math.round(0.5 * TICK_RATE);
export const MELEE_RANGE = 90;
export const MELEE_DAMAGE = 2;

/** Rozmiar komórki spatial hasha — ~2x promień moba wystarcza. */
export const HASH_CELL_SIZE = 64;
