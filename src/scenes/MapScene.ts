import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

export class MapScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MapScene' });
  }

  create(): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xE8D5B7);

    this.add.text(GAME_WIDTH / 2, 40, '🐻 탈출! 곰사원', {
      fontSize: '24px', color: '#5C3D2E', fontFamily: 'Arial',
    }).setOrigin(0.5);

    // 임시: 게임 시작 버튼
    const btn = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 200, 60, 0xD4A574);
    btn.setInteractive({ useHandCursor: true });
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Level 1 시작', {
      fontSize: '20px', color: '#FFF', fontFamily: 'Arial',
    }).setOrigin(0.5);

    btn.on('pointerdown', () => {
      this.scene.start('GameScene', { levelId: 1 });
    });
  }
}
