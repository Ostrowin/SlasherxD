import Phaser from 'phaser';
import type { Player, World } from '../sim/world';
import { SKILL_KEYS } from '../sim/skillsConfig';
import { ALPHA_PACK, PROGRESSION, xpForLevel } from '../sim/talentsConfig';
import { AURAS, STATUSES } from '../sim/statusConfig';
import { WAVE_CONFIG } from '../sim/wavesConfig';
import { ENEMIES } from '../sim/enemies';
import { BOSSES } from '../sim/bosses';
import * as C from '../sim/constants';

/**
 * ═══════════════════════════════════════════════════════════════════
 *  HUD gry — graficzny pasek w stylu LoL/Dota (moduł osobny, wzorem `Minimap`).
 *
 *  Wszystko czyta stan symulacji READ-ONLY (equipment i tak emituje komendy
 *  przez input, nie tędy), więc HUD nie może złamać determinizmu — rysuje tylko.
 *
 *  Warstwa: jeden `Graphics` przerysowywany co klatkę (paski, ikony, radiale)
 *  + pula `Text` odświeżanych wartościami. Zero alokacji w pętli gry.
 * ═══════════════════════════════════════════════════════════════════
 */

const ICON = 54;
const ICON_GAP = 8;
const HP_H = 22;
const XP_H = 6;
const DEPTH = 12;

const FONT = 'monospace';
const NEON = 0x39ff14;
const CYAN = 0x38e8ff;

/** Interpolacja koloru paska HP: zielony → żółty → czerwony wg ułamka życia. */
function hpColor(frac: number): number {
  if (frac > 0.5) return 0x39ff14; // zdrowy
  if (frac > 0.25) return 0xffd23f; // ostrzeżenie
  return 0xff2965; // krytyczny
}

interface BuffView {
  label: string;
  color: number;
  secs: number;
}

export class Hud {
  private readonly g: Phaser.GameObjects.Graphics;
  private readonly topText: Phaser.GameObjects.Text;
  private readonly hpText: Phaser.GameObjects.Text;
  private readonly levelText: Phaser.GameObjects.Text;
  private readonly resourceText: Phaser.GameObjects.Text;
  /** Rama wybranego wroga (nazwa) i tooltip skilla pod kursorem. */
  private readonly targetText: Phaser.GameObjects.Text;
  private readonly tipText: Phaser.GameObjects.Text;
  /** Odłożony tooltip do narysowania po całym HUD (żeby był na wierzchu). */
  private tip: { x: number; y: number; lines: string } | null = null;
  /** Per ikona skilla: literka klawisza + tekst środka (cooldown albo skrót). */
  private readonly keyTexts: Phaser.GameObjects.Text[] = [];
  private readonly centerTexts: Phaser.GameObjects.Text[] = [];
  /** Pula etykiet buffów (label + sekundy). */
  private readonly buffTexts: Phaser.GameObjects.Text[] = [];

  /** Klawisze slotów: Q/W/E/R + doskok pod spacją. */
  private static readonly SLOT_KEYS = [...SKILL_KEYS, 'SPC'];
  private static readonly BUFF_MAX = 6;

  constructor(scene: Phaser.Scene) {
    this.g = scene.add.graphics().setScrollFactor(0).setDepth(DEPTH);

    const mk = (size: number, color: string): Phaser.GameObjects.Text =>
      scene.add.text(0, 0, '', { fontFamily: FONT, fontSize: `${size}px`, color })
        .setScrollFactor(0)
        .setDepth(DEPTH + 1);

    this.topText = mk(15, '#cfe8ff');
    this.hpText = mk(13, '#ffffff').setOrigin(0.5);
    this.levelText = mk(15, '#0a0f16').setOrigin(0.5);
    this.resourceText = mk(11, '#cfe8ff').setOrigin(0.5);
    this.targetText = mk(13, '#ffdede').setOrigin(0.5);
    this.tipText = mk(12, '#dfeeff').setDepth(DEPTH + 2);

    // 5 ikon: Q/W/E/R + SPACE.
    for (let i = 0; i < 5; i++) {
      this.keyTexts.push(mk(11, '#9fb3c8'));
      this.centerTexts.push(mk(16, '#ffffff').setOrigin(0.5));
    }
    for (let i = 0; i < Hud.BUFF_MAX; i++) {
      this.buffTexts.push(mk(11, '#ffffff').setOrigin(0, 0.5));
    }
  }

  update(world: World, me: Player): void {
    const g = this.g;
    g.clear();
    this.tip = null;

    const W = this.g.scene.scale.width;
    const H = this.g.scene.scale.height;

    // Pasek skilli wyśrodkowany na dole; HP i XP nad nim.
    const rowW = 5 * ICON + 4 * ICON_GAP;
    const rowX = Math.round((W - rowW) / 2);
    const iconsY = H - 14 - ICON;

    const barW = rowW;
    const barX = rowX;
    const xpY = iconsY - 10 - XP_H;
    const hpY = xpY - 3 - HP_H;

    this.drawHpBar(world, me, barX, hpY, barW);
    this.drawXpBar(me, barX, xpY, barW);
    this.drawSkillBar(world, me, rowX, iconsY);
    this.drawClassResource(me, barX, hpY - 16, barW);
    this.drawBuffs(world, me, barX, hpY - 40);
    this.drawTopStrip(world, me);
    this.drawTargetFrame(world, me);
    this.drawTooltip(); // na końcu — na wierzchu całego HUD-u
  }

  /* ── Pasek HP + odznaka poziomu + pipsy tarczy ──────────────────────────── */
  private drawHpBar(world: World, me: Player, x: number, y: number, w: number): void {
    const g = this.g;
    const maxHp = world.maxHpOf(me);
    const frac = maxHp > 0 ? Math.max(0, Math.min(1, me.hp / maxHp)) : 0;

    // Tło + wypełnienie.
    g.fillStyle(0x0a0f16, 0.8).fillRoundedRect(x, y, w, HP_H, 5);
    if (frac > 0) {
      g.fillStyle(hpColor(frac), 0.95).fillRoundedRect(x + 2, y + 2, (w - 4) * frac, HP_H - 4, 4);
    }
    g.lineStyle(2, 0x1c2a3a, 1).strokeRoundedRect(x, y, w, HP_H, 5);
    this.hpText.setPosition(x + w / 2, y + HP_H / 2)
      .setText(`${Math.round(me.hp)} / ${maxHp}`);

    // Odznaka poziomu na lewo od paska.
    const badgeR = 15;
    const bx = x - badgeR - 6;
    const by = y + HP_H / 2;
    g.fillStyle(NEON, 1).fillCircle(bx, by, badgeR);
    g.lineStyle(2, 0x0a0f16, 1).strokeCircle(bx, by, badgeR);
    const maxed = me.level >= PROGRESSION.maxLevel;
    this.levelText.setPosition(bx, by).setText(maxed ? 'MX' : `${me.level}`);

    // Ładunki Overshielda jako pipsy na prawo od paska.
    const pips = me.shieldCharges;
    for (let i = 0; i < pips; i++) {
      g.fillStyle(CYAN, 0.95).fillRoundedRect(x + w + 6 + i * 12, y + 4, 8, HP_H - 8, 2);
    }
  }

  /* ── Pasek XP ───────────────────────────────────────────────────────────── */
  private drawXpBar(me: Player, x: number, y: number, w: number): void {
    const g = this.g;
    const maxed = me.level >= PROGRESSION.maxLevel;
    const need = maxed ? 1 : xpForLevel(me.level + 1);
    const frac = maxed ? 1 : Math.max(0, Math.min(1, me.xp / need));
    g.fillStyle(0x0a0f16, 0.8).fillRoundedRect(x, y, w, XP_H, 3);
    if (frac > 0) g.fillStyle(CYAN, 0.9).fillRoundedRect(x, y, w * frac, XP_H, 3);
  }

  /* ── Pasek skilli QWER + dash z radialnym cooldownem ────────────────────── */
  private drawSkillBar(world: World, me: Player, x: number, y: number): void {
    const g = this.g;
    for (let i = 0; i < 5; i++) {
      const ix = x + i * (ICON + ICON_GAP);
      const cx = ix + ICON / 2;
      const cy = y + ICON / 2;

      const isDash = i === 4;
      const has = isDash || !!me.skillIds[i];
      const def = isDash ? world.dashOf(me) : world.skillOf(me, i);

      const cd = isDash ? me.dashCooldown : me.skillCooldowns[i];
      const maxCd = isDash
        ? world.dashOf(me).cooldownTicks
        : world.skillCooldownTicksOf(me, i);
      const ready = has && cd <= 0;

      // Tło ikony.
      g.fillStyle(has ? 0x121c28 : 0x0a0f16, has ? 0.92 : 0.55)
        .fillRoundedRect(ix, y, ICON, ICON, 7);

      // Radial cooldownu: ciemny wycinek malejący, gdy skill się odnawia.
      if (has && cd > 0 && maxCd > 0) {
        const frac = Math.max(0, Math.min(1, cd / maxCd));
        g.fillStyle(0x000000, 0.6);
        g.slice(cx, cy, ICON / 2 - 2, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2, false);
        g.fillPath();
      }

      // Ramka: neon gdy gotowe, przygaszona gdy na cooldownie/pusto.
      const border = ready ? NEON : has ? 0x2a3a4a : 0x1c2430;
      g.lineStyle(ready ? 2.5 : 2, border, 1).strokeRoundedRect(ix, y, ICON, ICON, 7);

      // Literka klawisza w rogu.
      this.keyTexts[i].setPosition(ix + 5, y + 4)
        .setText(Hud.SLOT_KEYS[i])
        .setColor(ready ? '#39ff14' : '#9fb3c8')
        .setVisible(has);

      // Środek: sekundy cooldownu, albo skrót nazwy gdy gotowe.
      const center = this.centerTexts[i];
      if (!has) {
        center.setVisible(false);
      } else if (cd > 0) {
        center.setPosition(cx, cy).setText((cd * C.TICK_DT).toFixed(1)).setColor('#ffffff').setVisible(true);
      } else {
        const abbr = (def?.name ?? '').slice(0, 4).toUpperCase();
        center.setPosition(cx, cy + 6).setText(abbr).setColor('#dfeeff').setVisible(true);
      }

      // Tooltip pod kursorem: nazwa skilla + cooldown + klawisz.
      if (has && def) {
        const p = this.g.scene.input.activePointer;
        if (p.x >= ix && p.x <= ix + ICON && p.y >= y && p.y <= y + ICON) {
          const cdTxt = maxCd > 0 ? `  ·  CD ${(maxCd * C.TICK_DT).toFixed(1)}s` : '';
          this.tip = { x: cx, y, lines: `${def.name}\n[${Hud.SLOT_KEYS[i]}]${cdTxt}` };
        }
      }
    }
  }

  /* ── Zasób klasowy (Pack Instinct / transformacja / kanałowanie) ────────── */
  private drawClassResource(me: Player, x: number, y: number, w: number): void {
    const g = this.g;
    let frac = -1;
    let label = '';
    let color = NEON;

    if (me.packLeader) {
      frac = ALPHA_PACK.instinctMax > 0 ? me.packInstinct / ALPHA_PACK.instinctMax : 0;
      label = `PACK ${me.packInstinct}/${ALPHA_PACK.instinctMax}  ·  allies ${me.allyCount}`;
      color = 0xe07a5f;
    } else if (me.transformTicks > 0 && me.transformMaxTicks > 0) {
      frac = me.transformTicks / me.transformMaxTicks;
      label = `FORM ${(me.transformTicks * C.TICK_DT).toFixed(1)}s`;
      color = 0xff8c42;
    } else if (me.channelTicks > 0) {
      label = `CHANNEL ${(me.channelTicks * C.TICK_DT).toFixed(1)}s`;
      color = 0xc77dff;
      frac = 0; // bez znanego maksa — sam tekst
    }

    if (!label) {
      this.resourceText.setVisible(false);
      return;
    }
    const h = 6;
    if (frac >= 0) {
      g.fillStyle(0x0a0f16, 0.8).fillRoundedRect(x, y, w, h, 3);
      if (frac > 0) {
        g.fillStyle(color, 0.9).fillRoundedRect(x, y, w * Math.max(0, Math.min(1, frac)), h, 3);
      }
    }
    this.resourceText.setPosition(x + w / 2, y - 8).setText(label)
      .setColor(`#${color.toString(16).padStart(6, '0')}`).setVisible(true);
  }

  /* ── Pasek buffów/debuffów z timerami ───────────────────────────────────── */
  private drawBuffs(world: World, me: Player, x: number, y: number): void {
    const buffs = this.collectBuffs(world, me);
    const g = this.g;
    const size = 12;
    let bx = x;
    for (let i = 0; i < Hud.BUFF_MAX; i++) {
      const t = this.buffTexts[i];
      const b = buffs[i];
      if (!b) { t.setVisible(false); continue; }
      g.fillStyle(b.color, 0.95).fillRoundedRect(bx, y - size / 2, size, size, 3);
      const txt = `${b.label} ${b.secs.toFixed(1)}s`;
      t.setPosition(bx + size + 4, y).setText(txt).setVisible(true);
      bx += size + 6 + txt.length * 6.6 + 12;
    }
  }

  private collectBuffs(world: World, me: Player): BuffView[] {
    const out: BuffView[] = [];
    const add = (label: string, color: number, ticks: number): void => {
      if (ticks > 0 && out.length < Hud.BUFF_MAX) out.push({ label, color, secs: ticks * C.TICK_DT });
    };
    if (world.timeStopTicks > 0) add('TIME STOP', 0xffffff, world.timeStopTicks);
    add(me.transformTicks > 0 ? 'FORM' : '', 0xff8c42, me.transformTicks);
    if (me.blinkTicks > 0) add('BLINK', 0x74f7b8, me.blinkTicks);
    if (me.chainBuffTicks > 0) add(me.chainBuffName || 'CHAIN', 0xc77dff, me.chainBuffTicks);
    add(me.empowerTicks > 0 ? 'EMPOWER' : '', 0xffd23f, me.empowerTicks);
    // Aktywne aury na czas (np. PACK FURY, BLOODLUST) — pokazujemy skrót nazwy.
    for (let i = 0; i < me.auraTicks.length && out.length < Hud.BUFF_MAX; i++) {
      if (me.auraTicks[i] > 0) add(AURAS[i].name, AURAS[i].color, me.auraTicks[i]);
    }
    return out;
  }

  /* ── Górny pasek: fala, czas, mobki, kills ──────────────────────────────── */
  private drawTopStrip(world: World, me: Player): void {
    const inBreak = world.phase === 'break';
    const waveLeft = Math.max(0, world.waveTicksLeft * C.TICK_DT);
    const wave = inBreak
      ? 'BREAK — pick an upgrade'
      : `WAVE ${world.wave}/${WAVE_CONFIG.totalWaves}  ·  ${waveLeft.toFixed(0)}s`;
    const team = world.players.length > 1 ? `  ·  team ${world.livingPlayers.length}/${world.players.length}` : '';
    this.topText.setPosition(12, 10).setText(
      `${wave}  ·  mobs ${world.aliveMobs}  ·  kills ${me.kills}  ·  gold ${me.gold}${team}`,
    );
  }

  /* ── Rama wybranego wroga (focus / unit-select) ─────────────────────────── */
  private drawTargetFrame(world: World, me: Player): void {
    const idx = me.targetMob;
    const m = idx >= 0 ? world.mobs[idx] : null;
    if (!m || !m.alive) { this.targetText.setVisible(false); return; }

    const isBoss = m.bossIndex >= 0;
    const name = isBoss ? BOSSES[m.bossIndex].name : ENEMIES[m.defIndex].name;
    const color = isBoss ? BOSSES[m.bossIndex].color : ENEMIES[m.defIndex].color;
    const frac = m.maxHp > 0 ? Math.max(0, Math.min(1, m.hp / m.maxHp)) : 0;

    const g = this.g;
    const w = 220;
    const x = Math.round((this.g.scene.scale.width - w) / 2);
    const y = 44;
    const h = 14;

    this.targetText.setPosition(x + w / 2, y - 9).setText(name)
      .setColor(`#${color.toString(16).padStart(6, '0')}`).setVisible(true);

    g.fillStyle(0x05070d, 0.8).fillRoundedRect(x, y, w, h, 4);
    if (frac > 0) g.fillStyle(color, 0.9).fillRoundedRect(x + 1, y + 1, (w - 2) * frac, h - 2, 3);
    g.lineStyle(1.5, 0x1c2a3a, 1).strokeRoundedRect(x, y, w, h, 4);

    // Statusy wroga jako kropki pod paskiem.
    let dx = x + 5;
    for (const st of m.statuses) {
      if (st.defIndex < 0) continue;
      g.fillStyle(STATUSES[st.defIndex].color, 0.95).fillCircle(dx, y + h + 7, 4);
      dx += 12;
    }
  }

  /* ── Tooltip skilla (rysowany na końcu, na wierzchu) ────────────────────── */
  private drawTooltip(): void {
    const tip = this.tip;
    if (!tip) { this.tipText.setVisible(false); return; }
    const t = this.tipText.setText(tip.lines);
    const w = t.width + 14;
    const h = t.height + 10;
    const sw = this.g.scene.scale.width;
    const bx = Math.max(6, Math.min(sw - w - 6, tip.x - w / 2));
    const by = tip.y - h - 8 < 6 ? tip.y + 8 : tip.y - h - 8;
    this.g.fillStyle(0x05070d, 0.94).fillRoundedRect(bx, by, w, h, 5);
    this.g.lineStyle(1, 0x2a3a4a, 1).strokeRoundedRect(bx, by, w, h, 5);
    t.setPosition(bx + 7, by + 5).setVisible(true);
  }

  destroy(): void {
    this.g.destroy();
    this.topText.destroy();
    this.hpText.destroy();
    this.levelText.destroy();
    this.resourceText.destroy();
    this.targetText.destroy();
    this.tipText.destroy();
    for (const t of this.keyTexts) t.destroy();
    for (const t of this.centerTexts) t.destroy();
    for (const t of this.buffTexts) t.destroy();
  }
}
