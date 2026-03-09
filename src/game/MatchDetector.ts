import {
  BoardLike,
  TileData,
  TileType,
  SpecialType,
  MatchResult,
} from './types';

interface RawMatch {
  tiles: TileData[];
  direction: 'horizontal' | 'vertical';
}

export class MatchDetector {
  constructor(private board: BoardLike) {}

  detectAll(): MatchResult[] {
    const horizontals = this.findLinearMatches('horizontal');
    const verticals = this.findLinearMatches('vertical');
    const squares = this.findSquareMatches();

    // Try merging H+V into T/L shapes
    const merged = this.mergeIntoShapes(horizontals, verticals);

    // Collect tiles already used in merged results
    const usedKeys = new Set<string>();
    for (const m of merged) {
      for (const t of m.tiles) {
        usedKeys.add(`${t.row},${t.col}`);
      }
    }

    // Add remaining unmerged linear matches
    const results: MatchResult[] = [...merged];

    for (const raw of [...horizontals, ...verticals]) {
      const isUsed = raw.tiles.some((t) => usedKeys.has(`${t.row},${t.col}`));
      if (isUsed) continue;
      for (const t of raw.tiles) {
        usedKeys.add(`${t.row},${t.col}`);
      }
      results.push(this.classifyLinear(raw));
    }

    // Add square matches (only if tiles not already used)
    for (const sq of squares) {
      const isUsed = sq.tiles.some((t) => usedKeys.has(`${t.row},${t.col}`));
      if (isUsed) continue;
      for (const t of sq.tiles) {
        usedKeys.add(`${t.row},${t.col}`);
      }
      results.push(sq);
    }

    return results;
  }

  private findLinearMatches(
    direction: 'horizontal' | 'vertical',
  ): RawMatch[] {
    const results: RawMatch[] = [];
    const isHoriz = direction === 'horizontal';
    const outerLimit = isHoriz ? this.board.rows : this.board.cols;
    const innerLimit = isHoriz ? this.board.cols : this.board.rows;

    for (let outer = 0; outer < outerLimit; outer++) {
      let runStart = 0;
      let runType: TileType | null = null;
      let runTiles: TileData[] = [];

      for (let inner = 0; inner < innerLimit; inner++) {
        const r = isHoriz ? outer : inner;
        const c = isHoriz ? inner : outer;
        const tile = this.board.getTile(r, c);

        if (tile && tile.type === runType) {
          runTiles.push(tile);
        } else {
          if (runTiles.length >= 3) {
            results.push({ tiles: [...runTiles], direction });
          }
          runType = tile ? tile.type : null;
          runTiles = tile ? [tile] : [];
          runStart = inner;
        }
      }
      if (runTiles.length >= 3) {
        results.push({ tiles: [...runTiles], direction });
      }
    }

    return results;
  }

  private findSquareMatches(): MatchResult[] {
    const results: MatchResult[] = [];
    for (let r = 0; r < this.board.rows - 1; r++) {
      for (let c = 0; c < this.board.cols - 1; c++) {
        const tl = this.board.getTile(r, c);
        const tr = this.board.getTile(r, c + 1);
        const bl = this.board.getTile(r + 1, c);
        const br = this.board.getTile(r + 1, c + 1);
        if (tl && tr && bl && br &&
          tl.type === tr.type && tl.type === bl.type && tl.type === br.type) {
          results.push({
            tiles: [tl, tr, bl, br],
            special: SpecialType.Propeller,
            pattern: 'square',
          });
        }
      }
    }
    return results;
  }

  private mergeIntoShapes(
    horizontals: RawMatch[],
    verticals: RawMatch[],
  ): MatchResult[] {
    const results: MatchResult[] = [];
    const usedH = new Set<number>();
    const usedV = new Set<number>();

    for (let hi = 0; hi < horizontals.length; hi++) {
      for (let vi = 0; vi < verticals.length; vi++) {
        if (usedH.has(hi) || usedV.has(vi)) continue;

        const h = horizontals[hi];
        const v = verticals[vi];

        // Must be same type
        if (h.tiles[0].type !== v.tiles[0].type) continue;

        // Find intersection
        const intersection = h.tiles.find((ht) =>
          v.tiles.some((vt) => vt.row === ht.row && vt.col === ht.col),
        );

        if (!intersection) continue;

        // Merge unique tiles
        const tileMap = new Map<string, TileData>();
        for (const t of [...h.tiles, ...v.tiles]) {
          tileMap.set(`${t.row},${t.col}`, t);
        }
        const mergedTiles = Array.from(tileMap.values());
        const totalTiles = mergedTiles.length;

        if (totalTiles < 5) continue;

        // Determine if T or L shape
        const hLen = h.tiles.length;
        const vLen = v.tiles.length;

        // T-shape: intersection is at the middle of one arm
        // L-shape: intersection is at the end of both arms
        const hIndex = h.tiles.findIndex(
          (t) => t.row === intersection.row && t.col === intersection.col,
        );
        const vIndex = v.tiles.findIndex(
          (t) => t.row === intersection.row && t.col === intersection.col,
        );

        const hAtEnd = hIndex === 0 || hIndex === hLen - 1;
        const vAtEnd = vIndex === 0 || vIndex === vLen - 1;

        const pattern: 'T' | 'L' = hAtEnd && vAtEnd ? 'L' : 'T';

        results.push({
          tiles: mergedTiles,
          special: SpecialType.Shredder,
          pattern,
        });

        usedH.add(hi);
        usedV.add(vi);
      }
    }

    return results;
  }

  private classifyLinear(raw: RawMatch): MatchResult {
    const len = raw.tiles.length;
    if (len >= 5) {
      return {
        tiles: raw.tiles,
        special: SpecialType.WiFi,
        pattern: 'line5',
      };
    }
    if (len === 4) {
      return {
        tiles: raw.tiles,
        special: SpecialType.Rocket,
        pattern: raw.direction,
      };
    }
    // len === 3
    return {
      tiles: raw.tiles,
      special: null,
      pattern: raw.direction,
    };
  }
}
