import Phaser from 'phaser';

export const GAME_WIDTH = 390;
export const GAME_HEIGHT = 844;
export const GRID_COLS = 8;
export const GRID_ROWS = 8;
export const TILE_SIZE = 44;
export const GRID_OFFSET_X = 11;
export const GRID_OFFSET_Y = 180;
export const TILE_TYPE_COUNT = 4;

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#FFF8E7',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [],
};
