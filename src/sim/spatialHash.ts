import { HASH_CELL_SIZE } from './constants';

/**
 * Prosty spatial hash odbudowywany co tick.
 * Zamienia kolizje O(n²) na sprawdzanie tylko sąsiednich komórek —
 * warunek bramki wydajności "setki mobków @ 60 FPS".
 */
export class SpatialHash {
  private cells = new Map<number, number[]>();

  private key(x: number, y: number): number {
    const cx = Math.floor(x / HASH_CELL_SIZE);
    const cy = Math.floor(y / HASH_CELL_SIZE);
    // Klucz liczbowy (szybszy niż string); +32768 usuwa ujemne współrzędne.
    return (cx + 32768) * 65536 + (cy + 32768);
  }

  clear(): void {
    this.cells.clear();
  }

  insert(index: number, x: number, y: number): void {
    const k = this.key(x, y);
    const cell = this.cells.get(k);
    if (cell) cell.push(index);
    else this.cells.set(k, [index]);
  }

  /**
   * Wywołuje callback dla każdego indeksu w komórkach przecinających
   * kwadrat o boku 2*radius wokół (x, y). Callback musi sam sprawdzić dystans.
   */
  forEachNear(x: number, y: number, radius: number, cb: (index: number) => void): void {
    const minCx = Math.floor((x - radius) / HASH_CELL_SIZE);
    const maxCx = Math.floor((x + radius) / HASH_CELL_SIZE);
    const minCy = Math.floor((y - radius) / HASH_CELL_SIZE);
    const maxCy = Math.floor((y + radius) / HASH_CELL_SIZE);
    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const cell = this.cells.get((cx + 32768) * 65536 + (cy + 32768));
        if (!cell) continue;
        for (let i = 0; i < cell.length; i++) cb(cell[i]);
      }
    }
  }
}
