import { BoardLike, TileData, TileType, SpecialType } from './types';
import { PowerUpExecutor } from './PowerUpExecutor';

export interface CombineResult {
  name: string;
  cleared: TileData[];
}

type ComboName =
  | 'Cross'
  | 'BigCross'
  | 'RocketToTarget'
  | 'AllToRocket'
  | 'MegaExplosion'
  | 'ShredderToTarget'
  | 'AllToShredder'
  | 'TriplePropeller'
  | 'AllToPropeller'
  | 'ClearAll';

// Order-independent combo lookup: key is sorted "min,max" of SpecialType values
const COMBO_MAP = new Map<string, ComboName>([
  // Rocket(1) + Rocket(1)
  [`${SpecialType.Rocket},${SpecialType.Rocket}`, 'Cross'],
  // Rocket(1) + Propeller(2)
  [`${SpecialType.Rocket},${SpecialType.Propeller}`, 'RocketToTarget'],
  // Rocket(1) + Shredder(3)
  [`${SpecialType.Rocket},${SpecialType.Shredder}`, 'BigCross'],
  // Rocket(1) + WiFi(4)
  [`${SpecialType.Rocket},${SpecialType.WiFi}`, 'AllToRocket'],
  // Propeller(2) + Propeller(2)
  [`${SpecialType.Propeller},${SpecialType.Propeller}`, 'TriplePropeller'],
  // Propeller(2) + Shredder(3)
  [`${SpecialType.Propeller},${SpecialType.Shredder}`, 'ShredderToTarget'],
  // Propeller(2) + WiFi(4)
  [`${SpecialType.Propeller},${SpecialType.WiFi}`, 'AllToPropeller'],
  // Shredder(3) + Shredder(3)
  [`${SpecialType.Shredder},${SpecialType.Shredder}`, 'MegaExplosion'],
  // Shredder(3) + WiFi(4)
  [`${SpecialType.Shredder},${SpecialType.WiFi}`, 'AllToShredder'],
  // WiFi(4) + WiFi(4)
  [`${SpecialType.WiFi},${SpecialType.WiFi}`, 'ClearAll'],
]);

export class PowerUpCombiner {
  private executor: PowerUpExecutor;

  constructor(private board: BoardLike) {
    this.executor = new PowerUpExecutor(board);
  }

  /** Get combination name (order-independent). Returns null if not a valid combo. */
  getCombination(a: SpecialType, b: SpecialType): ComboName | null {
    if (a === SpecialType.None || b === SpecialType.None) return null;

    const key = this.comboKey(a, b);
    return COMBO_MAP.get(key) ?? null;
  }

  /** Execute the combination of two power-up tiles on the board */
  execute(
    row1: number,
    col1: number,
    row2: number,
    col2: number,
  ): CombineResult {
    const tile1 = this.board.getTile(row1, col1);
    const tile2 = this.board.getTile(row2, col2);

    if (!tile1 || !tile2) {
      return { name: 'None', cleared: [] };
    }

    const name = this.getCombination(tile1.special, tile2.special);
    if (!name) {
      return { name: 'None', cleared: [] };
    }

    // Remove both power-up tiles first
    this.board.setTile(row1, col1, null);
    this.board.setTile(row2, col2, null);

    const centerRow = row1;
    const centerCol = col1;

    let cleared: TileData[] = [tile1, tile2];

    switch (name) {
      case 'Cross':
        cleared.push(...this.executeCross(row1, col1, row2, col2));
        break;
      case 'BigCross':
        cleared.push(...this.executeBigCross(row1, col1, row2, col2));
        break;
      case 'RocketToTarget':
        cleared.push(...this.executeRocketToTarget(centerRow, centerCol));
        break;
      case 'AllToRocket':
        cleared.push(
          ...this.executeAllToType(tile1, tile2, SpecialType.Rocket),
        );
        break;
      case 'MegaExplosion':
        cleared.push(...this.executeMegaExplosion(row1, col1, row2, col2));
        break;
      case 'ShredderToTarget':
        cleared.push(...this.executeShredderToTarget(centerRow, centerCol));
        break;
      case 'AllToShredder':
        cleared.push(
          ...this.executeAllToType(tile1, tile2, SpecialType.Shredder),
        );
        break;
      case 'TriplePropeller':
        cleared.push(...this.executeTriplePropeller());
        break;
      case 'AllToPropeller':
        cleared.push(
          ...this.executeAllToType(tile1, tile2, SpecialType.Propeller),
        );
        break;
      case 'ClearAll':
        cleared.push(...this.executor.clearAll());
        break;
    }

    return { name, cleared };
  }

  private comboKey(a: SpecialType, b: SpecialType): string {
    const sorted = [a, b].sort((x, y) => x - y);
    return `${sorted[0]},${sorted[1]}`;
  }

  private executeCross(
    r1: number,
    c1: number,
    r2: number,
    c2: number,
  ): TileData[] {
    const cleared: TileData[] = [];
    cleared.push(...this.executor.clearRow(r1));
    cleared.push(...this.executor.clearCol(c1));
    cleared.push(...this.executor.clearCol(c2));
    if (r1 !== r2) cleared.push(...this.executor.clearRow(r2));
    return cleared;
  }

  private executeBigCross(
    r1: number,
    c1: number,
    r2: number,
    c2: number,
  ): TileData[] {
    const cleared: TileData[] = [];
    const centerRow = Math.min(r1, r2);
    const centerCol = Math.min(c1, c2);
    // Clear 3 rows
    for (let dr = -1; dr <= 1; dr++) {
      const r = centerRow + dr;
      if (r >= 0 && r < this.board.rows) {
        cleared.push(...this.executor.clearRow(r));
      }
    }
    // Clear 3 columns
    for (let dc = -1; dc <= 1; dc++) {
      const c = centerCol + dc;
      if (c >= 0 && c < this.board.cols) {
        cleared.push(...this.executor.clearCol(c));
      }
    }
    return cleared;
  }

  private executeRocketToTarget(
    centerRow: number,
    centerCol: number,
  ): TileData[] {
    // Propeller flies to random target, then fires a rocket (row+col)
    // For deterministic testing, just clear row + col from center
    const cleared: TileData[] = [];
    cleared.push(...this.executor.clearRow(centerRow));
    cleared.push(...this.executor.clearCol(centerCol));
    return cleared;
  }

  private executeMegaExplosion(
    r1: number,
    c1: number,
    r2: number,
    c2: number,
  ): TileData[] {
    const centerRow = Math.round((r1 + r2) / 2);
    const centerCol = Math.round((c1 + c2) / 2);
    return this.executor.clearAreaPublic(centerRow, centerCol, 4);
  }

  private executeShredderToTarget(
    centerRow: number,
    centerCol: number,
  ): TileData[] {
    // Propeller carries shredder to a target, then 3x3 explosion
    return this.executor.clearAreaPublic(centerRow, centerCol, 1);
  }

  private executeTriplePropeller(): TileData[] {
    // 3 propellers fly to 3 random locations and explode
    const cleared: TileData[] = [];
    const targets = this.findRandomTargets(3);
    for (const [r, c] of targets) {
      cleared.push(...this.executor.clearAreaPublic(r, c, 1));
    }
    return cleared;
  }

  private executeAllToType(
    tile1: TileData,
    tile2: TileData,
    _targetSpecial: SpecialType,
  ): TileData[] {
    // WiFi finds the type of the other tile, clears all of that type
    const otherType =
      tile1.special === SpecialType.WiFi ? tile2.type : tile1.type;
    return this.executor.clearAllOfType(otherType);
  }

  private findRandomTargets(count: number): [number, number][] {
    const targets: [number, number][] = [];
    const candidates: [number, number][] = [];
    for (let r = 0; r < this.board.rows; r++) {
      for (let c = 0; c < this.board.cols; c++) {
        if (this.board.getTile(r, c)) {
          candidates.push([r, c]);
        }
      }
    }
    // Deterministic: pick evenly spaced targets
    const step = Math.max(1, Math.floor(candidates.length / count));
    for (let i = 0; i < count && i * step < candidates.length; i++) {
      targets.push(candidates[i * step]);
    }
    return targets;
  }
}
