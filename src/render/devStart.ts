import type Phaser from 'phaser';
import { PROGRESSION, talentSlotsFor } from '../sim/talentsConfig';
import type { World } from '../sim/world';
import { DEV_MARKER } from './devMarker';

/**
 * Szybki start do testów grafiki (plan-grafik.md, Etap 0, D7): `?dev=1&class=bear&spec=0&wave=5&seed=1`
 * otwiera od razu grę na wskazanej fali — pod zrzuty w hordzie i powtarzalny pomiar FPS.
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
  if (dev.spec < 0) return -1;
  const p = world.players[0];
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
 * Pomiar FPS z planu (Success Criteria): 30 s od startu, próbka co 0,5 s, w konsoli mediana i minimum.
 * Ten sam seed i fala = porównywalne liczby przed i po każdym etapie grafiki (bazowo: wielokąty).
 */
export function startFpsProbe(scene: Phaser.Scene, dev: DevStart): void {
  const samples: number[] = [];
  const timer = scene.time.addEvent({
    delay: 500,
    repeat: 59,
    callback: () => {
      samples.push(scene.game.loop.actualFps);
      if (samples.length < 60) return;
      const sorted = [...samples].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      console.info(
        `${DEV_MARKER} FPS 30 s (klasa ${dev.classId}, fala ${dev.wave}, seed ${dev.seed}): ` +
          `mediana ${median.toFixed(1)}, min ${sorted[0].toFixed(1)}`,
      );
    },
  });
  scene.events.once('shutdown', () => timer.remove());
}
