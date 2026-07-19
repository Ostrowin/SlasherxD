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

export const MOB_RADIUS = 12;
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

/** Rozmiar komórki spatial hasha — ~2x promień moba wystarcza. */
export const HASH_CELL_SIZE = 64;
