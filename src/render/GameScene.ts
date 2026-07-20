import Phaser from 'phaser';
import { World, type Player, type SimInput } from '../sim/world';
import { CLASSES, type ClassDef } from '../sim/classes';
import { ENEMIES } from '../sim/enemies';
import { BOSSES, type BossDef } from '../sim/bosses';
import { sfx } from './audio';
import { DROP_CONFIG, ITEMS } from '../sim/itemsConfig';
import { UPGRADES, WAVE_CONFIG } from '../sim/wavesConfig';
import { CURRENCY_NAME, computeReward } from '../sim/metaConfig';
import { loadSave, metaBonusesFrom, writeSave } from '../meta/save';
import { makeGlowCircle, makeGlowPolygon, makeNeonGrid, makeStarfield } from './textures';
import { FogOfWar } from './fog';
import { Minimap } from './Minimap';
import { LockstepSession } from '../net/lockstep';
import type { Transport } from '../net/types';

/** Dane sesji co-op przekazywane z lobby. */
export interface CoopInit {
  transport: Transport;
  seed: number;
  localIndex: number;
  classIndexes: number[];
}
import * as C from '../sim/constants';

/**
 * Kształt sylwetki per typ wroga (indeks = ENEMIES).
 * Różne kształty czytają się w hordzie o niebo lepiej niż same kolory:
 * trójkąt = Alien, romb = Demon, sześciokąt = Mage, ośmiokąt = Robot.
 */
const ENEMY_SHAPES = [
  { key: 'mob-alien', sides: 3, rotation: -Math.PI / 2 },
  { key: 'mob-demon', sides: 4, rotation: 0 },
  { key: 'mob-mage', sides: 6, rotation: 0 },
  { key: 'mob-robot', sides: 8, rotation: Math.PI / 8 },
  { key: 'mob-brute', sides: 3, rotation: Math.PI / 2 },
];

/**
 * Warstwa renderowania: rysuje stan World i próbkuje klawiaturę do SimInput.
 * Nie zawiera żadnej logiki gry — patrz diagram w src/sim/world.ts.
 * Render działa w FPS przeglądarki, symulacja w stałych tickach;
 * pozycje między tickami są interpolowane (alpha = accumulator / TICK_DT).
 * Grafika: białe tekstury + tint kolorem klasy/wroga (bez sprite'ów — decyzja 2026-07-19).
 */
/** Każdy boss ma własną teksturę — klucz wyprowadzamy z jego id. */
const bossTextureKey = (def: BossDef): string => `boss-${def.id}`;

export class GameScene extends Phaser.Scene {
  private world!: World;
  private cls!: ClassDef;
  private accumulator = 0;
  /**
   * Który gracz w symulacji to „ja". W single-playerze zawsze 0; w co-opie
   * ustawia to warstwa sieciowa. Kamera, HUD i input dotyczą tylko jego.
   */
  private localIndex = 0;

  /** Skrót do stanu lokalnego gracza — render czyta wyłącznie przez to. */
  private get me(): Player {
    return this.world.players[this.localIndex];
  }

  /** Sprite'y wszystkich graczy; lokalny to `playerSprites[localIndex]`. */
  private playerSprites: Phaser.GameObjects.Image[] = [];
  /** Paski HP i etykiety nad kolegami z drużyny (lokalny gracz ich nie ma). */
  private teamBars!: Phaser.GameObjects.Graphics;
  private bossBar!: Phaser.GameObjects.Graphics;
  private bossName!: Phaser.GameObjects.Text;
  private lastSeenBossPhaseTick = -1;
  private session: LockstepSession | null = null;
  private coop: CoopInit | null = null;
  private lastSeenSkillTicks: number[] = [];
  /** Ile rozłączeń już ogłosiliśmy — żeby nie powtarzać komunikatu w kółko. */
  private announcedDrops = 0;
  /** Dźwięki grane RAZ na run — flaga `dead` zostaje na stałe. */
  private deathSoundPlayed = false;
  private victorySoundPlayed = false;
  /** Liczba zabójstw i trafień z poprzedniej klatki — z różnicy robimy dźwięk. */
  private lastSeenKills = 0;
  private lastSeenMobHitTick = -1;

  /** Skrót do sprite'a lokalnego gracza — kamera i efekty czepiają się jego. */
  private get playerSprite(): Phaser.GameObjects.Image {
    return this.playerSprites[this.localIndex];
  }
  private mobSprites: Phaser.GameObjects.Image[] = [];
  private projectileSprites: Phaser.GameObjects.Image[] = [];
  private meleeRing!: Phaser.GameObjects.Arc;
  private lastSeenMeleeTick = -1;
  private moveMarker!: Phaser.GameObjects.Arc;
  private rmbWasDown = false;
  private pickupSprites: Phaser.GameObjects.Image[] = [];
  private lastSeenPickupTick = -1;
  private lastSeenShieldTick = -1;
  private deathParticles!: Phaser.GameObjects.Particles.ParticleEmitter;
  private telegraphs!: Phaser.GameObjects.Graphics;
  /** Stan „żywy" z poprzedniej klatki — wykrywa moment śmierci dla cząsteczek. */
  private mobWasAlive: boolean[] = [];
  private starsFar!: Phaser.GameObjects.TileSprite;
  private starsNear!: Phaser.GameObjects.TileSprite;
  private fog!: FogOfWar;
  private minimap!: Minimap;

  private hud!: Phaser.GameObjects.Text;
  private deathText!: Phaser.GameObjects.Text;
  private lastSeenHp = 0;

  /** UI przerwy między falami: karty ulepszeń + banery faz. */
  private breakUi: Phaser.GameObjects.GameObject[] = [];
  private pendingUpgradePick = -1;
  private banner!: Phaser.GameObjects.Text;
  private paused = false;
  private endScreenShown = false;

  /** Tryb celowania (stan UI, nie symulacji): spacja włącza, LMB zatwierdza cios. */
  private aiming = false;
  private lmbWasDown = false;
  private aimPreview!: Phaser.GameObjects.Graphics;

  private keys!: {
    m: Phaser.Input.Keyboard.Key;
    n: Phaser.Input.Keyboard.Key;
    r: Phaser.Input.Keyboard.Key;
    c: Phaser.Input.Keyboard.Key;
    space: Phaser.Input.Keyboard.Key;
    esc: Phaser.Input.Keyboard.Key;
    l: Phaser.Input.Keyboard.Key;
    one: Phaser.Input.Keyboard.Key;
    two: Phaser.Input.Keyboard.Key;
    three: Phaser.Input.Keyboard.Key;
    four: Phaser.Input.Keyboard.Key;
  };

  constructor() {
    super('game');
  }

  init(data: { classIndex?: number; coop?: CoopInit }): void {
    this.cls = CLASSES[data.classIndex ?? 0];
    this.coop = data.coop ?? null;
  }

  create(): void {
    // Seed spoza symulacji — w co-opie (1-8 graczy) seed rozda host.
    // Bonusy meta wchodzą jako jawne dane wejściowe (patrz komentarz przy MetaBonus).
    const save = loadSave();
    if (this.coop) {
      // Co-op: seed i skład drużyny pochodzą od hosta — wszyscy budują
      // identyczny świat. Bonusy meta ma na razie tylko gracz lokalny;
      // docelowo lobby prześle je razem ze składem.
      const classes = this.coop.classIndexes.map((i) => CLASSES[i]);
      const bonuses = classes.map((_, i) =>
        i === this.coop!.localIndex ? metaBonusesFrom(save) : [],
      );
      this.world = new World(this.coop.seed, classes, bonuses);
      this.localIndex = this.coop.localIndex;
      this.cls = classes[this.localIndex];
      this.session = new LockstepSession(
        this.world,
        this.coop.transport,
        this.localIndex,
        classes.length,
      );
      // Zamknięcie karty nie odpala `shutdown` sceny, więc bez tego reszta
      // drużyny czekałaby na nas aż do timeoutu. `pagehide` łapie też
      // przejście w tło na mobile, gdzie `beforeunload` bywa pomijane.
      const sayGoodbye = (): void => this.session?.announceLeave();
      window.addEventListener('pagehide', sayGoodbye);
      this.events.once('shutdown', () => {
        window.removeEventListener('pagehide', sayGoodbye);
        this.session?.dispose();
      });
    } else {
      // Single-player = jednoelementowa drużyna.
      this.world = new World(Date.now() >>> 0, [this.cls], [metaBonusesFrom(save)]);
      this.localIndex = 0;
      this.session = null;
    }
    this.lastSeenSkillTicks = this.world.players.map(() => -1);
    this.announcedDrops = 0;
    this.deathSoundPlayed = false;
    this.victorySoundPlayed = false;
    this.lastSeenKills = 0;
    this.lastSeenMobHitTick = -1;
    this.accumulator = 0;
    this.lastSeenMeleeTick = -1;
    this.lastSeenHp = this.cls.maxHp;
    this.mobSprites = [];
    this.projectileSprites = [];

    this.createTextures();
    this.buildBackground();

    // Przeszkody terenu (statyczne, z symulacji — ta sama mapa co logika kolizji).
    // Neonowy pierścień + ciemny rdzeń: czytelna bryła, która nie zlewa się z tłem.
    for (const o of this.world.obstacles) {
      this.add.circle(o.x, o.y, o.r + 6, 0x1b3a8a, 0.12).setDepth(0);
      this.add
        .circle(o.x, o.y, o.r, 0x070b14)
        .setStrokeStyle(2, 0x3d8bff, 0.9)
        .setDepth(0);
      this.add
        .circle(o.x, o.y, o.r * 0.55, 0x0d1830)
        .setStrokeStyle(1, 0x3d8bff, 0.35)
        .setDepth(0);
    }

    this.meleeRing = this.add
      .circle(0, 0, this.cls.meleeRange, 0x39ff14, 0)
      .setStrokeStyle(3, this.cls.color, 1)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setVisible(false)
      .setDepth(4);
    this.aimPreview = this.add.graphics().setDepth(5);
    // Telegrafy wrogów: krąg rażenia rosnący w trakcie zamachu.
    this.telegraphs = this.add.graphics().setDepth(1).setBlendMode(Phaser.BlendModes.ADD);
    // Marker celu ruchu (Dota-style): zielony pierścień w miejscu kliknięcia RMB.
    this.moveMarker = this.add
      .circle(0, 0, 18, 0x39ff14, 0)
      .setStrokeStyle(2, 0x39ff14, 1)
      .setVisible(false)
      .setDepth(4);
    this.input.mouse?.disableContextMenu();

    // Sprite na każdego gracza — koledzy z drużyny są widoczni w świecie.
    this.playerSprites = this.world.players.map((p) =>
      this.add.image(p.x, p.y, 'player').setTint(p.cls.color).setDepth(3),
    );
    this.teamBars = this.add.graphics().setDepth(7);
    this.bossBar = this.add.graphics().setScrollFactor(0).setDepth(15);
    this.bossName = this.add
      .text(0, 0, '', { fontFamily: 'monospace', fontSize: '18px', color: '#ffffff' })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(16)
      .setVisible(false);
    for (let i = 0; i < C.MOB_CAP; i++) {
      this.mobSprites.push(this.add.image(0, 0, ENEMY_SHAPES[0].key).setVisible(false).setDepth(2));
    }
    for (let i = 0; i < C.PROJECTILE_CAP; i++) {
      this.projectileSprites.push(
        this.add.image(0, 0, 'projectile').setVisible(false).setBlendMode(Phaser.BlendModes.ADD).setDepth(3),
      );
    }
    this.mobWasAlive = new Array(C.MOB_CAP).fill(false);

    // Cząsteczki po rozbitym najeźdźcy — jeden pooled emiter na całą scenę.
    this.deathParticles = this.add
      .particles(0, 0, 'spark', {
        lifespan: 360,
        speed: { min: 50, max: 190 },
        scale: { start: 0.9, end: 0 },
        alpha: { start: 0.95, end: 0 },
        blendMode: Phaser.BlendModes.ADD,
        emitting: false,
      })
      .setDepth(4);
    for (let i = 0; i < DROP_CONFIG.maxGroundItems; i++) {
      this.pickupSprites.push(
        this.add.image(0, 0, 'pickup').setVisible(false).setBlendMode(Phaser.BlendModes.ADD).setDepth(1),
      );
    }

    const cam = this.cameras.main;
    cam.setBounds(0, 0, C.WORLD_W, C.WORLD_H);
    cam.startFollow(this.playerSprite, false, 0.15, 0.15);

    // Mgła wojny + minimapa. Świat startuje zasłonięty; odkrywa się tam,
    // gdzie chodzi drużyna (pozycje są zsynchronizowane, więc każdy klient
    // wylicza identyczną mgłę samodzielnie).
    this.fog = new FogOfWar(C.WORLD_W, C.WORLD_H, C.FOG_CELL_SIZE);
    this.minimap = new Minimap(
      this,
      this.fog,
      this.world.obstacles,
      C.WORLD_W,
      C.MINIMAP_SIZE,
      cam.width - C.MINIMAP_SIZE - C.MINIMAP_MARGIN,
      C.MINIMAP_MARGIN,
    );
    this.events.once('shutdown', () => this.minimap.destroy());

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

    // Baner faz: "WAVE 3", "WAVE CLEARED", pauza.
    this.banner = this.add
      .text(0, 0, '', {
        fontFamily: 'monospace',
        fontSize: '34px',
        color: '#39ff14',
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(11)
      .setVisible(false);

    const kb = this.input.keyboard!;
    this.keys = {
      m: kb.addKey(Phaser.Input.Keyboard.KeyCodes.M),
      // Wyciszenie pod N, bo M zajmuje dev-spawn mobków.
      n: kb.addKey(Phaser.Input.Keyboard.KeyCodes.N),
      r: kb.addKey(Phaser.Input.Keyboard.KeyCodes.R),
      c: kb.addKey(Phaser.Input.Keyboard.KeyCodes.C),
      space: kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      esc: kb.addKey(Phaser.Input.Keyboard.KeyCodes.ESC),
      l: kb.addKey(Phaser.Input.Keyboard.KeyCodes.L),
      one: kb.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
      two: kb.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
      three: kb.addKey(Phaser.Input.Keyboard.KeyCodes.THREE),
      four: kb.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR),
    };
    this.aiming = false;
    this.lmbWasDown = false;
    this.paused = false;
    this.endScreenShown = false;
    this.pendingUpgradePick = -1;
    this.breakUi = [];

    this.showBanner(`WAVE 1`, 1400);
  }

  /**
   * Tekstury neonowe: białe sylwetki z wypaloną poświatą (kolor nadaje tint).
   * Szczegóły techniki i uzasadnienie wydajnościowe: src/render/textures.ts.
   */
  private createTextures(): void {
    // Gracz: pięciokąt — organiczny i wyraźnie inny niż sylwetki najeźdźców.
    makeGlowPolygon(this, 'player', 5, C.PLAYER_RADIUS, -Math.PI / 2);
    ENEMY_SHAPES.forEach((shape, i) => {
      // Tekstura w rozmiarze rzeczywistego promienia typu — Brute jest po prostu wielki.
      makeGlowPolygon(this, shape.key, shape.sides, ENEMIES[i].radius, shape.rotation);
    });
    // Boss: dziesięciokąt, wyraźnie większy od wszystkiego innego na ekranie.
    // Tekstura na KAŻDEGO bossa osobno: rozmiar musi wynikać z jego własnego
    // promienia, inaczej sylwetka kłóci się z hitboxem (i tak było, dopóki
    // boss był jeden). Nowy boss nie wymaga tu już żadnej zmiany.
    for (const b of BOSSES) makeGlowPolygon(this, bossTextureKey(b), b.shapeSides, b.radius, 0);
    makeGlowCircle(this, 'projectile', C.PROJECTILE_RADIUS);
    makeGlowCircle(this, 'spark', 3);
    // Item: romb (4 boki bez obrotu) — czytelnie inny od sylwetek wrogów.
    makeGlowPolygon(this, 'pickup', 4, 9, 0);

    makeNeonGrid(this, 'grid', 96);
    makeStarfield(this, 'stars-far', 512, 260, 1337, 0.55);
    makeStarfield(this, 'stars-near', 512, 90, 90210, 0.9);
  }

  /**
   * Tło: dwie warstwy gwiazd z parallaxem + siatka stacji.
   * Warstwy są przypięte do kamery (scrollFactor < 1), więc przy ruchu
   * gwiazdy „zostają w tyle" i świat sprawia wrażenie głębi.
   */
  private buildBackground(): void {
    const cam = this.cameras.main;
    const w = cam.width;
    const h = cam.height;

    this.starsFar = this.add
      .tileSprite(0, 0, w, h, 'stars-far')
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-3);
    this.starsNear = this.add
      .tileSprite(0, 0, w, h, 'stars-near')
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-2);

    this.add
      .tileSprite(0, 0, C.WORLD_W, C.WORLD_H, 'grid')
      .setOrigin(0, 0)
      .setAlpha(0.5)
      .setDepth(-1);

    // Warstwy gwiazd są przypięte do kamery, więc muszą nadążać za zmianą okna.
    this.scale.on('resize', this.resizeBackground, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.resizeBackground, this));
  }

  private resizeBackground(size: Phaser.Structs.Size): void {
    this.starsFar?.setSize(size.width, size.height);
    this.starsNear?.setSize(size.width, size.height);
  }

  private sampleInput(): SimInput {
    const pointer = this.input.activePointer;
    const cursor = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

    const rmb = pointer.rightButtonDown();
    if (rmb && !this.rmbWasDown) this.flashMoveMarker(cursor.x, cursor.y);
    this.rmbWasDown = rmb;

    // Celowanie skilla: spacja włącza/wyłącza (tylko gdy skill gotowy),
    // LMB (świeże wciśnięcie) zatwierdza cios w kierunku kursora.
    // W przerwie skill jest wyłączony — LMB służy do wyboru karty ulepszenia.
    const inBreak = this.world.phase === 'break';
    if (!inBreak && Phaser.Input.Keyboard.JustDown(this.keys.space) && this.me.skillCooldown <= 0) {
      this.aiming = !this.aiming;
    }
    if (inBreak) this.aiming = false;
    const lmb = pointer.leftButtonDown();
    const confirmStrike = this.aiming && lmb && !this.lmbWasDown;
    this.lmbWasDown = lmb;
    if (confirmStrike) this.aiming = false;

    // Wybór ulepszenia: klik w kartę (ustawia pendingUpgradePick) albo klawisze 1-4.
    if (inBreak) {
      const numberKeys = [this.keys.one, this.keys.two, this.keys.three, this.keys.four];
      for (let i = 0; i < Math.min(numberKeys.length, this.me.upgradeChoices.length); i++) {
        if (Phaser.Input.Keyboard.JustDown(numberKeys[i])) this.pendingUpgradePick = i;
      }
    }
    const pick = this.pendingUpgradePick;
    this.pendingUpgradePick = -1;

    return {
      targetX: cursor.x,
      targetY: cursor.y,
      hasTarget: rmb,
      attack: confirmStrike,
      aimX: cursor.x,
      aimY: cursor.y,
      debugSpawn: this.keys.m.isDown,
      upgradePick: pick,
    };
  }

  /**
   * Telegrafy ciężkich ataków: krąg rażenia wypełnia się w trakcie zamachu.
   * Bez tego młot Brute'a byłby niesprawiedliwy — gracz musi WIDZIEĆ,
   * gdzie i kiedy spadnie cios.
   */
  private drawTelegraphs(): void {
    const w = this.world;
    this.telegraphs.clear();

    // Telegraf bossa — czytamy promień z aktualnie szykowanego ataku.
    const boss = w.boss;
    if (boss && boss.state === 'windup') {
      const bdef = BOSSES[boss.bossIndex];
      const attack = bdef.phases[boss.phaseIndex].attacks[boss.attackIndex];
      const radius =
        attack.kind === 'slam'
          ? attack.hitRadius
          : attack.kind === 'charge'
            ? attack.hitRadius * 2
            : bdef.radius * 3;
      const progress = 1 - boss.stateTicks / attack.windupTicks;
      const s = this.mobSprites[w.bossMobIndex];
      this.telegraphs
        .lineStyle(3, bdef.color, 0.7)
        .strokeCircle(s.x, s.y, radius)
        .fillStyle(bdef.color, 0.12 + progress * 0.25)
        .fillCircle(s.x, s.y, radius * progress);
    }

    for (let i = 0; i < w.mobs.length; i++) {
      const m = w.mobs[i];
      if (!m.alive || m.state !== 'windup' || m.bossIndex >= 0) continue;
      const def = ENEMIES[m.defIndex];
      if (!def.slam) continue;

      const progress = 1 - m.stateTicks / def.slam.windupTicks;
      const s = this.mobSprites[i];
      // Obrys pełnego zasięgu + wypełnienie rosnące do momentu uderzenia.
      this.telegraphs
        .lineStyle(2, def.color, 0.55)
        .strokeCircle(s.x, s.y, def.slam.hitRadius)
        .fillStyle(def.color, 0.13 + progress * 0.22)
        .fillCircle(s.x, s.y, def.slam.hitRadius * progress);
    }
  }

  /** Paski HP nad kolegami z drużyny — własnego nie rysujemy (jest w HUD). */
  private drawTeamBars(): void {
    this.teamBars.clear();
    if (this.world.players.length < 2) return;

    const barW = 34;
    const barH = 4;
    this.world.players.forEach((p, i) => {
      if (i === this.localIndex || p.dead) return;
      const s = this.playerSprites[i];
      const x = s.x - barW / 2;
      const y = s.y - 30;
      const frac = Math.max(0, Math.min(1, p.hp / this.world.maxHpOf(p)));
      this.teamBars
        .fillStyle(0x000000, 0.6)
        .fillRect(x - 1, y - 1, barW + 2, barH + 2)
        .fillStyle(p.cls.color, 1)
        .fillRect(x, y, barW * frac, barH);
    });
  }

  /** Pasek HP bossa u góry ekranu + komunikat przy zmianie fazy. */
  private drawBossBar(): void {
    const w = this.world;
    const boss = w.boss;
    this.bossBar.clear();
    if (!boss || w.bossMaxHp <= 0) {
      if (this.bossName.visible) this.bossName.setVisible(false);
      return;
    }

    const def = BOSSES[boss.bossIndex];
    const cam = this.cameras.main;
    const barW = Math.min(620, cam.width - 120);
    const barH = 16;
    const x = cam.width / 2 - barW / 2;
    const y = 74;
    const frac = Math.max(0, Math.min(1, boss.hp / w.bossMaxHp));

    this.bossBar
      .fillStyle(0x000000, 0.65)
      .fillRect(x - 2, y - 2, barW + 4, barH + 4)
      .fillStyle(0x2a0d1a, 1)
      .fillRect(x, y, barW, barH)
      .fillStyle(def.color, 1)
      .fillRect(x, y, barW * frac, barH)
      .lineStyle(2, def.color, 0.9)
      .strokeRect(x, y, barW, barH);

    this.bossName
      .setText(`${def.name}   ${Math.ceil(boss.hp)} / ${Math.ceil(w.bossMaxHp)}`)
      .setPosition(cam.width / 2, y - 16)
      .setVisible(true);

    // Wejście w nową fazę — krzyczymy o tym na środku ekranu.
    if (w.bossPhaseTick !== this.lastSeenBossPhaseTick) {
      this.lastSeenBossPhaseTick = w.bossPhaseTick;
      if (w.bossPhaseAnnounce) {
        this.showBanner(w.bossPhaseAnnounce, 1800);
        sfx.bossPhase();
      }
    }
  }

  /**
   * Dźwięki walki wyprowadzone z RÓŻNICY stanu między klatkami — tak samo jak
   * błyski. Symulacja nie wie o istnieniu dźwięku i nie może na niego wpłynąć.
   *
   * Oba dźwięki odpalamy najwyżej raz na klatkę (a wewnątrz `Sfx` działa
   * jeszcze limiter czasowy): przy 400 wrogach trafienia lecą kilkadziesiąt
   * razy na sekundę i bez tego zrobiłaby się z tego ściana szumu.
   */
  private playCombatSounds(): void {
    const w = this.world;

    let newestHit = this.lastSeenMobHitTick;
    for (const m of w.mobs) {
      if (m.alive && m.lastHitTick > newestHit) newestHit = m.lastHitTick;
    }
    if (newestHit > this.lastSeenMobHitTick) {
      this.lastSeenMobHitTick = newestHit;
      sfx.hit();
    }

    // Tylko własne zabójstwa — w co-opie cudze zlałyby się w nieustanny terkot.
    if (this.me.kills > this.lastSeenKills) {
      this.lastSeenKills = this.me.kills;
      sfx.kill();
    }
  }

  private showPickupText(def: (typeof ITEMS)[number]): void {
    const label = this.add
      .text(this.playerSprite.x, this.playerSprite.y - 26, def.name, {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: '#' + def.color.toString(16).padStart(6, '0'),
      })
      .setOrigin(0.5)
      .setDepth(9);
    this.tweens.add({
      targets: label,
      y: label.y - 34,
      alpha: 0,
      duration: 900,
      onComplete: () => label.destroy(),
    });
  }

  private flashMoveMarker(x: number, y: number): void {
    this.moveMarker.setPosition(x, y).setVisible(true).setAlpha(1).setScale(1);
    this.tweens.add({ targets: this.moveMarker, alpha: 0, scale: 0.4, duration: 300 });
  }

  update(_time: number, deltaMs: number): void {
    const w = this.world;

    // Koniec runu: śmierć albo przetrwanie wszystkich fal.
    if (w.isRunOver) {
      this.showEndScreen();
      if (this.keys.r.isDown) this.scene.restart({ classIndex: CLASSES.indexOf(this.cls) });
      if (this.keys.c.isDown) this.scene.start('class-select');
      if (this.keys.l.isDown) this.scene.start('meta');
      return;
    }

    // Wyciszenie (N) działa też w pauzie — stąd sprawdzenie przed `return`.
    if (Phaser.Input.Keyboard.JustDown(this.keys.n)) {
      this.showBanner(sfx.toggleMute() ? 'SOUND OFF' : 'SOUND ON', 900);
    }

    // Pauza (ESC) — symulacja stoi, render dalej rysuje ostatni stan.
    if (Phaser.Input.Keyboard.JustDown(this.keys.esc)) {
      this.paused = !this.paused;
      if (this.paused) this.showBanner('PAUSED\nESC to resume', 0);
      else this.hideBanner();
    }
    if (this.paused) return;

    const wasBreak = w.phase === 'break';
    const waveBefore = w.wave;
    const input = this.sampleInput();

    if (this.session) {
      // Co-op: to sesja decyduje, kiedy wolno wykonać tick — świat rusza
      // dopiero, gdy znane są wejścia wszystkich graczy.
      this.session.update(deltaMs, input);
      this.accumulator = this.session.renderAlpha * C.TICK_DT;
    } else {
      // Single-player: stały krok, nadganiamy ile się zmieściło w delcie.
      // Limit 250 ms chroni przed "spiralą śmierci" po uśpionej karcie.
      this.accumulator += Math.min(deltaMs, 250) / 1000;
      while (this.accumulator >= C.TICK_DT) {
        w.step([input]);
        this.accumulator -= C.TICK_DT;
      }
    }

    // Reakcje na zmiany faz (UI żyje po stronie renderu, nie symulacji).
    if (!wasBreak && w.phase === 'break') {
      this.showBanner('WAVE CLEARED', 1200);
      sfx.waveCleared();
      this.buildUpgradeCards();
    }
    if (wasBreak && w.phase === 'wave') {
      this.clearUpgradeCards();
      this.showBanner(`WAVE ${w.wave}`, 1200);
      sfx.waveStart();
    }
    if (waveBefore !== w.wave && !wasBreak) {
      this.showBanner(`WAVE ${w.wave}`, 1200);
      sfx.waveStart();
    }

    this.renderWorld(this.accumulator / C.TICK_DT);
    this.updateFogAndMinimap();
    this.updateHud();
    this.updateNetStatus();
  }

  /** Komunikaty sieciowe: czekanie na graczy i wykryty rozjazd symulacji. */
  private updateNetStatus(): void {
    if (!this.session) return;
    if (this.session.desyncAtTick >= 0) {
      this.showBanner(
        `DESYNC at tick ${this.session.desyncAtTick}\nsimulations diverged`,
        0,
      );
      return;
    }
    // Rozłączenie ogłaszamy raz, na chwilę — gra toczy się dalej bez tej osoby.
    const dropped = this.session.droppedIndexes;
    if (dropped.length > this.announcedDrops) {
      const index = dropped[this.announcedDrops++];
      this.showBanner(`${this.world.players[index].cls.name} DISCONNECTED`, 2500);
      sfx.disconnect();
      return;
    }

    // Krótkie przestoje są normalne; komunikat dopiero przy realnym czekaniu.
    if (this.session.stalledTicks > 15) {
      this.showBanner('waiting for players...', 0);
    } else if (this.banner.visible && this.banner.text.startsWith('waiting')) {
      this.hideBanner();
    }
  }

  /**
   * Mgła odkrywa się wokół KAŻDEGO żywego gracza — w co-opie drużyna
   * eksploruje wspólnie, więc mapa koleg i moja to ta sama mapa.
   */
  private updateFogAndMinimap(): void {
    for (const p of this.world.players) {
      if (!p.dead) this.fog.reveal(p.x, p.y, C.FOG_REVEAL_RADIUS);
    }
    this.minimap.applyReveals();
    this.minimap.update(this.world.players, this.localIndex);
  }

  /* ── UI struktury runu ────────────────────────────────────────────────── */

  private showBanner(text: string, autoHideMs: number): void {
    const cam = this.cameras.main;
    this.banner
      .setText(text)
      .setPosition(cam.width / 2, cam.height * 0.22)
      .setAlpha(1)
      .setVisible(true);
    if (autoHideMs > 0) {
      this.tweens.add({ targets: this.banner, alpha: 0, delay: autoHideMs, duration: 400 });
    }
  }

  private hideBanner(): void {
    this.banner.setVisible(false);
  }

  /** Karty ulepszeń w przerwie — klik albo klawisze 1-4. */
  private buildUpgradeCards(): void {
    this.clearUpgradeCards();
    const cam = this.cameras.main;
    const choices: number[] = this.me.upgradeChoices;
    const cardW = 210;
    const gap = 24;
    const totalW = choices.length * cardW + (choices.length - 1) * gap;
    const startX = cam.width / 2 - totalW / 2 + cardW / 2;
    const y = cam.height * 0.55;

    const title = this.add
      .text(cam.width / 2, y - 130, 'CHOOSE AN UPGRADE', {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(12);
    this.breakUi.push(title);

    choices.forEach((defIndex, i) => {
      const def = UPGRADES[defIndex];
      const x = startX + i * (cardW + gap);
      const hex = '#' + def.color.toString(16).padStart(6, '0');

      const card = this.add
        .rectangle(x, y, cardW, 150, 0x0d1420)
        .setStrokeStyle(2, def.color)
        .setScrollFactor(0)
        .setDepth(12)
        .setInteractive({ useHandCursor: true });
      card.on('pointerover', () => card.setFillStyle(0x162032));
      card.on('pointerout', () => card.setFillStyle(0x0d1420));
      card.on('pointerdown', () => {
        this.pendingUpgradePick = i;
      });

      const name = this.add
        .text(x, y - 34, def.name, { fontFamily: 'monospace', fontSize: '17px', color: hex })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(13);
      const desc = this.add
        .text(x, y + 4, def.desc, {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#ccddee',
          align: 'center',
          wordWrap: { width: cardW - 24 },
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(13);
      const key = this.add
        .text(x, y + 52, `[${i + 1}]`, {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#556677',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(13);

      this.breakUi.push(card, name, desc, key);
    });
  }

  private clearUpgradeCards(): void {
    this.breakUi.forEach((o) => o.destroy());
    this.breakUi = [];
  }

  /** Wypłata SALVAGE i aktualizacja rekordów — wywoływane raz na koniec runu. */
  private awardRun(): number {
    const w = this.world;
    const me = this.me;
    const victory = w.phase === 'victory';
    if (victory && !this.victorySoundPlayed) {
      this.victorySoundPlayed = true;
      sfx.victory();
    }
    // Nagroda liczona z WŁASNYCH zabójstw — w co-opie każdy zarabia na siebie.
    const reward = computeReward(me.kills, w.wavesCleared, victory);

    const save = loadSave();
    save.currency += reward;
    save.stats.runs++;
    if (victory) save.stats.victories++;
    save.stats.totalKills += me.kills;
    save.stats.bestKills = Math.max(save.stats.bestKills, me.kills);
    save.stats.bestWave = Math.max(save.stats.bestWave, victory ? WAVE_CONFIG.totalWaves : w.wave);
    save.stats.lastClassIndex = CLASSES.indexOf(this.cls);
    writeSave(save);
    return reward;
  }

  private renderWorld(alpha: number): void {
    const w = this.world;
    const me = this.me;
    // Wszyscy gracze: pozycje z interpolacją, martwi przygaszeni.
    this.world.players.forEach((p, i) => {
      const s = this.playerSprites[i];
      s.setPosition(Phaser.Math.Linear(p.prevX, p.x, alpha), Phaser.Math.Linear(p.prevY, p.y, alpha));
      s.setAlpha(p.dead ? 0.25 : 1);
    });
    this.drawTeamBars();
    this.drawBossBar();

    // Cząsteczki po śmierci: limit na klatkę, żeby czyszczenie fali (400 naraz)
    // nie zrzuciło FPS-ów. Nadmiar po prostu znika bez efektu.
    let burstBudget = 12;

    for (let i = 0; i < w.mobs.length; i++) {
      const m = w.mobs[i];
      const s = this.mobSprites[i];

      if (!m.alive) {
        if (s.visible) {
          if (this.mobWasAlive[i] && burstBudget > 0) {
            burstBudget--;
            const def = ENEMIES[m.defIndex];
            this.deathParticles.setParticleTint(def.color);
            // Grubszy wróg rozpada się na więcej iskier.
            this.deathParticles.emitParticleAt(s.x, s.y, def.radius > 18 ? 16 : 5);
          }
          s.setVisible(false);
        }
        this.mobWasAlive[i] = false;
        continue;
      }

      if (!s.visible) {
        // Sylwetka i kolor zależą od typu — ustawiamy raz przy „wskrzeszeniu" z poola.
        s.setTexture(
          m.bossIndex >= 0 ? bossTextureKey(BOSSES[m.bossIndex]) : ENEMY_SHAPES[m.defIndex].key,
        ).setVisible(true);
      }
      this.mobWasAlive[i] = true;

      // Boss: własny kolor i skala, reszta jak przy zwykłym wrogu.
      if (m.bossIndex >= 0) {
        const bdef = BOSSES[m.bossIndex];
        if (w.tick - m.lastHitTick <= 2) s.setTintFill(0xffffff);
        else if (m.state === 'windup') s.setTintFill(0xffdddd);
        else s.setTint(bdef.color);
        s.setScale(m.state === 'charging' ? 1.12 : 1);
        s.setPosition(
          Phaser.Math.Linear(m.prevX, m.x, alpha),
          Phaser.Math.Linear(m.prevY, m.y, alpha),
        );
        continue;
      }

      const def = ENEMIES[m.defIndex];

      // Hit-flash: świeżo trafiony mob świeci na biało przez ~2 ticki.
      if (w.tick - m.lastHitTick <= 2) s.setTintFill(0xffffff);
      else if (m.state === 'windup') s.setTintFill(0xffffff); // ładuje cios — świeci
      else if (m.state === 'recover') s.setTint(0x666677); // bezbronny — przygasa
      else s.setTint(def.color);

      // Zamach „puchnie", faza bezbronności kuli się — czytelne bez ikonek.
      if (m.state === 'windup' && def.slam) {
        const t = 1 - m.stateTicks / def.slam.windupTicks;
        s.setScale(1 + t * 0.25);
      } else if (m.state === 'recover') {
        s.setScale(0.85);
      } else if (s.scale !== 1) {
        s.setScale(1);
      }

      s.setPosition(Phaser.Math.Linear(m.prevX, m.x, alpha), Phaser.Math.Linear(m.prevY, m.y, alpha));
    }

    this.drawTelegraphs();

    // Parallax: gwiazdy przesuwają się wolniej niż świat (głębia).
    const cam = this.cameras.main;
    this.starsFar.setTilePosition(cam.scrollX * 0.12, cam.scrollY * 0.12);
    this.starsNear.setTilePosition(cam.scrollX * 0.3, cam.scrollY * 0.3);

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

    this.playCombatSounds();

    // Błysk pierścienia przy ataku (czysta kosmetyka — czyta stan, nic nie zmienia).
    if (me.lastMeleeTick !== this.lastSeenMeleeTick) {
      this.lastSeenMeleeTick = me.lastMeleeTick;
      sfx.melee();
      // Promień z aktualnego zasięgu (rośnie po zebraniu Range Extendera).
      this.meleeRing.setRadius(w.meleeRangeOf(me));
      this.meleeRing.setPosition(this.playerSprite.x, this.playerSprite.y).setVisible(true).setAlpha(0.9);
      this.tweens.add({ targets: this.meleeRing, alpha: 0, duration: 180 });
    }

    // Wachlarz Power Slasha — rysowany dla KAŻDEGO gracza, żeby było widać,
    // że kolega właśnie przywalił. Trzęsienie ekranu tylko od własnego ciosu.
    this.world.players.forEach((p, i) => {
      if (p.lastSkillTick === this.lastSeenSkillTicks[i]) return;
      this.lastSeenSkillTicks[i] = p.lastSkillTick;
      if (p.lastSkillTick < 0) return;
      const s = this.playerSprites[i];
      const range = w.meleeRangeOf(p) * C.SKILL_RANGE_MULT;
      const angle = Math.atan2(p.lastSkillDirY, p.lastSkillDirX);
      const half = Math.acos(C.SKILL_CONE_COS);
      const cone = this.add.graphics().setDepth(5).setBlendMode(Phaser.BlendModes.ADD);
      cone
        .fillStyle(p.cls.color, 0.4)
        .slice(s.x, s.y, range, angle - half, angle + half)
        .fillPath();
      this.tweens.add({
        targets: cone,
        alpha: 0,
        duration: 220,
        onComplete: () => cone.destroy(),
      });
      // Dźwięk tylko od WŁASNEGO ciosu: przy ośmiu graczach cudze Power Slashe
      // zlałyby się w jeden nieczytelny huk.
      if (i === this.localIndex) {
        this.cameras.main.shake(90, 0.004);
        sfx.skill();
      }
    });

    // Itemy na ziemi: pulsują i migają, gdy zaraz znikną (ostatnie 3 s).
    for (let i = 0; i < w.pickups.length; i++) {
      const p = w.pickups[i];
      const s = this.pickupSprites[i];
      if (!p.alive) {
        if (s.visible) s.setVisible(false);
        continue;
      }
      if (!s.visible) s.setVisible(true).setTint(ITEMS[p.defIndex].color);
      s.setPosition(p.x, p.y);
      const pulse = 1 + Math.sin(w.tick * 0.2 + i) * 0.12;
      s.setScale(pulse);
      s.setAlpha(p.ttl < 90 && Math.floor(p.ttl / 5) % 2 === 0 ? 0.35 : 1);
    }

    // Floating text przy zebraniu itemu.
    if (me.lastPickupTick !== this.lastSeenPickupTick) {
      this.lastSeenPickupTick = me.lastPickupTick;
      if (me.lastPickupDefIndex >= 0) {
        this.showPickupText(ITEMS[me.lastPickupDefIndex]);
        sfx.pickup();
      }
    }

    // Błysk tarczy, gdy Overshield pochłonie trafienie.
    if (me.lastShieldTick !== this.lastSeenShieldTick) {
      this.lastSeenShieldTick = me.lastShieldTick;
      if (me.lastShieldTick > 0) {
        sfx.shield();
        const ring = this.add
          .circle(this.playerSprite.x, this.playerSprite.y, 34, 0x4dc9ff, 0)
          .setStrokeStyle(3, 0x4dc9ff, 1)
          .setDepth(6);
        this.tweens.add({
          targets: ring,
          alpha: 0,
          scale: 1.8,
          duration: 320,
          onComplete: () => ring.destroy(),
        });
      }
    }

    // Podgląd celowania: półprzezroczysty stożek od gracza w stronę kursora.
    if (this.aiming) {
      const pointer = this.input.activePointer;
      const cursor = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const angle = Math.atan2(cursor.y - this.playerSprite.y, cursor.x - this.playerSprite.x);
      const half = Math.acos(C.SKILL_CONE_COS);
      const range = this.world.meleeRangeOf(this.me) * C.SKILL_RANGE_MULT;
      this.aimPreview
        .clear()
        .fillStyle(this.cls.color, 0.15)
        .slice(this.playerSprite.x, this.playerSprite.y, range, angle - half, angle + half)
        .fillPath()
        .lineStyle(2, this.cls.color, 0.6)
        .slice(this.playerSprite.x, this.playerSprite.y, range, angle - half, angle + half)
        .strokePath();
    } else if (this.aimPreview) {
      this.aimPreview.clear();
    }

    if (me.hp < this.lastSeenHp) {
      this.cameras.main.flash(120, 255, 40, 80);
      sfx.hurt();
    }
    this.lastSeenHp = me.hp;

    // Śmierć gra raz — bez tego dźwięk leciałby w kółko, bo `dead` zostaje.
    if (me.dead && !this.deathSoundPlayed) {
      this.deathSoundPlayed = true;
      sfx.death();
    }
  }

  private updateHud(): void {
    const w = this.world;
    const me = this.me;
    const skill = this.aiming
      ? 'AIMING — LMB to strike'
      : me.skillCooldown <= 0
        ? 'SLASH ready [SPACE]'
        : `SLASH ${(me.skillCooldown * C.TICK_DT).toFixed(1)}s`;
    const shield = me.shieldCharges > 0 ? `  |  SHIELD ${me.shieldCharges}` : '';
    // Druga linia: statystyki zmienione przez itemy (pokazujemy tylko niezerowe).
    const stats: string[] = [];
    if (me.armorFlat > 0) stats.push(`ARM ${me.armorFlat}`);
    if (me.damageMult !== 1) stats.push(`DMG +${Math.round((me.damageMult - 1) * 100)}%`);
    if (me.attackSpeedMult !== 1) stats.push(`ASPD +${Math.round((me.attackSpeedMult - 1) * 100)}%`);
    if (me.rangeMult !== 1) stats.push(`RNG +${Math.round((me.rangeMult - 1) * 100)}%`);
    if (me.speedMult !== 1) stats.push(`SPD +${Math.round((me.speedMult - 1) * 100)}%`);
    if (me.cooldownMult !== 1) stats.push(`CDR ${Math.round((1 - me.cooldownMult) * 100)}%`);
    if (me.regenPerSec > 0) stats.push(`REG ${me.regenPerSec.toFixed(1)}/s`);
    if (me.leechHealPerKill > 0) stats.push(`LCH ${me.leechHealPerKill.toFixed(1)}`);
    if (me.thornsDamage > 0) stats.push(`THN ${me.thornsDamage}`);
    if (me.knockbackMult !== 1) stats.push(`KB +${Math.round((me.knockbackMult - 1) * 100)}%`);
    if (me.magnetBonus > 0) stats.push(`MAG +${me.magnetBonus}`);

    const waveLeft = Math.max(0, w.waveTicksLeft * C.TICK_DT);
    const wavePart =
      w.phase === 'break'
        ? `BREAK — pick an upgrade`
        : `WAVE ${w.wave}/${WAVE_CONFIG.totalWaves}  ${waveLeft.toFixed(0)}s`;
    // W co-opie pokazujemy stan drużyny; w single-playerze linia znika.
    const team =
      w.players.length > 1
        ? `  |  team ${w.livingPlayers.length}/${w.players.length}`
        : '';

    this.hud.setText(
      `${wavePart}  |  ${this.cls.name}  |  FPS ${Math.round(this.game.loop.actualFps)}  |  ` +
        `mobs ${w.aliveMobs}  |  HP ${Math.round(me.hp)}/${w.maxHpOf(me)}  |  kills ${me.kills}${team}  |  ` +
        `${skill}${shield}\n` +
        `items ${me.totalItemsCollected}${stats.length ? '  |  ' + stats.join('  ') : ''}\n` +
        `RMB: move   SPACE: aim slash   LMB: strike   ESC: pause   N: sound   hold M: dev spawn`,
    );
  }

  /**
   * Ekran końca runu: śmierć albo zwycięstwo, z podsumowaniem.
   * Tu też wypłacamy SALVAGE i zapisujemy statystyki (raz na run).
   */
  private showEndScreen(): void {
    if (this.endScreenShown) return;
    this.endScreenShown = true;
    this.clearUpgradeCards();
    this.hideBanner();

    const w = this.world;
    const reward = this.awardRun();
    const cam = this.cameras.main;
    const victory = w.phase === 'victory';
    const seconds = Math.floor(w.tick * C.TICK_DT);
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toString().padStart(2, '0');

    // Najczęściej zbierane itemy — skrót buildu z tego runu.
    const me = this.me;
    const topItems = ITEMS.map((def, i) => ({ name: def.name, n: me.itemCounts[i] }))
      .filter((e) => e.n > 0)
      .sort((a, b) => b.n - a.n)
      .slice(0, 3)
      .map((e) => `${e.name} x${e.n}`)
      .join(', ');
    const upgrades = me.pickedUpgrades.map((i: number) => UPGRADES[i].name).join(', ');

    const title = victory ? 'VICTORY' : 'YOU DIED';
    const summary =
      `${title}\n\n` +
      `${this.cls.name}   time ${mins}:${secs}\n` +
      `waves ${victory ? WAVE_CONFIG.totalWaves : w.wave} / ${WAVE_CONFIG.totalWaves}   ` +
      `kills ${me.kills}   items ${me.totalItemsCollected}\n` +
      (upgrades ? `upgrades: ${upgrades}\n` : '') +
      (topItems ? `top drops: ${topItems}\n` : '') +
      `\n+${reward} ${CURRENCY_NAME}\n` +
      `\nR: retry   C: change class   L: LAB`;

    this.deathText
      .setText(summary)
      .setFontSize(victory ? 30 : 28)
      .setColor(victory ? '#39ff14' : '#ff2965')
      .setPosition(cam.width / 2, cam.height / 2)
      .setVisible(true);
  }
}
