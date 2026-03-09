import Phaser from 'phaser';
import { gameConfig } from './config';
import { BootScene } from './scenes/BootScene';
import { MapScene } from './scenes/MapScene';
import { GameScene } from './scenes/GameScene';
import { ResultScene } from './scenes/ResultScene';

const config: Phaser.Types.Core.GameConfig = {
  ...gameConfig,
  scene: [BootScene, MapScene, GameScene, ResultScene],
};

new Phaser.Game(config);
