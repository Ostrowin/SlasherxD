import { TICK_RATE } from './constants';

/**
 * 10 klas-ssaków (decyzja 2026-07-19, gdd.md 5.4).
 * Na razie klasa = kolor + statystyki; drzewka umiejętności i sci-fi bronie
 * dojdą w przyszłości. Kolory zastępują grafiki (celowo — gdd.md).
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
  /** Jednozdaniowy opis roli na ekranie wyboru. */
  blurb: string;
}

const secs = (s: number) => Math.round(s * TICK_RATE);

export const CLASSES: ClassDef[] = [
  { id: 'bear',      name: 'Bear',      color: 0x8b5a2b, maxHp: 140, speed: 205, meleeDamage: 3, meleeRange: 100, meleeIntervalTicks: secs(0.7),  blurb: 'Big. Angry. Absorbs lasers.' },
  { id: 'wolf',      name: 'Wolf',      color: 0x9aa5b1, maxHp: 90,  speed: 260, meleeDamage: 2, meleeRange: 90,  meleeIntervalTicks: secs(0.4),  blurb: 'Fast strikes, pack instinct.' },
  { id: 'fox',       name: 'Fox',       color: 0xff7a29, maxHp: 80,  speed: 265, meleeDamage: 4, meleeRange: 80,  meleeIntervalTicks: secs(0.55), blurb: 'Hits rarely, hits hard.' },
  { id: 'hare',      name: 'Hare',      color: 0xf5f5f5, maxHp: 70,  speed: 300, meleeDamage: 2, meleeRange: 80,  meleeIntervalTicks: secs(0.45), blurb: 'Too fast to die. Usually.' },
  { id: 'mole',      name: 'Mole',      color: 0x5d4037, maxHp: 110, speed: 215, meleeDamage: 2, meleeRange: 85,  meleeIntervalTicks: secs(0.5),  blurb: 'Engineer of the underground.' },
  { id: 'hedgehog',  name: 'Hedgehog',  color: 0x8a9a5b, maxHp: 120, speed: 210, meleeDamage: 2, meleeRange: 70,  meleeIntervalTicks: secs(0.5),  blurb: 'Touch me and regret it.' },
  { id: 'bat',       name: 'Bat',       color: 0x8e44ad, maxHp: 75,  speed: 280, meleeDamage: 2, meleeRange: 85,  meleeIntervalTicks: secs(0.5),  blurb: 'Night hunter, future vampire.' },
  { id: 'capybara',  name: 'Capybara',  color: 0xc9a066, maxHp: 130, speed: 220, meleeDamage: 2, meleeRange: 90,  meleeIntervalTicks: secs(0.5),  blurb: 'Calm. Unbothered. Deadly.' },
  { id: 'gorilla',   name: 'Gorilla',   color: 0x4a4a58, maxHp: 125, speed: 220, meleeDamage: 3, meleeRange: 95,  meleeIntervalTicks: secs(0.6),  blurb: 'Wide swings, wide damage.' },
  { id: 'armadillo', name: 'Armadillo', color: 0xb0a08f, maxHp: 150, speed: 190, meleeDamage: 2, meleeRange: 80,  meleeIntervalTicks: secs(0.6),  blurb: 'A tank with a heartbeat.' },
];
