import Phaser from 'phaser';
import type { Player } from '../sim/world';
import { SHOP_REROLL_COST } from '../sim/gearConfig';

/**
 * ═══════════════════════════════════════════════════════════════════
 *  SKLEP RUNOWY (Faza S2, przebudowa) — PEŁNOEKRANOWY overlay w przerwie.
 *
 *  Otwierany klawiszem `B` (tylko w `break`). Pokazuje ofertę (`Player.shopOffers`)
 *  jako karty, kupno klikiem, reroll za złoto. Klik USTAWIA pending w GameScene;
 *  komenda idzie strumieniem inputu i działa w `stepBreak` (handleShop).
 *
 *  Gdy zamknięty a jest przerwa — pokazuje mały prompt „[B] SHOP". Karty
 *  (interaktywne) przebudowują się TYLKO gdy zmieni się oferta/złoto; przy
 *  zamknięciu są NISZCZONE (niewidoczny interaktywny obiekt łykałby kliknięcia).
 * ═══════════════════════════════════════════════════════════════════
 */

const DEPTH = 32;
const FONT = 'monospace';

export class ShopPanel {
  private opened = false;
  private sig = '';
  private readonly backdrop: Phaser.GameObjects.Rectangle;
  private readonly panel: Phaser.GameObjects.Rectangle;
  private readonly title: Phaser.GameObjects.Text;
  private readonly hint: Phaser.GameObjects.Text;
  /** Mały prompt na dole w przerwie, gdy sklep zamknięty. */
  private readonly prompt: Phaser.GameObjects.Text;
  private cells: (Phaser.GameObjects.Rectangle | Phaser.GameObjects.Text)[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly onBuy: (index: number) => void,
    private readonly onReroll: () => void,
  ) {
    const W = scene.scale.width;
    const H = scene.scale.height;
    this.backdrop = scene.add.rectangle(W / 2, H / 2, W, H, 0x05070d, 0.85)
      .setScrollFactor(0).setDepth(DEPTH).setVisible(false);
    this.panel = scene.add.rectangle(W / 2, H / 2, 800, 420, 0x0a1220, 0.98)
      .setStrokeStyle(2, 0xffd166).setScrollFactor(0).setDepth(DEPTH + 1).setVisible(false);
    this.title = scene.add.text(W / 2, H / 2 - 175, '', {
      fontFamily: FONT, fontSize: '22px', color: '#ffd166',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH + 2).setVisible(false);
    this.hint = scene.add.text(W / 2, H / 2 + 180, 'click to buy · [B] / [ESC] close', {
      fontFamily: FONT, fontSize: '13px', color: '#8fa3b8',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH + 2).setVisible(false);
    this.prompt = scene.add.text(W / 2, H - 176, '', {
      fontFamily: FONT, fontSize: '15px', color: '#ffd166',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(14).setVisible(false);
  }

  isOpen(): boolean {
    return this.opened;
  }

  /** Otwiera/zamyka (wołane z GameScene na klawisz B — tylko w przerwie). */
  toggle(): void {
    if (this.opened) this.close();
    else { this.opened = true; this.sig = ''; this.backdrop.setInteractive(); }
  }

  close(): void {
    this.opened = false;
    this.backdrop.disableInteractive();
    for (const o of [this.backdrop, this.panel, this.title, this.hint]) o.setVisible(false);
    for (const c of this.cells) c.destroy();
    this.cells = [];
    this.sig = '';
  }

  update(me: Player, inBreak: boolean): void {
    // Sklep żyje tylko w przerwie — koniec przerwy zamyka go automatycznie.
    if (!inBreak) {
      if (this.opened) this.close();
      this.prompt.setVisible(false);
      return;
    }
    // Zamknięty w przerwie: mały prompt zachęcający do otwarcia.
    if (!this.opened) {
      this.prompt.setText(`[B] SHOP  ·  gold ${me.gold}`).setVisible(true);
      return;
    }
    this.prompt.setVisible(false);
    for (const o of [this.backdrop, this.panel, this.title, this.hint]) o.setVisible(true);
    this.title.setText(`SHOP   ·   gold ${me.gold}`);

    const sig = me.shopOffers.map((o) => `${o.label}:${o.sold ? 1 : 0}:${o.price}`).join(',') + `|${me.gold}`;
    if (sig !== this.sig) {
      this.rebuild(me);
      this.sig = sig;
    }
  }

  private rebuild(me: Player): void {
    for (const c of this.cells) c.destroy();
    this.cells = [];
    const W = this.scene.scale.width;
    const H = this.scene.scale.height;

    const n = me.shopOffers.length;
    const cardW = 168;
    const cardH = 210;
    const gap = 18;
    const totalW = n * cardW + (n - 1) * gap;
    const startX = W / 2 - totalW / 2;
    const y = H / 2 - cardH / 2 - 10;

    me.shopOffers.forEach((o, i) => {
      const x = startX + i * (cardW + gap);
      const affordable = !o.sold && me.gold >= o.price;
      const hex = `#${o.color.toString(16).padStart(6, '0')}`;

      const rect = this.scene.add.rectangle(x, y, cardW, cardH, 0x0d1420, 0.97)
        .setOrigin(0, 0).setStrokeStyle(2, affordable ? o.color : 0x2a3644)
        .setScrollFactor(0).setDepth(DEPTH + 2);
      if (affordable) {
        rect.setInteractive({ useHandCursor: true });
        rect.on('pointerover', () => rect.setFillStyle(0x162032, 1));
        rect.on('pointerout', () => rect.setFillStyle(0x0d1420, 0.97));
        rect.on('pointerdown', () => this.onBuy(i));
      }
      this.cells.push(rect);

      // Typ (GEAR / BOOST) u góry.
      this.cells.push(this.scene.add.text(x + cardW / 2, y + 16,
        o.kind === 'gear' ? 'GEAR' : 'BOOST',
        { fontFamily: FONT, fontSize: '11px', color: '#6a7b8a' })
        .setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH + 3));
      // Nazwa (kolor rarity/upgrade'u), zawijana.
      this.cells.push(this.scene.add.text(x + cardW / 2, y + cardH / 2 - 10, o.label,
        { fontFamily: FONT, fontSize: '15px', color: affordable ? hex : '#5a6b7a',
          align: 'center', wordWrap: { width: cardW - 20 } })
        .setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH + 3));
      // Cena / SOLD.
      this.cells.push(this.scene.add.text(x + cardW / 2, y + cardH - 22,
        o.sold ? 'SOLD' : `${o.price} gold`,
        { fontFamily: FONT, fontSize: '14px', color: o.sold ? '#5a6b7a' : (affordable ? '#ffd166' : '#7a5a2a') })
        .setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH + 3));
    });

    // Reroll — pod kartami, wyśrodkowany.
    const canReroll = me.gold >= SHOP_REROLL_COST;
    const rw = 200;
    const ry = y + cardH + 18;
    const rrect = this.scene.add.rectangle(W / 2 - rw / 2, ry, rw, 34, 0x0d1420, 0.97)
      .setOrigin(0, 0).setStrokeStyle(2, canReroll ? 0x9aa5b1 : 0x2a3644)
      .setScrollFactor(0).setDepth(DEPTH + 2);
    if (canReroll) {
      rrect.setInteractive({ useHandCursor: true });
      rrect.on('pointerover', () => rrect.setFillStyle(0x162032, 1));
      rrect.on('pointerout', () => rrect.setFillStyle(0x0d1420, 0.97));
      rrect.on('pointerdown', () => this.onReroll());
    }
    this.cells.push(rrect);
    this.cells.push(this.scene.add.text(W / 2, ry + 17, `REROLL   ${SHOP_REROLL_COST} gold`,
      { fontFamily: FONT, fontSize: '13px', color: canReroll ? '#cfe8ff' : '#5a6b7a' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH + 3));
  }

  destroy(): void {
    for (const c of this.cells) c.destroy();
    for (const o of [this.backdrop, this.panel, this.title, this.hint, this.prompt]) o.destroy();
  }
}
