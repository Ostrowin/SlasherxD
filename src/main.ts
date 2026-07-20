import Phaser from 'phaser';
import { ClassSelectScene } from './render/ClassSelectScene';
import { MetaScene } from './render/MetaScene';
import { CoopScene } from './render/CoopScene';
import { GameScene } from './render/GameScene';
import { sfx } from './render/audio';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#0a0a12',
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  scene: [ClassSelectScene, MetaScene, CoopScene, GameScene],
});

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
