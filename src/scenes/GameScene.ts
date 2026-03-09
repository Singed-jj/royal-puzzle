import Phaser from 'phaser';
import { GAME_WIDTH } from '../config';
import { Board } from '../game/Board';
import { BoardRenderer } from '../game/BoardRenderer';
import { InputHandler } from '../game/InputHandler';
import { Level, LevelData } from '../game/Level';
import { TileType } from '../game/types';
import levelsData from '../data/levels.json';

const TILE_TYPE_NAMES: Record<number, string> = {
  [TileType.Coffee]: '커피',
  [TileType.Document]: '서류',
  [TileType.Stapler]: '스테이플러',
  [TileType.PostIt]: '포스트잇',
};

export class GameScene extends Phaser.Scene {
  private board!: Board;
  private boardRenderer!: BoardRenderer;
  private inputHandler!: InputHandler;
  private level!: Level;

  private movesText!: Phaser.GameObjects.Text;
  private objectiveTexts: Phaser.GameObjects.Text[] = [];

  constructor() {
    super({ key: 'GameScene' });
  }

  create(data?: { levelId?: number }): void {
    const levelId = data?.levelId ?? 1;

    // Load level data
    const levelData = (levelsData as LevelData[]).find(
      (l) => l.id === levelId,
    );
    if (!levelData) {
      // No more levels, go back to map
      this.scene.start('MapScene');
      return;
    }

    this.level = new Level(levelData);

    // Create board
    this.board = new Board(levelData.grid.rows, levelData.grid.cols);
    this.board.fill();

    // Create renderer
    this.boardRenderer = new BoardRenderer(this, this.board);
    this.boardRenderer.renderAll();

    // Create input handler
    this.inputHandler = new InputHandler(
      this,
      levelData.grid.rows,
      levelData.grid.cols,
    );
    this.inputHandler.onSwap = (r1, c1, r2, c2) => this.handleSwap(r1, c1, r2, c2);

    // Create HUD
    this.createHUD();
  }

  private createHUD(): void {
    // Moves display
    this.movesText = this.add
      .text(GAME_WIDTH / 2, 30, '', {
        fontSize: '20px',
        color: '#5C3D2E',
        fontFamily: 'Arial',
      })
      .setOrigin(0.5);

    // Objective displays
    this.objectiveTexts = [];
    this.level.objectives.forEach((_obj, i) => {
      const text = this.add
        .text(GAME_WIDTH / 2, 60 + i * 28, '', {
          fontSize: '16px',
          color: '#5C3D2E',
          fontFamily: 'Arial',
        })
        .setOrigin(0.5);
      this.objectiveTexts.push(text);
    });

    this.updateHUD();
  }

  private updateHUD(): void {
    this.movesText.setText(`남은 이동: ${this.level.movesLeft}`);

    this.level.objectives.forEach((obj, i) => {
      const text = this.objectiveTexts[i];
      if (!text) return;

      let label: string;
      if (obj.type === 'collect' && obj.tileType !== undefined) {
        label = TILE_TYPE_NAMES[obj.tileType] ?? `타일 ${obj.tileType}`;
      } else if (obj.type === 'clear_obstacle') {
        label = obj.obstacleType ?? '장애물';
      } else {
        label = '목표';
      }

      text.setText(`${label}: ${obj.current}/${obj.count}`);
    });
  }

  private async handleSwap(
    r1: number,
    c1: number,
    r2: number,
    c2: number,
  ): Promise<void> {
    this.inputHandler.setEnabled(false);

    // Animate the swap visually
    await this.boardRenderer.animateSwap(r1, c1, r2, c2);

    // Try swap on board
    const result = this.board.trySwap(r1, c1, r2, c2);

    if (!result.valid) {
      // Swap back animation
      await this.boardRenderer.animateSwap(r2, c2, r1, c1);
      this.inputHandler.setEnabled(true);
      return;
    }

    // Valid swap: use a move
    this.level.useMove();

    // Process matches recursively
    await this.processMatches();

    // Update HUD
    this.updateHUD();

    // Check end conditions
    if (this.level.isComplete()) {
      this.scene.start('ResultScene', {
        success: true,
        levelId: this.level.id,
      });
      return;
    }

    if (this.level.isFailed()) {
      this.scene.start('ResultScene', {
        success: false,
        levelId: this.level.id,
      });
      return;
    }

    this.inputHandler.setEnabled(true);
  }

  private async processMatches(): Promise<void> {
    let matches = this.board.findAllMatches();

    while (matches.length > 0) {
      // Collect all matched tiles and count per type
      const allMatchedTiles = matches.flatMap((m) => m.tiles);

      // Track progress for objectives
      const typeCounts = new Map<number, number>();
      for (const tile of allMatchedTiles) {
        typeCounts.set(tile.type, (typeCounts.get(tile.type) ?? 0) + 1);
      }
      for (const [tileType, count] of typeCounts) {
        this.level.addProgress('collect', tileType, count);
      }

      // Deduplicate tiles by position for removal
      const posKey = (r: number, c: number) => `${r},${c}`;
      const seen = new Set<string>();
      const uniqueTiles = allMatchedTiles.filter((t) => {
        const k = posKey(t.row, t.col);
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });

      // Animate removal
      await this.boardRenderer.animateRemove(uniqueTiles);

      // Cascade on board
      const cascade = this.board.removeAndCascade(uniqueTiles);

      // Animate cascade
      await this.boardRenderer.animateCascade(cascade.moved, cascade.spawned);

      // Check for chain matches
      matches = this.board.findAllMatches();
    }
  }
}
