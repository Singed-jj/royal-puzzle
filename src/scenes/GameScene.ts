import Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      '탈출! 곰사원',
      { fontSize: '32px', color: '#5C3D2E', fontFamily: 'Arial' }
    ).setOrigin(0.5);
  }
}
