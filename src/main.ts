import Phaser from 'phaser';
import { GameScene } from './render/GameScene';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#0a0a12',
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  scene: [GameScene],
});

// Uchwyt dev-diagnostyczny (tylko tryb dev) — pozwala zajrzeć w stan gry z konsoli.
if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__ws = game;
}
