import { Rng } from './rng';
import { SpatialHash } from './spatialHash';
import { type ClassDef } from './classes';
import { ENEMIES, type EnemyDef } from './enemies';
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
 *   - jedyne wejście danych z zewnątrz to argumenty konstruktora i SimInput w step()
 *  Dzięki temu w przyszłym co-opie (1-8 graczy) wystarczy słać SimInput graczy
 *  po sieci, a każdy klient policzy identyczną symulację (lockstep).
 */

/** Wejście gracza na jeden tick. Jedyna droga danych do symulacji. */
export interface SimInput {
  /** Kierunek ruchu, każda oś w {-1, 0, 1}; normalizacja po stronie symulacji. */
  moveX: number;
  moveY: number;
  /** Aktywny skill (Power Slash) — model hybrydowy, decyzja D10 2026-07-19. */
  attack: boolean;
  /** Dev-helper (klawisz M): natychmiastowy spawn 50 mobków do testu wydajności. */
  debugSpawn: boolean;
}

export interface Mob {
  alive: boolean;
  /** Indeks w ENEMIES — typ najeźdźcy (Alien / Demon / Mage / Robot). */
  defIndex: number;
  x: number;
  y: number;
  /** Pozycja z poprzedniego ticka — do interpolacji w renderze. */
  prevX: number;
  prevY: number;
  hp: number;
  speed: number;
  /** Ticki do następnego strzału (tylko typy ranged). */
  attackCooldown: number;
  /** Tick ostatniego otrzymanego ciosu — render robi z tego biały hit-flash. */
  lastHitTick: number;
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

export class World {
  readonly rng: Rng;
  readonly cls: ClassDef;
  tick = 0;

  playerX = C.WORLD_W / 2;
  playerY = C.WORLD_H / 2;
  playerPrevX = this.playerX;
  playerPrevY = this.playerY;
  playerHp: number;
  /** Ticki pozostałe do końca nietykalności po obrażeniach. */
  private hurtCooldown = 0;
  private meleeCooldown: number;
  /** Tick, w którym ostatnio wykonano atak — render czyta to dla efektu wizualnego. */
  lastMeleeTick = -1;

  /** Kierunek patrzenia (ostatni niezerowy ruch) — w tę stronę idzie Power Slash. */
  facingX = 1;
  facingY = 0;
  /** Power Slash (hybryda, D10): cooldown w tickach + dane ostatniego użycia dla renderu. */
  skillCooldown = 0;
  lastSkillTick = -1;
  lastSkillDirX = 1;
  lastSkillDirY = 0;

  /** Poole o stałym rozmiarze — zero alokacji w trakcie gry. */
  readonly mobs: Mob[] = [];
  readonly projectiles: Projectile[] = [];
  aliveMobs = 0;
  /** Licznik zabitych mobków w całym runie. */
  kills = 0;

  private readonly hash = new SpatialHash();

  constructor(seed: number, cls: ClassDef) {
    this.rng = new Rng(seed);
    this.cls = cls;
    this.playerHp = cls.maxHp;
    this.meleeCooldown = cls.meleeIntervalTicks;
    for (let i = 0; i < C.MOB_CAP; i++) {
      this.mobs.push({
        alive: false, defIndex: 0, x: 0, y: 0, prevX: 0, prevY: 0,
        hp: 0, speed: 0, attackCooldown: 0, lastHitTick: -100,
      });
    }
    for (let i = 0; i < C.PROJECTILE_CAP; i++) {
      this.projectiles.push({
        alive: false, x: 0, y: 0, prevX: 0, prevY: 0, vx: 0, vy: 0, ttl: 0, damage: 0,
      });
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
    this.moveMobsAndShoot();
    this.stepProjectiles();
    this.applyMelee();
    this.applySkill(input.attack);
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
    for (let i = 0; i < this.projectiles.length; i++) {
      const p = this.projectiles[i];
      if (!p.alive) continue;
      p.prevX = p.x;
      p.prevY = p.y;
    }
  }

  private movePlayer(input: SimInput): void {
    let dx = input.moveX;
    let dy = input.moveY;
    if (dx !== 0 || dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      dx /= len;
      dy /= len;
      this.facingX = dx;
      this.facingY = dy;
      this.playerX += dx * this.cls.speed * C.TICK_DT;
      this.playerY += dy * this.cls.speed * C.TICK_DT;
      this.playerX = Math.min(Math.max(this.playerX, C.PLAYER_RADIUS), C.WORLD_W - C.PLAYER_RADIUS);
      this.playerY = Math.min(Math.max(this.playerY, C.PLAYER_RADIUS), C.WORLD_H - C.PLAYER_RADIUS);
    }
  }

  /** Losuje typ najeźdźcy spośród odblokowanych w danym momencie runu (wagi z ENEMIES). */
  private pickEnemyDef(elapsedSeconds: number): number {
    let totalWeight = 0;
    for (let i = 0; i < ENEMIES.length; i++) {
      if (ENEMIES[i].unlockAtSeconds <= elapsedSeconds) totalWeight += ENEMIES[i].weight;
    }
    let roll = this.rng.next() * totalWeight;
    for (let i = 0; i < ENEMIES.length; i++) {
      const def = ENEMIES[i];
      if (def.unlockAtSeconds > elapsedSeconds) continue;
      roll -= def.weight;
      if (roll <= 0) return i;
    }
    return 0;
  }

  private spawnMobs(debugSpawn: boolean): void {
    const elapsedSeconds = this.tick * C.TICK_DT;
    let target = Math.min(
      C.MOB_TARGET_BASE + elapsedSeconds * C.MOB_TARGET_PER_SECOND,
      C.MOB_CAP,
    );
    if (debugSpawn) target = Math.min(this.aliveMobs + 50, C.MOB_CAP);

    while (this.aliveMobs < target) {
      const slot = this.findFreeMobSlot();
      if (slot === -1) return;
      const m = this.mobs[slot];
      const defIndex = this.pickEnemyDef(elapsedSeconds);
      const def = ENEMIES[defIndex];
      const angle = this.rng.range(0, Math.PI * 2);
      m.defIndex = defIndex;
      m.x = this.playerX + Math.cos(angle) * C.MOB_SPAWN_DISTANCE;
      m.y = this.playerY + Math.sin(angle) * C.MOB_SPAWN_DISTANCE;
      m.x = Math.min(Math.max(m.x, C.MOB_RADIUS), C.WORLD_W - C.MOB_RADIUS);
      m.y = Math.min(Math.max(m.y, C.MOB_RADIUS), C.WORLD_H - C.MOB_RADIUS);
      m.prevX = m.x;
      m.prevY = m.y;
      m.hp = def.hp;
      m.speed = this.rng.range(def.speedMin, def.speedMax);
      m.attackCooldown = def.ranged ? def.ranged.cooldownTicks : 0;
      m.alive = true;
      this.aliveMobs++;
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

  private moveMobsAndShoot(): void {
    const separationRadius = C.MOB_RADIUS * 2;
    for (let i = 0; i < this.mobs.length; i++) {
      const m = this.mobs[i];
      if (!m.alive) continue;
      const def = ENEMIES[m.defIndex];

      let dx = this.playerX - m.x;
      let dy = this.playerY - m.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      dx /= dist;
      dy /= dist;

      // Typy ranged (Alien Mage) trzymają dystans i strzelają; reszta idzie na kontakt.
      let advance = 1;
      if (def.ranged) {
        if (dist <= def.ranged.holdDistance) advance = 0;
        if (m.attackCooldown > 0) m.attackCooldown--;
        if (advance === 0 && m.attackCooldown === 0) {
          this.fireProjectile(m.x, m.y, dx, dy, def);
          m.attackCooldown = def.ranged.cooldownTicks;
        }
      }

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

      m.x += (dx * m.speed * advance + pushX * 60) * C.TICK_DT;
      m.y += (dy * m.speed * advance + pushY * 60) * C.TICK_DT;
    }
  }

  private fireProjectile(x: number, y: number, dirX: number, dirY: number, def: EnemyDef): void {
    const r = def.ranged;
    if (!r) return;
    for (let i = 0; i < this.projectiles.length; i++) {
      const p = this.projectiles[i];
      if (p.alive) continue;
      p.alive = true;
      p.x = x;
      p.y = y;
      p.prevX = x;
      p.prevY = y;
      p.vx = dirX * r.projectileSpeed;
      p.vy = dirY * r.projectileSpeed;
      p.ttl = C.PROJECTILE_TTL_TICKS;
      p.damage = r.projectileDamage;
      return;
    }
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
      const dx = p.x - this.playerX;
      const dy = p.y - this.playerY;
      if (dx * dx + dy * dy <= hit2) {
        p.alive = false;
        this.damagePlayer(p.damage);
      }
    }
  }

  private applyMelee(): void {
    // PLACEHOLDER modelu walki (pełne koło co interwał klasy) — docelowy model to
    // otwarta decyzja w gdd.md 5.1; wymiana tej metody nie dotyka reszty symulacji.
    this.meleeCooldown--;
    if (this.meleeCooldown > 0) return;
    this.meleeCooldown = this.cls.meleeIntervalTicks;
    this.lastMeleeTick = this.tick;

    const r2 = this.cls.meleeRange * this.cls.meleeRange;
    this.hash.forEachNear(this.playerX, this.playerY, this.cls.meleeRange, (i) => {
      const m = this.mobs[i];
      if (!m.alive) return;
      const dx = m.x - this.playerX;
      const dy = m.y - this.playerY;
      if (dx * dx + dy * dy > r2) return;
      m.hp -= this.cls.meleeDamage;
      m.lastHitTick = this.tick;
      if (m.hp <= 0) {
        m.alive = false;
        this.aliveMobs--;
        this.kills++;
      }
    });
  }

  /**
   * Power Slash — aktywny skill hybrydy (D10): stożek 120° w kierunku patrzenia,
   * potrojone obrażenia, knockback, cooldown. Docelowo: skille per klasa
   * odpalane klawiszami i kombinacjami klawiszy (TODOS.md).
   */
  private applySkill(attackPressed: boolean): void {
    if (this.skillCooldown > 0) this.skillCooldown--;
    if (!attackPressed || this.skillCooldown > 0) return;
    this.skillCooldown = C.SKILL_COOLDOWN_TICKS;
    this.lastSkillTick = this.tick;
    this.lastSkillDirX = this.facingX;
    this.lastSkillDirY = this.facingY;

    const range = this.cls.meleeRange * C.SKILL_RANGE_MULT;
    const r2 = range * range;
    const damage = this.cls.meleeDamage * C.SKILL_DAMAGE_MULT;
    this.hash.forEachNear(this.playerX, this.playerY, range, (i) => {
      const m = this.mobs[i];
      if (!m.alive) return;
      const dx = m.x - this.playerX;
      const dy = m.y - this.playerY;
      const d2 = dx * dx + dy * dy;
      if (d2 > r2 || d2 === 0) return;
      const d = Math.sqrt(d2);
      // Test stożka: kąt między kierunkiem patrzenia a wektorem do moba.
      if ((dx / d) * this.facingX + (dy / d) * this.facingY < C.SKILL_CONE_COS) return;
      m.hp -= damage;
      m.lastHitTick = this.tick;
      if (m.hp <= 0) {
        m.alive = false;
        this.aliveMobs--;
        this.kills++;
        return;
      }
      // Knockback: natychmiastowe odepchnięcie wzdłuż wektora od gracza.
      m.x = Math.min(Math.max(m.x + (dx / d) * C.SKILL_KNOCKBACK, C.MOB_RADIUS), C.WORLD_W - C.MOB_RADIUS);
      m.y = Math.min(Math.max(m.y + (dy / d) * C.SKILL_KNOCKBACK, C.MOB_RADIUS), C.WORLD_H - C.MOB_RADIUS);
    });
  }

  private applyContactDamage(): void {
    if (this.hurtCooldown > 0) {
      this.hurtCooldown--;
      return;
    }
    const contactDist = C.PLAYER_RADIUS + C.MOB_RADIUS;
    const r2 = contactDist * contactDist;
    let damage = 0;
    this.hash.forEachNear(this.playerX, this.playerY, contactDist, (i) => {
      if (damage > 0) return;
      const m = this.mobs[i];
      if (!m.alive) return;
      const dx = m.x - this.playerX;
      const dy = m.y - this.playerY;
      if (dx * dx + dy * dy <= r2) damage = ENEMIES[m.defIndex].contactDamage;
    });
    if (damage > 0) this.damagePlayer(damage);
  }

  /** Wspólna bramka obrażeń gracza — kontakt i pociski dzielą cooldown nietykalności. */
  private damagePlayer(amount: number): void {
    if (this.hurtCooldown > 0) return;
    this.playerHp = Math.max(0, this.playerHp - amount);
    this.hurtCooldown = C.PLAYER_HURT_COOLDOWN_TICKS;
  }
}
