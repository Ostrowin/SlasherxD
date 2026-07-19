/**
 * Seedowany, deterministyczny generator losowości (mulberry32).
 * Jedyne dozwolone źródło losowości w symulacji — Math.random() jest
 * zablokowane ESLint-em, bo rozjechałby lockstep w przyszłym co-opie.
 */
export class Rng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  /** Liczba z przedziału [0, 1). */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Liczba z przedziału [min, max). */
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
}
