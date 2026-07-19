import { Rng } from './rng';
import { SpatialHash } from './spatialHash';
import * as C from './constants';

/*
 *  ARCHITEKTURA (decyzja 2026-07-19, gdd.md sekcja 7 — fundament pod co-op):
 *
 *   klawiatura → SimInput ──► World.step()  (stały tick 30/s, deterministyczny)
 *                                 │
 *                                 ▼
 *                        stan świata (pozycje, HP, tick)
 *                                 │
 *                                 ▼
 *              GameScene (Phaser) tylko RYSUJE stan + interpoluje
 *
 *  Reguły tego katalogu (src/sim):
 *   - zero importów z Phasera, zero DOM, zero Date.now()
 *   - losowość wyłącznie przez this.rng
 *   - jedyne wejście danych z zewnątrz to argument SimInput w step()
 *  Dzięki temu w przyszłym co-opie wystarczy słać SimInput graczy po sieci,
 *  a każdy klient policzy identyczną symulację (lockstep).
 */

/** Wejście gracza na jeden tick. Jedyna droga danych do symulacji. */
export interface SimInput {
  /** Kierunek ruchu, każda oś w {-1, 0, 1}; normalizacja po stronie symulacji. */
  moveX: number;
  moveY: number;
  /** Dev-helper (klawisz M): natychmiastowy spawn 50 mobków do testu wydajności. */
  debugSpawn: boolean;
}

export interface Mob {
  alive: boolean;
  x: number;
  y: number;
  /** Pozycja z poprzedniego ticka — do interpolacji w renderze. */
  prevX: number;
  prevY: number;
  hp: number;
  speed: number;
}

export class World {
  readonly rng: Rng;
  tick = 0;

  playerX = C.WORLD_W / 2;
  playerY = C.WORLD_H / 2;
  playerPrevX = this.playerX;
  playerPrevY = this.playerY;
  playerHp = C.PLAYER_MAX_HP;
  /** Ticki pozostałe do końca nietykalności po obrażeniach. */
  private hurtCooldown = 0;
  private meleeCooldown = C.MELEE_INTERVAL_TICKS;
  /** Tick, w którym ostatnio wykonano atak — render czyta to dla efektu wizualnego. */
  lastMeleeTick = -1;

  /** Pool mobków o stałym rozmiarze — zero alokacji w trakcie gry. */
  readonly mobs: Mob[] = [];
  aliveMobs = 0;
  /** Licznik zabitych mobków w całym runie. */
  kills = 0;

  private readonly hash = new SpatialHash();

  constructor(seed: number) {
    this.rng = new Rng(seed);
    for (let i = 0; i < C.MOB_CAP; i++) {
      this.mobs.push({ alive: false, x: 0, y: 0, prevX: 0, prevY: 0, hp: 0, speed: 0 });
    }
  }

  get isPlayerDead(): boolean {
    return this.playerHp <= 0;
  }

  step(input: SimInput): void {
    if (this.isPlayerDead) return;
    this.tick++;

    this.savePrevPositions();
    this.movePlayer(input);
    this.spawnMobs(input.debugSpawn);
    this.rebuildHash();
    this.moveMobs();
    this.applyMelee();
    this.applyContactDamage();
  }

  private savePrevPositions(): void {
    this.playerPrevX = this.playerX;
    this.playerPrevY = this.playerY;
    for (let i = 0; i < this.mobs.length; i++) {
      const m = this.mobs[i];
      if (!m.alive) continue;
      m.prevX = m.x;
      m.prevY = m.y;
    }
  }

  private movePlayer(input: SimInput): void {
    let dx = input.moveX;
    let dy = input.moveY;
    if (dx !== 0 || dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      dx /= len;
      dy /= len;
      this.playerX += dx * C.PLAYER_SPEED * C.TICK_DT;
      this.playerY += dy * C.PLAYER_SPEED * C.TICK_DT;
      this.playerX = Math.min(Math.max(this.playerX, C.PLAYER_RADIUS), C.WORLD_W - C.PLAYER_RADIUS);
      this.playerY = Math.min(Math.max(this.playerY, C.PLAYER_RADIUS), C.WORLD_H - C.PLAYER_RADIUS);
    }
  }

  private spawnMobs(debugSpawn: boolean): void {
    const elapsedSeconds = this.tick * C.TICK_DT;
    let target = Math.min(
      C.MOB_TARGET_BASE + elapsedSeconds * C.MOB_TARGET_PER_SECOND,
      C.MOB_CAP,
    );
    if (debugSpawn) target = Math.min(this.aliveMobs + 50, C.MOB_CAP);

    while (this.aliveMobs < target) {
      const slot = this.findFreeSlot();
      if (slot === -1) return;
      const m = this.mobs[slot];
      const angle = this.rng.range(0, Math.PI * 2);
      m.x = this.playerX + Math.cos(angle) * C.MOB_SPAWN_DISTANCE;
      m.y = this.playerY + Math.sin(angle) * C.MOB_SPAWN_DISTANCE;
      m.x = Math.min(Math.max(m.x, C.MOB_RADIUS), C.WORLD_W - C.MOB_RADIUS);
      m.y = Math.min(Math.max(m.y, C.MOB_RADIUS), C.WORLD_H - C.MOB_RADIUS);
      m.prevX = m.x;
      m.prevY = m.y;
      m.hp = C.MOB_HP;
      m.speed = this.rng.range(C.MOB_SPEED_MIN, C.MOB_SPEED_MAX);
      m.alive = true;
      this.aliveMobs++;
    }
  }

  private findFreeSlot(): number {
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

  private moveMobs(): void {
    const separationRadius = C.MOB_RADIUS * 2;
    for (let i = 0; i < this.mobs.length; i++) {
      const m = this.mobs[i];
      if (!m.alive) continue;

      // Ruch w stronę gracza.
      let dx = this.playerX - m.x;
      let dy = this.playerY - m.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      dx /= dist;
      dy /= dist;

      // Miękkie rozpychanie sąsiadów, żeby horda nie zlewała się w jeden punkt.
      let pushX = 0;
      let pushY = 0;
      this.hash.forEachNear(m.x, m.y, separationRadius, (j) => {
        if (j === i) return;
        const o = this.mobs[j];
        const ox = m.x - o.x;
        const oy = m.y - o.y;
        const d2 = ox * ox + oy * oy;
        if (d2 > 0 && d2 < separationRadius * separationRadius) {
          const d = Math.sqrt(d2);
          const force = (separationRadius - d) / separationRadius;
          pushX += (ox / d) * force;
          pushY += (oy / d) * force;
        }
      });

      m.x += (dx * m.speed + pushX * 60) * C.TICK_DT;
      m.y += (dy * m.speed + pushY * 60) * C.TICK_DT;
    }
  }

  private applyMelee(): void {
    // PLACEHOLDER modelu walki (pełne koło co 0.5 s) — docelowy model to otwarta
    // decyzja w gdd.md 5.1; wymiana tej metody nie dotyka reszty symulacji.
    this.meleeCooldown--;
    if (this.meleeCooldown > 0) return;
    this.meleeCooldown = C.MELEE_INTERVAL_TICKS;
    this.lastMeleeTick = this.tick;

    const r2 = C.MELEE_RANGE * C.MELEE_RANGE;
    this.hash.forEachNear(this.playerX, this.playerY, C.MELEE_RANGE, (i) => {
      const m = this.mobs[i];
      if (!m.alive) return;
      const dx = m.x - this.playerX;
      const dy = m.y - this.playerY;
      if (dx * dx + dy * dy > r2) return;
      m.hp -= C.MELEE_DAMAGE;
      if (m.hp <= 0) {
        m.alive = false;
        this.aliveMobs--;
        this.kills++;
      }
    });
  }

  private applyContactDamage(): void {
    if (this.hurtCooldown > 0) {
      this.hurtCooldown--;
      return;
    }
    const contactDist = C.PLAYER_RADIUS + C.MOB_RADIUS;
    const r2 = contactDist * contactDist;
    let hit = false;
    this.hash.forEachNear(this.playerX, this.playerY, contactDist, (i) => {
      if (hit) return;
      const m = this.mobs[i];
      if (!m.alive) return;
      const dx = m.x - this.playerX;
      const dy = m.y - this.playerY;
      if (dx * dx + dy * dy <= r2) hit = true;
    });
    if (hit) {
      this.playerHp = Math.max(0, this.playerHp - C.MOB_CONTACT_DAMAGE);
      this.hurtCooldown = C.PLAYER_HURT_COOLDOWN_TICKS;
    }
  }
}
