/**
 * ═══════════════════════════════════════════════════════════════════
 *  KONFIGURACJA ITEMÓW — tu ustawiasz pierdoły. Edytuj śmiało.
 *  Vite przeładuje grę automatycznie po zapisaniu pliku.
 *
 *  Wszystkie efekty działają DO KOŃCA RUNU i się stackują
 *  (decyzja 2026-07-19: permanentne, ale małe wartości).
 * ═══════════════════════════════════════════════════════════════════
 */

export const DROP_CONFIG = {
  /** Szansa (w %), że zabity mob upuści item. */
  dropChancePercent: 8,
  /** Po ilu sekundach item zniknie z ziemi. */
  despawnSeconds: 12,
  /** Bazowy promień zbierania (px) — Grav Magnet go powiększa. */
  pickupRadiusBase: 28,
  /** Maksymalna liczba itemów leżących naraz na ziemi (rozmiar poola). */
  maxGroundItems: 120,
};

/** Twarde limity stackowania — żeby nie dało się zepsuć gry farmieniem. */
export const ITEM_CAPS = {
  /** Maksymalna płaska redukcja obrażeń z Armora. */
  armorMax: 6,
  /** Auto-atak nie tyknie częściej niż co tyle ticków (30 ticków = 1 s). */
  minMeleeIntervalTicks: 3,
  /** Cooldown skilla nie zejdzie poniżej tego mnożnika bazy (0.4 = 40%). */
  minCooldownMult: 0.4,
  /** Maksymalna liczba ładunków Overshielda naraz. */
  maxShieldCharges: 3,
  /**
   * Sufit szansy na kryta. Poniżej 100% celowo: przy gwarantowanym krycie
   * „krytyczne" przestaje być zdarzeniem, a staje się zwykłym mnożnikiem
   * obrażeń — i cała statystyka traci sens.
   */
  critChanceMax: 75,
  /**
   * Sufity na statystyki PODTRZYMUJĄCE ŻYCIE. Bez nich wystarczy ustawić
   * dowolne z nich wysoko, żeby stanie w miejscu stało się optymalną
   * strategią — gra przestaje być o unikaniu, a zaczyna o czekaniu.
   * Dokładnie tak zepsuł grę regen (2026-07-19) i wampiryzm (2026-07-20).
   */
  leechMax: 10,
  regenMax: 8,
  thornsMax: 60,
};

/**
 * Rodzaje efektów (kind) i znaczenie pola `value`:
 *  - medkit:      natychmiast leczy `value` HP
 *  - armor:       każde obrażenie mniejsze o `value` (płasko, stackuje się)
 *  - speed:       +`value`% prędkości ruchu
 *  - attackSpeed: auto-atak szybszy o `value`%
 *  - range:       +`value`% zasięgu auto-ataku i skilla
 *  - strength:    +`value`% obrażeń auto-ataku i skilla
 *  - overshield:  +`value` ładunków bariery (1 ładunek = pochłania całe 1 trafienie)
 *  - regen:       +`value` HP na sekundę
 *  - maxHp:       +`value` maks. HP (i tyle samo leczenia od razu)
 *  - cooldown:    cooldown skilla krótszy o `value`%
 *  - leech:       każde zabójstwo leczy `value` HP (ułamki się sumują)
 *  - magnet:      +`value` px promienia zbierania
 *  - knockback:   odrzut skilla mocniejszy o `value`%
 *  - thorns:      wróg, który Cię dotknie, dostaje `value` obrażeń
 *  - projectileCount: +`value` pocisków w wachlarzu skilla strzelającego
 *  - chainCount:  +`value` odbić pocisku na kolejnego wroga
 *
 * `weight` = względna częstość dropu (większa waga = częstszy).
 */
export type ItemKind =
  | 'medkit'
  | 'armor'
  | 'speed'
  | 'attackSpeed'
  | 'range'
  | 'strength'
  | 'overshield'
  | 'regen'
  | 'maxHp'
  | 'cooldown'
  | 'leech'
  | 'magnet'
  | 'knockback'
  | 'thorns'
  | 'critChance'
  | 'critDamage'
  | 'raiseDead'
  /* Skalowanie sojuszniczych jednostek (`minionsConfig.ts`) — buildy
     przywoływaczy rosną przez TE statystyki, nie przez własne obrażenia. */
  | 'minionDamage'
  | 'minionHp'
  | 'minionCount'
  | 'minionDuration'
  /** Promień fali uderzeniowej doskoku (build skoczka). */
  | 'impactRadius'
  /* Skalowanie pocisków odbijanych (`ProjectileSkill`) — na tych dwóch
     statystykach stoi Arcane Archer lisa i Thunder Fang wilka. */
  | 'projectileCount'
  | 'chainCount';

export interface ItemDef {
  kind: ItemKind;
  /** Nazwa pokazywana w grze (EN). */
  name: string;
  /** Kolor rombu na ziemi i floating textu. */
  color: number;
  weight: number;
  value: number;
}

export const ITEMS: ItemDef[] = [
  { kind: 'medkit',      name: 'Medkit',           color: 0xff4d6d, weight: 12, value: 15 },
  { kind: 'armor',       name: 'Armor Plate',      color: 0x9db4c0, weight: 6,  value: 1 },
  { kind: 'speed',       name: 'Speed Module',     color: 0x38e8ff, weight: 8,  value: 4 },
  { kind: 'attackSpeed', name: 'Attack Chip',      color: 0xffe066, weight: 8,  value: 5 },
  { kind: 'range',       name: 'Range Extender',   color: 0x74f7b8, weight: 7,  value: 5 },
  { kind: 'strength',    name: 'Strength Serum',   color: 0xff8c42, weight: 8,  value: 8 },
  { kind: 'overshield',  name: 'Overshield',       color: 0x4dc9ff, weight: 5,  value: 1 },
  { kind: 'regen',       name: 'Repair Nanobots',  color: 0x7bff9e, weight: 5,  value: 0.3 },
  { kind: 'maxHp',       name: 'Max HP Core',      color: 0xff5db1, weight: 6,  value: 10 },
  { kind: 'cooldown',    name: 'Cooldown Chip',    color: 0xc77dff, weight: 5,  value: 6 },
  { kind: 'leech',       name: 'Vampiric Nanobots', color: 0xb0004d, weight: 4, value: 0.2 },
  { kind: 'magnet',      name: 'Grav Magnet',      color: 0xf1f5f9, weight: 5,  value: 12 },
  { kind: 'knockback',   name: 'Knockback Booster', color: 0xffb703, weight: 4, value: 15 },
  { kind: 'thorns',      name: 'Thorn Field',      color: 0x99d98c, weight: 5,  value: 2 },
  { kind: 'critChance',  name: 'Targeting Chip',   color: 0xff2e63, weight: 7,  value: 3 },
  { kind: 'critDamage',  name: 'Fracture Round',   color: 0xff8fa3, weight: 5,  value: 15 },
];
