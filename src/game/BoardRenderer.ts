import Phaser from 'phaser';
import { Board } from './Board';
import { TileType, TileData } from './types';
import { TILE_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y } from '../config';
import { ParticleManager } from '../effects/ParticleManager';

const TEXTURE_MAP: Record<TileType, string> = {
  [TileType.Coffee]: 'coffee',
  [TileType.Document]: 'document',
  [TileType.Stapler]: 'stapler',
  [TileType.PostIt]: 'postit',
};

export class BoardRenderer {
  private scene: Phaser.Scene;
  private board: Board;
  private container: Phaser.GameObjects.Container;
  private sprites: (Phaser.GameObjects.Sprite | null)[][];
  private particles: ParticleManager;

  constructor(scene: Phaser.Scene, board: Board) {
    this.scene = scene;
    this.board = board;
    this.container = scene.add.container(0, 0);
    this.sprites = Array.from({ length: board.rows }, () =>
      Array(board.cols).fill(null),
    );
    this.particles = new ParticleManager(scene);
  }

  private tileX(col: number): number {
    return GRID_OFFSET_X + col * TILE_SIZE + TILE_SIZE / 2;
  }

  private tileY(row: number): number {
    return GRID_OFFSET_Y + row * TILE_SIZE + TILE_SIZE / 2;
  }

  renderAll(): void {
    // Destroy existing sprites
    for (let r = 0; r < this.board.rows; r++) {
      for (let c = 0; c < this.board.cols; c++) {
        if (this.sprites[r][c]) {
          this.sprites[r][c]!.destroy();
          this.sprites[r][c] = null;
        }
      }
    }

    for (let r = 0; r < this.board.rows; r++) {
      for (let c = 0; c < this.board.cols; c++) {
        const tile = this.board.getTile(r, c);
        if (!tile) continue;

        const textureName = TEXTURE_MAP[tile.type];
        const sprite = this.scene.add.sprite(
          this.tileX(c),
          this.tileY(r),
          textureName,
        );
        sprite.setInteractive();
        sprite.setData('row', r);
        sprite.setData('col', c);

        this.container.add(sprite);
        this.sprites[r][c] = sprite;
      }
    }
  }

  getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }

  getSpriteAt(row: number, col: number): Phaser.GameObjects.Sprite | null {
    return this.sprites[row]?.[col] ?? null;
  }

  animateSwap(
    r1: number,
    c1: number,
    r2: number,
    c2: number,
  ): Promise<void> {
    return new Promise((resolve) => {
      const spriteA = this.sprites[r1][c1];
      const spriteB = this.sprites[r2][c2];

      if (!spriteA || !spriteB) {
        resolve();
        return;
      }

      const targetAx = this.tileX(c2);
      const targetAy = this.tileY(r2);
      const targetBx = this.tileX(c1);
      const targetBy = this.tileY(r1);

      let completed = 0;
      const onComplete = () => {
        completed++;
        if (completed >= 2) {
          // Swap sprite references
          this.sprites[r1][c1] = spriteB;
          this.sprites[r2][c2] = spriteA;
          spriteA.setData('row', r2);
          spriteA.setData('col', c2);
          spriteB.setData('row', r1);
          spriteB.setData('col', c1);
          resolve();
        }
      };

      this.scene.tweens.add({
        targets: spriteA,
        x: targetAx,
        y: targetAy,
        duration: 150,
        ease: 'Power2',
        onComplete,
      });

      this.scene.tweens.add({
        targets: spriteB,
        x: targetBx,
        y: targetBy,
        duration: 150,
        ease: 'Power2',
        onComplete,
      });
    });
  }

  animateRemove(tiles: TileData[]): Promise<void> {
    if (tiles.length === 0) return Promise.resolve();

    return new Promise((resolve) => {
      let completed = 0;
      const total = tiles.length;

      for (const tile of tiles) {
        const sprite = this.sprites[tile.row][tile.col];
        if (!sprite) {
          completed++;
          if (completed >= total) resolve();
          continue;
        }

        // 매치 폭발 파티클 이펙트
        this.particles.matchExplosion(
          this.tileX(tile.col),
          this.tileY(tile.row),
          tile.type,
        );

        this.scene.tweens.add({
          targets: sprite,
          scaleX: 1.3,
          scaleY: 1.3,
          alpha: 0,
          duration: 200,
          ease: 'Power2',
          onComplete: () => {
            sprite.destroy();
            this.sprites[tile.row][tile.col] = null;
            completed++;
            if (completed >= total) resolve();
          },
        });
      }
    });
  }

  animateCascade(
    moved: Array<{ tile: TileData; fromRow: number; toRow: number }>,
    spawned: TileData[],
  ): Promise<void> {
    const promises: Promise<void>[] = [];

    // Animate existing tiles dropping
    for (const m of moved) {
      const sprite = this.sprites[m.fromRow]?.[m.tile.col];
      if (!sprite) continue;

      // Move sprite reference to new position
      this.sprites[m.fromRow][m.tile.col] = null;
      this.sprites[m.toRow][m.tile.col] = sprite;
      sprite.setData('row', m.toRow);

      const targetY = this.tileY(m.toRow);
      promises.push(
        new Promise((resolve) => {
          this.scene.tweens.add({
            targets: sprite,
            y: targetY,
            duration: 300,
            ease: 'Bounce.easeOut',
            onComplete: () => resolve(),
          });
        }),
      );
    }

    // Animate new tiles spawning from above
    for (const tile of spawned) {
      const textureName = TEXTURE_MAP[tile.type];
      const sprite = this.scene.add.sprite(
        this.tileX(tile.col),
        this.tileY(-1), // Start from above the board
        textureName,
      );
      sprite.setInteractive();
      sprite.setData('row', tile.row);
      sprite.setData('col', tile.col);
      this.container.add(sprite);
      this.sprites[tile.row][tile.col] = sprite;

      const targetY = this.tileY(tile.row);
      promises.push(
        new Promise((resolve) => {
          this.scene.tweens.add({
            targets: sprite,
            y: targetY,
            duration: 400,
            ease: 'Bounce.easeOut',
            onComplete: () => resolve(),
          });
        }),
      );
    }

    if (promises.length === 0) return Promise.resolve();
    return Promise.all(promises).then(() => {});
  }
}
