import Phaser from 'phaser';
import { World, withoutOneShots, type Player, type SimInput } from '../sim/world';
import { CLASSES, classById, DEFAULT_CLASS_ID, type ClassDef } from '../sim/classes';
import { ENEMIES } from '../sim/enemies';
import { BOSSES, type BossDef } from '../sim/bosses';
import { sfx } from './audio';
import { branchesFor, PROGRESSION, talentSlotsFor } from '../sim/talentsConfig';
import { SKILL_KEYS } from '../sim/skillsConfig';
import { MINIONS, type MinionDef } from '../sim/minionsConfig';
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
  /** Kolejność = indeksy graczy w symulacji; wartości to id klas. */
  classIds: string[];
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
/** Każda jednostka sojusznicza ma własną teksturę — jak bossy. */
const minionTextureKey = (def: MinionDef): string => `minion-${def.id}`;

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
  /** Panel talentów (klawisz T) — działa też w trakcie fali, bo co-op nie ma pauzy. */
  private talentUi: Phaser.GameObjects.GameObject[] = [];
  private talentPanelOpen = false;
  private pendingTalentPick = -1;
  /**
   * Bufory wejść JEDNORAZOWYCH. Render chodzi szybciej niż symulacja, więc
   * bez nich kliknięcie albo wciśnięcie klawisza wypadające w klatce bez
   * ticku po prostu przepadało — z perspektywy gracza „czasem nie działa".
   */
  private pendingSkillCast = -1;
  private pendingDash = false;
  /** Odcisk stanu drzewka — panel przerysowujemy tylko, gdy coś się zmieni. */
  private talentUiSignature = '';
  private lastSeenLevel = 1;

  /** Dźwięki grane RAZ na run — flaga `dead` zostaje na stałe. */
  private deathSoundPlayed = false;
  private victorySoundPlayed = false;
  /** Liczba zabójstw i trafień z poprzedniej klatki — z różnicy robimy dźwięk. */
  private lastSeenKills = 0;
  private lastSeenMobHitTick = -1;
  private lastSeenDashTick = -1;
  private lastSeenDashImpactTick = -1;

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
  private minionSprites: Phaser.GameObjects.Image[] = [];
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

  /** Podgląd zasięgu skilla — świeci, gdy skill jest gotowy (quick cast). */
  private aimPreview!: Phaser.GameObjects.Graphics;

  private keys!: {
    m: Phaser.Input.Keyboard.Key;
    n: Phaser.Input.Keyboard.Key;
    t: Phaser.Input.Keyboard.Key;
    q: Phaser.Input.Keyboard.Key;
    w: Phaser.Input.Keyboard.Key;
    e: Phaser.Input.Keyboard.Key;
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

  init(data: { classId?: string; coop?: CoopInit }): void {
    this.cls = classById(data.classId ?? DEFAULT_CLASS_ID) ?? CLASSES[0];
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
      // Nieznane id nie powinno tu dotrzeć (lobby odsiewa obce wersje gry),
      // ale symulacja nie może wywalić się na danych z sieci.
      const classes = this.coop.classIds.map((id) => classById(id) ?? CLASSES[0]);
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
    this.talentUi = [];
    this.talentPanelOpen = false;
    this.pendingTalentPick = -1;
    this.pendingSkillCast = -1;
    this.pendingDash = false;
    this.talentUiSignature = '';
    this.lastSeenLevel = 1;
    this.deathSoundPlayed = false;
    this.victorySoundPlayed = false;
    this.lastSeenKills = 0;
    this.lastSeenMobHitTick = -1;
    this.lastSeenDashTick = -1;
    this.lastSeenDashImpactTick = -1;
    this.accumulator = 0;
    this.lastSeenMeleeTick = -1;
    this.lastSeenHp = this.cls.maxHp;
    this.mobSprites = [];
    this.minionSprites = [];
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
    // Sprite'y jednostek — pool o rozmiarze poola symulacji, zero alokacji
    // w trakcie gry (ta sama zasada co przy mobkach).
    for (let i = 0; i < this.world.minions.length; i++) {
      this.minionSprites.push(
        this.add.image(0, 0, minionTextureKey(MINIONS[0])).setVisible(false).setDepth(3),
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
      t: kb.addKey(Phaser.Input.Keyboard.KeyCodes.T),
      // Skille: Q teraz, W/E/R w miarę projektowania kolejnych.
      q: kb.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
      w: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      e: kb.addKey(Phaser.Input.Keyboard.KeyCodes.E),
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
    // Jednostki sojusznicze — każda ma własną sylwetkę i rozmiar, jak bossy.
    for (const m of MINIONS) {
      makeGlowPolygon(this, minionTextureKey(m), m.shapeSides, m.radius, 0);
    }
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

    // QUICK CAST: klawisz odpala skill NATYCHMIAST w stronę kursora — bez
    // trybu celowania. Wzorzec wybrany pod przyszłe W/E/R: przy czterech
    // skillach „najpierw wyceluj, potem zatwierdź" byłoby nie do grania.
    // W przerwie i przy otwartym drzewku skille są wyłączone.
    const inBreak = this.world.phase === 'break';
    const uiBlocking = inBreak || this.talentPanelOpen;
    // Pierwszy gotowy slot, którego klawisz właśnie wciśnięto (Q/W/E).
    //
    // Wciśnięcie ZAPAMIĘTUJEMY, zamiast używać od razu: `JustDown` jest
    // prawdziwe tylko przez jedną klatkę, a tick symulacji wypada mniej
    // więcej co drugą. Bez bufora połowa wciśnięć znikała bez śladu.
    if (!uiBlocking) {
      const skillKeys = [this.keys.q, this.keys.w, this.keys.e];
      for (let i = 0; i < skillKeys.length; i++) {
        if (
          this.me.skillIds[i] &&
          this.me.skillCooldowns[i] <= 0 &&
          Phaser.Input.Keyboard.JustDown(skillKeys[i])
        ) {
          this.pendingSkillCast = i;
          break;
        }
      }
    }
    const skillCast = uiBlocking ? -1 : this.pendingSkillCast;
    // Spacja = doskok. Własny cooldown, więc nie konkuruje ze skillem.
    // Doskok buforujemy tak samo jak skille — z tego samego powodu.
    if (
      !uiBlocking &&
      Phaser.Input.Keyboard.JustDown(this.keys.space) &&
      this.me.dashCooldown <= 0
    ) {
      this.pendingDash = true;
    }
    const dash = !uiBlocking && this.pendingDash;

    // Wybór ulepszenia: klik w kartę (ustawia pendingUpgradePick) albo klawisze 1-4.
    if (inBreak) {
      const numberKeys = [this.keys.one, this.keys.two, this.keys.three, this.keys.four];
      for (let i = 0; i < Math.min(numberKeys.length, this.me.upgradeChoices.length); i++) {
        if (Phaser.Input.Keyboard.JustDown(numberKeys[i])) this.pendingUpgradePick = i;
      }
    }
    // Wyborów NIE kasujemy tutaj — robi to `update()` po tym, jak symulacja
    // je faktycznie skonsumowała (patrz komentarz przy `tickBefore`).
    const pick = this.pendingUpgradePick;
    const talentPick = this.pendingTalentPick;

    return {
      targetX: cursor.x,
      targetY: cursor.y,
      // Z otwartym panelem nie chodzimy — klik w talent nie ma przestawiać postaci.
      hasTarget: rmb && !this.talentPanelOpen,
      skillCast,
      aimX: cursor.x,
      aimY: cursor.y,
      dash,
      debugSpawn: this.keys.m.isDown,
      upgradePick: pick,
      talentPick,
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
    const bdef = boss ? BOSSES[boss.bossIndex] : undefined;
    const attack = bdef?.phases[boss!.phaseIndex]?.attacks[boss!.attackIndex];
    // Brak definicji = pomijamy telegraf bossa, ale telegrafy zwykłych
    // wrogów niżej rysujemy normalnie.
    if (boss && bdef && attack && boss.state === 'windup') {
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

    // Bezpiecznik: gdyby indeks bossa był nieprawidłowy, NIE wolno rzucić
    // wyjątkiem — wyjątek w renderze przerywa całą pętlę gry i wygląda dla
    // gracza jak zawieszenie (tak właśnie objawiał się błąd z 2026-07-20).
    const def = BOSSES[boss.bossIndex];
    if (!def) {
      if (this.bossName.visible) this.bossName.setVisible(false);
      return;
    }
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

  /* ── Drzewko talentów ─────────────────────────────────────────────────── */

  private clearTalentPanel(): void {
    for (const o of this.talentUi) o.destroy();
    this.talentUi = [];
    this.talentUiSignature = '';
  }

  /**
   * Panel przerysowujemy tylko, gdy stan drzewka faktycznie się zmienił —
   * odbudowa kilkudziesięciu obiektów co klatkę zjadłaby FPS przy hordzie.
   */
  private refreshTalentPanel(): void {
    if (!this.talentPanelOpen) return;
    const me = this.me;
    const signature = `${me.level}|${me.talentPoints}|${me.specIndex}|${me.talentRanks.join(',')}`;
    if (signature === this.talentUiSignature) return;
    this.talentUiSignature = signature;
    this.buildTalentPanel();
  }

  private buildTalentPanel(): void {
    for (const o of this.talentUi) o.destroy();
    this.talentUi = [];

    const cam = this.cameras.main;
    const me = this.me;
    const slots = talentSlotsFor(me.cls.id);
    const branches = branchesFor(me.cls.id);

    const add = <T extends Phaser.GameObjects.GameObject>(o: T): T => {
      this.talentUi.push(o);
      return o;
    };

    add(
      this.add
        .rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0x05070d, 0.82)
        .setScrollFactor(0)
        .setDepth(20),
    );

    const pts = me.talentPoints;
    const mustPickSpec = me.specIndex < 0 && me.level >= PROGRESSION.specLevel;
    add(
      this.add
        .text(
          cam.width / 2, 44,
          `${me.cls.name.toUpperCase()}   LEVEL ${me.level}/${PROGRESSION.maxLevel}` +
            `   —   ${pts} point${pts === 1 ? '' : 's'} to spend`,
          { fontFamily: 'monospace', fontSize: '22px', color: pts > 0 ? '#39ff14' : '#8899aa' },
        )
        .setOrigin(0.5).setScrollFactor(0).setDepth(21),
    );
    // Wybór specjalizacji jest nieodwracalny — komunikat musi to powiedzieć
    // WPROST, zanim gracz kliknie, a nie dopiero po fakcie.
    const hint = mustPickSpec
      ? 'CHOOSE YOUR SPECIALIZATION — this locks the other branches for the whole run'
      : me.specIndex < 0
        ? `specialization unlocks at level ${PROGRESSION.specLevel}`
        : 'T: close   —   spend deeper in a branch to unlock its lower rows';
    add(
      this.add
        .text(cam.width / 2, 72, hint, {
          fontFamily: 'monospace', fontSize: '13px',
          color: mustPickSpec ? '#ffd166' : '#556677',
        })
        .setOrigin(0.5).setScrollFactor(0).setDepth(21),
    );

    const colW = Math.min(320, (cam.width - 60) / 3);
    const startX = cam.width / 2 - colW;
    const startY = 150;

    branches.forEach((branch, bi) => {
      const cx = startX + bi * colW;
      const spent = me.spentPerBranch[bi] ?? 0;
      // Po wyborze specjalizacji pozostałe gałęzie są zamknięte na cały run.
      const branchClosed = me.specIndex >= 0 && me.specIndex !== bi;
      const isMySpec = me.specIndex === bi;

      add(
        this.add
          .text(cx, startY, branch.name, {
            fontFamily: 'monospace', fontSize: '18px',
            color: branch.comingSoon || branchClosed ? '#44505f' : isMySpec ? '#39ff14' : '#ffd166',
          })
          .setOrigin(0.5).setScrollFactor(0).setDepth(21),
      );
      add(
        this.add
          .text(
            cx, startY + 22,
            branch.comingSoon ? 'not designed yet'
              : branchClosed ? 'LOCKED — other path chosen'
                : isMySpec ? `YOUR PATH — ${spent} spent`
                  : 'available',
            { fontFamily: 'monospace', fontSize: '12px', color: branchClosed ? '#7a3b46' : '#667788' },
          )
          .setOrigin(0.5).setScrollFactor(0).setDepth(21),
      );

      branch.tiers.forEach((tier, ti) => {
        const rowY = startY + 66 + ti * 92;
        // Rząd specjalizacji ma inną regułę niż reszta: nie zależy od punktów
        // w gałęzi, tylko od poziomu i tego, czy wybór już zapadł.
        const tierLocked = tier.isSpec
          ? me.specIndex >= 0 || me.level < PROGRESSION.specLevel
          : branchClosed || spent < tier.requiresInBranch;

        if (tier.isSpec) {
          add(
            this.add
              .text(cx, rowY - 26, me.specIndex < 0 ? `SPECIALIZATION (level ${PROGRESSION.specLevel})` : '', {
                fontFamily: 'monospace', fontSize: '11px', color: '#ffd166',
              })
              .setOrigin(0.5).setScrollFactor(0).setDepth(21),
          );
        } else if (tier.requiresInBranch > 0) {
          add(
            this.add
              .text(cx, rowY - 26, `needs ${tier.requiresInBranch} in branch`, {
                fontFamily: 'monospace', fontSize: '11px',
                color: tierLocked ? '#aa4455' : '#33553f',
              })
              .setOrigin(0.5).setScrollFactor(0).setDepth(21),
          );
        }

        tier.talents.forEach((def, k) => {
          const index = slots.findIndex((s) => s.def.id === def.id);
          const rank = me.talentRanks[index] ?? 0;
          const maxed = rank >= def.maxRank;
          const canBuy = !tierLocked && !maxed && me.talentPoints > 0;

          const offset = tier.talents.length === 1 ? 0 : (k === 0 ? -72 : 72);
          const x = cx + offset;

          const stroke = maxed
            ? (tier.isSpec ? 0x39ff14 : 0xffd166)
            : tierLocked ? 0x333c48 : canBuy ? 0x39ff14 : 0x556677;
          const box = this.add
            // Rząd specjalizacji jest szerszy — mieści dłuższy opis i wizualnie
            // odstaje od zwykłych talentów, bo to decyzja innej wagi.
            .rectangle(x, rowY + 14, tier.isSpec ? 250 : 136, 62, tier.isSpec ? 0x111a2b : 0x0d1420)
            .setStrokeStyle(2, stroke)
            .setScrollFactor(0)
            .setDepth(21);
          add(box);

          if (canBuy) {
            box.setInteractive({ useHandCursor: true });
            box.on('pointerdown', () => {
              this.pendingTalentPick = index;
            });
          }

          const dim = tierLocked ? '#4a5563' : '#ccddee';
          add(
            this.add
              .text(x, rowY, def.name, {
                fontFamily: 'monospace', fontSize: '12px', color: maxed ? '#ffd166' : dim,
              })
              .setOrigin(0.5).setScrollFactor(0).setDepth(22),
          );
          add(
            this.add
              .text(x, rowY + 17, def.desc, {
                fontFamily: 'monospace', fontSize: tier.isSpec ? 9 : 10,
                color: tierLocked ? '#3d4652' : '#8899aa',
              })
              .setOrigin(0.5).setScrollFactor(0).setDepth(22),
          );
          add(
            this.add
              .text(x, rowY + 33, tier.isSpec ? (rank > 0 ? 'CHOSEN' : 'choose') : `${rank}/${def.maxRank}`, {
                fontFamily: 'monospace', fontSize: '12px',
                color: maxed ? '#ffd166' : tierLocked ? '#3d4652' : '#39ff14',
              })
              .setOrigin(0.5).setScrollFactor(0).setDepth(22),
          );
        });
      });

      if (branch.comingSoon) {
        add(
          this.add
            .text(cx, startY + 140, 'COMING\nSOON', {
              fontFamily: 'monospace', fontSize: '16px', color: '#2e3742', align: 'center',
            })
            .setOrigin(0.5).setScrollFactor(0).setDepth(21),
        );
      }
    });
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
      if (this.keys.r.isDown) this.scene.restart({ classId: this.cls.id });
      if (this.keys.c.isDown) this.scene.start('class-select');
      if (this.keys.l.isDown) this.scene.start('meta');
      return;
    }

    // Drzewko talentów (T). Nie zatrzymuje symulacji: w co-opie nie ma pauzy,
    // a czekanie z awansami do przerwy oznaczałoby granie słabszą postacią.
    if (Phaser.Input.Keyboard.JustDown(this.keys.t)) {
      this.talentPanelOpen = !this.talentPanelOpen;
      sfx.uiClick();
      if (this.talentPanelOpen) this.buildTalentPanel();
      else this.clearTalentPanel();
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

    const tickBefore = w.tick;
    if (this.session) {
      // Co-op: to sesja decyduje, kiedy wolno wykonać tick — świat rusza
      // dopiero, gdy znane są wejścia wszystkich graczy.
      this.session.update(deltaMs, input);
      this.accumulator = this.session.renderAlpha * C.TICK_DT;
    } else {
      // Single-player: stały krok, nadganiamy ile się zmieściło w delcie.
      // Limit 250 ms chroni przed "spiralą śmierci" po uśpionej karcie.
      this.accumulator += Math.min(deltaMs, 250) / 1000;
      let firstTick = true;
      while (this.accumulator >= C.TICK_DT) {
        // Kliknięcia i wciśnięcia klawiszy liczą się TYLKO w pierwszym ticku
        // klatki — inaczej jedno kliknięcie kupiłoby dwa talenty.
        w.step([firstTick ? input : withoutOneShots(input)]);
        firstTick = false;
        this.accumulator -= C.TICK_DT;
      }
    }

    // Wybory czyścimy DOPIERO gdy symulacja je faktycznie skonsumowała.
    // Render chodzi szybciej niż symulacja, więc bez tego co druga klatka
    // gubiła kliknięcie w talent albo w kartę ulepszenia — a gracz widział
    // tylko to, że „czasem klik nie działa".
    if (w.tick !== tickBefore) {
      this.pendingUpgradePick = -1;
      this.pendingTalentPick = -1;
      this.pendingSkillCast = -1;
      this.pendingDash = false;
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

    // Awans: krótki komunikat i dźwięk, żeby nie trzeba było patrzeć na HUD.
    if (this.me.level > this.lastSeenLevel) {
      this.lastSeenLevel = this.me.level;
      this.showBanner(`LEVEL ${this.me.level}   [T] to spend`, 1600);
      sfx.shield();
    }

    this.renderWorld(this.accumulator / C.TICK_DT);
    this.refreshTalentPanel();
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
    save.stats.lastClassId = this.cls.id;
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
      // Skok: postać „urasta", bo jest nad areną i nietykalna — to musi być
      // widać na pierwszy rzut oka, inaczej gracz nie wie, kiedy jest bezpieczny.
      if (w.isAirborne(p)) s.setScale(1.35);
      else if (p.dashTicksLeft > 0) s.setScale(1.12);
      else s.setScale(1);
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

    // Doskok: smuga w miejscu startu + dźwięk. Bez tego dash „nie czuć".
    if (me.lastDashTick !== this.lastSeenDashTick) {
      this.lastSeenDashTick = me.lastDashTick;
      if (me.lastDashTick >= 0) {
        const jump = w.dashOf(me).passesObstacles;
        const trail = this.add
          .circle(this.playerSprite.x, this.playerSprite.y, jump ? 30 : 22, this.cls.color, 0.35)
          .setDepth(4);
        this.tweens.add({
          targets: trail,
          alpha: 0,
          scale: jump ? 2.2 : 1.7,
          duration: 260,
          onComplete: () => trail.destroy(),
        });
        sfx.melee();
      }
    }

    // Power Jump: fala uderzeniowa w miejscu lądowania. Rysowana w promieniu
    // rażenia z definicji, więc zmiana liczby w DASHES od razu widać w grze.
    if (me.lastDashImpactTick !== this.lastSeenDashImpactTick) {
      this.lastSeenDashImpactTick = me.lastDashImpactTick;
      if (me.lastDashImpactTick >= 0) {
        const radius = w.dashImpactRadiusOf(me, w.dashOf(me));
        const ring = this.add
          .circle(this.playerSprite.x, this.playerSprite.y, radius * 0.4, this.cls.color, 0.28)
          .setStrokeStyle(4, 0xffffff, 0.9)
          .setDepth(6);
        this.tweens.add({
          targets: ring,
          alpha: 0,
          scale: 2.5,
          duration: 300,
          onComplete: () => ring.destroy(),
        });
        this.cameras.main.shake(140, 0.008);
        sfx.skill();
      }
    }

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
      const skillDef = w.skillOf(p);
      // Wachlarz rysujemy tylko dla ciosów; przywołania mają własny efekt.
      if (!skillDef || skillDef.kind !== 'cone') return;
      const s = this.playerSprites[i];
      const range = w.skillRangeOf(p);
      const angle = Math.atan2(p.lastSkillDirY, p.lastSkillDirX);
      // Nova (`coneCos: -1`) to pełne koło — `acos` bez przycięcia dałby NaN.
      const half = Math.acos(Math.max(-1, Math.min(1, skillDef.coneCos)));
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

    // Sojusznicze jednostki: jaśniejsze i z obwódką, żeby w hordzie było
    // od razu widać, co jest nasze, a co wroga.
    for (let i = 0; i < w.minions.length; i++) {
      const mi = w.minions[i];
      const s = this.minionSprites[i];
      if (!mi.alive) {
        if (s.visible) s.setVisible(false);
        continue;
      }
      const def = MINIONS[mi.defIndex];
      const key = minionTextureKey(def);
      if (!s.visible || s.texture.key !== key) s.setTexture(key).setVisible(true);
      s.setTint(def.color);
      s.setPosition(
        Phaser.Math.Linear(mi.prevX, mi.x, alpha),
        Phaser.Math.Linear(mi.prevY, mi.y, alpha),
      );
      // Zamach jednostki „puchnie" — ten sam język wizualny co u wrogów.
      s.setScale(mi.state === 'windup' ? 1.2 : 1);
      // Migotanie tuż przed zniknięciem: gracz wie, że totem zaraz wygaśnie.
      s.setAlpha(mi.ttl > 0 && mi.ttl < 60 && Math.floor(mi.ttl / 5) % 2 === 0 ? 0.35 : 1);

      // Duzi przywołańcy dostają pasek HP — tak samo jak koledzy z drużyny.
      if (def.showHpBar && mi.maxHp > 0) {
        const frac = Math.max(0, Math.min(1, mi.hp / mi.maxHp));
        const barW = 46;
        this.teamBars
          .fillStyle(0x000000, 0.6)
          .fillRect(s.x - barW / 2 - 1, s.y - def.radius - 13, barW + 2, 6)
          .fillStyle(def.color, 1)
          .fillRect(s.x - barW / 2, s.y - def.radius - 12, barW * frac, 4);
      }
    }

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

    // Podgląd zasięgu skilla — pokazuje się SAM, gdy skill jest gotowy.
    // Przy quick caście to jedyna informacja o tym, gdzie trafi cios.
    const previewSkill = w.skillOf(me);
    if (
      previewSkill?.kind === 'cone' && me.skillCooldowns[0] <= 0 &&
      !this.talentPanelOpen && w.phase !== 'break'
    ) {
      const pointer = this.input.activePointer;
      const cursor = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const angle = Math.atan2(cursor.y - this.playerSprite.y, cursor.x - this.playerSprite.x);
      // `coneCos: -1` to atak dookoła (nova) — rysujemy pełne koło, nie stożek.
      const half = Math.acos(Math.max(-1, Math.min(1, previewSkill.coneCos)));
      const range = this.world.skillRangeOf(me);
      this.aimPreview
        .clear()
        // Delikatniej niż dawny tryb celowania — teraz świeci non stop,
        // więc nie może przykrywać tego, co się dzieje na arenie.
        .fillStyle(this.cls.color, 0.07)
        .slice(this.playerSprite.x, this.playerSprite.y, range, angle - half, angle + half)
        .fillPath()
        .lineStyle(2, this.cls.color, 0.28)
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
    // Wszystkie obsadzone sloty na pasku — dzik-inżynier ma trzy naraz.
    const skill = me.skillIds
      .map((id, i) => {
        if (!id) return '';
        const def = w.skillOf(me, i);
        if (!def) return '';
        const cd = me.skillCooldowns[i];
        return cd <= 0
          ? `[${SKILL_KEYS[i]}] ${def.name}`
          : `[${SKILL_KEYS[i]}] ${(cd * C.TICK_DT).toFixed(1)}s`;
      })
      .filter(Boolean)
      .join('  ');
    // Doskok ma własny cooldown, więc i własny wskaźnik — inaczej gracz nie
    // wie, czy ucieczka jest dostępna.
    const dashName = w.dashOf(me).name;
    const dashState =
      me.dashCooldown <= 0
        ? `${dashName} ready [SPACE]`
        : `${dashName} ${(me.dashCooldown * C.TICK_DT).toFixed(1)}s`;
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

    // Nierozdane punkty wołają o uwagę — bez tego gracz gra słabszą postacią
    // i nawet nie wie dlaczego.
    const maxed = me.level >= PROGRESSION.maxLevel;
    const lvl =
      `LVL ${me.level}${maxed ? ' MAX' : ''}` +
      (me.specIndex < 0 && me.level >= PROGRESSION.specLevel
        ? '  ** CHOOSE SPECIALIZATION — [T] **'
        : me.talentPoints > 0
          ? `  ** ${me.talentPoints} TALENT POINT(S) — [T] **`
          : '');

    this.hud.setText(
      `${wavePart}  |  ${this.cls.name}  |  ${lvl}  |  FPS ${Math.round(this.game.loop.actualFps)}  |  ` +
        `mobs ${w.aliveMobs}  |  HP ${Math.round(me.hp)}/${w.maxHpOf(me)}  |  kills ${me.kills}${team}  |  ` +
        `${skill}  |  ${dashState}${shield}\n` +
        `items ${me.totalItemsCollected}${stats.length ? '  |  ' + stats.join('  ') : ''}\n` +
        `RMB: move   Q: slash   SPACE: ${dashName.toLowerCase()}   T: talents   ESC: pause   N: sound   hold M: dev spawn`,
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
