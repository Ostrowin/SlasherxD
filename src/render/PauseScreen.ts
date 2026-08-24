import Phaser from 'phaser';
import type { Player } from '../sim/world';
import { ITEM_CAPS } from '../sim/itemsConfig';
import { EQUIP_SLOTS, RARITIES } from '../sim/gearConfig';
import { sfx } from './audio';

/**
 * ═══════════════════════════════════════════════════════════════════
 *  MENU PAUZY + EKRAN STATYSTYK (Faza 5c) — otwierane ESC.
 *
 *  Pauza pokazuje pełny rozkład statów (styl Brotato) + listę założonego gearu,
 *  plus przyciski Resume / Sound / Quit. Render-only: czyta stan gracza, nic nie
 *  liczy w symulacji. Staty są zamrożone (symulacja stoi), więc budujemy je RAZ
 *  przy otwarciu i niszczymy przy zamknięciu.
 *
 *  Efektywne wartości statów z capem (armor/crit/regen/leech/thorns/cooldown)
 *  liczymy tak samo jak read-site w `world.ts`: `min(cap, baza+gear)`.
 * ═══════════════════════════════════════════════════════════════════
 */

const DEPTH = 40;
const FONT = 'monospace';

const pct = (m: number): string => `${m >= 1 ? '+' : ''}${Math.round((m - 1) * 100)}%`;
const row = (label: string, value: string): string => label.padEnd(13) + value;
const rarityHex = (r: number): string => `#${(RARITIES[r]?.color ?? 0xffffff).toString(16).padStart(6, '0')}`;

export class PauseScreen {
  private opened = false;
  private readonly backdrop: Phaser.GameObjects.Rectangle;
  /** Wszystko budowane przy otwarciu (staty, gear, przyciski) — niszczone przy zamknięciu. */
  private els: Phaser.GameObjects.GameObject[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly onQuit: () => void,
  ) {
    const W = scene.scale.width;
    const H = scene.scale.height;
    this.backdrop = scene.add.rectangle(W / 2, H / 2, W, H, 0x05070d, 0.86)
      .setScrollFactor(0).setDepth(DEPTH).setVisible(false);
  }

  isOpen(): boolean {
    return this.opened;
  }

  toggle(me: Player): void {
    if (this.opened) this.close();
    else this.open(me);
  }

  private open(me: Player): void {
    this.opened = true;
    this.backdrop.setVisible(true).setInteractive();
    this.build(me);
  }

  close(): void {
    this.opened = false;
    this.backdrop.setVisible(false).disableInteractive();
    for (const e of this.els) e.destroy();
    this.els = [];
  }

  /** Buduje zamrożony ekran: tytuł, przyciski, kolumny statów, lista gearu. */
  private build(me: Player): void {
    const W = this.scene.scale.width;
    const H = this.scene.scale.height;
    const cx = W / 2;
    const top = H / 2 - 210;

    this.text(cx, top, 'PAUSED', 24, '#dfeeff', 0.5);
    this.text(cx, top + 26, 'ESC to resume', 12, '#8fa3b8', 0.5);

    this.buildButtons(cx, top + 54);

    // Trzy kolumny: Offense, Defense/Utility/klasa/run, Gear.
    const colY = top + 96;
    const off = this.offenseLines(me);
    const def = this.defenseLines(me);
    this.text(W / 2 - 340, colY - 22, 'OFFENSE', 13, '#ff8c42', 0);
    this.text(W / 2 - 340, colY, off.join('\n'), 13, '#cfe8ff', 0, 4);
    this.text(W / 2 - 110, colY - 22, 'DEFENSE / UTILITY', 13, '#38e8ff', 0);
    this.text(W / 2 - 110, colY, def.join('\n'), 13, '#cfe8ff', 0, 4);

    this.buildGearList(me, W / 2 + 150, colY - 22);
  }

  private buildButtons(cx: number, y: number): void {
    const soundLabel = (): string => `SOUND: ${sfx.muted ? 'OFF' : 'ON'}`;
    const defs: [string, () => void][] = [
      ['RESUME', () => this.close()],
      [soundLabel(), () => { sfx.toggleMute(); }],
      ['QUIT TO MENU', () => this.onQuit()],
    ];
    const bw = 150;
    const gap = 16;
    const totalW = defs.length * bw + (defs.length - 1) * gap;
    let bx = cx - totalW / 2;
    for (const [label, onClick] of defs) {
      const isSound = label.startsWith('SOUND');
      const rect = this.scene.add.rectangle(bx, y, bw, 30, 0x111c28, 0.95)
        .setOrigin(0, 0.5).setStrokeStyle(1.5, 0x2a3a4a)
        .setScrollFactor(0).setDepth(DEPTH + 1).setInteractive({ useHandCursor: true });
      const txt = this.scene.add.text(bx + bw / 2, y, label, {
        fontFamily: FONT, fontSize: '13px', color: '#cfe8ff',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH + 2);
      rect.on('pointerover', () => rect.setFillStyle(0x1a2838, 1));
      rect.on('pointerout', () => rect.setFillStyle(0x111c28, 0.95));
      rect.on('pointerdown', () => {
        sfx.uiClick();
        onClick();
        // Relabel TYLKO przycisku dźwięku (Resume/Quit niszczą/przełączają scenę).
        if (isSound && this.opened) txt.setText(`SOUND: ${sfx.muted ? 'OFF' : 'ON'}`);
      });
      this.els.push(rect, txt);
      bx += bw + gap;
    }
  }

  private offenseLines(me: Player): string[] {
    const crit = Math.min(ITEM_CAPS.critChanceMax, me.critChance + me.gearCritChance);
    const lines = [
      row('Attack Dmg', pct(me.attackDamageMult)),
      row('Skill Power', pct(me.skillPowerMult)),
      row('Might', pct(me.damageMult)),
      row('Attack Spd', pct(me.attackSpeedMult)),
      row('Range', pct(me.rangeMult)),
      row('Crit Chance', `${Math.round(crit)}%`),
      row('Crit Dmg', `x${me.critDamageMult.toFixed(2)}`),
    ];
    if (me.projectileCountBonus > 0) lines.push(row('Projectiles', `+${me.projectileCountBonus}`));
    if (me.chainCountBonus > 0) lines.push(row('Chains', `+${me.chainCountBonus}`));
    if (me.chainDamageMult !== 1) lines.push(row('Chain Dmg', pct(me.chainDamageMult)));
    return lines;
  }

  private defenseLines(me: Player): string[] {
    const armor = Math.min(ITEM_CAPS.armorMax, me.armorFlat + me.gearArmorFlat);
    const regen = Math.min(ITEM_CAPS.regenMax, me.regenPerSec + me.gearRegen);
    const leech = Math.min(ITEM_CAPS.leechMax, me.leechHealPerKill + me.gearLeech);
    const thorns = Math.min(ITEM_CAPS.thornsMax, me.thornsDamage + me.gearThorns);
    const cdFactor = Math.max(ITEM_CAPS.minCooldownMult, me.cooldownMult * me.gearCooldownMult);
    const lines = [
      row('Max HP', `${me.cls.maxHp + me.maxHpBonus}`),
      row('Armor', `${armor}`),
      row('Regen', `${regen.toFixed(1)}/s`),
      row('Leech', `${leech.toFixed(1)}`),
      row('Thorns', `${thorns}`),
      row('Cooldown', `-${Math.round((1 - cdFactor) * 100)}%`),
      row('Move Speed', pct(me.speedMult)),
      row('Magnet', `+${me.magnetBonus}`),
      row('Knockback', pct(me.knockbackMult)),
    ];
    // Miniony — tylko dla buildów przywoływaczy (gdy cokolwiek niezerowe).
    if (me.minionDamageMult !== 1 || me.minionCountBonus > 0 || me.minionHpMult !== 1) {
      lines.push('', row('Minion Dmg', pct(me.minionDamageMult)));
      lines.push(row('Minion HP', pct(me.minionHpMult)));
      if (me.minionCountBonus > 0) lines.push(row('Minion Cnt', `+${me.minionCountBonus}`));
    }
    // Mechaniki klasowe — pokazujemy tylko gdy aktywne.
    if (me.speedToDamage > 0) lines.push(row('Spd->Dmg', me.speedToDamage.toFixed(1)));
    if (me.hpToDamage > 0) lines.push(row('HP->Dmg', me.hpToDamage.toFixed(1)));
    if (me.lostHpToDamage > 0) lines.push(row('LostHP->Dmg', me.lostHpToDamage.toFixed(1)));
    if (me.executeToDamage > 0) lines.push(row('Execute', me.executeToDamage.toFixed(1)));
    lines.push('', row('Level', `${me.level}`), row('Gold', `${me.gold}`),
      row('Kills', `${me.kills}`), row('Items', `${me.totalItemsCollected}`));
    return lines;
  }

  private buildGearList(me: Player, x: number, y: number): void {
    this.text(x, y, 'EQUIPPED', 13, '#c77dff', 0);
    EQUIP_SLOTS.forEach((slot, i) => {
      const piece = me.equipped[i];
      const ly = y + 22 + i * 16;
      const label = `${slot.label.padEnd(9)} ${piece ? piece.name : '—'}`;
      this.text(x, ly, label, 12, piece ? rarityHex(piece.rarity) : '#5a6b7a', 0);
    });
  }

  private text(x: number, y: number, s: string, size: number, color: string, originX: number, lineSpacing = 0): void {
    this.els.push(
      this.scene.add.text(x, y, s, { fontFamily: FONT, fontSize: `${size}px`, color, lineSpacing })
        .setOrigin(originX, 0).setScrollFactor(0).setDepth(DEPTH + 1),
    );
  }

  destroy(): void {
    for (const e of this.els) e.destroy();
    this.backdrop.destroy();
  }
}
