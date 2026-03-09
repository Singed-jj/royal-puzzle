import { BoardLike, TileData, TileType, SpecialType } from '../types';

export class MockBoard implements BoardLike {
  private grid: (TileData | null)[][];

  constructor(
    public readonly rows: number = 9,
    public readonly cols: number = 9,
  ) {
    this.grid = Array.from({ length: rows }, () =>
      Array.from<TileData | null>({ length: cols }).fill(null),
    );
  }

  getTile(row: number, col: number): TileData | null {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return null;
    return this.grid[row][col];
  }

  setTile(row: number, col: number, tile: TileData | null): void {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return;
    this.grid[row][col] = tile;
  }

  /** Helper: place a tile with given type and optional special */
  place(
    row: number,
    col: number,
    type: TileType,
    special: SpecialType = SpecialType.None,
  ): TileData {
    const tile: TileData = { type, special, row, col };
    this.setTile(row, col, tile);
    return tile;
  }

  /** Helper: fill entire board with a single type */
  fillAll(type: TileType): void {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.place(r, c, type);
      }
    }
  }

  /** Helper: fill a horizontal line */
  fillRow(
    row: number,
    colStart: number,
    length: number,
    type: TileType,
    special: SpecialType = SpecialType.None,
  ): void {
    for (let c = colStart; c < colStart + length; c++) {
      this.place(row, c, type, special);
    }
  }

  /** Helper: fill a vertical line */
  fillCol(
    col: number,
    rowStart: number,
    length: number,
    type: TileType,
    special: SpecialType = SpecialType.None,
  ): void {
    for (let r = rowStart; r < rowStart + length; r++) {
      this.place(r, col, type, special);
    }
  }
}
