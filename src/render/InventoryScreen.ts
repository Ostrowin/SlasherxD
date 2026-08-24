import Phaser from 'phaser';
import type { Player } from '../sim/world';
import type { ItemKind } from '../sim/itemsConfig';
import { EQUIP_SLOTS, BAG_CAP, RARITIES, SELL_VALUE, legendaryById, type GearPiece } from '../sim/gearConfig';

/**
 * ═══════════════════════════════════════════════════════════════════
 *  EKRAN EKWIPUNKU (Faza 5b) — overlay otwierany klawiszem, zarządzany w PRZERWIE.
 *
 *  11 slotów + siatka plecaka. Klik w część plecaka → equip (auto-route),
 *  klik w slot → unequip. Klik tylko USTAWIA pending w GameScene; sama komenda
 *  idzie strumieniem inputu i działa wyłącznie w `break` (handleGearCommands),
 *  więc poza przerwą ekran jest podglądem (hint to mówi).
 *
 *  To render-only: czyta `me.equipped`/`me.bag`, nie dotyka symulacji.
 *  Struktura (interaktywne prostokąty) przebudowuje się TYLKO gdy zmieni się
 *  zawartość (sygnatura id) — nie co klatkę.
 * ═══════════════════════════════════════════════════════════════════
 */

const DEPTH = 30;
const FONT = 'monospace';
const EMPTY = 0x2a3644;

const AFFIX_NAME: Record<ItemKind, string> = {
  medkit: 'HEAL', armor: 'ARM', speed: 'SPD', attackSpeed: 'ASPD', range: 'RNG',
  strength: 'STR', attackDamage: 'ATK', skillPower: 'SKILL', overshield: 'SHLD',
  regen: 'REG', maxHp: 'HP', cooldown: 'CDR', leech: 'LCH', magnet: 'MAG',
  knockback: 'KB', thorns: 'THN', critChance: 'CRIT', critDamage: 'CDMG',
  raiseDead: 'RAISE', minionDamage: 'M.DMG', minionHp: 'M.HP', minionCount: 'M.CNT',
  minionDuration: 'M.DUR', impactRadius: 'IMP', projectileCount: 'PROJ',
  chainCount: 'CHAIN', chainDamage: 'C.DMG', drainTargets: 'DRAIN', summonCount: 'SUM',
};
const AFFIX_PERCENT = new Set<ItemKind>([
  'strength', 'attackDamage', 'skillPower', 'attackSpeed', 'range',
  'critDamage', 'knockback', 'speed', 'cooldown', 'critChance',
]);

function affixLine(kind: ItemKind, value: number): string {
  const nm = AFFIX_NAME[kind] ?? kind;
  return AFFIX_PERCENT.has(kind) ? `${nm} +${value}%` : `${nm} +${value}`;
}

const rarityHex = (r: number): string => `#${(RARITIES[r]?.color ?? 0xffffff).toString(16).padStart(6, '0')}`;

export class InventoryScreen {
  private opened = false;
  private sig = '';
  private hover: { kind: 'slot' | 'bag'; index: number } | null = null;

  private readonly backdrop: Phaser.GameObjects.Rectangle;
  private readonly panel: Phaser.GameObjects.Rectangle;
  private readonly title: Phaser.GameObjects.Text;
  private readonly hint: Phaser.GameObjects.Text;
  private readonly tipG: Phaser.GameObjects.Graphics;
  private readonly tipText: Phaser.GameObjects.Text;
  /** Interaktywne kafle + etykiety — niszczone/odtwarzane przy zmianie zawartości. */
  private cells: (Phaser.GameObjects.Rectangle | Phaser.GameObjects.Text)[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly onEquip: (bagIndex: number) => void,
    private readonly onUnequip: (slotIndex: number) => void,
    private readonly onDrop: (bagIndex: number) => void,
  ) {
    const W = scene.scale.width;
    const H = scene.scale.height;
    // Backdrop startuje NIE-interaktywny: niewidzialny, ale wciąż interaktywny
    // obiekt łykałby kliknięcia w grze (Phaser nie wyłącza inputu przez setVisible).
    this.backdrop = scene.add.rectangle(W / 2, H / 2, W, H, 0x05070d, 0.82)
      .setScrollFactor(0).setDepth(DEPTH).setVisible(false);
    this.panel = scene.add.rectangle(W / 2, H / 2, 780, 460, 0x0a1220, 0.98)
      .setStrokeStyle(2, 0x2a3a4a).setScrollFactor(0).setDepth(DEPTH + 1).setVisible(false);
    this.title = scene.add.text(W / 2, H / 2 - 210, 'EQUIPMENT', {
      fontFamily: FONT, fontSize: '20px', color: '#dfeeff',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH + 2).setVisible(false);
    this.hint = scene.add.text(W / 2, H / 2 + 214, '', {
      fontFamily: FONT, fontSize: '13px', color: '#8fa3b8',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH + 2).setVisible(false);
    this.tipG = scene.add.graphics().setScrollFactor(0).setDepth(DEPTH + 4).setVisible(false);
    this.tipText = scene.add.text(0, 0, '', {
      fontFamily: FONT, fontSize: '12px', color: '#dfeeff', lineSpacing: 2,
    }).setScrollFactor(0).setDepth(DEPTH + 5).setVisible(false);
  }

  isOpen(): boolean {
    return this.opened;
  }

  toggle(): void {
    if (this.opened) this.hide();
    else { this.opened = true; this.sig = ''; this.backdrop.setInteractive(); }
  }

  private hide(): void {
    this.opened = false;
    this.hover = null;
    this.backdrop.disableInteractive();
    for (const o of [this.backdrop, this.panel, this.title, this.hint, this.tipG, this.tipText]) {
      o.setVisible(false);
    }
    // Niszczymy kafle (interaktywne) — inaczej niewidoczne łykałyby kliknięcia.
    for (const c of this.cells) c.destroy();
    this.cells = [];
    this.sig = '';
  }

  update(me: Player): void {
    if (!this.opened) return;
    for (const o of [this.backdrop, this.panel, this.title, this.hint]) o.setVisible(true);

    const sig = me.equipped.map((p) => (p ? p.id : 0)).join(',') + '|' +
      me.bag.map((p) => (p ? p.id : 0)).join(',');
    if (sig !== this.sig) {
      this.rebuild(me);
      this.sig = sig;
    }

    this.hint.setText('BAG: L-click equip · R-click SELL · SLOT: click unequip · [I] close');
    this.drawTooltip(me);
  }

  /** Odtwarza kafle slotów i plecaka wraz z interakcją (tylko przy zmianie zawartości). */
  private rebuild(me: Player): void {
    for (const c of this.cells) c.destroy();
    this.cells = [];

    const W = this.scene.scale.width;
    const H = this.scene.scale.height;
    const left = W / 2 - 360;
    const top = H / 2 - 168;

    // ── Sloty ekwipunku (lewa kolumna) ──
    const rowW = 300;
    const rowH = 26;
    const rowGap = 4;
    EQUIP_SLOTS.forEach((slot, i) => {
      const y = top + i * (rowH + rowGap);
      const piece = me.equipped[i];
      this.makeCell(left, y, rowW, rowH, 'slot', i, piece,
        `${slot.label}: ${piece ? piece.name : '—'}`,
        () => { if (piece) this.onUnequip(i); });
    });

    // ── Plecak (prawa siatka 6×4) — cw dobrane tak, by ostatnia kolumna
    //    mieściła się w panelu (780 szer.): 6×52 + 5×6 = 342 < prawa połowa. ──
    const bagX = W / 2 + 30;
    const cols = 6;
    const cw = 52;
    const ch = 40;
    const cg = 6;
    for (let i = 0; i < BAG_CAP; i++) {
      const cxi = i % cols;
      const cyi = Math.floor(i / cols);
      const x = bagX + cxi * (cw + cg);
      const y = top + cyi * (ch + cg);
      const piece = me.bag[i];
      const label = piece ? this.slotAbbrev(piece) : '';
      // L-klik: załóż. P-klik: wyrzuć (zwolnij miejsce — inaczej pełny plecak
      // blokuje podniesienie legendarki z bossa).
      this.makeCell(x, y, cw, ch, 'bag', i, piece, label,
        () => { if (piece) this.onEquip(i); }, true,
        () => { if (piece) this.onDrop(i); });
    }

    // Nagłówek plecaka.
    this.cells.push(
      this.scene.add.text(bagX, top - 22, 'BAG', {
        fontFamily: FONT, fontSize: '13px', color: '#8fa3b8',
      }).setScrollFactor(0).setDepth(DEPTH + 2),
    );
  }

  /** Pojedynczy kafel: prostokąt (interaktywny) + etykieta; hover ustawia tooltip. */
  private makeCell(
    x: number, y: number, w: number, h: number,
    kind: 'slot' | 'bag', index: number, piece: GearPiece | null,
    label: string, onClick: () => void, centerLabel = false,
    onRightClick?: () => void,
  ): void {
    const color = piece ? RARITIES[piece.rarity].color : EMPTY;
    const rect = this.scene.add.rectangle(x, y, w, h, 0x111c28, piece ? 0.95 : 0.5)
      .setOrigin(0, 0)
      .setStrokeStyle(1.5, color)
      .setScrollFactor(0)
      .setDepth(DEPTH + 2)
      .setInteractive({ useHandCursor: !!piece });
    rect.on('pointerover', () => {
      rect.setFillStyle(0x1a2838, 1);
      this.hover = piece ? { kind, index } : null;
    });
    rect.on('pointerout', () => {
      rect.setFillStyle(0x111c28, piece ? 0.95 : 0.5);
      if (this.hover && this.hover.kind === kind && this.hover.index === index) this.hover = null;
    });
    rect.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (onRightClick && pointer.rightButtonDown()) onRightClick();
      else onClick();
    });
    this.cells.push(rect);

    const txt = this.scene.add.text(
      centerLabel ? x + w / 2 : x + 8, y + h / 2, label,
      { fontFamily: FONT, fontSize: '12px', color: piece ? rarityHex(piece.rarity) : '#5a6b7a' },
    ).setOrigin(centerLabel ? 0.5 : 0, 0.5).setScrollFactor(0).setDepth(DEPTH + 3);
    this.cells.push(txt);
  }

  /** Krótki znacznik typu części w kaflu plecaka (np. „WPN", „RING"). */
  private slotAbbrev(piece: GearPiece): string {
    const map: Record<string, string> = {
      weapon: piece.twoHanded ? '2H' : 'WPN', offhand: 'OFF', head: 'HEAD', body: 'BODY',
      legs: 'LEGS', ring: 'RING', amulet: 'AMU', boots: 'BOOT', gloves: 'GLV', belt: 'BELT',
    };
    return map[piece.slotType] ?? '?';
  }

  /** Tooltip afixów części pod kursorem (nazwa w kolorze rarity + lista afixów). */
  private drawTooltip(me: Player): void {
    const h = this.hover;
    const piece = h ? (h.kind === 'slot' ? me.equipped[h.index] : me.bag[h.index]) : null;
    if (!piece) { this.tipG.setVisible(false); this.tipText.setVisible(false); return; }

    const lines = [piece.name, ...piece.affixes.map((a) => affixLine(a.kind, a.value))];
    // Legendarka: dopisz jej UNIKALNY efekt (to jest jej sedno, nie afixy).
    const leg = piece.unique ? legendaryById(piece.unique) : null;
    if (leg) lines.push('* ' + leg.effect);
    if (piece.slotType === 'weapon') lines.push(piece.twoHanded ? '(two-handed)' : '(one-handed)');
    if (h?.kind === 'bag') lines.push(`R-click: SELL for ${SELL_VALUE[piece.rarity] ?? 0} gold`);
    this.tipText.setText(lines.join('\n')).setColor('#dfeeff');

    const p = this.scene.input.activePointer;
    const tw = this.tipText.width + 16;
    const th = this.tipText.height + 12;
    const sw = this.scene.scale.width;
    const sh = this.scene.scale.height;
    const bx = Math.max(6, Math.min(sw - tw - 6, p.x + 14));
    const by = Math.max(6, Math.min(sh - th - 6, p.y + 14));

    this.tipG.clear();
    this.tipG.fillStyle(0x05070d, 0.96).fillRoundedRect(bx, by, tw, th, 5);
    this.tipG.lineStyle(1.5, RARITIES[piece.rarity].color, 1).strokeRoundedRect(bx, by, tw, th, 5);
    this.tipG.setVisible(true);
    // Pierwsza linia (nazwa) w kolorze rarity — reszta jasna; prosto: cała w rarity.
    this.tipText.setPosition(bx + 8, by + 6).setColor(rarityHex(piece.rarity)).setVisible(true);
  }

  destroy(): void {
    for (const c of this.cells) c.destroy();
    for (const o of [this.backdrop, this.panel, this.title, this.hint, this.tipG, this.tipText]) {
      o.destroy();
    }
  }
}
