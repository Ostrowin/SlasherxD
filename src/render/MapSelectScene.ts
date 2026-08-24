import Phaser from 'phaser';
import { MAPS } from '../sim/maps';
import { DEFAULT_CLASS_ID } from '../sim/classes';
import { makeStarfield } from './textures';

/**
 * Ekran wyboru MAPY — po wyborze klasy. Realne areny: `station` i `crater`
 * (każda z własnym harmonogramem bossów, `maps.ts`); reszta `comingSoon`
 * (widoczna, niewybieralna). Mysz albo strzałki + Enter. Wstecz: ESC. Teksty EN.
 *
 * Przekazuje dalej `{ classId, mapId }` do sceny gry. Co-op ma własny flow
 * (lobby) i tu NIE trafia — dostaje mapę domyślną.
 */
export class MapSelectScene extends Phaser.Scene {
  private selected = 0;
  private classId = DEFAULT_CLASS_ID;
  private cards: Phaser.GameObjects.Rectangle[] = [];
  private blurbText!: Phaser.GameObjects.Text;

  constructor() {
    super('map-select');
  }

  init(data: { classId?: string }): void {
    this.classId = data.classId ?? DEFAULT_CLASS_ID;
  }

  create(): void {
    this.cards = [];
    this.input.mouse?.disableContextMenu();
    const { width, height } = this.scale;

    makeStarfield(this, 'stars-far', 512, 260, 1337, 0.55);
    this.add.tileSprite(0, 0, width, height, 'stars-far').setOrigin(0, 0).setDepth(-3);

    this.add
      .text(width / 2, height * 0.14, 'CHOOSE YOUR ARENA', {
        fontFamily: 'monospace', fontSize: '40px', color: '#39ff14',
      })
      .setOrigin(0.5);
    this.add
      .text(width / 2, height * 0.14 + 40, `playing as ${this.classId.toUpperCase()}`, {
        fontFamily: 'monospace', fontSize: '18px', color: '#8899aa',
      })
      .setOrigin(0.5);

    // Rząd kart — map jest mało, więc większe kafle w jednej linii.
    const cardW = 200;
    const cardH = 150;
    const gap = 28;
    const totalW = MAPS.length * cardW + (MAPS.length - 1) * gap;
    const startX = width / 2 - totalW / 2 + cardW / 2;
    const y = height * 0.45;

    MAPS.forEach((map, i) => {
      const x = startX + i * (cardW + gap);
      const locked = map.comingSoon === true;

      const card = this.add
        .rectangle(x, y, cardW, cardH, map.color, locked ? 0.18 : 0.5)
        .setStrokeStyle(2, 0x223355)
        .setInteractive({ useHandCursor: !locked });
      card.on('pointerover', () => this.select(i));
      card.on('pointerdown', () => this.confirm());
      this.cards.push(card);

      this.add
        .text(x, y, map.name, {
          fontFamily: 'monospace', fontSize: '16px', color: locked ? '#5a6b7a' : '#ccddee',
          align: 'center', wordWrap: { width: cardW - 20 },
        })
        .setOrigin(0.5);
      if (locked) {
        this.add
          .text(x, y + cardH / 2 - 16, 'COMING SOON', {
            fontFamily: 'monospace', fontSize: '12px', color: '#ffb703',
          })
          .setOrigin(0.5);
      }
    });

    this.blurbText = this.add
      .text(width / 2, y + cardH / 2 + 40, '', {
        fontFamily: 'monospace', fontSize: '17px', color: '#39ff14',
        align: 'center', wordWrap: { width: width * 0.8 },
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height - 40, 'arrows: select   ENTER / click: play   ESC: back to class', {
        fontFamily: 'monospace', fontSize: '14px', color: '#556677',
      })
      .setOrigin(0.5);

    const kb = this.input.keyboard!;
    kb.on('keydown-LEFT', () => this.move(-1));
    kb.on('keydown-RIGHT', () => this.move(1));
    kb.on('keydown-ENTER', () => this.confirm());
    kb.on('keydown-ESC', () => this.scene.start('class-select'));

    this.select(this.selected);
  }

  private move(delta: number): void {
    this.select((this.selected + delta + MAPS.length) % MAPS.length);
  }

  private select(i: number): void {
    this.selected = i;
    const map = MAPS[i];
    this.cards.forEach((c, j) =>
      c.setStrokeStyle(j === i ? 3 : 2, j === i ? 0xffffff : 0x223355),
    );
    this.blurbText.setText(`${map.name} — ${map.blurb}`);
  }

  private confirm(): void {
    const map = MAPS[this.selected];
    // `comingSoon` = niewybieralna: mignij podpowiedzią zamiast startować grę.
    if (map.comingSoon) {
      this.blurbText.setText(`${map.name} — locked. Coming soon!`);
      return;
    }
    this.scene.start('game', { classId: this.classId, mapId: map.id });
  }
}
