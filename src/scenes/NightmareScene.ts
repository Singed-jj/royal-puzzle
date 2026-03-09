import Phaser from 'phaser';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  GRID_COLS,
  GRID_ROWS,
  TILE_SIZE,
  GRID_OFFSET_X,
} from '../config';
import { Board } from '../game/Board';
import { TileData, CascadeStep } from '../game/types';

const TILE_TEXTURES = ['coffee', 'document', 'stapler', 'postit'];
const GRID_OFFSET_Y_NIGHTMARE = 260;
const TOTAL_TIME = 60;
const TIME_BONUS = 2;
const BOSS_START_Y = -100;
const BOSS_DESCENT_RANGE = 250;
const SWAP_DURATION = 150;
const REMOVE_DURATION = 200;
const CASCADE_DURATION = 150;

export class NightmareScene extends Phaser.Scene {
  private board!: Board;
  private tileSprites: (Phaser.GameObjects.Image | null)[][] = [];
  private timeLeft: number = TOTAL_TIME;
  private timerText!: Phaser.GameObjects.Text;
  private bossText!: Phaser.GameObjects.Text;
  private warningText!: Phaser.GameObjects.Text;
  private isAnimating: boolean = false;
  private selectedTile: { row: number; col: number } | null = null;
  private selectionIndicator!: Phaser.GameObjects.Rectangle;
  private timerEvent!: Phaser.Time.TimerEvent;
  private shakeTimer: Phaser.Time.TimerEvent | null = null;
  private dragStart: { row: number; col: number; x: number; y: number } | null =
    null;
  private gameOver: boolean = false;
  private elapsedTicks: number = 0;

  constructor() {
    super({ key: 'NightmareScene' });
  }

  create(): void {
    this.timeLeft = TOTAL_TIME;
    this.isAnimating = false;
    this.selectedTile = null;
    this.dragStart = null;
    this.gameOver = false;
    this.tileSprites = [];
    this.shakeTimer = null;
    this.elapsedTicks = 0;

    // Dark background
    this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x2a1a0e
    );

    // Warning text
    this.warningText = this.add
      .text(GAME_WIDTH / 2, 60, '야근 비상! 사장이 온다!', {
        fontSize: '20px',
        color: '#FFD700',
        fontFamily: 'Arial',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Timer
    this.timerText = this.add
      .text(GAME_WIDTH / 2, 110, `${TOTAL_TIME}`, {
        fontSize: '48px',
        color: '#FF6B35',
        fontFamily: 'Arial',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Boss emoji
    this.bossText = this.add
      .text(GAME_WIDTH / 2, BOSS_START_Y, '😡', {
        fontSize: '64px',
      })
      .setOrigin(0.5);

    // Selection indicator (hidden by default)
    this.selectionIndicator = this.add
      .rectangle(0, 0, TILE_SIZE, TILE_SIZE, 0xffffff, 0.3)
      .setVisible(false);

    // Create and fill board
    this.board = new Board(GRID_ROWS, GRID_COLS);
    this.board.fill();
    this.createTileSprites();

    // Input handling
    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointerup', this.onPointerUp, this);

    // Timer countdown
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: this.onTimerTick,
      callbackScope: this,
      loop: true,
    });
  }

  private tileX(col: number): number {
    return GRID_OFFSET_X + col * TILE_SIZE + TILE_SIZE / 2;
  }

  private tileY(row: number): number {
    return GRID_OFFSET_Y_NIGHTMARE + row * TILE_SIZE + TILE_SIZE / 2;
  }

  private createTileSprites(): void {
    this.tileSprites = Array.from({ length: GRID_ROWS }, () =>
      Array(GRID_COLS).fill(null)
    );

    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const tile = this.board.getTile(r, c);
        if (tile) {
          this.tileSprites[r][c] = this.createSpriteForTile(tile);
        }
      }
    }
  }

  private createSpriteForTile(tile: TileData): Phaser.GameObjects.Image {
    const textureName = TILE_TEXTURES[tile.type];
    const sprite = this.add.image(
      this.tileX(tile.col),
      this.tileY(tile.row),
      textureName
    );
    sprite.setInteractive();
    return sprite;
  }

  private destroySpriteAt(row: number, col: number): void {
    const sprite = this.tileSprites[row]?.[col];
    if (sprite) {
      sprite.destroy();
      this.tileSprites[row][col] = null;
    }
  }

  private pointerToGrid(
    x: number,
    y: number
  ): { row: number; col: number } | null {
    const col = Math.floor((x - GRID_OFFSET_X) / TILE_SIZE);
    const row = Math.floor((y - GRID_OFFSET_Y_NIGHTMARE) / TILE_SIZE);
    if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS)
      return null;
    return { row, col };
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.isAnimating || this.gameOver) return;

    const gridPos = this.pointerToGrid(pointer.x, pointer.y);
    if (!gridPos) return;

    this.dragStart = { ...gridPos, x: pointer.x, y: pointer.y };

    if (this.selectedTile) {
      const dr = Math.abs(gridPos.row - this.selectedTile.row);
      const dc = Math.abs(gridPos.col - this.selectedTile.col);
      if (dr + dc === 1) {
        this.attemptSwap(
          this.selectedTile.row,
          this.selectedTile.col,
          gridPos.row,
          gridPos.col
        );
        this.clearSelection();
        return;
      }
    }

    this.selectedTile = { row: gridPos.row, col: gridPos.col };
    this.selectionIndicator
      .setPosition(this.tileX(gridPos.col), this.tileY(gridPos.row))
      .setVisible(true);
  }

  private onPointerUp(pointer: Phaser.Input.Pointer): void {
    if (this.isAnimating || this.gameOver || !this.dragStart) return;

    const dx = pointer.x - this.dragStart.x;
    const dy = pointer.y - this.dragStart.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > TILE_SIZE * 0.4) {
      let dr = 0;
      let dc = 0;
      if (Math.abs(dx) > Math.abs(dy)) {
        dc = dx > 0 ? 1 : -1;
      } else {
        dr = dy > 0 ? 1 : -1;
      }

      const targetRow = this.dragStart.row + dr;
      const targetCol = this.dragStart.col + dc;

      if (
        targetRow >= 0 &&
        targetRow < GRID_ROWS &&
        targetCol >= 0 &&
        targetCol < GRID_COLS
      ) {
        this.attemptSwap(
          this.dragStart.row,
          this.dragStart.col,
          targetRow,
          targetCol
        );
        this.clearSelection();
      }
    }

    this.dragStart = null;
  }

  private clearSelection(): void {
    this.selectedTile = null;
    this.selectionIndicator.setVisible(false);
  }

  private async attemptSwap(
    r1: number,
    c1: number,
    r2: number,
    c2: number
  ): Promise<void> {
    this.isAnimating = true;

    const result = this.board.trySwap(r1, c1, r2, c2);

    if (!result.valid) {
      await this.animateSwap(r1, c1, r2, c2);
      await this.animateSwap(r2, c2, r1, c1);
      this.isAnimating = false;
      return;
    }

    await this.animateSwap(r1, c1, r2, c2);
    await this.processMatchesLoop();
    this.isAnimating = false;
  }

  private animateSwap(
    r1: number,
    c1: number,
    r2: number,
    c2: number
  ): Promise<void> {
    return new Promise<void>((resolve) => {
      const spriteA = this.tileSprites[r1]?.[c1];
      const spriteB = this.tileSprites[r2]?.[c2];

      if (this.tileSprites[r1]) this.tileSprites[r1][c1] = spriteB ?? null;
      if (this.tileSprites[r2]) this.tileSprites[r2][c2] = spriteA ?? null;

      let tweensLeft = 0;
      const onComplete = () => {
        tweensLeft--;
        if (tweensLeft <= 0) resolve();
      };

      if (spriteA) {
        tweensLeft++;
        this.tweens.add({
          targets: spriteA,
          x: this.tileX(c2),
          y: this.tileY(r2),
          duration: SWAP_DURATION,
          ease: 'Power2',
          onComplete,
        });
      }

      if (spriteB) {
        tweensLeft++;
        this.tweens.add({
          targets: spriteB,
          x: this.tileX(c1),
          y: this.tileY(r1),
          duration: SWAP_DURATION,
          ease: 'Power2',
          onComplete,
        });
      }

      if (tweensLeft === 0) resolve();
    });
  }

  private async processMatchesLoop(): Promise<void> {
    let matches = this.board.findAllMatches();

    while (matches.length > 0) {
      this.addTimeBonus(matches.length * TIME_BONUS);

      const allTiles: TileData[] = [];
      const seen = new Set<string>();
      for (const match of matches) {
        for (const tile of match.tiles) {
          const key = `${tile.row},${tile.col}`;
          if (!seen.has(key)) {
            seen.add(key);
            allTiles.push(tile);
          }
        }
      }

      await this.animateRemove(allTiles);
      const cascade = this.board.removeAndCascade(allTiles);
      await this.animateCascade(cascade);
      matches = this.board.findAllMatches();
    }
  }

  private animateRemove(tiles: TileData[]): Promise<void> {
    return new Promise<void>((resolve) => {
      if (tiles.length === 0) {
        resolve();
        return;
      }

      let remaining = tiles.length;
      const onComplete = () => {
        remaining--;
        if (remaining <= 0) resolve();
      };

      for (const tile of tiles) {
        const sprite = this.tileSprites[tile.row]?.[tile.col];
        if (sprite) {
          this.tweens.add({
            targets: sprite,
            alpha: 0,
            scaleX: 0,
            scaleY: 0,
            duration: REMOVE_DURATION,
            ease: 'Power2',
            onComplete: () => {
              this.destroySpriteAt(tile.row, tile.col);
              onComplete();
            },
          });
        } else {
          onComplete();
        }
      }
    });
  }

  private animateCascade(cascade: CascadeStep): Promise<void> {
    return new Promise<void>((resolve) => {
      const tweenTargets: Array<{
        sprite: Phaser.GameObjects.Image;
        toRow: number;
        col: number;
      }> = [];

      for (const move of cascade.moved) {
        const sprite = this.tileSprites[move.fromRow]?.[move.tile.col];
        if (sprite) {
          if (this.tileSprites[move.fromRow])
            this.tileSprites[move.fromRow][move.tile.col] = null;
          tweenTargets.push({ sprite, toRow: move.toRow, col: move.tile.col });
        }
      }

      for (const tile of cascade.spawned) {
        const sprite = this.createSpriteForTile(tile);
        sprite.y = GRID_OFFSET_Y_NIGHTMARE - TILE_SIZE;
        tweenTargets.push({ sprite, toRow: tile.row, col: tile.col });
      }

      if (tweenTargets.length === 0) {
        resolve();
        return;
      }

      let remaining = tweenTargets.length;
      const onComplete = () => {
        remaining--;
        if (remaining <= 0) resolve();
      };

      for (const target of tweenTargets) {
        if (this.tileSprites[target.toRow])
          this.tileSprites[target.toRow][target.col] = target.sprite;

        this.tweens.add({
          targets: target.sprite,
          y: this.tileY(target.toRow),
          duration: CASCADE_DURATION,
          ease: 'Bounce.easeOut',
          onComplete,
        });
      }
    });
  }

  private addTimeBonus(seconds: number): void {
    this.timeLeft = Math.min(TOTAL_TIME, this.timeLeft + seconds);
    this.updateTimerDisplay();
  }

  private onTimerTick(): void {
    if (this.gameOver) return;

    this.elapsedTicks++;
    this.timeLeft--;

    if (this.elapsedTicks >= TOTAL_TIME) {
      this.onSurvived();
      return;
    }

    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.updateTimerDisplay();
      this.onTimeUp();
      return;
    }

    this.updateTimerDisplay();
    this.updateBoss();

    if (this.timeLeft <= 10) {
      this.cameras.main.shake(200, 0.005);
    }

    if (this.timeLeft <= 10 && !this.shakeTimer) {
      this.shakeTimer = this.time.addEvent({
        delay: 100,
        callback: () => {
          if (this.bossText && this.bossText.active) {
            const offsetX = (Math.random() - 0.5) * 6;
            this.bossText.x = GAME_WIDTH / 2 + offsetX;
          }
        },
        loop: true,
      });
    }

    if (this.timeLeft > 10 && this.shakeTimer) {
      this.shakeTimer.destroy();
      this.shakeTimer = null;
      this.bossText.x = GAME_WIDTH / 2;
    }
  }

  private updateTimerDisplay(): void {
    this.timerText.setText(`${Math.ceil(this.timeLeft)}`);

    if (this.timeLeft <= 10) {
      this.timerText.setColor('#FF0000');
      this.timerText.setFontSize(56);
    } else {
      this.timerText.setColor('#FF6B35');
      this.timerText.setFontSize(48);
    }
  }

  private updateBoss(): void {
    const elapsed = TOTAL_TIME - this.timeLeft;
    const bossY =
      BOSS_START_Y + (elapsed / TOTAL_TIME) * BOSS_DESCENT_RANGE;
    this.bossText.y = bossY;

    if (this.timeLeft <= 5) {
      const t = (5 - this.timeLeft) / 5;
      const scale = 1.0 + t * 0.5;
      this.bossText.setScale(scale);
    }
  }

  private onTimeUp(): void {
    this.gameOver = true;
    this.timerEvent.destroy();
    if (this.shakeTimer) this.shakeTimer.destroy();

    this.tweens.add({
      targets: this.bossText,
      y: GAME_HEIGHT / 2 - 80,
      scaleX: 2,
      scaleY: 2,
      duration: 500,
      ease: 'Bounce.easeOut',
      onComplete: () => {
        this.add
          .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, '야근 확정...', {
            fontSize: '32px',
            color: '#FF0000',
            fontFamily: 'Arial',
            fontStyle: 'bold',
          })
          .setOrigin(0.5);

        this.time.delayedCall(2000, () => {
          this.scene.start('MapScene');
        });
      },
    });
  }

  private onSurvived(): void {
    this.gameOver = true;
    this.timerEvent.destroy();
    if (this.shakeTimer) this.shakeTimer.destroy();

    this.tweens.add({
      targets: this.bossText,
      y: -200,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
    });

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, '탈출 성공!', {
        fontSize: '40px',
        color: '#00FF88',
        fontFamily: 'Arial',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, '15분 무제한 라이프 획득!', {
        fontSize: '20px',
        color: '#FFD700',
        fontFamily: 'Arial',
      })
      .setOrigin(0.5);

    this.time.delayedCall(2500, () => {
      this.scene.start('MapScene');
    });
  }

  shutdown(): void {
    this.input.off('pointerdown', this.onPointerDown, this);
    this.input.off('pointerup', this.onPointerUp, this);
    if (this.timerEvent) this.timerEvent.destroy();
    if (this.shakeTimer) this.shakeTimer.destroy();
  }
}
