import Phaser from 'phaser';
import { TILE_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y } from '../config';

const MIN_DRAG_DISTANCE = 10;

export class InputHandler {
  private scene: Phaser.Scene;
  private enabled = true;
  private selectedTile: { row: number; col: number } | null = null;
  private dragStart: { x: number; y: number } | null = null;
  private dragTile: { row: number; col: number } | null = null;
  private rows: number;
  private cols: number;

  onSwap: ((r1: number, c1: number, r2: number, c2: number) => void) | null =
    null;

  constructor(scene: Phaser.Scene, rows: number, cols: number) {
    this.scene = scene;
    this.rows = rows;
    this.cols = cols;
    this.setupInput();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.selectedTile = null;
      this.dragStart = null;
      this.dragTile = null;
    }
  }

  private pixelToGrid(
    x: number,
    y: number,
  ): { row: number; col: number } | null {
    const col = Math.floor((x - GRID_OFFSET_X) / TILE_SIZE);
    const row = Math.floor((y - GRID_OFFSET_Y) / TILE_SIZE);
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols)
      return null;
    return { row, col };
  }

  private isAdjacent(
    r1: number,
    c1: number,
    r2: number,
    c2: number,
  ): boolean {
    return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
  }

  private setupInput(): void {
    this.scene.input.on(
      'pointerdown',
      (pointer: Phaser.Input.Pointer) => {
        if (!this.enabled) return;

        const tile = this.pixelToGrid(pointer.x, pointer.y);
        if (!tile) return;

        this.dragStart = { x: pointer.x, y: pointer.y };
        this.dragTile = tile;
      },
    );

    this.scene.input.on(
      'pointerup',
      (pointer: Phaser.Input.Pointer) => {
        if (!this.enabled) return;
        if (!this.dragStart || !this.dragTile) {
          this.dragStart = null;
          this.dragTile = null;
          return;
        }

        const dx = pointer.x - this.dragStart.x;
        const dy = pointer.y - this.dragStart.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance >= MIN_DRAG_DISTANCE) {
          // Drag/swipe: determine direction
          const { row, col } = this.dragTile;
          let targetRow = row;
          let targetCol = col;

          if (Math.abs(dx) > Math.abs(dy)) {
            targetCol += dx > 0 ? 1 : -1;
          } else {
            targetRow += dy > 0 ? 1 : -1;
          }

          if (
            targetRow >= 0 &&
            targetRow < this.rows &&
            targetCol >= 0 &&
            targetCol < this.cols
          ) {
            this.selectedTile = null;
            this.onSwap?.(row, col, targetRow, targetCol);
          }
        } else {
          // Tap: select or swap with previously selected
          const tile = this.pixelToGrid(pointer.x, pointer.y);
          if (!tile) {
            this.selectedTile = null;
            this.dragStart = null;
            this.dragTile = null;
            return;
          }

          if (this.selectedTile) {
            if (
              this.isAdjacent(
                this.selectedTile.row,
                this.selectedTile.col,
                tile.row,
                tile.col,
              )
            ) {
              const { row: r1, col: c1 } = this.selectedTile;
              this.selectedTile = null;
              this.onSwap?.(r1, c1, tile.row, tile.col);
            } else {
              // Select new tile
              this.selectedTile = tile;
            }
          } else {
            this.selectedTile = tile;
          }
        }

        this.dragStart = null;
        this.dragTile = null;
      },
    );
  }
}
