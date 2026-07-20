/**
 * Mgła wojny — siatka odkrytych komórek świata.
 *
 * DLACZEGO W RENDERZE, A NIE W SYMULACJI:
 * pozycje graczy są już identyczne na wszystkich klientach (lockstep), więc
 * każdy klient wyliczy z nich dokładnie tę samą mgłę samodzielnie. Trzymanie
 * jej w symulacji tylko rozdęłoby stan i sumę kontrolną, nie dając nic w zamian.
 *
 * Odkrycie jest TRWAŁE na cały run — raz zobaczony teren zostaje na minimapie.
 */
export class FogOfWar {
  readonly cols: number;
  readonly rows: number;
  readonly cellSize: number;

  /** 0 = nieodkryte, 1 = odkryte. Uint8Array zamiast boolean[] dla pamięci. */
  private readonly explored: Uint8Array;
  /**
   * Komórki odkryte od ostatniego odczytu — minimapa dorysowuje tylko je,
   * zamiast przerysowywać całą siatkę co klatkę.
   */
  private pending: number[] = [];
  private exploredCount = 0;

  constructor(worldWidth: number, worldHeight: number, cellSize: number) {
    this.cellSize = cellSize;
    this.cols = Math.ceil(worldWidth / cellSize);
    this.rows = Math.ceil(worldHeight / cellSize);
    this.explored = new Uint8Array(this.cols * this.rows);
  }

  /** Odkrywa okrąg wokół punktu (typowo: pozycja gracza i jego pole widzenia). */
  reveal(x: number, y: number, radius: number): void {
    const minCol = Math.max(0, Math.floor((x - radius) / this.cellSize));
    const maxCol = Math.min(this.cols - 1, Math.floor((x + radius) / this.cellSize));
    const minRow = Math.max(0, Math.floor((y - radius) / this.cellSize));
    const maxRow = Math.min(this.rows - 1, Math.floor((y + radius) / this.cellSize));
    const r2 = radius * radius;

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const idx = row * this.cols + col;
        if (this.explored[idx]) continue;
        // Środek komórki w promieniu = odkryte (okrągły kształt, nie kwadratowy).
        const cx = (col + 0.5) * this.cellSize;
        const cy = (row + 0.5) * this.cellSize;
        const dx = cx - x;
        const dy = cy - y;
        if (dx * dx + dy * dy > r2) continue;
        this.explored[idx] = 1;
        this.exploredCount++;
        this.pending.push(idx);
      }
    }
  }

  /** Zwraca komórki odkryte od ostatniego wywołania i czyści kolejkę. */
  drainPending(): number[] {
    if (this.pending.length === 0) return [];
    const out = this.pending;
    this.pending = [];
    return out;
  }

  isExplored(col: number, row: number): boolean {
    if (col < 0 || row < 0 || col >= this.cols || row >= this.rows) return false;
    return this.explored[row * this.cols + col] === 1;
  }

  /** Procent odkrytej mapy — do HUD-u i statystyk runu. */
  get exploredPercent(): number {
    return (this.exploredCount / this.explored.length) * 100;
  }
}
