import Phaser from 'phaser';
import { ClassSelectScene } from './render/ClassSelectScene';
import { MapSelectScene } from './render/MapSelectScene';
import { MetaScene } from './render/MetaScene';
import { CoopScene } from './render/CoopScene';
import { GameScene } from './render/GameScene';
import { sfx } from './render/audio';
import { parseDevStart } from './render/devStart';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#0a0a12',
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  scene: [ClassSelectScene, MapSelectScene, MetaScene, CoopScene, GameScene],
});

// Szybki start do testów grafiki: `?dev=1&class=bear&spec=0&wave=5&seed=1` pomija menu. Tylko `npm run dev` —
// w buildzie gałąź i moduł `devStart` znikają (sprawdza `bench/artCheck.ts`).
if (import.meta.env.DEV) {
  // Uchwyt do gry dla narzędzi (np. przewijanie klatek przy ukrytej karcie) — tylko `npm run dev`.
  (window as unknown as { __game: Phaser.Game }).__game = game;
  const dev = parseDevStart(window.location.search);
  if (dev) {
    game.events.once('ready', () => {
      game.scene.stop('class-select');
      game.scene.start('game', { classId: dev.classId, mapId: dev.mapId, dev });
    });
  }
}

/**
 * Przeglądarki nie pozwalają odtworzyć dźwięku, dopóki gracz w cokolwiek nie
 * kliknie. Podpinamy się pod PIERWSZY gest na dokumencie (a nie pod Phasera),
 * bo wtedy dźwięk działa niezależnie od tego, w której scenie zaczął grać.
 * `pointerup` i `keydown` łapią i mysz, i klawiaturę.
 */
for (const evt of ['pointerup', 'keydown'] as const) {
  window.addEventListener(evt, () => sfx.unlock(), { passive: true });
}
// Powrót z tła zawiesza AudioContext — bez tego gra po alt-tabie niemieje.
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) sfx.unlock();
});

// Uchwyt dev-diagnostyczny (tylko tryb dev) — pozwala zajrzeć w stan gry z konsoli.
if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__ws = game;
}
