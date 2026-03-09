import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { PlayerProgress } from '../game/PlayerProgress';
import { ParticleManager } from '../effects/ParticleManager';
import levelsData from '../data/levels.json';

interface ResultData {
  success: boolean;
  levelId: number;
  stars: number;
  movesLeft: number;
}

const PANEL_WIDTH = 320;
const PANEL_HEIGHT = 360;
const COIN_BONUS_PER_STAR = 10;

export class ResultScene extends Phaser.Scene {
  private progress!: PlayerProgress;

  constructor() {
    super({ key: 'ResultScene' });
  }

  create(data: ResultData): void {
    this.progress = new PlayerProgress();

    // Dark overlay
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6);

    if (data.success) {
      this.handleSuccess(data);
      this.createSuccessPanel(data);
      // 성공 시 컨페티 이펙트
      const particles = new ParticleManager(this);
      particles.levelCompleteConfetti();
    } else {
      this.createFailurePanel(data);
    }
  }

  private handleSuccess(data: ResultData): void {
    this.progress.completeLevel(data.levelId, data.stars);
    const bonus = data.stars * COIN_BONUS_PER_STAR;
    if (bonus > 0) {
      this.progress.addCoins(bonus);
    }
  }

  private createSuccessPanel(data: ResultData): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // Panel background
    const panelBg = this.add.graphics();
    panelBg.fillStyle(0xfff8e7, 1);
    panelBg.fillRoundedRect(cx - PANEL_WIDTH / 2, cy - PANEL_HEIGHT / 2, PANEL_WIDTH, PANEL_HEIGHT, 16);
    panelBg.lineStyle(3, 0xd4a574, 1);
    panelBg.strokeRoundedRect(cx - PANEL_WIDTH / 2, cy - PANEL_HEIGHT / 2, PANEL_WIDTH, PANEL_HEIGHT, 16);

    let y = cy - PANEL_HEIGHT / 2 + 30;

    // Success emoji
    this.add.text(cx, y, '🎉', {
      fontSize: '48px',
      fontFamily: 'Arial',
    }).setOrigin(0.5);
    y += 60;

    // Title
    this.add.text(cx, y, '탈출 성공!', {
      fontSize: '28px',
      color: '#5C3D2E',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    y += 45;

    // Stars
    let starStr = '';
    for (let i = 0; i < 3; i++) {
      starStr += i < data.stars ? '⭐' : '☆';
    }
    this.add.text(cx, y, starStr, {
      fontSize: '36px',
      fontFamily: 'Arial',
    }).setOrigin(0.5);
    y += 50;

    // Coin bonus
    const bonus = data.stars * COIN_BONUS_PER_STAR;
    if (bonus > 0) {
      this.add.text(cx, y, `+${bonus} ☕🎫`, {
        fontSize: '18px',
        color: '#8B7355',
        fontFamily: 'Arial',
      }).setOrigin(0.5);
      y += 35;
    }

    // Moves left info
    if (data.movesLeft > 0) {
      this.add.text(cx, y, `남은 수: ${data.movesLeft}`, {
        fontSize: '14px',
        color: '#8B7355',
        fontFamily: 'Arial',
      }).setOrigin(0.5);
      y += 35;
    }

    // Next level button
    const totalLevels = (levelsData as Array<{ id: number }>).length;
    const hasNextLevel = data.levelId < totalLevels;

    if (hasNextLevel) {
      this.createButton(cx, y + 10, '다음 층으로 →', () => {
        this.scene.start('GameScene', { levelId: data.levelId + 1 });
      });
    } else {
      this.createButton(cx, y + 10, '맵으로 돌아가기', () => {
        this.scene.start('MapScene');
      });
    }
  }

  private createFailurePanel(data: ResultData): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // Panel background
    const panelBg = this.add.graphics();
    panelBg.fillStyle(0xfff8e7, 1);
    panelBg.fillRoundedRect(cx - PANEL_WIDTH / 2, cy - PANEL_HEIGHT / 2, PANEL_WIDTH, PANEL_HEIGHT, 16);
    panelBg.lineStyle(3, 0xd4a574, 1);
    panelBg.strokeRoundedRect(cx - PANEL_WIDTH / 2, cy - PANEL_HEIGHT / 2, PANEL_WIDTH, PANEL_HEIGHT, 16);

    let y = cy - PANEL_HEIGHT / 2 + 30;

    // Failure emoji
    this.add.text(cx, y, '😱', {
      fontSize: '48px',
      fontFamily: 'Arial',
    }).setOrigin(0.5);
    y += 60;

    // Title
    this.add.text(cx, y, '사장에게 잡혔다!', {
      fontSize: '26px',
      color: '#5C3D2E',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    y += 60;

    // Encouragement
    this.add.text(cx, y, '다시 도전해보세요!', {
      fontSize: '16px',
      color: '#8B7355',
      fontFamily: 'Arial',
    }).setOrigin(0.5);
    y += 50;

    // Retry button
    this.createButton(cx, y, '다시 도전', () => {
      this.scene.start('GameScene', { levelId: data.levelId });
    });

    // Map button
    this.createButton(cx, y + 60, '맵으로', () => {
      this.scene.start('MapScene');
    }, true);
  }

  private createButton(x: number, y: number, label: string, callback: () => void, secondary = false): void {
    const btnWidth = 200;
    const btnHeight = 44;
    const btnColor = secondary ? 0x8b7355 : 0xd4a574;

    const btnBg = this.add.graphics();
    btnBg.fillStyle(btnColor, 1);
    btnBg.fillRoundedRect(x - btnWidth / 2, y - btnHeight / 2, btnWidth, btnHeight, 10);

    const btnText = this.add.text(x, y, label, {
      fontSize: '18px',
      color: '#FFFFFF',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const hitArea = this.add.rectangle(x, y, btnWidth, btnHeight)
      .setInteractive({ useHandCursor: true })
      .setAlpha(0.001);

    hitArea.on('pointerdown', callback);
    hitArea.on('pointerover', () => {
      btnBg.clear();
      btnBg.fillStyle(btnColor, 0.8);
      btnBg.fillRoundedRect(x - btnWidth / 2, y - btnHeight / 2, btnWidth, btnHeight, 10);
    });
    hitArea.on('pointerout', () => {
      btnBg.clear();
      btnBg.fillStyle(btnColor, 1);
      btnBg.fillRoundedRect(x - btnWidth / 2, y - btnHeight / 2, btnWidth, btnHeight, 10);
    });
  }
}
