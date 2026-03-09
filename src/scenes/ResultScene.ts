import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

export class ResultScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ResultScene' });
  }

  create(data: { success: boolean; levelId: number }): void {
    const { success, levelId } = data;

    this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      success ? 0xd4edda : 0xf8d7da,
    );

    // Result message
    const message = success ? '탈출 성공!' : '사장에게 잡혔다!';
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, message, {
        fontSize: '28px',
        color: success ? '#155724' : '#721c24',
        fontFamily: 'Arial',
      })
      .setOrigin(0.5);

    // Button
    const btnText = success ? '다음 층으로' : '다시 도전';
    const nextLevelId = success ? levelId + 1 : levelId;

    const btn = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 + 40,
      200,
      60,
      success ? 0x28a745 : 0xdc3545,
    );
    btn.setInteractive({ useHandCursor: true });

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, btnText, {
        fontSize: '20px',
        color: '#FFFFFF',
        fontFamily: 'Arial',
      })
      .setOrigin(0.5);

    btn.on('pointerdown', () => {
      this.scene.start('GameScene', { levelId: nextLevelId });
    });
  }
}
