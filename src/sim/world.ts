import { Rng } from './rng';
import { SpatialHash } from './spatialHash';
import { type ClassDef } from './classes';
import { CONTACT_CONFIG, ENEMIES, type EnemyDef } from './enemies';
import { DROP_CONFIG, ITEM_CAPS, ITEMS, type ItemKind } from './itemsConfig';
import { BOSS_WAVES, UPGRADES, WAVE_CONFIG, WAVE_DURATION_TICKS } from './wavesConfig';
import { BOSSES, bossById, type BossAttack, type BossDef } from './bosses';
import type { MetaEffectKind } from './metaConfig';
import * as C from './constants';

/*
 *  ARCHITEKTURA (fundament pod co-op 1-8 graczy):
 *
 *   inputy WSZYSTKICH graczy ──► World.step(inputs[])  (stały tick 30/s)
 *                                      │
 *                                      ▼
 *                             stan świata (gracze, mobki, tick)
 *                                      │
 *                                      ▼
 *                   GameScene (Phaser) tylko RYSUJE stan + interpoluje
 *
 *  Reguły tego katalogu (src/sim):
 *   - zero importów z Phasera, zero DOM, zero Date.now(), zero localStorage
 *   - losowość wyłącznie przez this.rng
 *   - jedyne wejście danych z zewnątrz to argumenty konstruktora i tablica
 *     SimInput w step()
 *
 *  Lockstep: każdy klient liczy IDENTYCZNĄ symulację z tych samych inputów.
 *  Po sieci lecą wyłącznie inputy graczy (kilkadziesiąt bajtów na tick),
 *  nigdy pozycje mobków — dlatego 400 wrogów kosztuje w sieci dokładnie tyle
 *  samo co zero.
 */

/** Wejście jednego gracza na jeden tick. Jedyna droga danych do symulacji. */
export interface SimInput {
  /**
   * Sterowanie ruchem — wyłącznie mysz (Dota/LoL-style): cel ruchu we
   * współrzędnych ŚWIATA. hasTarget=true w ticku, w którym RMB jest wciśnięty
   * (klik = jeden tick z celem, trzymanie = cel aktualizowany co tick).
   * Cel jest trwały w stanie symulacji — postać idzie do niego sama.
   */
  targetX: number;
  targetY: number;
  hasTarget: boolean;
  /**
   * Power Slash z celowaniem: attack=true w ticku zatwierdzenia ciosu
   * (LMB po spacji); aimX/aimY = punkt świata, w którego KIERUNKU idzie cios.
   * Tryb celowania to stan UI (render), nie symulacji.
   */
  attack: boolean;
  aimX: number;
  aimY: number;
  /** Dev-helper (klawisz M): natychmiastowy spawn 50 mobków do testu wydajności. */
  debugSpawn: boolean;
  /**
   * Wybór ulepszenia w przerwie: indeks w `upgradeChoices` gracza (0..n-1)
   * albo -1 gdy jeszcze nie wybrał. Przerwa trwa, aż zdecydują WSZYSCY żywi.
   */
  upgradePick: number;
}

/** Pusty input — dla graczy, których dane jeszcze nie dotarły albo którzy padli. */
export const EMPTY_INPUT: SimInput = {
  targetX: 0, targetY: 0, hasTarget: false,
  attack: false, aimX: 0, aimY: 0,
  debugSpawn: false, upgradePick: -1,
};

/** Faza runu — maszyna stanów struktury rozgrywki. */
export type Phase = 'wave' | 'break' | 'victory';

/**
 * Trwały bonus z meta-progresji, nakładany na starcie runu.
 * Przekazywany jawnie do konstruktora — w co-opie każdy gracz ma własny
 * zestaw, więc musi trafić do symulacji jako dane wejściowe (rozsyłane przy
 * starcie sesji), a nie być czytany z localStorage w środku.
 */
export interface MetaBonus {
  kind: MetaEffectKind;
  value: number;
}

/** Okrągła przeszkoda terenu — blokuje graczy, mobki i pociski. */
export interface Obstacle {
  x: number;
  y: number;
  r: number;
}

export interface Mob {
  alive: boolean;
  /** Indeks w ENEMIES — typ najeźdźcy. */
  defIndex: number;
  x: number;
  y: number;
  /** Pozycja z poprzedniego ticka — do interpolacji w renderze. */
  prevX: number;
  prevY: number;
  hp: number;
  speed: number;
  /** Ticki do następnego ataku (strzał maga / młot Brute'a). */
  attackCooldown: number;
  /** Tick ostatniego otrzymanego ciosu — render robi z tego biały hit-flash. */
  lastHitTick: number;
  /**
   * Stan wroga z telegrafem:
   *  chase   — biegnie do najbliższego gracza
   *  windup  — zamach/ładowanie, stoi w miejscu (czas na ucieczkę)
   *  recover — po ataku, bezbronny (okno na kontrę)
   */
  state: 'chase' | 'windup' | 'recover' | 'charging';
  stateTicks: number;
  windupStartTick: number;
  lastSlamTick: number;
  /** Indeks gracza, na którego wróg aktualnie poluje. */
  targetPlayer: number;

  /** Indeks w BOSSES (-1 = zwykły wróg). Boss to po prostu wyróżniony mob, */
  /** dzięki czemu cała istniejąca logika trafień działa dla niego za darmo. */
  bossIndex: number;
  /** Faza walki i miejsce w cyklu ataków (tylko boss). */
  phaseIndex: number;
  attackIndex: number;
  /** Prędkość szarży (tylko w stanie 'charging'). */
  chargeVX: number;
  chargeVY: number;
  /** Promień i obrażenia trwającej szarży. */
  chargeRadius: number;
  chargeDamage: number;
}

export interface Projectile {
  alive: boolean;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  vx: number;
  vy: number;
  ttl: number;
  damage: number;
}

/** Item leżący na ziemi (drop z moba), czeka na zebranie albo despawn. */
export interface Pickup {
  alive: boolean;
  /** Indeks w ITEMS (itemsConfig.ts). */
  defIndex: number;
  x: number;
  y: number;
  ttl: number;
}

/**
 * Pełny stan jednego gracza. W single-playerze tablica ma jeden element,
 * w co-opie do ośmiu — reszta symulacji nie widzi różnicy.
 */
export interface Player {
  index: number;
  cls: ClassDef;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  hp: number;
  /**
   * Flaga śmierci ustawiana w momencie zadania obrażeń.
   * Bez niej regeneracja „wskrzeszała" gracza: obrażenia zbijały HP do zera,
   * a regen w tym samym ticku dorzucał ułamek punktu, więc `hp > 0` i gra
   * leciała dalej — z regenem dało się wygrać cały run stojąc w miejscu.
   */
  dead: boolean;
  /**
   * Gracz rozłączył się w co-opie. Trzymamy to osobno od `dead`, mimo że
   * rozłączony jest zawsze też martwy: render ma pokazać „LEFT" zamiast
   * „DEAD", a podsumowanie runu — nie liczyć rozłączenia jako porażki.
   */
  left: boolean;
  hurtCooldown: number;

  /** Kierunek patrzenia (ostatni niezerowy ruch) — domyślny kierunek ciosu. */
  facingX: number;
  facingY: number;
  /** Trwały cel ruchu z RMB (Dota-style); render czyta do rysowania markera. */
  moveTargetX: number;
  moveTargetY: number;
  hasMoveTarget: boolean;

  meleeCooldown: number;
  lastMeleeTick: number;
  skillCooldown: number;
  lastSkillTick: number;
  lastSkillDirX: number;
  lastSkillDirY: number;

  /** Modyfikatory z itemów i ulepszeń — permanentne do końca runu. */
  armorFlat: number;
  speedMult: number;
  attackSpeedMult: number;
  rangeMult: number;
  damageMult: number;
  shieldCharges: number;
  regenPerSec: number;
  maxHpBonus: number;
  cooldownMult: number;
  leechHealPerKill: number;
  magnetBonus: number;
  knockbackMult: number;
  thornsDamage: number;
  dropChanceBonus: number;

  /** Statystyki i historia — podsumowanie runu. */
  kills: number;
  itemCounts: number[];
  totalItemsCollected: number;
  lastPickupTick: number;
  lastPickupDefIndex: number;
  lastShieldTick: number;
  pickedUpgrades: number[];
  /** Ulepszenia wylosowane temu graczowi na aktualną przerwę. */
  upgradeChoices: number[];
  /** Czy gracz podjął już decyzję w tej przerwie. */
  hasPickedThisBreak: boolean;
}

export class World {
  readonly rng: Rng;
  tick = 0;

  readonly players: Player[] = [];

  /** Poole o stałym rozmiarze — zero alokacji w trakcie gry. */
  readonly mobs: Mob[] = [];
  readonly projectiles: Projectile[] = [];
  readonly pickups: Pickup[] = [];
  /** Przeszkody wygenerowane z seeda w konstruktorze — stałe przez cały run. */
  readonly obstacles: Obstacle[] = [];

  aliveMobs = 0;
  /** Ilu wrogów każdego typu żyje (indeks = ENEMIES) — pilnuje limitów maxAlive. */
  readonly aliveByType: number[] = ENEMIES.map(() => 0);
  /** Łączny licznik zabitych mobków (wszyscy gracze razem). */
  kills = 0;

  /* ── Boss ─────────────────────────────────────────────────────────────── */
  /** Indeks moba będącego bossem (-1 = brak bossa na arenie). */
  bossMobIndex = -1;
  /** HP startowe bossa — render rysuje z tego pasek. */
  bossMaxHp = 0;
  /** Tick ostatniej zmiany fazy bossa i jej komunikat (dla renderu). */
  bossPhaseTick = -1;
  bossPhaseAnnounce = '';

  get boss(): Mob | null {
    if (this.bossMobIndex < 0) return null;
    const m = this.mobs[this.bossMobIndex];
    return m.alive ? m : null;
  }

  get bossDef(): BossDef | null {
    const b = this.boss;
    return b ? BOSSES[b.bossIndex] : null;
  }

  /** Czy na bieżącej fali ma pojawić się boss. */
  get isBossWave(): boolean {
    return BOSS_WAVES[this.wave] !== undefined;
  }

  /* ── Struktura runu: fale i przerwy (wavesConfig.ts) ──────────────────── */
  phase: Phase = 'wave';
  /** Numer aktualnej fali, liczony od 1. */
  wave = 1;
  /** Ticki pozostałe do końca bieżącej fali. */
  waveTicksLeft = WAVE_DURATION_TICKS;

  private readonly hash = new SpatialHash();

  /**
   * @param seed        wspólny dla wszystkich klientów — z niego lecą przeszkody,
   *                    spawny i losowanie ulepszeń, więc świat jest identyczny
   * @param classes     klasa każdego gracza (długość = liczba graczy)
   * @param metaBonuses bonusy meta osobno dla każdego gracza
   */
  constructor(seed: number, classes: ClassDef[], metaBonuses: MetaBonus[][] = []) {
    this.rng = new Rng(seed);

    classes.forEach((cls, i) => {
      const p = this.createPlayer(i, cls);
      // Gracze startują w wachlarzu wokół środka areny, żeby się nie nakładali.
      if (classes.length > 1) {
        const angle = (i / classes.length) * Math.PI * 2;
        p.x = C.WORLD_W / 2 + Math.cos(angle) * 70;
        p.y = C.WORLD_H / 2 + Math.sin(angle) * 70;
      }
      p.prevX = p.x;
      p.prevY = p.y;
      for (const bonus of metaBonuses[i] ?? []) {
        if (bonus.kind === 'dropChance') p.dropChanceBonus += bonus.value;
        else this.applyEffect(p, bonus.kind, bonus.value);
      }
      p.hp = this.maxHpOf(p);
      this.players.push(p);
    });

    for (let i = 0; i < C.MOB_CAP; i++) {
      this.mobs.push({
        alive: false, defIndex: 0, x: 0, y: 0, prevX: 0, prevY: 0,
        hp: 0, speed: 0, attackCooldown: 0, lastHitTick: -100,
        state: 'chase', stateTicks: 0, windupStartTick: -100, lastSlamTick: -100,
        targetPlayer: 0,
        bossIndex: -1, phaseIndex: 0, attackIndex: 0,
        chargeVX: 0, chargeVY: 0, chargeRadius: 0, chargeDamage: 0,
      });
    }
    for (let i = 0; i < C.PROJECTILE_CAP; i++) {
      this.projectiles.push({
        alive: false, x: 0, y: 0, prevX: 0, prevY: 0, vx: 0, vy: 0, ttl: 0, damage: 0,
      });
    }
    for (let i = 0; i < DROP_CONFIG.maxGroundItems; i++) {
      this.pickups.push({ alive: false, defIndex: 0, x: 0, y: 0, ttl: 0 });
    }

    this.generateObstacles();
  }

  private createPlayer(index: number, cls: ClassDef): Player {
    return {
      index, cls,
      x: C.WORLD_W / 2, y: C.WORLD_H / 2, prevX: C.WORLD_W / 2, prevY: C.WORLD_H / 2,
      hp: cls.maxHp, dead: false, left: false, hurtCooldown: 0,
      facingX: 1, facingY: 0,
      moveTargetX: 0, moveTargetY: 0, hasMoveTarget: false,
      meleeCooldown: cls.meleeIntervalTicks, lastMeleeTick: -1,
      skillCooldown: 0, lastSkillTick: -1, lastSkillDirX: 1, lastSkillDirY: 0,
      armorFlat: 0, speedMult: 1, attackSpeedMult: 1, rangeMult: 1, damageMult: 1,
      shieldCharges: 0, regenPerSec: 0, maxHpBonus: 0, cooldownMult: 1,
      leechHealPerKill: 0, magnetBonus: 0, knockbackMult: 1, thornsDamage: 0,
      dropChanceBonus: 0,
      kills: 0, itemCounts: ITEMS.map(() => 0), totalItemsCollected: 0,
      lastPickupTick: -1, lastPickupDefIndex: -1, lastShieldTick: -1,
      pickedUpgrades: [], upgradeChoices: [], hasPickedThisBreak: false,
    };
  }

  /* ── Statystyki efektywne (baza klasy + modyfikatory) ─────────────────── */

  maxHpOf(p: Player): number {
    return p.cls.maxHp + p.maxHpBonus;
  }
  moveSpeedOf(p: Player): number {
    return p.cls.speed * p.speedMult;
  }
  meleeRangeOf(p: Player): number {
    return p.cls.meleeRange * p.rangeMult;
  }
  meleeDamageOf(p: Player): number {
    return p.cls.meleeDamage * p.damageMult;
  }
  meleeIntervalOf(p: Player): number {
    return Math.max(
      ITEM_CAPS.minMeleeIntervalTicks,
      Math.round(p.cls.meleeIntervalTicks / p.attackSpeedMult),
    );
  }
  skillCooldownTicksOf(p: Player): number {
    return Math.round(C.SKILL_COOLDOWN_TICKS * p.cooldownMult);
  }
  pickupRadiusOf(p: Player): number {
    return DROP_CONFIG.pickupRadiusBase + p.magnetBonus;
  }

  /* ── Stan runu ────────────────────────────────────────────────────────── */

  get livingPlayers(): Player[] {
    return this.players.filter((p) => !p.dead);
  }

  /**
   * Gracz opuścił grę (zamknął kartę / stracił połączenie).
   *
   * MUSI być wywołane na WSZYSTKICH klientach w tym samym ticku, inaczej
   * symulacje się rozjadą — tym zajmuje się LockstepSession, która uzgadnia
   * tick rozłączenia po sieci. Tu tylko efekt: postać znika z pola walki.
   */
  dropPlayer(index: number): void {
    const p = this.players[index];
    if (!p || p.left) return;
    p.left = true;
    p.dead = true;
    p.hasMoveTarget = false;
    // Gdyby odszedł w trakcie przerwy, reszta czekałaby na jego wybór
    // ulepszenia w nieskończoność — dokładnie ten zwis, który naprawiamy.
    p.hasPickedThisBreak = true;
  }

  /** Run przegrany, gdy padli wszyscy — w co-opie jeden trup nie kończy gry. */
  get allPlayersDead(): boolean {
    return this.players.every((p) => p.dead);
  }

  get isRunOver(): boolean {
    return this.allPlayersDead || this.phase === 'victory';
  }

  /** Ile fal drużyna faktycznie zaliczyła (do nagrody meta). */
  get wavesCleared(): number {
    return this.phase === 'victory' ? WAVE_CONFIG.totalWaves : this.wave - 1;
  }

  /** Mnożnik HP wrogów w bieżącej fali (krzywa trudności: wavesConfig.ts). */
  get enemyHpMult(): number {
    return 1 + (this.wave - 1) * (WAVE_CONFIG.enemyHpPercentPerWave / 100);
  }

  /** Mnożnik obrażeń wrogów w bieżącej fali. */
  get enemyDamageMult(): number {
    return 1 + (this.wave - 1) * (WAVE_CONFIG.enemyDamagePercentPerWave / 100);
  }

  /** Czas trwania bieżącej fali (fale-wyzwania co N fal są dłuższe). */
  get currentWaveDurationTicks(): number {
    const elite =
      WAVE_CONFIG.eliteEveryNWaves > 0 && this.wave % WAVE_CONFIG.eliteEveryNWaves === 0;
    return Math.round(WAVE_DURATION_TICKS * (elite ? WAVE_CONFIG.eliteWaveMultiplier : 1));
  }

  /**
   * Jeden krok symulacji. `inputs[i]` należy do gracza `i`;
   * brakujące wpisy są traktowane jak brak akcji.
   */
  step(inputs: SimInput[]): void {
    if (this.isRunOver) return;
    this.tick++;

    const inputOf = (p: Player): SimInput => inputs[p.index] ?? EMPTY_INPUT;

    if (this.phase === 'break') {
      this.stepBreak(inputOf);
      return;
    }

    this.savePrevPositions();
    for (const p of this.players) {
      if (!p.dead) this.movePlayer(p, inputOf(p));
    }
    this.spawnMobs(this.players.some((p) => !p.dead && inputOf(p).debugSpawn));
    this.rebuildHash();
    this.moveMobsAndAttack();
    this.stepProjectiles();
    for (const p of this.players) {
      if (p.dead) continue;
      this.applyMelee(p);
      this.applySkill(p, inputOf(p));
      this.applyContactDamage(p);
    }
    this.stepPickups();
    for (const p of this.players) {
      if (!p.dead) this.applyRegen(p);
    }

    // Fala z bossem nie kończy się na czas — trwa, dopóki boss żyje.
    if (this.isBossWave) {
      if (this.bossMobIndex >= 0 && !this.boss) this.endWave();
      return;
    }
    this.waveTicksLeft--;
    if (this.waveTicksLeft <= 0) this.endWave();
  }

  /* ── Fale i przerwy ───────────────────────────────────────────────────── */

  /**
   * W przerwie gracze chodzą (mogą pozbierać leżące itemy) i wybierają
   * ulepszenia. Fala rusza dopiero, gdy zdecydują WSZYSCY żywi — nikt nie
   * zostaje z tyłu z niewybraną kartą.
   */
  private stepBreak(inputOf: (p: Player) => SimInput): void {
    this.savePrevPositions();
    for (const p of this.players) {
      if (p.dead) continue;
      const input = inputOf(p);
      this.movePlayer(p, input);

      if (!p.hasPickedThisBreak) {
        const pick = input.upgradePick;
        if (pick >= 0 && pick < p.upgradeChoices.length) {
          const defIndex = p.upgradeChoices[pick];
          const def = UPGRADES[defIndex];
          this.applyEffect(p, def.kind, def.value);
          p.pickedUpgrades.push(defIndex);
          p.hasPickedThisBreak = true;
        }
      }
    }
    this.stepPickups();
    for (const p of this.players) {
      if (!p.dead) this.applyRegen(p);
    }

    const living = this.livingPlayers;
    if (living.length > 0 && living.every((p) => p.hasPickedThisBreak)) {
      this.startNextWave();
    }
  }

  private endWave(): void {
    if (WAVE_CONFIG.clearMobsBetweenWaves) {
      for (let i = 0; i < this.mobs.length; i++) this.mobs[i].alive = false;
      for (let i = 0; i < this.projectiles.length; i++) this.projectiles[i].alive = false;
      this.aliveMobs = 0;
      for (let i = 0; i < this.aliveByType.length; i++) this.aliveByType[i] = 0;
    }

    if (this.wave >= WAVE_CONFIG.totalWaves) {
      this.phase = 'victory';
      return;
    }
    this.phase = 'break';
    for (const p of this.players) {
      p.hasPickedThisBreak = p.dead;
      p.upgradeChoices = [];
      if (!p.dead) this.rollUpgradeChoices(p);
    }
  }

  /** Losuje ulepszenia dla gracza (deterministycznie, bez powtórek w trójce). */
  private rollUpgradeChoices(p: Player): void {
    p.upgradeChoices = [];
    // Leczenie przy (prawie) pełnym HP to zmarnowana karta — nie oferujemy go.
    const healthy = p.hp >= this.maxHpOf(p) * 0.9;
    const eligible = (i: number): boolean =>
      !p.upgradeChoices.includes(i) && !(healthy && UPGRADES[i].kind === 'medkit');

    const available = UPGRADES.filter((_, i) => !(healthy && UPGRADES[i].kind === 'medkit')).length;
    const count = Math.min(WAVE_CONFIG.upgradeChoices, available);
    while (p.upgradeChoices.length < count) {
      let totalWeight = 0;
      for (let i = 0; i < UPGRADES.length; i++) {
        if (eligible(i)) totalWeight += UPGRADES[i].weight;
      }
      let roll = this.rng.next() * totalWeight;
      for (let i = 0; i < UPGRADES.length; i++) {
        if (!eligible(i)) continue;
        roll -= UPGRADES[i].weight;
        if (roll <= 0) {
          p.upgradeChoices.push(i);
          break;
        }
      }
    }
  }

  private startNextWave(): void {
    this.wave++;
    this.phase = 'wave';
    this.waveTicksLeft = this.currentWaveDurationTicks;
    // Nowa fala = nowy boss (albo jego brak).
    this.bossMobIndex = -1;
    this.bossMaxHp = 0;
    for (const p of this.players) {
      p.upgradeChoices = [];
      p.hasPickedThisBreak = false;
    }
  }

  /* ── Świat: przeszkody ────────────────────────────────────────────────── */

  /** Losowe przeszkody z seeda — deterministyczne, z czystą strefą startową. */
  private generateObstacles(): void {
    let attempts = 0;
    const cx = C.WORLD_W / 2;
    const cy = C.WORLD_H / 2;
    while (this.obstacles.length < C.OBSTACLE_COUNT && attempts < C.OBSTACLE_COUNT * 10) {
      attempts++;
      const r = this.rng.range(C.OBSTACLE_RADIUS_MIN, C.OBSTACLE_RADIUS_MAX);
      const x = this.rng.range(r, C.WORLD_W - r);
      const y = this.rng.range(r, C.WORLD_H - r);
      const dx = x - cx;
      const dy = y - cy;
      const clearance = C.OBSTACLE_SPAWN_CLEARANCE + r;
      if (dx * dx + dy * dy < clearance * clearance) continue;
      this.obstacles.push({ x, y, r });
    }
  }

  private projectileHitsObstacle(x: number, y: number): boolean {
    for (let i = 0; i < this.obstacles.length; i++) {
      const o = this.obstacles[i];
      const dx = x - o.x;
      const dy = y - o.y;
      const minD = o.r + C.PROJECTILE_RADIUS;
      if (dx * dx + dy * dy < minD * minD) return true;
    }
    return false;
  }

  /**
   * Wypycha okrąg (x, y, radius) poza wszystkie przeszkody.
   * Zwraca skorygowaną pozycję; przy idealnym środku przeszkody wypycha w prawo.
   */
  private pushOutOfObstacles(x: number, y: number, radius: number): { x: number; y: number } {
    for (let i = 0; i < this.obstacles.length; i++) {
      const o = this.obstacles[i];
      const dx = x - o.x;
      const dy = y - o.y;
      const minD = o.r + radius;
      const d2 = dx * dx + dy * dy;
      if (d2 >= minD * minD) continue;
      const d = Math.sqrt(d2);
      if (d < 0.001) {
        x = o.x + minD;
      } else {
        x = o.x + (dx / d) * minD;
        y = o.y + (dy / d) * minD;
      }
    }
    return { x, y };
  }

  /* ── Gracze ───────────────────────────────────────────────────────────── */

  private savePrevPositions(): void {
    for (const p of this.players) {
      p.prevX = p.x;
      p.prevY = p.y;
    }
    for (let i = 0; i < this.mobs.length; i++) {
      const m = this.mobs[i];
      if (!m.alive) continue;
      m.prevX = m.x;
      m.prevY = m.y;
    }
    for (let i = 0; i < this.projectiles.length; i++) {
      const p = this.projectiles[i];
      if (!p.alive) continue;
      p.prevX = p.x;
      p.prevY = p.y;
    }
  }

  private movePlayer(p: Player, input: SimInput): void {
    // Nowy cel z RMB (klik lub trzymanie) — cel przycięty do granic świata.
    if (input.hasTarget) {
      p.moveTargetX = Math.min(Math.max(input.targetX, C.PLAYER_RADIUS), C.WORLD_W - C.PLAYER_RADIUS);
      p.moveTargetY = Math.min(Math.max(input.targetY, C.PLAYER_RADIUS), C.WORLD_H - C.PLAYER_RADIUS);
      p.hasMoveTarget = true;
    }
    if (!p.hasMoveTarget) return;

    let dx = p.moveTargetX - p.x;
    let dy = p.moveTargetY - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const stepLen = this.moveSpeedOf(p) * C.TICK_DT;

    if (dist <= stepLen) {
      // Dochodzimy do celu w tym ticku — snap i stop (bez drgania wokół punktu).
      p.x = p.moveTargetX;
      p.y = p.moveTargetY;
      p.hasMoveTarget = false;
      if (dist > 0.001) {
        p.facingX = dx / dist;
        p.facingY = dy / dist;
      }
    } else {
      dx /= dist;
      dy /= dist;
      p.facingX = dx;
      p.facingY = dy;
      p.x += dx * stepLen;
      p.y += dy * stepLen;
    }

    // Kolizja z przeszkodami + granice świata.
    const pushed = this.pushOutOfObstacles(p.x, p.y, C.PLAYER_RADIUS);
    p.x = Math.min(Math.max(pushed.x, C.PLAYER_RADIUS), C.WORLD_W - C.PLAYER_RADIUS);
    p.y = Math.min(Math.max(pushed.y, C.PLAYER_RADIUS), C.WORLD_H - C.PLAYER_RADIUS);

    // Cel nieosiągalny (gracz zablokowany o przeszkodę) — kasujemy, żeby nie drgał.
    const movedX = p.x - p.prevX;
    const movedY = p.y - p.prevY;
    if (p.hasMoveTarget && movedX * movedX + movedY * movedY < 0.01) {
      p.hasMoveTarget = false;
    }
  }

  /* ── Wrogowie ─────────────────────────────────────────────────────────── */

  /**
   * Losuje typ najeźdźcy spośród odblokowanych (wagi z ENEMIES).
   * Typy z limitem `maxAlive` wypadają z puli po osiągnięciu limitu.
   */
  private pickEnemyDef(elapsedSeconds: number): number {
    const eligible = (i: number): boolean => {
      const def = ENEMIES[i];
      if (def.unlockAtSeconds > elapsedSeconds) return false;
      if (def.maxAlive > 0 && this.aliveByType[i] >= def.maxAlive) return false;
      return true;
    };

    let totalWeight = 0;
    for (let i = 0; i < ENEMIES.length; i++) if (eligible(i)) totalWeight += ENEMIES[i].weight;
    if (totalWeight <= 0) return 0;

    let roll = this.rng.next() * totalWeight;
    for (let i = 0; i < ENEMIES.length; i++) {
      if (!eligible(i)) continue;
      roll -= ENEMIES[i].weight;
      if (roll <= 0) return i;
    }
    return 0;
  }

  /** Wstawia bossa fali na arenę (raz na falę). Definicja: src/sim/bosses/. */
  private spawnBoss(defId: string): void {
    const def = bossById(defId);
    const living = this.livingPlayers;
    if (!def || living.length === 0) return;
    const slot = this.findFreeMobSlot();
    if (slot === -1) return;

    const around = living[0];
    const angle = this.rng.range(0, Math.PI * 2);
    const m = this.mobs[slot];
    m.defIndex = 0;
    m.bossIndex = BOSSES.indexOf(def);
    m.x = Math.min(Math.max(around.x + Math.cos(angle) * 520, def.radius), C.WORLD_W - def.radius);
    m.y = Math.min(Math.max(around.y + Math.sin(angle) * 520, def.radius), C.WORLD_H - def.radius);
    m.prevX = m.x;
    m.prevY = m.y;
    // HP bossa rośnie z liczbą graczy — inaczej czterech ziomków rozłożyłoby
    // go zanim zdążyłby pokazać drugą fazę.
    const teamMult =
      1 + (living.length - 1) * (WAVE_CONFIG.bossHpPercentPerExtraPlayer / 100);
    m.hp = def.hp * this.enemyHpMult * teamMult;
    this.bossMaxHp = m.hp;
    m.speed = def.speed;
    m.state = 'chase';
    m.stateTicks = 0;
    m.phaseIndex = 0;
    m.attackIndex = 0;
    m.attackCooldown = def.phases[0].attackIntervalTicks;
    m.lastHitTick = -100;
    m.alive = true;
    this.aliveMobs++;
    this.bossMobIndex = slot;
    this.bossPhaseTick = this.tick;
    this.bossPhaseAnnounce = def.phases[0].announce;
  }

  private spawnMobs(debugSpawn: boolean): void {
    const living = this.livingPlayers;
    if (living.length === 0) return;

    // Boss pojawia się raz, na początku swojej fali.
    const bossId = BOSS_WAVES[this.wave];
    if (bossId && this.bossMobIndex < 0) this.spawnBoss(bossId);

    const elapsedSeconds = this.tick * C.TICK_DT;
    // Liczba wrogów rośnie z falą ORAZ z liczbą graczy — inaczej co-op byłby
    // trywialny (ta sama horda rozłożona na ośmiu).
    const elite =
      WAVE_CONFIG.eliteEveryNWaves > 0 && this.wave % WAVE_CONFIG.eliteEveryNWaves === 0;
    const perPlayer = 1 + (living.length - 1) * (WAVE_CONFIG.mobsPercentPerExtraPlayer / 100);
    // Na fali z bossem zwykłych wrogów jest mniej — walka ma być o bossa.
    const bossWaveMult = this.isBossWave ? WAVE_CONFIG.bossWaveMobsPercent / 100 : 1;
    let target = Math.min(
      Math.round(
        (WAVE_CONFIG.mobsBase + (this.wave - 1) * WAVE_CONFIG.mobsPerWave) *
          (elite ? WAVE_CONFIG.eliteWaveMultiplier : 1) *
          perPlayer *
          bossWaveMult,
      ),
      C.MOB_CAP,
    );
    if (debugSpawn) target = Math.min(this.aliveMobs + 50, C.MOB_CAP);

    while (this.aliveMobs < target) {
      const slot = this.findFreeMobSlot();
      if (slot === -1) return;
      const m = this.mobs[slot];
      const defIndex = this.pickEnemyDef(elapsedSeconds);
      const def = ENEMIES[defIndex];
      // Spawn wokół losowego żywego gracza — presja rozkłada się na drużynę.
      const around = living[Math.floor(this.rng.next() * living.length)] ?? living[0];
      const angle = this.rng.range(0, Math.PI * 2);
      m.defIndex = defIndex;
      m.x = around.x + Math.cos(angle) * C.MOB_SPAWN_DISTANCE;
      m.y = around.y + Math.sin(angle) * C.MOB_SPAWN_DISTANCE;
      m.x = Math.min(Math.max(m.x, def.radius), C.WORLD_W - def.radius);
      m.y = Math.min(Math.max(m.y, def.radius), C.WORLD_H - def.radius);
      m.prevX = m.x;
      m.prevY = m.y;
      m.hp = def.hp * this.enemyHpMult;
      m.speed = this.rng.range(def.speedMin, def.speedMax);
      m.attackCooldown = def.ranged ? def.ranged.cooldownTicks : 0;
      m.state = 'chase';
      m.stateTicks = 0;
      m.windupStartTick = -100;
      m.lastSlamTick = -100;
      m.targetPlayer = around.index;
      m.alive = true;
      this.aliveMobs++;
      this.aliveByType[defIndex]++;
    }
  }

  private findFreeMobSlot(): number {
    for (let i = 0; i < this.mobs.length; i++) if (!this.mobs[i].alive) return i;
    return -1;
  }

  private rebuildHash(): void {
    this.hash.clear();
    for (let i = 0; i < this.mobs.length; i++) {
      const m = this.mobs[i];
      if (m.alive) this.hash.insert(i, m.x, m.y);
    }
  }

  /** Najbliższy żywy gracz — cel polowania mobków. */
  private nearestLivingPlayer(x: number, y: number): Player | null {
    let best: Player | null = null;
    let bestD2 = Infinity;
    for (const p of this.players) {
      if (p.dead) continue;
      const dx = p.x - x;
      const dy = p.y - y;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestD2) {
        bestD2 = d2;
        best = p;
      }
    }
    return best;
  }

  private moveMobsAndAttack(): void {
    const separationRadius = C.MOB_RADIUS * 2;
    for (let i = 0; i < this.mobs.length; i++) {
      const m = this.mobs[i];
      if (!m.alive) continue;
      const def = ENEMIES[m.defIndex];

      const target = this.nearestLivingPlayer(m.x, m.y);
      if (!target) continue;
      m.targetPlayer = target.index;

      // Boss ma własny cykl ataków i fazy — obsługiwany osobno.
      if (m.bossIndex >= 0) {
        this.stepBoss(m, BOSSES[m.bossIndex], target);
        continue;
      }

      let dx = target.x - m.x;
      let dy = target.y - m.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      dx /= dist;
      dy /= dist;

      // advance: 1 = biegnie na gracza, 0 = stoi (zamach, ładowanie, odpoczynek).
      let advance = 1;
      if (m.attackCooldown > 0) m.attackCooldown--;

      if (m.state === 'windup' || m.state === 'recover') {
        advance = 0;
        m.stateTicks--;
        if (m.stateTicks <= 0) {
          if (m.state === 'windup') this.resolveWindup(m, def, target);
          else m.state = 'chase';
        }
      } else if (def.slam && dist <= def.slam.triggerRange && m.attackCooldown === 0) {
        // Ciężki wróg w zasięgu — zaczyna zamach (gracz ma czas odskoczyć).
        m.state = 'windup';
        m.stateTicks = def.slam.windupTicks;
        m.windupStartTick = this.tick;
        advance = 0;
      } else if (def.ranged) {
        // Strzelec trzyma dystans; strzał też ma telegraf.
        if (dist <= def.ranged.holdDistance) {
          advance = 0;
          if (m.attackCooldown === 0) {
            m.state = 'windup';
            m.stateTicks = def.ranged.windupTicks;
            m.windupStartTick = this.tick;
          }
        }
      }

      // Miękkie rozpychanie sąsiadów, żeby horda nie zlewała się w jeden punkt.
      const mobRadius = def.radius;
      const sep = Math.max(separationRadius, mobRadius * 2);
      let pushX = 0;
      let pushY = 0;
      this.hash.forEachNear(m.x, m.y, sep, (j) => {
        if (j === i) return;
        const o = this.mobs[j];
        const ox = m.x - o.x;
        const oy = m.y - o.y;
        const d2 = ox * ox + oy * oy;
        if (d2 > 0 && d2 < sep * sep) {
          const d = Math.sqrt(d2);
          const force = (sep - d) / sep;
          pushX += (ox / d) * force;
          pushY += (oy / d) * force;
        }
      });

      m.x += (dx * m.speed * advance + pushX * 60) * C.TICK_DT;
      m.y += (dy * m.speed * advance + pushY * 60) * C.TICK_DT;

      // Przeszkody blokują też najeźdźców (wypchnięcie = ślizganie po okręgu).
      const pushed = this.pushOutOfObstacles(m.x, m.y, mobRadius);
      m.x = pushed.x;
      m.y = pushed.y;
    }
  }

  /* ── Boss: fazy i cykl ataków ─────────────────────────────────────────── */

  /**
   * Krok bossa. Zachowanie jest w całości sterowane deklaracją z pliku bossa
   * (src/sim/bosses/) — tutaj tylko wykonujemy to, co tam zapisane.
   */
  private stepBoss(m: Mob, def: BossDef, target: Player): void {
    // Wejście w kolejną fazę, gdy HP spadnie poniżej progu.
    const frac = this.bossMaxHp > 0 ? m.hp / this.bossMaxHp : 1;
    for (let i = def.phases.length - 1; i > m.phaseIndex; i--) {
      if (frac <= def.phases[i].hpFraction) {
        m.phaseIndex = i;
        m.attackIndex = 0;
        m.attackCooldown = def.phases[i].attackIntervalTicks;
        this.bossPhaseTick = this.tick;
        this.bossPhaseAnnounce = def.phases[i].announce;
        break;
      }
    }
    const phase = def.phases[m.phaseIndex];

    if (m.attackCooldown > 0) m.attackCooldown--;

    if (m.state === 'charging') {
      // Szarża: boss pędzi po prostej i rani wszystkich po drodze.
      m.stateTicks--;
      m.x = Math.min(Math.max(m.x + m.chargeVX * C.TICK_DT, def.radius), C.WORLD_W - def.radius);
      m.y = Math.min(Math.max(m.y + m.chargeVY * C.TICK_DT, def.radius), C.WORLD_H - def.radius);
      const reach = m.chargeRadius + C.PLAYER_RADIUS;
      for (const p of this.players) {
        if (p.dead) continue;
        const dx = p.x - m.x;
        const dy = p.y - m.y;
        if (dx * dx + dy * dy <= reach * reach) {
          this.damagePlayer(p, m.chargeDamage * this.enemyDamageMult);
        }
      }
      if (m.stateTicks <= 0) {
        m.state = 'recover';
        m.stateTicks = m.attackCooldown = phase.attackIntervalTicks;
      }
      return;
    }

    if (m.state === 'windup' || m.state === 'recover') {
      m.stateTicks--;
      if (m.stateTicks <= 0) {
        if (m.state === 'windup') this.executeBossAttack(m, def, phase.attacks[m.attackIndex], target);
        else m.state = 'chase';
      }
      return;
    }

    // Chase: podchodzi do gracza i czeka na moment ataku.
    let dx = target.x - m.x;
    let dy = target.y - m.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    dx /= dist;
    dy /= dist;
    m.x += dx * def.speed * phase.speedMult * C.TICK_DT;
    m.y += dy * def.speed * phase.speedMult * C.TICK_DT;
    const pushed = this.pushOutOfObstacles(m.x, m.y, def.radius);
    m.x = pushed.x;
    m.y = pushed.y;

    if (m.attackCooldown <= 0) {
      const attack = phase.attacks[m.attackIndex];
      m.state = 'windup';
      m.stateTicks = attack.windupTicks;
      m.windupStartTick = this.tick;
    }
  }

  /** Wykonanie pojedynczego ataku bossa po zakończeniu zamachu. */
  private executeBossAttack(m: Mob, def: BossDef, attack: BossAttack, target: Player): void {
    const phase = def.phases[m.phaseIndex];

    switch (attack.kind) {
      case 'slam': {
        m.lastSlamTick = this.tick;
        const reach = attack.hitRadius + C.PLAYER_RADIUS;
        for (const p of this.players) {
          if (p.dead) continue;
          const dx = p.x - m.x;
          const dy = p.y - m.y;
          if (dx * dx + dy * dy <= reach * reach) {
            this.damagePlayer(p, attack.damage * this.enemyDamageMult);
          }
        }
        m.state = 'recover';
        m.stateTicks = attack.recoverTicks;
        break;
      }
      case 'ring': {
        // Pociski równomiernie w okręgu — luka do wybiegnięcia zawsze istnieje.
        for (let i = 0; i < attack.count; i++) {
          const a = (i / attack.count) * Math.PI * 2;
          this.spawnProjectile(
            m.x, m.y,
            Math.cos(a) * attack.projectileSpeed,
            Math.sin(a) * attack.projectileSpeed,
            attack.damage * this.enemyDamageMult,
          );
        }
        m.state = 'recover';
        m.stateTicks = attack.recoverTicks;
        break;
      }
      case 'charge': {
        const dx = target.x - m.x;
        const dy = target.y - m.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        m.chargeVX = (dx / d) * attack.speed;
        m.chargeVY = (dy / d) * attack.speed;
        m.chargeRadius = attack.hitRadius;
        m.chargeDamage = attack.damage;
        m.state = 'charging';
        m.stateTicks = attack.durationTicks;
        break;
      }
      case 'summon': {
        const defIndex = ENEMIES.findIndex((e) => e.id === attack.enemyId);
        if (defIndex >= 0) {
          for (let i = 0; i < attack.count; i++) {
            const a = this.rng.range(0, Math.PI * 2);
            this.spawnMobAt(defIndex, m.x + Math.cos(a) * 90, m.y + Math.sin(a) * 90);
          }
        }
        m.state = 'recover';
        m.stateTicks = attack.recoverTicks;
        break;
      }
    }

    // Kolejny atak z cyklu fazy.
    m.attackIndex = (m.attackIndex + 1) % phase.attacks.length;
    m.attackCooldown = phase.attackIntervalTicks;
  }

  /**
   * Koniec zamachu: młot Brute'a trafia w obszar (jeśli gracz nie uciekł),
   * a mag wypuszcza pocisk. Potem wróg przechodzi w fazę bezbronności.
   */
  private resolveWindup(m: Mob, def: EnemyDef, target: Player): void {
    if (def.slam) {
      m.lastSlamTick = this.tick;
      const reach = def.slam.hitRadius + C.PLAYER_RADIUS;
      // Młot rani KAŻDEGO gracza w obszarze — w co-opie nie stójcie w kupie.
      for (const p of this.players) {
        if (p.dead) continue;
        const dx = p.x - m.x;
        const dy = p.y - m.y;
        if (dx * dx + dy * dy <= reach * reach) {
          this.damagePlayer(p, def.slam.damage * this.enemyDamageMult);
        }
      }
      m.state = 'recover';
      m.stateTicks = def.slam.recoverTicks;
      m.attackCooldown = def.slam.recoverTicks;
      return;
    }
    if (def.ranged) {
      const dx = target.x - m.x;
      const dy = target.y - m.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      this.fireProjectile(m.x, m.y, dx / d, dy / d, def);
      m.attackCooldown = def.ranged.cooldownTicks;
    }
    m.state = 'chase';
  }

  private fireProjectile(x: number, y: number, dirX: number, dirY: number, def: EnemyDef): void {
    const r = def.ranged;
    if (!r) return;
    this.spawnProjectile(
      x, y,
      dirX * r.projectileSpeed,
      dirY * r.projectileSpeed,
      r.projectileDamage * this.enemyDamageMult,
    );
  }

  /** Wspólny spawner pocisków — używany przez magów i ataki bossów. */
  private spawnProjectile(x: number, y: number, vx: number, vy: number, damage: number): void {
    for (let i = 0; i < this.projectiles.length; i++) {
      const p = this.projectiles[i];
      if (p.alive) continue;
      p.alive = true;
      p.x = x;
      p.y = y;
      p.prevX = x;
      p.prevY = y;
      p.vx = vx;
      p.vy = vy;
      p.ttl = C.PROJECTILE_TTL_TICKS;
      p.damage = damage;
      return;
    }
  }

  /** Stawia wroga w konkretnym miejscu (przyzywanie przez bossa). */
  private spawnMobAt(defIndex: number, x: number, y: number): void {
    const slot = this.findFreeMobSlot();
    if (slot === -1) return;
    const def = ENEMIES[defIndex];
    const m = this.mobs[slot];
    m.defIndex = defIndex;
    m.bossIndex = -1;
    m.x = Math.min(Math.max(x, def.radius), C.WORLD_W - def.radius);
    m.y = Math.min(Math.max(y, def.radius), C.WORLD_H - def.radius);
    m.prevX = m.x;
    m.prevY = m.y;
    m.hp = def.hp * this.enemyHpMult;
    m.speed = this.rng.range(def.speedMin, def.speedMax);
    m.attackCooldown = def.ranged ? def.ranged.cooldownTicks : 0;
    m.state = 'chase';
    m.stateTicks = 0;
    m.lastHitTick = -100;
    m.alive = true;
    this.aliveMobs++;
    this.aliveByType[defIndex]++;
  }

  private stepProjectiles(): void {
    const hitDist = C.PROJECTILE_RADIUS + C.PLAYER_RADIUS;
    const hit2 = hitDist * hitDist;
    for (let i = 0; i < this.projectiles.length; i++) {
      const p = this.projectiles[i];
      if (!p.alive) continue;
      p.x += p.vx * C.TICK_DT;
      p.y += p.vy * C.TICK_DT;
      p.ttl--;
      if (p.ttl <= 0) {
        p.alive = false;
        continue;
      }
      // Pociski rozbijają się o przeszkody — teren działa jak osłona.
      if (this.projectileHitsObstacle(p.x, p.y)) {
        p.alive = false;
        continue;
      }
      // Pocisk trafia pierwszego gracza na drodze.
      for (const pl of this.players) {
        if (pl.dead) continue;
        const dx = p.x - pl.x;
        const dy = p.y - pl.y;
        if (dx * dx + dy * dy <= hit2) {
          p.alive = false;
          this.damagePlayer(pl, p.damage);
          break;
        }
      }
    }
  }

  /* ── Walka gracza ─────────────────────────────────────────────────────── */

  private applyMelee(p: Player): void {
    // PLACEHOLDER modelu walki (pełne koło co interwał klasy) — docelowy model
    // to otwarta decyzja w gdd.md 5.1; wymiana tej metody nie rusza reszty.
    p.meleeCooldown--;
    if (p.meleeCooldown > 0) return;
    p.meleeCooldown = this.meleeIntervalOf(p);
    p.lastMeleeTick = this.tick;

    const range = this.meleeRangeOf(p);
    const damage = this.meleeDamageOf(p);
    this.hash.forEachNear(p.x, p.y, range + C.MOB_RADIUS_MAX, (i) => {
      const m = this.mobs[i];
      if (!m.alive) return;
      const reach = range + ENEMIES[m.defIndex].radius;
      const dx = m.x - p.x;
      const dy = m.y - p.y;
      if (dx * dx + dy * dy > reach * reach) return;
      m.hp -= damage;
      m.lastHitTick = this.tick;
      if (m.hp <= 0) this.killMob(m, p);
    });
  }

  /**
   * Power Slash — aktywny skill hybrydy z celowaniem: spacja otwiera celowanie
   * (UI), LMB zatwierdza — cios idzie stożkiem 120° w kierunku punktu aim.
   */
  private applySkill(p: Player, input: SimInput): void {
    if (p.skillCooldown > 0) p.skillCooldown--;
    if (!input.attack || p.skillCooldown > 0) return;

    // Kierunek ciosu: od gracza do punktu celowania; fallback = kierunek patrzenia.
    let dirX = input.aimX - p.x;
    let dirY = input.aimY - p.y;
    const dirLen = Math.sqrt(dirX * dirX + dirY * dirY);
    if (dirLen < 0.001) {
      dirX = p.facingX;
      dirY = p.facingY;
    } else {
      dirX /= dirLen;
      dirY /= dirLen;
    }

    p.skillCooldown = this.skillCooldownTicksOf(p);
    p.lastSkillTick = this.tick;
    p.lastSkillDirX = dirX;
    p.lastSkillDirY = dirY;

    const range = this.meleeRangeOf(p) * C.SKILL_RANGE_MULT;
    const damage = this.meleeDamageOf(p) * C.SKILL_DAMAGE_MULT;
    const knockback = C.SKILL_KNOCKBACK * p.knockbackMult;
    this.hash.forEachNear(p.x, p.y, range + C.MOB_RADIUS_MAX, (i) => {
      const m = this.mobs[i];
      if (!m.alive) return;
      const reach = range + ENEMIES[m.defIndex].radius;
      const dx = m.x - p.x;
      const dy = m.y - p.y;
      const d2 = dx * dx + dy * dy;
      if (d2 > reach * reach || d2 === 0) return;
      const d = Math.sqrt(d2);
      // Test stożka: kąt między kierunkiem celowania a wektorem do moba.
      if ((dx / d) * dirX + (dy / d) * dirY < C.SKILL_CONE_COS) return;
      m.hp -= damage;
      m.lastHitTick = this.tick;
      if (m.hp <= 0) {
        this.killMob(m, p);
        return;
      }
      // Bossa nie da się odepchnąć — inaczej dałoby się go zaganiać w róg.
      if (m.bossIndex >= 0) return;
      // Knockback z respektowaniem przeszkód — mob nie wyląduje w ścianie.
      const kb = this.pushOutOfObstacles(
        m.x + (dx / d) * knockback,
        m.y + (dy / d) * knockback,
        ENEMIES[m.defIndex].radius,
      );
      m.x = Math.min(Math.max(kb.x, C.MOB_RADIUS), C.WORLD_W - C.MOB_RADIUS);
      m.y = Math.min(Math.max(kb.y, C.MOB_RADIUS), C.WORLD_H - C.MOB_RADIUS);
    });
  }

  private applyContactDamage(p: Player): void {
    if (p.hurtCooldown > 0) {
      p.hurtCooldown--;
      return;
    }
    let maxRadius = 0;
    for (const e of ENEMIES) maxRadius = Math.max(maxRadius, e.radius);
    const searchDist = C.PLAYER_RADIUS + maxRadius;

    let damage = 0;
    let touching = 0;
    // Thorns (item 14): każdy dotykający wróg dostaje obrażenia odwetowe.
    this.hash.forEachNear(p.x, p.y, searchDist, (i) => {
      const m = this.mobs[i];
      if (!m.alive) return;
      const def = ENEMIES[m.defIndex];
      const contactDist = C.PLAYER_RADIUS + def.radius;
      const dx = m.x - p.x;
      const dy = m.y - p.y;
      if (dx * dx + dy * dy > contactDist * contactDist) return;

      touching++;
      damage = Math.max(damage, def.contactDamage);
      if (p.thornsDamage > 0) {
        m.hp -= p.thornsDamage;
        m.lastHitTick = this.tick;
        if (m.hp <= 0) this.killMob(m, p);
      }
    });

    if (damage > 0) {
      // Im większy tłok, tym mocniej boli — bez tego stanie w hordzie było
      // bezpieczne, bo globalny cooldown zrównywał 300 wrogów z jednym.
      const crowdMult = Math.min(
        CONTACT_CONFIG.crowdDamageMaxMultiplier,
        1 + (touching - 1) * (CONTACT_CONFIG.crowdDamagePercentPerEnemy / 100),
      );
      this.damagePlayer(p, damage * crowdMult * this.enemyDamageMult);
    }
  }

  /**
   * Wspólna bramka obrażeń gracza — kontakt i pociski dzielą cooldown
   * nietykalności. Kolejność: Overshield pochłania całe trafienie,
   * inaczej Armor redukuje płasko (minimum 1 obrażenie).
   */
  private damagePlayer(p: Player, amount: number): void {
    if (p.dead || p.hurtCooldown > 0) return;
    p.hurtCooldown = C.PLAYER_HURT_COOLDOWN_TICKS;
    if (p.shieldCharges > 0) {
      p.shieldCharges--;
      p.lastShieldTick = this.tick;
      return;
    }
    const reduced = Math.max(1, amount - p.armorFlat);
    p.hp = Math.max(0, p.hp - reduced);
    if (p.hp <= 0) {
      p.dead = true;
      p.hasMoveTarget = false;
    }
  }

  /* ── Itemy ────────────────────────────────────────────────────────────── */

  /** Jedyne miejsce uśmiercania moba: liczniki, leech i rzut na drop. */
  private killMob(m: Mob, killer: Player): void {
    m.alive = false;
    this.aliveMobs--;
    this.kills++;
    if (m.bossIndex >= 0) {
      // Boss padł — fala z bossem może się zakończyć. Zostawiamy bossMobIndex,
      // bo po nim `step()` poznaje, że boss już był i jest po walce.
      m.bossIndex = -1;
      killer.kills++;
      return;
    }
    this.aliveByType[m.defIndex]--;
    killer.kills++;
    if (killer.leechHealPerKill > 0) {
      killer.hp = Math.min(this.maxHpOf(killer), killer.hp + killer.leechHealPerKill);
    }
    const dropChance = DROP_CONFIG.dropChancePercent + killer.dropChanceBonus;
    if (this.rng.next() * 100 < dropChance) this.dropItem(m.x, m.y);
  }

  private dropItem(x: number, y: number): void {
    let slot = -1;
    for (let i = 0; i < this.pickups.length; i++) {
      if (!this.pickups[i].alive) {
        slot = i;
        break;
      }
    }
    if (slot === -1) return;

    // Losowanie typu wg wag z itemsConfig.ts.
    let totalWeight = 0;
    for (let i = 0; i < ITEMS.length; i++) totalWeight += ITEMS[i].weight;
    let roll = this.rng.next() * totalWeight;
    let defIndex = 0;
    for (let i = 0; i < ITEMS.length; i++) {
      roll -= ITEMS[i].weight;
      if (roll <= 0) {
        defIndex = i;
        break;
      }
    }

    const p = this.pickups[slot];
    p.alive = true;
    p.defIndex = defIndex;
    p.x = x;
    p.y = y;
    p.ttl = Math.round(DROP_CONFIG.despawnSeconds * C.TICK_RATE);
  }

  /** Item zbiera pierwszy gracz, który do niego dojdzie (kto pierwszy, ten lepszy). */
  private stepPickups(): void {
    for (let i = 0; i < this.pickups.length; i++) {
      const item = this.pickups[i];
      if (!item.alive) continue;
      item.ttl--;
      if (item.ttl <= 0) {
        item.alive = false;
        continue;
      }
      for (const p of this.players) {
        if (p.dead) continue;
        const radius = this.pickupRadiusOf(p);
        const dx = item.x - p.x;
        const dy = item.y - p.y;
        if (dx * dx + dy * dy <= radius * radius) {
          item.alive = false;
          this.collectItem(p, item.defIndex);
          break;
        }
      }
    }
  }

  private collectItem(p: Player, defIndex: number): void {
    const def = ITEMS[defIndex];
    p.itemCounts[defIndex]++;
    p.totalItemsCollected++;
    p.lastPickupTick = this.tick;
    p.lastPickupDefIndex = defIndex;
    this.applyEffect(p, def.kind, def.value);
  }

  /**
   * Jedna implementacja efektów dla itemów (dropy), ulepszeń (przerwa)
   * i bonusów meta. Różnią się tylko wartościami.
   */
  private applyEffect(p: Player, kind: ItemKind, value: number): void {
    switch (kind) {
      case 'medkit':
        p.hp = Math.min(this.maxHpOf(p), p.hp + value);
        break;
      case 'armor':
        p.armorFlat = Math.min(ITEM_CAPS.armorMax, p.armorFlat + value);
        break;
      case 'speed':
        p.speedMult += value / 100;
        break;
      case 'attackSpeed':
        p.attackSpeedMult += value / 100;
        break;
      case 'range':
        p.rangeMult += value / 100;
        break;
      case 'strength':
        p.damageMult += value / 100;
        break;
      case 'overshield':
        p.shieldCharges = Math.min(ITEM_CAPS.maxShieldCharges, p.shieldCharges + value);
        break;
      case 'regen':
        p.regenPerSec += value;
        break;
      case 'maxHp':
        p.maxHpBonus += value;
        p.hp = Math.min(this.maxHpOf(p), p.hp + value);
        break;
      case 'cooldown':
        p.cooldownMult = Math.max(ITEM_CAPS.minCooldownMult, p.cooldownMult - value / 100);
        break;
      case 'leech':
        p.leechHealPerKill += value;
        break;
      case 'magnet':
        p.magnetBonus += value;
        break;
      case 'knockback':
        p.knockbackMult += value / 100;
        break;
      case 'thorns':
        p.thornsDamage += value;
        break;
    }
  }

  private applyRegen(p: Player): void {
    if (p.regenPerSec <= 0) return;
    p.hp = Math.min(this.maxHpOf(p), p.hp + p.regenPerSec * C.TICK_DT);
  }

  /**
   * Suma kontrolna stanu — w lockstepie każdy klient liczy ją co N ticków
   * i porównuje z resztą. Rozjazd = desync, czyli błąd determinizmu.
   */
  checksum(): number {
    let h = 2166136261 >>> 0;
    const mix = (v: number): void => {
      // Zaokrąglamy do 0.01 px: chroni przed szumem zmiennoprzecinkowym,
      // a wyłapuje każdą realną rozbieżność symulacji.
      h ^= Math.round(v * 100) | 0;
      h = Math.imul(h, 16777619) >>> 0;
    };
    mix(this.tick);
    mix(this.wave);
    mix(this.aliveMobs);
    mix(this.kills);
    for (const p of this.players) {
      mix(p.x);
      mix(p.y);
      mix(p.hp);
      mix(p.dead ? 1 : 0);
      mix(p.left ? 1 : 0);
      mix(p.kills);
    }
    for (let i = 0; i < this.mobs.length; i++) {
      const m = this.mobs[i];
      if (!m.alive) continue;
      mix(m.x);
      mix(m.y);
      mix(m.hp);
    }
    return h >>> 0;
  }
}
