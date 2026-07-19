import Phaser from 'phaser';
import { World, type SimInput } from '../sim/world';
import * as C from '../sim/constants';

/**
 * Warstwa renderowania: rysuje stan World i próbkuje klawiaturę do SimInput.
 * Nie zawiera żadnej logiki gry — patrz diagram w src/sim/world.ts.
 * Render działa w FPS przeglądarki, symulacja w stałych tickach;
 * pozycje między tickami są interpolowane (alpha = accumulator / TICK_DT).
 */
export class GameScene extends Phaser.Scene {
  private world!: World;
  private accumulator = 0;

  private playerSprite!: Phaser.GameObjects.Image;
  private mobSprites: Phaser.GameObjects.Image[] = [];
  private meleeRing!: Phaser.GameObjects.Arc;
  private lastSeenMeleeTick = -1;

  private hud!: Phaser.GameObjects.Text;
  private deathText!: Phaser.GameObjects.Text;
  private lastSeenHp = C.PLAYER_MAX_HP;

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
  };

  constructor() {
    super('game');
  }

  create(): void {
    // Seed spoza symulacji — w co-opie hostem seeda będzie jeden z graczy.
    this.world = new World(Date.now() >>> 0);
    this.accumulator = 0;
    this.lastSeenMeleeTick = -1;
    this.lastSeenHp = C.PLAYER_MAX_HP;
    this.mobSprites = [];

    this.createTextures();
    this.add.tileSprite(0, 0, C.WORLD_W, C.WORLD_H, 'grid').setOrigin(0, 0).setAlpha(0.35);

    this.meleeRing = this.add
      .circle(0, 0, C.MELEE_RANGE, 0x39ff14, 0)
      .setStrokeStyle(3, 0x39ff14, 1)
      .setVisible(false);

    this.playerSprite = this.add.image(this.world.playerX, this.world.playerY, 'player');
    for (let i = 0; i < C.MOB_CAP; i++) {
      this.mobSprites.push(this.add.image(0, 0, 'mob').setVisible(false));
    }

    const cam = this.cameras.main;
    cam.setBounds(0, 0, C.WORLD_W, C.WORLD_H);
    cam.startFollow(this.playerSprite, false, 0.15, 0.15);

    this.hud = this.add
      .text(12, 10, '', { fontFamily: 'monospace', fontSize: '16px', color: '#39ff14' })
      .setScrollFactor(0)
      .setDepth(10);

    this.deathText = this.add
      .text(0, 0, 'YOU DIED\npress R to restart', {
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
    };
  }

  /** Placeholder-tekstury generowane w locie — zero plików graficznych w Fazie 1. */
  private createTextures(): void {
    if (this.textures.exists('player')) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);

    g.fillStyle(0x39ff14).fillRect(0, 0, C.PLAYER_RADIUS * 2, C.PLAYER_RADIUS * 2);
    g.lineStyle(2, 0xffffff).strokeRect(1, 1, C.PLAYER_RADIUS * 2 - 2, C.PLAYER_RADIUS * 2 - 2);
    g.generateTexture('player', C.PLAYER_RADIUS * 2, C.PLAYER_RADIUS * 2);
    g.clear();

    g.fillStyle(0xff00ff).fillRect(0, 0, C.MOB_RADIUS * 2, C.MOB_RADIUS * 2);
    g.lineStyle(2, 0x8800aa).strokeRect(1, 1, C.MOB_RADIUS * 2 - 2, C.MOB_RADIUS * 2 - 2);
    g.generateTexture('mob', C.MOB_RADIUS * 2, C.MOB_RADIUS * 2);
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
      debugSpawn: k.m.isDown,
    };
  }

  update(_time: number, deltaMs: number): void {
    if (this.world.isPlayerDead) {
      this.showDeath();
      if (this.keys.r.isDown) this.scene.restart();
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
      s.setPosition(Phaser.Math.Linear(m.prevX, m.x, alpha), Phaser.Math.Linear(m.prevY, m.y, alpha));
    }

    // Błysk pierścienia przy ataku (czysta kosmetyka — czyta stan, nic nie zmienia).
    if (w.lastMeleeTick !== this.lastSeenMeleeTick) {
      this.lastSeenMeleeTick = w.lastMeleeTick;
      this.meleeRing.setPosition(this.playerSprite.x, this.playerSprite.y).setVisible(true).setAlpha(0.9);
      this.tweens.add({ targets: this.meleeRing, alpha: 0, duration: 180 });
    }

    if (w.playerHp < this.lastSeenHp) this.cameras.main.flash(120, 255, 40, 80);
    this.lastSeenHp = w.playerHp;
  }

  private updateHud(): void {
    const w = this.world;
    this.hud.setText(
      `FPS ${Math.round(this.game.loop.actualFps)}  |  mobs ${w.aliveMobs}  |  ` +
        `HP ${w.playerHp}/${C.PLAYER_MAX_HP}  |  kills ${w.kills}  |  tick ${w.tick}\n` +
        `WASD/strzalki: ruch   M (przytrzymaj): +mobki do testu FPS`,
    );
  }

  private showDeath(): void {
    const cam = this.cameras.main;
    this.deathText.setPosition(cam.width / 2, cam.height / 2).setVisible(true);
  }
}
