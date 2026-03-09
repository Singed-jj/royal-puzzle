import Phaser from 'phaser';
import { GAME_WIDTH } from '../config';
import { Level, LevelObjective } from '../game/Level';
import { TileType, ObstacleType } from '../game/types';

const TILE_EMOJI: Record<number, string> = {
  [TileType.Coffee]: '☕',
  [TileType.Document]: '📄',
  [TileType.Stapler]: '📎',
  [TileType.PostIt]: '📝',
};

const OBSTACLE_EMOJI: Record<string, string> = {
  [ObstacleType.Box]: '📦',
  [ObstacleType.FileCabinet]: '🗄️',
  [ObstacleType.Printer]: '🖨️',
  [ObstacleType.CoffeeSplash]: '💦',
};

export class HUD {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;
  private movesText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private objectiveTexts: Phaser.GameObjects.Text[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  create(level: Level): void {
    this.container = this.scene.add.container(0, 0);
    this.container.setDepth(100);

    const panelWidth = GAME_WIDTH - 20;
    const panelHeight = 120;
    const panelX = GAME_WIDTH / 2;
    const panelY = 10;

    // Background rounded rectangle
    const bg = this.scene.add.graphics();
    bg.fillStyle(0xfff0d4, 1);
    bg.fillRoundedRect(10, panelY, panelWidth, panelHeight, 12);
    bg.lineStyle(2, 0xd4a574, 1);
    bg.strokeRoundedRect(10, panelY, panelWidth, panelHeight, 12);
    this.container.add(bg);

    // Level number
    this.levelText = this.scene.add.text(25, panelY + 12, `📋 레벨 ${level.id}`, {
      fontSize: '16px',
      color: '#5C3D2E',
      fontFamily: 'Arial',
    });
    this.container.add(this.levelText);

    // Moves left - big number, right side
    this.movesText = this.scene.add.text(GAME_WIDTH - 30, panelY + 8, `${level.movesLeft}`, {
      fontSize: '36px',
      color: level.movesLeft <= 5 ? '#E74C3C' : '#5C3D2E',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    }).setOrigin(1, 0);
    this.container.add(this.movesText);

    const movesLabel = this.scene.add.text(GAME_WIDTH - 30, panelY + 46, '남은 수', {
      fontSize: '11px',
      color: '#8B7355',
      fontFamily: 'Arial',
    }).setOrigin(1, 0);
    this.container.add(movesLabel);

    // Objectives row
    this.createObjectives(level, panelY + 70);
  }

  private createObjectives(level: Level, y: number): void {
    this.objectiveTexts = [];

    const totalObjs = level.objectives.length;
    const spacing = Math.min(120, (GAME_WIDTH - 40) / totalObjs);
    const startX = 25;

    level.objectives.forEach((obj, i) => {
      const emoji = this.getObjectiveEmoji(obj);
      const text = this.formatObjective(obj, emoji);

      const objText = this.scene.add.text(startX + i * spacing, y, text, {
        fontSize: '14px',
        color: '#5C3D2E',
        fontFamily: 'Arial',
      });
      this.container.add(objText);
      this.objectiveTexts.push(objText);
    });
  }

  private getObjectiveEmoji(obj: LevelObjective): string {
    if (obj.type === 'collect' && obj.tileType !== undefined) {
      return TILE_EMOJI[obj.tileType] ?? '❓';
    }
    if (obj.type === 'clear_obstacle' && obj.obstacleType !== undefined) {
      return OBSTACLE_EMOJI[obj.obstacleType] ?? '📦';
    }
    return '❓';
  }

  private formatObjective(obj: LevelObjective, emoji: string): string {
    if (obj.current >= obj.count) {
      return `${emoji} ✅`;
    }
    return `${emoji} ${obj.current}/${obj.count}`;
  }

  update(level: Level): void {
    // Update moves
    this.movesText.setText(`${level.movesLeft}`);
    this.movesText.setColor(level.movesLeft <= 5 ? '#E74C3C' : '#5C3D2E');

    // Update objectives
    level.objectives.forEach((obj, i) => {
      if (i < this.objectiveTexts.length) {
        const emoji = this.getObjectiveEmoji(obj);
        this.objectiveTexts[i].setText(this.formatObjective(obj, emoji));
      }
    });
  }

  destroy(): void {
    this.container.destroy();
  }
}
