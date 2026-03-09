import { BoardLike, TileData, TileType, SpecialType } from './types';

export class PowerUpExecutor {
  constructor(private board: BoardLike) {}

  execute(
    row: number,
    col: number,
    direction?: 'horizontal' | 'vertical',
    swappedType?: TileType,
  ): TileData[] {
    const tile = this.board.getTile(row, col);
    if (!tile || tile.special === SpecialType.None) return [];

    switch (tile.special) {
      case SpecialType.Rocket:
        return this.executeRocket(row, col, direction ?? 'horizontal');
      case SpecialType.Propeller:
        return this.executePropeller(row, col);
      case SpecialType.Shredder:
        return this.executeShredder(row, col);
      case SpecialType.WiFi:
        return this.executeWiFi(row, col, swappedType);
      default:
        return [];
    }
  }

  private executeRocket(
    row: number,
    col: number,
    direction: 'horizontal' | 'vertical',
  ): TileData[] {
    const cleared: TileData[] = [];
    if (direction === 'horizontal') {
      for (let c = 0; c < this.board.cols; c++) {
        const t = this.board.getTile(row, c);
        if (t) {
          cleared.push(t);
          this.board.setTile(row, c, null);
        }
      }
    } else {
      for (let r = 0; r < this.board.rows; r++) {
        const t = this.board.getTile(r, col);
        if (t) {
          cleared.push(t);
          this.board.setTile(r, col, null);
        }
      }
    }
    return cleared;
  }

  executePropeller(row: number, col: number): TileData[] {
    return this.clearArea(row, col, 1);
  }

  executeShredder(row: number, col: number): TileData[] {
    return this.clearArea(row, col, 1);
  }

  private clearArea(
    centerRow: number,
    centerCol: number,
    radius: number,
  ): TileData[] {
    const cleared: TileData[] = [];
    for (let r = centerRow - radius; r <= centerRow + radius; r++) {
      for (let c = centerCol - radius; c <= centerCol + radius; c++) {
        const t = this.board.getTile(r, c);
        if (t) {
          cleared.push(t);
          this.board.setTile(r, c, null);
        }
      }
    }
    return cleared;
  }

  private executeWiFi(
    row: number,
    col: number,
    swappedType?: TileType,
  ): TileData[] {
    const targetType =
      swappedType !== undefined
        ? swappedType
        : this.findMostCommonType(row, col);

    if (targetType === null) return [];

    const cleared: TileData[] = [];
    for (let r = 0; r < this.board.rows; r++) {
      for (let c = 0; c < this.board.cols; c++) {
        const t = this.board.getTile(r, c);
        if (t && t.type === targetType) {
          cleared.push(t);
          this.board.setTile(r, c, null);
        }
      }
    }
    return cleared;
  }

  private findMostCommonType(
    excludeRow: number,
    excludeCol: number,
  ): TileType | null {
    const counts = new Map<TileType, number>();
    for (let r = 0; r < this.board.rows; r++) {
      for (let c = 0; c < this.board.cols; c++) {
        if (r === excludeRow && c === excludeCol) continue;
        const t = this.board.getTile(r, c);
        if (t && t.special === SpecialType.None) {
          counts.set(t.type, (counts.get(t.type) ?? 0) + 1);
        }
      }
    }
    let maxType: TileType | null = null;
    let maxCount = 0;
    for (const [type, count] of counts) {
      if (count > maxCount) {
        maxCount = count;
        maxType = type;
      }
    }
    return maxType;
  }

  /** Public for use by PowerUpCombiner */
  clearRow(row: number): TileData[] {
    const cleared: TileData[] = [];
    for (let c = 0; c < this.board.cols; c++) {
      const t = this.board.getTile(row, c);
      if (t) {
        cleared.push(t);
        this.board.setTile(row, c, null);
      }
    }
    return cleared;
  }

  clearCol(col: number): TileData[] {
    const cleared: TileData[] = [];
    for (let r = 0; r < this.board.rows; r++) {
      const t = this.board.getTile(r, col);
      if (t) {
        cleared.push(t);
        this.board.setTile(r, col, null);
      }
    }
    return cleared;
  }

  clearAreaPublic(row: number, col: number, radius: number): TileData[] {
    return this.clearArea(row, col, radius);
  }

  clearAllOfType(type: TileType): TileData[] {
    const cleared: TileData[] = [];
    for (let r = 0; r < this.board.rows; r++) {
      for (let c = 0; c < this.board.cols; c++) {
        const t = this.board.getTile(r, c);
        if (t && t.type === type) {
          cleared.push(t);
          this.board.setTile(r, c, null);
        }
      }
    }
    return cleared;
  }

  clearAll(): TileData[] {
    const cleared: TileData[] = [];
    for (let r = 0; r < this.board.rows; r++) {
      for (let c = 0; c < this.board.cols; c++) {
        const t = this.board.getTile(r, c);
        if (t) {
          cleared.push(t);
          this.board.setTile(r, c, null);
        }
      }
    }
    return cleared;
  }
}
