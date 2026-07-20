import Phaser from 'phaser';
import { CURRENCY_NAME, META_UPGRADES, upgradeCost } from '../sim/metaConfig';
import { loadSave, resetSave, upgradeLevel, writeSave, type SaveData } from '../meta/save';
import { makeStarfield } from './textures';

/**
 * LAB — sklep meta-progresji między runami.
 * Tu wydajesz SALVAGE na trwałe ulepszenia, które działają w KAŻDYM
 * kolejnym runie. Konfiguracja (koszty, efekty, limity): src/sim/metaConfig.ts.
 */
export class MetaScene extends Phaser.Scene {
  private save!: SaveData;
  private currencyText!: Phaser.GameObjects.Text;
  private rows: {
    def: (typeof META_UPGRADES)[number];
    bg: Phaser.GameObjects.Rectangle;
    level: Phaser.GameObjects.Text;
    cost: Phaser.GameObjects.Text;
  }[] = [];
  private hint!: Phaser.GameObjects.Text;

  constructor() {
    super('meta');
  }

  create(): void {
    this.input.mouse?.disableContextMenu();
    this.save = loadSave();
    this.rows = [];
    const { width, height } = this.scale;

    makeStarfield(this, 'stars-far', 512, 260, 1337, 0.55);
    this.add.tileSprite(0, 0, width, height, 'stars-far').setOrigin(0, 0).setDepth(-3);

    this.add
      .text(width / 2, 44, 'LAB', {
        fontFamily: 'monospace',
        fontSize: '40px',
        color: '#c77dff',
      })
      .setOrigin(0.5);
    this.add
      .text(width / 2, 78, 'permanent upgrades — they work in every run', {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: '#8899aa',
      })
      .setOrigin(0.5);

    this.currencyText = this.add
      .text(width / 2, 108, '', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#ffd166',
      })
      .setOrigin(0.5);

    // Dwie kolumny po 5 wierszy.
    const colW = 380;
    const rowH = 54;
    const startX = width / 2 - colW - 12;
    const startY = 165;

    META_UPGRADES.forEach((def, i) => {
      const col = i < 5 ? 0 : 1;
      const row = i % 5;
      const x = startX + col * (colW + 24);
      const y = startY + row * rowH;
      const hex = '#' + def.color.toString(16).padStart(6, '0');

      const bg = this.add
        .rectangle(x, y, colW, rowH - 8, 0x0d1420)
        .setOrigin(0, 0.5)
        .setStrokeStyle(2, def.color, 0.7)
        .setInteractive({ useHandCursor: true });
      bg.on('pointerover', () => bg.setFillStyle(0x162032));
      bg.on('pointerout', () => bg.setFillStyle(0x0d1420));
      bg.on('pointerdown', () => this.buy(def.id));

      this.add
        .text(x + 14, y - 11, def.name, { fontFamily: 'monospace', fontSize: '16px', color: hex })
        .setOrigin(0, 0.5);
      this.add
        .text(x + 14, y + 10, def.desc + ' / level', {
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#8899aa',
        })
        .setOrigin(0, 0.5);

      const level = this.add
        .text(x + colW - 120, y, '', {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#ccddee',
        })
        .setOrigin(0.5);
      const cost = this.add
        .text(x + colW - 46, y, '', {
          fontFamily: 'monospace',
          fontSize: '15px',
          color: '#ffd166',
        })
        .setOrigin(0.5);

      this.rows.push({ def, bg, level, cost });
    });

    this.hint = this.add
      .text(width / 2, height - 62, '', {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: '#39ff14',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height - 32, 'click a row to buy   ESC / ENTER: back to class select   [X]: wipe save', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#556677',
      })
      .setOrigin(0.5);

    const kb = this.input.keyboard!;
    kb.on('keydown-ESC', () => this.scene.start('class-select'));
    kb.on('keydown-ENTER', () => this.scene.start('class-select'));
    kb.on('keydown-X', () => {
      this.save = resetSave();
      this.refresh('save wiped');
    });

    this.refresh();
  }

  private buy(id: string): void {
    const def = META_UPGRADES.find((d) => d.id === id);
    if (!def) return;
    const level = upgradeLevel(this.save, id);
    if (level >= def.maxLevel) {
      this.refresh(`${def.name} is maxed out`);
      return;
    }
    const cost = upgradeCost(def, level);
    if (this.save.currency < cost) {
      this.refresh(`not enough ${CURRENCY_NAME} for ${def.name} (need ${cost})`);
      return;
    }
    this.save.currency -= cost;
    this.save.upgrades[id] = level + 1;
    writeSave(this.save);
    this.refresh(`${def.name} → level ${level + 1}`);
  }

  private refresh(message = ''): void {
    this.currencyText.setText(`${CURRENCY_NAME}: ${this.save.currency}`);
    for (const row of this.rows) {
      const level = upgradeLevel(this.save, row.def.id);
      const maxed = level >= row.def.maxLevel;
      row.level.setText(`lv ${level}/${row.def.maxLevel}`);
      if (maxed) {
        row.cost.setText('MAX').setColor('#556677');
        row.bg.setStrokeStyle(2, 0x334455, 0.7);
      } else {
        const cost = upgradeCost(row.def, level);
        const affordable = this.save.currency >= cost;
        row.cost.setText(String(cost)).setColor(affordable ? '#ffd166' : '#7a6a3a');
        row.bg.setStrokeStyle(2, row.def.color, affordable ? 0.9 : 0.35);
      }
    }
    this.hint.setText(message);
  }
}
