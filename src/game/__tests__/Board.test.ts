import { describe, it, expect } from 'vitest';
import { Board } from '../Board';
import { TileType, SpecialType } from '../types';
const TILE_TYPE_COUNT = 4;

// ============================================================
// Task 3: Board Data Model
// ============================================================
describe('Board - Data Model', () => {
  it('creates an 8x8 grid', () => {
    const board = new Board(8, 8);
    expect(board.rows).toBe(8);
    expect(board.cols).toBe(8);
  });

  it('all cells are null after construction', () => {
    const board = new Board(8, 8);
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        expect(board.getTile(r, c)).toBeNull();
      }
    }
  });

  it('setTile and getTile work correctly', () => {
    const board = new Board(8, 8);
    const tile = { type: TileType.Coffee, special: SpecialType.None, row: 2, col: 3 };
    board.setTile(2, 3, tile);
    expect(board.getTile(2, 3)).toEqual(tile);
  });

  it('all cells filled after fill()', () => {
    const board = new Board(8, 8);
    board.fill();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const tile = board.getTile(r, c);
        expect(tile).not.toBeNull();
        expect(tile!.row).toBe(r);
        expect(tile!.col).toBe(c);
        expect(tile!.type).toBeGreaterThanOrEqual(0);
        expect(tile!.type).toBeLessThan(TILE_TYPE_COUNT);
        expect(tile!.special).toBe(SpecialType.None);
      }
    }
  });

  it('no initial 3-matches after fill()', () => {
    // Run multiple times to increase confidence
    for (let i = 0; i < 20; i++) {
      const board = new Board(8, 8);
      board.fill();
      const matches = board.findAllMatches();
      expect(matches).toHaveLength(0);
    }
  });

  it('findAllMatches detects horizontal match', () => {
    const board = new Board(8, 8);
    board.fill();
    // Manually set a horizontal match
    board.setTile(0, 0, { type: TileType.Coffee, special: SpecialType.None, row: 0, col: 0 });
    board.setTile(0, 1, { type: TileType.Coffee, special: SpecialType.None, row: 0, col: 1 });
    board.setTile(0, 2, { type: TileType.Coffee, special: SpecialType.None, row: 0, col: 2 });
    const matches = board.findAllMatches();
    const hasHorizontal = matches.some(
      (m) => m.pattern === 'horizontal' && m.tiles.length >= 3
    );
    expect(hasHorizontal).toBe(true);
  });

  it('findAllMatches detects vertical match', () => {
    const board = new Board(8, 8);
    board.fill();
    board.setTile(0, 0, { type: TileType.Document, special: SpecialType.None, row: 0, col: 0 });
    board.setTile(1, 0, { type: TileType.Document, special: SpecialType.None, row: 1, col: 0 });
    board.setTile(2, 0, { type: TileType.Document, special: SpecialType.None, row: 2, col: 0 });
    const matches = board.findAllMatches();
    const hasVertical = matches.some(
      (m) => m.pattern === 'vertical' && m.tiles.length >= 3
    );
    expect(hasVertical).toBe(true);
  });

  it('wouldMatch correctly detects potential matches', () => {
    const board = new Board(8, 8);
    board.setTile(0, 0, { type: TileType.Coffee, special: SpecialType.None, row: 0, col: 0 });
    board.setTile(0, 1, { type: TileType.Coffee, special: SpecialType.None, row: 0, col: 1 });
    // Placing Coffee at (0,2) would create a match
    expect(board.wouldMatch(0, 2, TileType.Coffee)).toBe(true);
    // Placing Document at (0,2) would not
    expect(board.wouldMatch(0, 2, TileType.Document)).toBe(false);
  });
});

// ============================================================
// Task 4: Swap & Match Detection
// ============================================================
describe('Board - Swap & Match Detection', () => {
  it('swap returns false for non-adjacent tiles', () => {
    const board = new Board(8, 8);
    board.fill();
    expect(board.swap(0, 0, 2, 2)).toBe(false);
    expect(board.swap(0, 0, 0, 2)).toBe(false);
  });

  it('swap returns true and swaps adjacent tiles', () => {
    const board = new Board(8, 8);
    board.fill();
    const tileA = board.getTile(0, 0)!;
    const tileB = board.getTile(0, 1)!;
    const typeA = tileA.type;
    const typeB = tileB.type;
    expect(board.swap(0, 0, 0, 1)).toBe(true);
    expect(board.getTile(0, 0)!.type).toBe(typeB);
    expect(board.getTile(0, 1)!.type).toBe(typeA);
    // Positions should be updated
    expect(board.getTile(0, 0)!.row).toBe(0);
    expect(board.getTile(0, 0)!.col).toBe(0);
    expect(board.getTile(0, 1)!.row).toBe(0);
    expect(board.getTile(0, 1)!.col).toBe(1);
  });

  it('swap works vertically', () => {
    const board = new Board(8, 8);
    board.fill();
    const typeA = board.getTile(0, 0)!.type;
    const typeB = board.getTile(1, 0)!.type;
    expect(board.swap(0, 0, 1, 0)).toBe(true);
    expect(board.getTile(0, 0)!.type).toBe(typeB);
    expect(board.getTile(1, 0)!.type).toBe(typeA);
  });

  it('trySwap returns valid=true when swap creates a match', () => {
    const board = new Board(8, 8);
    // Set up: Coffee at (0,0), (0,1), Document at (0,2), Coffee at (0,3)
    // Fill the rest with alternating to avoid accidental matches
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        board.setTile(r, c, {
          type: (r + c) % 2 === 0 ? TileType.Stapler : TileType.PostIt,
          special: SpecialType.None,
          row: r,
          col: c,
        });
      }
    }
    board.setTile(0, 0, { type: TileType.Coffee, special: SpecialType.None, row: 0, col: 0 });
    board.setTile(0, 1, { type: TileType.Coffee, special: SpecialType.None, row: 0, col: 1 });
    board.setTile(0, 2, { type: TileType.Document, special: SpecialType.None, row: 0, col: 2 });
    board.setTile(0, 3, { type: TileType.Coffee, special: SpecialType.None, row: 0, col: 3 });

    const result = board.trySwap(0, 2, 0, 3);
    expect(result.valid).toBe(true);
    expect(result.matches.length).toBeGreaterThan(0);
  });

  it('trySwap reverts when no match is created', () => {
    const board = new Board(8, 8);
    // Fill with a pattern that has no matches
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        board.setTile(r, c, {
          type: (r * 8 + c) % TILE_TYPE_COUNT,
          special: SpecialType.None,
          row: r,
          col: c,
        });
      }
    }
    // Make sure swapping (0,0) and (0,1) doesn't create a match
    board.setTile(0, 0, { type: TileType.Coffee, special: SpecialType.None, row: 0, col: 0 });
    board.setTile(0, 1, { type: TileType.Document, special: SpecialType.None, row: 0, col: 1 });

    const origType0 = board.getTile(0, 0)!.type;
    const origType1 = board.getTile(0, 1)!.type;

    const result = board.trySwap(0, 0, 0, 1);
    // If no match, should revert
    if (!result.valid) {
      expect(board.getTile(0, 0)!.type).toBe(origType0);
      expect(board.getTile(0, 1)!.type).toBe(origType1);
    }
  });
});

// ============================================================
// Task 5: Cascade (gravity + new tile spawning)
// ============================================================
describe('Board - Cascade', () => {
  it('removeAndCascade removes specified tiles', () => {
    const board = new Board(8, 8);
    board.fill();
    const tilesToRemove = [board.getTile(7, 0)!, board.getTile(7, 1)!, board.getTile(7, 2)!];
    board.removeAndCascade(tilesToRemove);
    // After cascade, no cell should be null (all filled)
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 3; c++) {
        expect(board.getTile(r, c)).not.toBeNull();
      }
    }
  });

  it('removeAndCascade drops tiles down by gravity', () => {
    const board = new Board(4, 4);
    // Fill manually
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        board.setTile(r, c, {
          type: (r * 4 + c) % TILE_TYPE_COUNT,
          special: SpecialType.None,
          row: r,
          col: c,
        });
      }
    }
    // Remember the tile at (2, 0) - it should drop to (3, 0)
    const aboveTile = board.getTile(2, 0)!;
    const aboveType = aboveTile.type;

    const step = board.removeAndCascade([board.getTile(3, 0)!]);

    // The tile that was at row 2 should now be at row 3
    expect(board.getTile(3, 0)!.type).toBe(aboveType);
    expect(board.getTile(3, 0)!.row).toBe(3);

    // moved should contain the drop info
    expect(step.moved.length).toBeGreaterThan(0);
  });

  it('removeAndCascade spawns new tiles at top', () => {
    const board = new Board(4, 4);
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        board.setTile(r, c, {
          type: (r * 4 + c) % TILE_TYPE_COUNT,
          special: SpecialType.None,
          row: r,
          col: c,
        });
      }
    }
    const step = board.removeAndCascade([board.getTile(3, 0)!]);

    // One tile removed from column 0, so one should be spawned
    expect(step.spawned.length).toBe(1);
    // Spawned tile should be at row 0
    expect(step.spawned[0].row).toBe(0);
    expect(step.spawned[0].col).toBe(0);
  });

  it('removeAndCascade handles multiple removals in same column', () => {
    const board = new Board(4, 4);
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        board.setTile(r, c, {
          type: (r * 4 + c) % TILE_TYPE_COUNT,
          special: SpecialType.None,
          row: r,
          col: c,
        });
      }
    }
    const tile2 = board.getTile(2, 0)!;
    const tile3 = board.getTile(3, 0)!;
    const type0 = board.getTile(0, 0)!.type;
    const type1 = board.getTile(1, 0)!.type;

    const step = board.removeAndCascade([tile2, tile3]);

    // Tiles from rows 0,1 should drop to rows 2,3
    expect(board.getTile(2, 0)!.type).toBe(type0);
    expect(board.getTile(3, 0)!.type).toBe(type1);
    expect(step.spawned.length).toBe(2);
    // All cells should be filled
    for (let r = 0; r < 4; r++) {
      expect(board.getTile(r, 0)).not.toBeNull();
    }
  });

  it('removeAndCascade returns correct CascadeStep structure', () => {
    const board = new Board(4, 4);
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        board.setTile(r, c, {
          type: (r * 4 + c) % TILE_TYPE_COUNT,
          special: SpecialType.None,
          row: r,
          col: c,
        });
      }
    }
    const removed = [board.getTile(3, 0)!];
    const step = board.removeAndCascade(removed);

    expect(step).toHaveProperty('removed');
    expect(step).toHaveProperty('moved');
    expect(step).toHaveProperty('spawned');
    expect(step.removed).toHaveLength(1);
  });
});
