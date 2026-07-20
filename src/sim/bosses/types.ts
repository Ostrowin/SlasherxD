import { TICK_RATE } from '../constants';

/**
 * ═══════════════════════════════════════════════════════════════════
 *  BOSSOWIE — jeden plik na bossa (src/sim/bosses/nazwa.ts).
 *
 *  ZASADA: prymitywy ataków żyją w symulacji (world.ts), a plik bossa jest
 *  DEKLARATYWNY — mówi tylko, jakich ataków używa, z jakimi parametrami
 *  i w jakich fazach. Dzięki temu:
 *   - nowy boss = jeden plik, zero nowego kodu w symulacji
 *   - ataki są deterministyczne z definicji, więc lockstep w co-opie działa
 *   - nowy KOD dopisujesz tylko dla naprawdę nowego typu ataku
 * ═══════════════════════════════════════════════════════════════════
 */

export const secs = (s: number): number => Math.round(s * TICK_RATE);

/** Ciężki cios w obszarze — jak młot Brute'a, tylko groźniejszy. */
export interface SlamAttack {
  kind: 'slam';
  /** Ticki zamachu — czas gracza na ucieczkę. Krótszy = trudniej. */
  windupTicks: number;
  hitRadius: number;
  damage: number;
  recoverTicks: number;
}

/** Pierścień pocisków we wszystkie strony — trzeba znaleźć lukę albo osłonę. */
export interface RingAttack {
  kind: 'ring';
  windupTicks: number;
  /** Ile pocisków w pełnym okręgu. */
  count: number;
  projectileSpeed: number;
  damage: number;
  recoverTicks: number;
}

/** Szarża w stronę gracza — telegrafowana, kończy się poślizgiem. */
export interface ChargeAttack {
  kind: 'charge';
  windupTicks: number;
  /** Prędkość w trakcie szarży (px/s). */
  speed: number;
  durationTicks: number;
  damage: number;
  hitRadius: number;
  recoverTicks: number;
}

/** Przyzwanie pomocników — indeks typu z ENEMIES. */
export interface SummonAttack {
  kind: 'summon';
  windupTicks: number;
  enemyId: string;
  count: number;
  recoverTicks: number;
}

export type BossAttack = SlamAttack | RingAttack | ChargeAttack | SummonAttack;

/**
 * Faza walki. Boss przechodzi do kolejnej fazy, gdy jego HP spadnie poniżej
 * progu — wtedy zmienia zestaw ataków (klasyczne „boss się wkurza").
 */
export interface BossPhase {
  /** Wchodzi w tę fazę, gdy HP <= tego ułamka maksimum (1 = od początku). */
  hpFraction: number;
  /** Nazwa fazy pokazywana graczowi przy przejściu (EN — teksty w grze). */
  announce: string;
  /** Cykl ataków wykonywany po kolei w kółko. */
  attacks: BossAttack[];
  /** Przerwa między atakami w tej fazie. */
  attackIntervalTicks: number;
  /** Mnożnik prędkości ruchu w tej fazie. */
  speedMult: number;
}

export interface BossDef {
  id: string;
  /** Nazwa nad paskiem HP. */
  name: string;
  color: number;
  /**
   * Liczba boków sylwetki — każdy boss ma rozpoznawalny kształt.
   * Im mniej boków, tym ostrzejszy i szybszy wygląda; 10+ to „masywny".
   */
  shapeSides: number;
  hp: number;
  radius: number;
  /** Bazowa prędkość ruchu (px/s); fazy mogą ją mnożyć. */
  speed: number;
  contactDamage: number;
  /** Fazy od najsilniejszej (hpFraction 1) do najsłabszej. */
  phases: BossPhase[];
}
