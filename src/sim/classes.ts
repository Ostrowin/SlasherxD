import { TICK_RATE } from './constants';

/**
 * 12 klas-ssaków (roster zaktualizowany 2026-07-20, gdd.md 5.4).
 *
 * Klasa = kolor + statystyki. Sygnaturowe mechaniki KAŻDEJ klasy (zaraza
 * szczura, szarża dzika, aury wydry…) przyjdą razem z drzewkiem talentów —
 * to w praktyce ten sam kod, więc nie ma sensu robić go dwa razy.
 *
 * `id` jest JEDYNYM identyfikatorem klasy w danych przekraczających granice
 * (sieć, zapis). Indeks w tej tablicy to szczegół implementacyjny i wolno go
 * używać wyłącznie lokalnie: przy zmianie rosteru indeksy się przesuwają,
 * a wtedy stary zapis i starsza karta w co-opie wskazałyby inną klasę —
 * bez żadnego błędu, za to z dwiema różnymi symulacjami.
 */
export interface ClassDef {
  id: string;
  /** Nazwa pokazywana w grze (teksty w grze: EN — decyzja 2026-07-19). */
  name: string;
  color: number;
  maxHp: number;
  speed: number;
  meleeDamage: number;
  meleeRange: number;
  meleeIntervalTicks: number;
  /**
   * Startowy wariant doskoku spod spacji — id z `DASHES` (skillsConfig.ts).
   * Talent może go PODMIENIĆ, tak samo jak umiejętność spod Q; dzięki temu
   * zając ze specjalizacją dostaje Power Jump bez nowego mechanizmu.
   */
  dashId: string;
  /** Jednozdaniowy opis roli na ekranie wyboru. */
  blurb: string;
}

const secs = (s: number) => Math.round(s * TICK_RATE);

export const CLASSES: ClassDef[] = [
  { id: 'bear',     name: 'Bear',     color: 0x8b5a2b, maxHp: 140, speed: 205, meleeDamage: 3, meleeRange: 100, meleeIntervalTicks: secs(0.7),  dashId: 'dash', blurb: 'Big. Angry. Absorbs lasers.' },
  { id: 'wolf',     name: 'Wolf',     color: 0x9aa5b1, maxHp: 90,  speed: 260, meleeDamage: 2, meleeRange: 90,  meleeIntervalTicks: secs(0.4),  dashId: 'dash', blurb: 'Fast strikes, pack instinct.' },
  { id: 'fox',      name: 'Fox',      color: 0xff7a29, maxHp: 80,  speed: 265, meleeDamage: 4, meleeRange: 80,  meleeIntervalTicks: secs(0.55), dashId: 'dash', blurb: 'Hits rarely, hits hard.' },
  { id: 'hare',     name: 'Hare',     color: 0xf5f5f5, maxHp: 70,  speed: 300, meleeDamage: 2, meleeRange: 80,  meleeIntervalTicks: secs(0.45), dashId: 'jump', blurb: 'Too fast to die. Usually.' },
  { id: 'mole',     name: 'Mole',     color: 0x5d4037, maxHp: 110, speed: 215, meleeDamage: 2, meleeRange: 85,  meleeIntervalTicks: secs(0.5),  dashId: 'dash', blurb: 'Engineer of the underground.' },
  { id: 'hedgehog', name: 'Hedgehog', color: 0x8a9a5b, maxHp: 120, speed: 210, meleeDamage: 2, meleeRange: 70,  meleeIntervalTicks: secs(0.5),  dashId: 'dash', blurb: 'Touch me and regret it.' },
  { id: 'bat',      name: 'Bat',      color: 0x8e44ad, maxHp: 75,  speed: 280, meleeDamage: 2, meleeRange: 85,  meleeIntervalTicks: secs(0.5),  dashId: 'dash', blurb: 'Night hunter, future vampire.' },
  { id: 'gorilla',  name: 'Gorilla',  color: 0x4a4a58, maxHp: 125, speed: 220, meleeDamage: 3, meleeRange: 95,  meleeIntervalTicks: secs(0.6),  dashId: 'dash', blurb: 'Wide swings, wide damage.' },
  // Nowi 2026-07-20 (zastąpili kapibarę i pancernika — dublowali niedźwiedzia i jeża).
  { id: 'rat',      name: 'Rat',      color: 0xb6d94c, maxHp: 78,  speed: 270, meleeDamage: 2, meleeRange: 75,  meleeIntervalTicks: secs(0.4),  dashId: 'dash', blurb: 'Sickness on four legs.' },
  { id: 'boar',     name: 'Boar',     color: 0x9c3b1e, maxHp: 135, speed: 230, meleeDamage: 3, meleeRange: 85,  meleeIntervalTicks: secs(0.65), dashId: 'dash', blurb: 'Full speed. No brakes.' },
  { id: 'otter',    name: 'Otter',    color: 0x3fa7a0, maxHp: 95,  speed: 250, meleeDamage: 2, meleeRange: 90,  meleeIntervalTicks: secs(0.5),  dashId: 'dash', blurb: 'Keeps the team breathing.' },
  { id: 'hyena',    name: 'Hyena',    color: 0xc9a227, maxHp: 100, speed: 255, meleeDamage: 3, meleeRange: 80,  meleeIntervalTicks: secs(0.55), dashId: 'dash', blurb: 'Laughs at the wounded.' },
];

/** Klasa awaryjna — gdy id jest nieznane albo zapis jest uszkodzony. */
export const DEFAULT_CLASS_ID = CLASSES[0].id;

export function classById(id: string): ClassDef | null {
  return CLASSES.find((c) => c.id === id) ?? null;
}

/** Indeks do użytku LOKALNEGO (siatka wyboru, tablice per gracz). */
export function classIndexById(id: string): number {
  const i = CLASSES.findIndex((c) => c.id === id);
  return i >= 0 ? i : 0;
}
