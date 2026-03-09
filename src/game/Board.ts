import {
  TileData,
  TileType,
  SpecialType,
  MatchResult,
  SwapResult,
  CascadeStep,
} from './types';
/** Number of distinct tile types (matches config.ts TILE_TYPE_COUNT) */
const TILE_TYPE_COUNT = 4;

export class Board {
  readonly rows: number;
  readonly cols: number;
  private grid: (TileData | null)[][];

  constructor(rows: number, cols: number) {
    this.rows = rows;
    this.cols = cols;
    this.grid = Array.from({ length: rows }, () => Array(cols).fill(null));
  }

  getTile(row: number, col: number): TileData | null {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return null;
    return this.grid[row][col];
  }

  setTile(row: number, col: number, tile: TileData | null): void {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return;
    this.grid[row][col] = tile;
  }

  /** Check if placing `type` at (row, col) would create a 3-match */
  wouldMatch(row: number, col: number, type: TileType): boolean {
    // Check horizontal: left
    let countLeft = 0;
    for (let c = col - 1; c >= 0; c--) {
      const t = this.grid[row]?.[c];
      if (t && t.type === type) countLeft++;
      else break;
    }
    // Check horizontal: right
    let countRight = 0;
    for (let c = col + 1; c < this.cols; c++) {
      const t = this.grid[row]?.[c];
      if (t && t.type === type) countRight++;
      else break;
    }
    if (countLeft + countRight + 1 >= 3) return true;

    // Check vertical: up
    let countUp = 0;
    for (let r = row - 1; r >= 0; r--) {
      const t = this.grid[r]?.[col];
      if (t && t.type === type) countUp++;
      else break;
    }
    // Check vertical: down
    let countDown = 0;
    for (let r = row + 1; r < this.rows; r++) {
      const t = this.grid[r]?.[col];
      if (t && t.type === type) countDown++;
      else break;
    }
    if (countUp + countDown + 1 >= 3) return true;

    return false;
  }

  /** Fill the board with random tiles, ensuring no initial 3-matches */
  fill(): void {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c] !== null) continue;

        let type: TileType;
        let attempts = 0;
        do {
          type = Math.floor(Math.random() * TILE_TYPE_COUNT) as TileType;
          attempts++;
        } while (this.wouldMatch(r, c, type) && attempts < 100);

        this.grid[r][c] = {
          type,
          special: SpecialType.None,
          row: r,
          col: c,
        };
      }
    }
  }

  /** Find all horizontal and vertical matches (3+ in a row) */
  findAllMatches(): MatchResult[] {
    const matches: MatchResult[] = [];
    const visited = Array.from({ length: this.rows }, () =>
      Array(this.cols).fill(false)
    );

    // Horizontal matches
    for (let r = 0; r < this.rows; r++) {
      let c = 0;
      while (c < this.cols) {
        const tile = this.grid[r][c];
        if (!tile) {
          c++;
          continue;
        }
        let end = c + 1;
        while (end < this.cols) {
          const next = this.grid[r][end];
          if (next && next.type === tile.type) end++;
          else break;
        }
        const length = end - c;
        if (length >= 3) {
          const tiles: TileData[] = [];
          for (let i = c; i < end; i++) {
            tiles.push(this.grid[r][i]!);
          }
          matches.push({
            tiles,
            special: null,
            pattern: 'horizontal',
          });
        }
        c = end;
      }
    }

    // Vertical matches
    for (let c = 0; c < this.cols; c++) {
      let r = 0;
      while (r < this.rows) {
        const tile = this.grid[r][c];
        if (!tile) {
          r++;
          continue;
        }
        let end = r + 1;
        while (end < this.rows) {
          const next = this.grid[end][c];
          if (next && next.type === tile.type) end++;
          else break;
        }
        const length = end - r;
        if (length >= 3) {
          const tiles: TileData[] = [];
          for (let i = r; i < end; i++) {
            tiles.push(this.grid[i][c]!);
          }
          matches.push({
            tiles,
            special: null,
            pattern: 'vertical',
          });
        }
        r = end;
      }
    }

    return matches;
  }

  // ============================================================
  // Task 4: Swap & Match Detection
  // ============================================================

  /** Swap two tiles. Returns false if positions are not adjacent. */
  swap(r1: number, c1: number, r2: number, c2: number): boolean {
    const dr = Math.abs(r1 - r2);
    const dc = Math.abs(c1 - c2);
    if (dr + dc !== 1) return false;

    const tileA = this.grid[r1][c1];
    const tileB = this.grid[r2][c2];

    this.grid[r1][c1] = tileB;
    this.grid[r2][c2] = tileA;

    if (tileA) {
      tileA.row = r2;
      tileA.col = c2;
    }
    if (tileB) {
      tileB.row = r1;
      tileB.col = c1;
    }

    return true;
  }

  /** Try a swap: if it creates matches, keep it; otherwise revert. */
  trySwap(r1: number, c1: number, r2: number, c2: number): SwapResult {
    const swapped = this.swap(r1, c1, r2, c2);
    if (!swapped) {
      return { valid: false, matches: [], cascades: [] };
    }

    const matches = this.findAllMatches();
    if (matches.length === 0) {
      // Revert
      this.swap(r1, c1, r2, c2);
      return { valid: false, matches: [], cascades: [] };
    }

    return { valid: true, matches, cascades: [] };
  }

  // ============================================================
  // Task 5: Cascade (gravity + new tile spawning)
  // ============================================================

  /** Remove tiles, apply gravity, spawn new tiles at top. */
  removeAndCascade(tiles: TileData[]): CascadeStep {
    const removed = [...tiles];

    // Remove tiles from grid
    for (const tile of tiles) {
      this.grid[tile.row][tile.col] = null;
    }

    const moved: Array<{ tile: TileData; fromRow: number; toRow: number }> = [];
    const spawned: TileData[] = [];

    // Process each column independently
    const affectedCols = new Set(tiles.map((t) => t.col));

    for (const col of affectedCols) {
      // Gravity: drop tiles down to fill gaps
      // Start from bottom, collect non-null tiles
      const remaining: TileData[] = [];
      for (let r = this.rows - 1; r >= 0; r--) {
        const t = this.grid[r][col];
        if (t !== null) {
          remaining.push(t);
        }
      }
      // remaining is bottom-to-top of surviving tiles

      // Clear column
      for (let r = 0; r < this.rows; r++) {
        this.grid[r][col] = null;
      }

      // Place surviving tiles at bottom
      const emptySlots = this.rows - remaining.length;
      for (let i = 0; i < remaining.length; i++) {
        const newRow = this.rows - 1 - i;
        const tile = remaining[i];
        const fromRow = tile.row;
        if (fromRow !== newRow) {
          moved.push({ tile, fromRow, toRow: newRow });
        }
        tile.row = newRow;
        tile.col = col;
        this.grid[newRow][col] = tile;
      }

      // Spawn new tiles at top to fill empty slots
      for (let i = 0; i < emptySlots; i++) {
        const newTile: TileData = {
          type: Math.floor(Math.random() * TILE_TYPE_COUNT) as TileType,
          special: SpecialType.None,
          row: i,
          col,
        };
        this.grid[i][col] = newTile;
        spawned.push(newTile);
      }
    }

    return { removed, moved, spawned };
  }
}
