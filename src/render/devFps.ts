import type Phaser from 'phaser';
import { DEV_MARKER } from './devMarker';

/**
 * Dziennik FPS zwykłej gry (tylko `npm run dev`): co 30 s aktywnej gry dopisuje wpis do `.dev/fps.jsonl`
 * (plugin w vite.config.ts) — mediana i minimum FPS, liczba wrogów, fala, mapa, urządzenie.
 * Służy do porównania wydajności przed i po grafice wrogów (plan-grafik.md, Etap 3, Success Criteria).
 *
 * Moduł importowany wyłącznie w gałęzi `import.meta.env.DEV`, więc w buildzie go nie ma.
 * Liczymy tylko AKTYWNĄ grę: pauza, ekran końca runu i karta w tle nie psują mediany.
 */

export interface FpsContext {
  /** Czy gra naprawdę się toczy (nie pauza, nie koniec runu). */
  active: boolean;
  liveMobs: number;
  wave: number;
  map: string;
  classId: string;
  spec: number;
  players: number;
  /** Ile typów wrogów i bossów rysuje się z atlasu (0 = dawne wielokąty, np. `?noart`). */
  enemyArt: number;
}

const WINDOW_SAMPLES = 60; // 60 × 0,5 s = 30 s aktywnej gry

export function startFpsLog(scene: Phaser.Scene, ctx: () => FpsContext): void {
  let fps: number[] = [];
  let mobs: number[] = [];
  let waves = new Set<number>();
  const timer = scene.time.addEvent({
    delay: 500,
    loop: true,
    callback: () => {
      const c = ctx();
      if (!c.active || document.visibilityState !== 'visible') return;
      fps.push(scene.game.loop.actualFps);
      mobs.push(c.liveMobs);
      waves.add(c.wave);
      if (fps.length < WINDOW_SAMPLES) return;
      const sorted = [...fps].sort((a, b) => a - b);
      const entry = {
        at: new Date().toISOString(),
        median: Math.round(sorted[Math.floor(sorted.length / 2)] * 10) / 10,
        min: Math.round(sorted[0] * 10) / 10,
        p10: Math.round(sorted[Math.floor(sorted.length * 0.1)] * 10) / 10,
        mobsAvg: Math.round(mobs.reduce((a, b) => a + b, 0) / mobs.length),
        mobsMax: Math.max(...mobs),
        waves: [...waves],
        map: c.map,
        classId: c.classId,
        spec: c.spec,
        players: c.players,
        enemyArt: c.enemyArt,
        device: {
          ua: navigator.userAgent,
          dpr: window.devicePixelRatio,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
        },
      };
      console.info(`${DEV_MARKER} FPS 30 s: mediana ${entry.median}, min ${entry.min}, wrogów ~${entry.mobsAvg}`);
      fetch('/__dev/fps', { method: 'POST', body: JSON.stringify(entry) }).catch(() => {
        // brak serwera deweloperskiego (np. `vite preview`) — wpis zostaje tylko w konsoli
      });
      fps = [];
      mobs = [];
      waves = new Set();
    },
  });
  scene.events.once('shutdown', () => timer.remove());
}
