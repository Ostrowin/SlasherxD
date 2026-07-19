import Phaser from 'phaser';
import { World, type SimInput } from '../sim/world';
import { CLASSES, type ClassDef } from '../sim/classes';
import { ENEMIES } from '../sim/enemies';
import * as C from '../sim/constants';

/**
 * Warstwa renderowania: rysuje stan World i próbkuje klawiaturę do SimInput.
 * Nie zawiera żadnej logiki gry — patrz diagram w src/sim/world.ts.
 * Render działa w FPS przeglądarki, symulacja w stałych tickach;
 * pozycje między tickami są interpolowane (alpha = accumulator / TICK_DT).
 * Grafika: białe tekstury + tint kolorem klasy/wroga (bez sprite'ów — decyzja 2026-07-19).
 */
export class GameScene extends Phaser.Scene {
  private world!: World;
  private cls!: ClassDef;
  private accumulator = 0;

  private playerSprite!: Phaser.GameObjects.Image;
  private mobSprites: Phaser.GameObjects.Image[] = [];
  private projectileSprites: Phaser.GameObjects.Image[] = [];
  private meleeRing!: Phaser.GameObjects.Arc;
  private lastSeenMeleeTick = -1;
  private skillCone!: Phaser.GameObjects.Graphics;
  private lastSeenSkillTick = -1;

  private hud!: Phaser.GameObjects.Text;
  private deathText!: Phaser.GameObjects.Text;
  private lastSeenHp = 0;

  private keys!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    w: Phaser.Input.Keyboard.Key;
    s: Phaser.Input.Keyboard.Key;
    a: Phaser.Input.Keyboard.Key;
    d: Phaser.Input.Keyboard.Key;
    m: Phaser.Input.Keyboard.Key;
    r: Phaser.Input.Keyboard.Key;
    c: Phaser.Input.Keyboard.Key;
    space: Phaser.Input.Keyboard.Key;
  };

  constructor() {
    super('game');
  }

  init(data: { classIndex?: number }): void {
    this.cls = CLASSES[data.classIndex ?? 0];
  }

  create(): void {
    // Seed spoza symulacji — w co-opie (1-8 graczy) seed rozda host.
    this.world = new World(Date.now() >>> 0, this.cls);
    this.accumulator = 0;
    this.lastSeenMeleeTick = -1;
    this.lastSeenHp = this.cls.maxHp;
    this.mobSprites = [];
    this.projectileSprites = [];

    this.createTextures();
    this.add.tileSprite(0, 0, C.WORLD_W, C.WORLD_H, 'grid').setOrigin(0, 0).setAlpha(0.35);

    this.meleeRing = this.add
      .circle(0, 0, this.cls.meleeRange, 0x39ff14, 0)
      .setStrokeStyle(3, this.cls.color, 1)
      .setVisible(false);
    this.skillCone = this.add.graphics().setDepth(5);

    this.playerSprite = this.add
      .image(this.world.playerX, this.world.playerY, 'box-player')
      .setTint(this.cls.color);
    for (let i = 0; i < C.MOB_CAP; i++) {
      this.mobSprites.push(this.add.image(0, 0, 'box-mob').setVisible(false));
    }
    for (let i = 0; i < C.PROJECTILE_CAP; i++) {
      this.projectileSprites.push(this.add.image(0, 0, 'projectile').setVisible(false));
    }

    const cam = this.cameras.main;
    cam.setBounds(0, 0, C.WORLD_W, C.WORLD_H);
    cam.startFollow(this.playerSprite, false, 0.15, 0.15);

    this.hud = this.add
      .text(12, 10, '', { fontFamily: 'monospace', fontSize: '16px', color: '#39ff14' })
      .setScrollFactor(0)
      .setDepth(10);

    this.deathText = this.add
      .text(0, 0, 'YOU DIED\nR: retry   C: change class', {
        fontFamily: 'monospace',
        fontSize: '42px',
        color: '#ff2965',
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10)
      .setVisible(false);

    const kb = this.input.keyboard!;
    this.keys = {
      up: kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      down: kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      left: kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      w: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      s: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      a: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      d: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      m: kb.addKey(Phaser.Input.Keyboard.KeyCodes.M),
      r: kb.addKey(Phaser.Input.Keyboard.KeyCodes.R),
      c: kb.addKey(Phaser.Input.Keyboard.KeyCodes.C),
      space: kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
    };
  }

  /** Białe tekstury bazowe (tint nadaje kolor per klasa/typ wroga). */
  private createTextures(): void {
    if (this.textures.exists('box-player')) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);

    g.fillStyle(0xffffff).fillRect(0, 0, C.PLAYER_RADIUS * 2, C.PLAYER_RADIUS * 2);
    g.generateTexture('box-player', C.PLAYER_RADIUS * 2, C.PLAYER_RADIUS * 2);
    g.clear();

    g.fillStyle(0xffffff).fillRect(0, 0, C.MOB_RADIUS * 2, C.MOB_RADIUS * 2);
    g.generateTexture('box-mob', C.MOB_RADIUS * 2, C.MOB_RADIUS * 2);
    g.clear();

    g.fillStyle(0xffffff).fillCircle(C.PROJECTILE_RADIUS, C.PROJECTILE_RADIUS, C.PROJECTILE_RADIUS);
    g.generateTexture('projectile', C.PROJECTILE_RADIUS * 2, C.PROJECTILE_RADIUS * 2);
    g.clear();

    g.lineStyle(1, 0x223355).strokeRect(0, 0, 64, 64);
    g.generateTexture('grid', 64, 64);
    g.destroy();
  }

  private sampleInput(): SimInput {
    const k = this.keys;
    return {
      moveX: (k.right.isDown || k.d.isDown ? 1 : 0) - (k.left.isDown || k.a.isDown ? 1 : 0),
      moveY: (k.down.isDown || k.s.isDown ? 1 : 0) - (k.up.isDown || k.w.isDown ? 1 : 0),
      attack: k.space.isDown,
      debugSpawn: k.m.isDown,
    };
  }

  update(_time: number, deltaMs: number): void {
    if (this.world.isPlayerDead) {
      this.showDeath();
      if (this.keys.r.isDown) this.scene.restart({ classIndex: CLASSES.indexOf(this.cls) });
      if (this.keys.c.isDown) this.scene.start('class-select');
      return;
    }

    // Stały krok symulacji: nadganiamy tyle ticków, ile zmieściło się w delcie.
    // Limit 250 ms chroni przed "spiralą śmierci" po powrocie do uśpionej karty.
    this.accumulator += Math.min(deltaMs, 250) / 1000;
    const input = this.sampleInput();
    while (this.accumulator >= C.TICK_DT) {
      this.world.step(input);
      this.accumulator -= C.TICK_DT;
    }

    this.renderWorld(this.accumulator / C.TICK_DT);
    this.updateHud();
  }

  private renderWorld(alpha: number): void {
    const w = this.world;
    this.playerSprite.setPosition(
      Phaser.Math.Linear(w.playerPrevX, w.playerX, alpha),
      Phaser.Math.Linear(w.playerPrevY, w.playerY, alpha),
    );

    for (let i = 0; i < w.mobs.length; i++) {
      const m = w.mobs[i];
      const s = this.mobSprites[i];
      if (!m.alive) {
        if (s.visible) s.setVisible(false);
        continue;
      }
      if (!s.visible) s.setVisible(true);
      // Hit-flash: świeżo trafiony mob świeci na biało przez ~2 ticki.
      if (w.tick - m.lastHitTick <= 2) s.setTintFill(0xffffff);
      else s.setTint(ENEMIES[m.defIndex].color);
      s.setPosition(Phaser.Math.Linear(m.prevX, m.x, alpha), Phaser.Math.Linear(m.prevY, m.y, alpha));
    }

    for (let i = 0; i < w.projectiles.length; i++) {
      const p = w.projectiles[i];
      const s = this.projectileSprites[i];
      if (!p.alive) {
        if (s.visible) s.setVisible(false);
        continue;
      }
      if (!s.visible) s.setVisible(true).setTint(0x00ccff);
      s.setPosition(Phaser.Math.Linear(p.prevX, p.x, alpha), Phaser.Math.Linear(p.prevY, p.y, alpha));
    }

    // Błysk pierścienia przy ataku (czysta kosmetyka — czyta stan, nic nie zmienia).
    if (w.lastMeleeTick !== this.lastSeenMeleeTick) {
      this.lastSeenMeleeTick = w.lastMeleeTick;
      this.meleeRing.setPosition(this.playerSprite.x, this.playerSprite.y).setVisible(true).setAlpha(0.9);
      this.tweens.add({ targets: this.meleeRing, alpha: 0, duration: 180 });
    }

    // Wachlarz Power Slasha: rysowany raz przy użyciu, znika tweenem.
    if (w.lastSkillTick !== this.lastSeenSkillTick) {
      this.lastSeenSkillTick = w.lastSkillTick;
      const range = this.cls.meleeRange * C.SKILL_RANGE_MULT;
      const angle = Math.atan2(w.lastSkillDirY, w.lastSkillDirX);
      const half = Math.acos(C.SKILL_CONE_COS);
      this.skillCone
        .clear()
        .fillStyle(this.cls.color, 0.4)
        .slice(this.playerSprite.x, this.playerSprite.y, range, angle - half, angle + half)
        .fillPath()
        .setAlpha(1);
      this.tweens.add({ targets: this.skillCone, alpha: 0, duration: 220 });
      this.cameras.main.shake(90, 0.004);
    }

    if (w.playerHp < this.lastSeenHp) this.cameras.main.flash(120, 255, 40, 80);
    this.lastSeenHp = w.playerHp;
  }

  private updateHud(): void {
    const w = this.world;
    const skill =
      w.skillCooldown <= 0
        ? 'SLASH ready'
        : `SLASH ${(w.skillCooldown * C.TICK_DT).toFixed(1)}s`;
    this.hud.setText(
      `${this.cls.name}  |  FPS ${Math.round(this.game.loop.actualFps)}  |  mobs ${w.aliveMobs}  |  ` +
        `HP ${w.playerHp}/${this.cls.maxHp}  |  kills ${w.kills}  |  ${skill}\n` +
        `WASD/arrows: move   SPACE: power slash   hold M: spawn mobs (dev)`,
    );
  }

  private showDeath(): void {
    const cam = this.cameras.main;
    this.deathText.setPosition(cam.width / 2, cam.height / 2).setVisible(true);
  }
}
