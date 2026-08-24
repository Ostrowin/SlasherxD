import Phaser from 'phaser';

/**
 * Floating liczby obrażeń nad wrogami. Pool o stałym rozmiarze (zero alokacji
 * w pętli), sterowany ręcznie licznikiem czasu życia — bez tweenów, żeby recykling
 * slotu nie wymagał zabijania wiszącego tweena.
 *
 * To render-only: liczby liczymy z DELTY HP wroga między klatkami (`GameScene`),
 * nie z symulacji — więc nie dotyka determinizmu.
 */
export class DamageNumbers {
  private readonly texts: Phaser.GameObjects.Text[] = [];
  private readonly ttl: number[] = [];
  private static readonly MAX_TTL = 620; // ms
  private static readonly RISE = 0.05; // px/ms w górę
  /** Rotacja slotów, gdy pool pełny; też deterministyczny jitter X (bez Math.random). */
  private cursor = 0;

  constructor(scene: Phaser.Scene, poolSize = 48) {
    for (let i = 0; i < poolSize; i++) {
      this.texts.push(
        scene.add.text(0, 0, '', {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#ffffff',
          stroke: '#05070d',
          strokeThickness: 3,
        }).setOrigin(0.5).setDepth(6).setVisible(false),
      );
      this.ttl.push(0);
    }
  }

  spawn(x: number, y: number, amount: number): void {
    const v = Math.max(1, Math.round(amount));
    let slot = this.ttl.findIndex((t) => t <= 0);
    if (slot < 0) slot = this.cursor % this.texts.length; // pool pełny → nadpisz najstarszy w rotacji
    const jitter = ((this.cursor % 5) - 2) * 7; // rozrzut X, żeby liczby się nie zlewały
    this.cursor++;

    const big = v >= 30;
    const t = this.texts[slot];
    t.setText(`${v}`)
      .setFontSize(big ? 19 : 14)
      .setColor(big ? '#ffd23f' : '#ffffff')
      .setPosition(x + jitter, y - 20)
      .setAlpha(1)
      .setVisible(true);
    this.ttl[slot] = DamageNumbers.MAX_TTL;
  }

  update(dtMs: number): void {
    for (let i = 0; i < this.texts.length; i++) {
      if (this.ttl[i] <= 0) continue;
      this.ttl[i] -= dtMs;
      const t = this.texts[i];
      t.y -= DamageNumbers.RISE * dtMs;
      t.setAlpha(Math.max(0, this.ttl[i] / DamageNumbers.MAX_TTL));
      if (this.ttl[i] <= 0) t.setVisible(false);
    }
  }

  destroy(): void {
    for (const t of this.texts) t.destroy();
  }
}
