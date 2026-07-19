import Phaser from 'phaser';
import { CLASSES } from '../sim/classes';

/**
 * Ekran wyboru klasy: 10 ssaków jako kolorowe kwadraty (bez grafik — decyzja
 * 2026-07-19). Wybór myszą albo strzałkami + Enter. Teksty w grze: EN.
 */
export class ClassSelectScene extends Phaser.Scene {
  private selected = 0;
  private cards: Phaser.GameObjects.Rectangle[] = [];
  private blurbText!: Phaser.GameObjects.Text;

  constructor() {
    super('class-select');
  }

  create(): void {
    this.selected = 0;
    this.cards = [];
    this.input.mouse?.disableContextMenu();
    const { width, height } = this.scale;

    this.add
      .text(width / 2, height * 0.12, 'WEBSLASHER', {
        fontFamily: 'monospace', fontSize: '48px', color: '#39ff14',
      })
      .setOrigin(0.5);
    this.add
      .text(width / 2, height * 0.12 + 44, 'choose your fighter', {
        fontFamily: 'monospace', fontSize: '20px', color: '#8899aa',
      })
      .setOrigin(0.5);

    // Siatka 5x2.
    const cols = 5;
    const cellW = 150;
    const cellH = 130;
    const gridW = cols * cellW;
    const startX = width / 2 - gridW / 2 + cellW / 2;
    const startY = height * 0.38;

    CLASSES.forEach((cls, i) => {
      const x = startX + (i % cols) * cellW;
      const y = startY + Math.floor(i / cols) * cellH;

      const card = this.add
        .rectangle(x, y, 56, 56, cls.color)
        .setStrokeStyle(2, 0x223355)
        .setInteractive({ useHandCursor: true });
      card.on('pointerover', () => this.select(i));
      card.on('pointerdown', () => this.confirm());
      this.cards.push(card);

      this.add
        .text(x, y + 48, cls.name, {
          fontFamily: 'monospace', fontSize: '15px', color: '#ccddee',
        })
        .setOrigin(0.5);
    });

    this.blurbText = this.add
      .text(width / 2, startY + 2 * cellH + 20, '', {
        fontFamily: 'monospace', fontSize: '17px', color: '#39ff14',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height - 40, 'arrows: select   ENTER / click: play', {
        fontFamily: 'monospace', fontSize: '14px', color: '#556677',
      })
      .setOrigin(0.5);

    const kb = this.input.keyboard!;
    kb.on('keydown-LEFT', () => this.move(-1));
    kb.on('keydown-RIGHT', () => this.move(1));
    kb.on('keydown-UP', () => this.move(-5));
    kb.on('keydown-DOWN', () => this.move(5));
    kb.on('keydown-ENTER', () => this.confirm());

    this.select(0);
  }

  private move(delta: number): void {
    this.select((this.selected + delta + CLASSES.length) % CLASSES.length);
  }

  private select(i: number): void {
    this.selected = i;
    const cls = CLASSES[i];
    this.cards.forEach((c, j) =>
      c.setStrokeStyle(j === i ? 3 : 2, j === i ? 0xffffff : 0x223355),
    );
    this.blurbText.setText(
      `${cls.name} — ${cls.blurb}   [HP ${cls.maxHp} | SPD ${cls.speed} | DMG ${cls.meleeDamage}]`,
    );
  }

  private confirm(): void {
    this.scene.start('game', { classIndex: this.selected });
  }
}
