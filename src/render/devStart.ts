import { PROGRESSION, talentSlotsFor } from '../sim/talentsConfig';
import type { World } from '../sim/world';
import { DEV_MARKER } from './devMarker';

/**
 * Szybki start do testów grafiki (plan-grafik.md, Etap 0, D7): `?dev=1&class=bear&spec=0&wave=5&seed=1`
 * otwiera od razu grę na wskazanej fali — pod zrzuty w hordzie i powtarzalny pomiar FPS.
 * `&level=2` bez `spec` = szeregowy z punktem talentu: T → wybór gałęzi → przemiana postaci.
 * `&at=obstacle` = start obok najbliższej przeszkody (podgląd areny), `&map=crater` = druga arena.
 * `&god=0` = bez nieśmiertelności (domyślnie postać nie ginie — patrz `keepAlive`).
 *
 * TYLKO tryb deweloperski: moduł jest importowany wyłącznie w gałęziach `import.meta.env.DEV`, więc build
 * produkcyjny (itch.io) go nie zawiera. Pilnuje tego `bench/artCheck.ts` (szuka znacznika z `devMarker.ts` w `dist/`).
 *
 * Symulacja zostaje nietknięta: świat budujemy normalnie, a potem ustawiamy falę i poziom tak jak
 * `bench/regressions.ts`; specjalizację wybiera zwykły input `talentPick`, czyli ta sama ścieżka co w grze.
 */

export interface DevStart {
  classId: string;
  mapId?: string;
  /** Indeks gałęzi specjalizacji albo -1 (bez specjalizacji — szeregowy). */
  spec: number;
  /** Poziom startowy (każdy poziom ponad 1 = punkt talentu) — np. `level=2` pod ręczny test przemiany. */
  level: number;
  /** `obstacle` = start obok najbliższej przeszkody (podgląd grafiki areny); domyślnie środek mapy. */
  at: string | null;
  /**
   * Nieśmiertelność (domyślnie włączona, `god=0` wyłącza): postać z poziomem 1-2 na fali 5 ginie w kilka sekund,
   * a pomiar FPS i oglądanie grafiki potrzebują 30+ s w hordzie.
   */
  god: boolean;
  wave: number;
  seed: number;
}

/** `null`, gdy w adresie nie ma `dev=1`. Domyślnie stały seed — ten sam przebieg przy każdym starcie. */
export function parseDevStart(search: string): DevStart | null {
  const q = new URLSearchParams(search);
  if (q.get('dev') !== '1') return null;
  const num = (key: string, def: number): number => {
    const v = Number(q.get(key));
    return q.has(key) && Number.isFinite(v) ? v : def;
  };
  const dev: DevStart = {
    classId: q.get('class') ?? 'bear',
    mapId: q.get('map') ?? undefined,
    spec: num('spec', -1),
    level: Math.max(1, Math.floor(num('level', 1))),
    at: q.get('at'),
    god: q.get('god') !== '0',
    wave: Math.max(1, num('wave', 1)),
    seed: num('seed', 1) >>> 0,
  };
  console.info(`${DEV_MARKER} ${JSON.stringify(dev)}`);
  return dev;
}

/**
 * Ustawia falę i poziom świata przed pierwszym tickiem. Zwraca indeks slotu talentu do wysłania jako
 * `talentPick` (wybór specjalizacji), albo -1.
 */
export function applyDevStart(world: World, dev: DevStart): number {
  world.wave = dev.wave;
  const p = world.players[0];
  if (dev.at === 'obstacle' && world.obstacles.length) {
    // najbliższa przeszkoda i miejsce tuż obok niej (poza kolizją) — przed pierwszym tickiem
    const o = [...world.obstacles].sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
    p.x = p.prevX = o.x - o.r - 60;
    p.y = p.prevY = o.y;
  }
  if (dev.level > p.level) {
    p.talentPoints += dev.level - p.level;
    p.level = dev.level;
  }
  if (dev.spec < 0) return -1;
  const slot = talentSlotsFor(p.cls.id).findIndex((s) => s.isSpec && s.branchIndex === dev.spec);
  if (slot < 0) {
    console.warn(`${DEV_MARKER} klasa ${p.cls.id} nie ma gałęzi ${dev.spec}`);
    return -1;
  }
  p.level = Math.max(p.level, PROGRESSION.specLevel);
  p.talentPoints += 1;
  return slot;
}

/**
 * Nieśmiertelność szybkiego startu: HP pełne przed każdym tickiem — ten sam wzorzec co `bench/regressions.ts`.
 * Tylko solo i tylko DEV, więc determinizm co-opu nie jest zagrożony.
 */
export function keepAlive(world: World): void {
  const p = world.players[0];
  p.hp = world.maxHpOf(p);
  p.dead = false;
}
