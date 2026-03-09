import { describe, it, expect, beforeEach } from 'vitest';
import { MockBoard } from './MockBoard';
import { PowerUpCombiner, CombineResult } from '../PowerUpCombiner';
import { TileType, SpecialType } from '../types';

describe('PowerUpCombiner', () => {
  let board: MockBoard;
  let combiner: PowerUpCombiner;

  beforeEach(() => {
    board = new MockBoard(9, 9);
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        board.place(r, c, (r + c) % 4 as TileType);
      }
    }
    combiner = new PowerUpCombiner(board);
  });

  describe('order independence', () => {
    it('Rocket+Shredder equals Shredder+Rocket', () => {
      const r1 = combiner.getCombination(SpecialType.Rocket, SpecialType.Shredder);
      const r2 = combiner.getCombination(SpecialType.Shredder, SpecialType.Rocket);
      expect(r1).toBe(r2);
    });
  });

  describe('Rocket + Rocket → Cross', () => {
    it('clears both row and column', () => {
      board.place(4, 4, TileType.Coffee, SpecialType.Rocket);
      board.place(4, 5, TileType.Document, SpecialType.Rocket);
      const result = combiner.execute(4, 4, 4, 5);
      expect(result.name).toBe('Cross');
      // Row 4 + Column 4 + Column 5 should be cleared
      for (let c = 0; c < 9; c++) {
        expect(board.getTile(4, c)).toBeNull();
      }
      for (let r = 0; r < 9; r++) {
        expect(board.getTile(r, 4)).toBeNull();
        expect(board.getTile(r, 5)).toBeNull();
      }
    });
  });

  describe('Rocket + Shredder → BigCross', () => {
    it('clears 3 rows + 3 columns', () => {
      board.place(4, 4, TileType.Coffee, SpecialType.Rocket);
      board.place(4, 5, TileType.Document, SpecialType.Shredder);
      const result = combiner.execute(4, 4, 4, 5);
      expect(result.name).toBe('BigCross');
      // Rows 3-5 and columns 3-6 should be cleared
      for (let r = 3; r <= 5; r++) {
        for (let c = 0; c < 9; c++) {
          expect(board.getTile(r, c)).toBeNull();
        }
      }
    });
  });

  describe('Rocket + Propeller → RocketToTarget', () => {
    it('returns RocketToTarget combination', () => {
      board.place(4, 4, TileType.Coffee, SpecialType.Rocket);
      board.place(4, 5, TileType.Document, SpecialType.Propeller);
      const result = combiner.execute(4, 4, 4, 5);
      expect(result.name).toBe('RocketToTarget');
      expect(result.cleared.length).toBeGreaterThan(0);
    });
  });

  describe('Rocket + WiFi → AllToRocket', () => {
    it('clears all tiles of a type via rockets', () => {
      board.place(4, 4, TileType.Coffee, SpecialType.Rocket);
      board.place(4, 5, TileType.Document, SpecialType.WiFi);
      const result = combiner.execute(4, 4, 4, 5);
      expect(result.name).toBe('AllToRocket');
      expect(result.cleared.length).toBeGreaterThan(0);
    });
  });

  describe('Shredder + Shredder → MegaExplosion', () => {
    it('clears 4-tile radius area', () => {
      board.place(4, 4, TileType.Coffee, SpecialType.Shredder);
      board.place(4, 5, TileType.Document, SpecialType.Shredder);
      const result = combiner.execute(4, 4, 4, 5);
      expect(result.name).toBe('MegaExplosion');
      // Should clear large area (radius 4 from center)
      expect(result.cleared.length).toBeGreaterThan(9);
    });
  });

  describe('Shredder + Propeller → ShredderToTarget', () => {
    it('returns ShredderToTarget combination', () => {
      board.place(4, 4, TileType.Coffee, SpecialType.Shredder);
      board.place(4, 5, TileType.Document, SpecialType.Propeller);
      const result = combiner.execute(4, 4, 4, 5);
      expect(result.name).toBe('ShredderToTarget');
      expect(result.cleared.length).toBeGreaterThan(0);
    });
  });

  describe('Shredder + WiFi → AllToShredder', () => {
    it('converts all of a type to shredders and detonates', () => {
      board.place(4, 4, TileType.Coffee, SpecialType.Shredder);
      board.place(4, 5, TileType.Document, SpecialType.WiFi);
      const result = combiner.execute(4, 4, 4, 5);
      expect(result.name).toBe('AllToShredder');
      expect(result.cleared.length).toBeGreaterThan(0);
    });
  });

  describe('Propeller + Propeller → TriplePropeller', () => {
    it('clears 3 target areas', () => {
      board.place(4, 4, TileType.Coffee, SpecialType.Propeller);
      board.place(4, 5, TileType.Document, SpecialType.Propeller);
      const result = combiner.execute(4, 4, 4, 5);
      expect(result.name).toBe('TriplePropeller');
      expect(result.cleared.length).toBeGreaterThan(0);
    });
  });

  describe('Propeller + WiFi → AllToPropeller', () => {
    it('converts all of a type to propellers', () => {
      board.place(4, 4, TileType.Coffee, SpecialType.Propeller);
      board.place(4, 5, TileType.Document, SpecialType.WiFi);
      const result = combiner.execute(4, 4, 4, 5);
      expect(result.name).toBe('AllToPropeller');
      expect(result.cleared.length).toBeGreaterThan(0);
    });
  });

  describe('WiFi + WiFi → ClearAll', () => {
    it('clears entire board', () => {
      board.place(4, 4, TileType.Coffee, SpecialType.WiFi);
      board.place(4, 5, TileType.Document, SpecialType.WiFi);
      const result = combiner.execute(4, 4, 4, 5);
      expect(result.name).toBe('ClearAll');
      // Entire board should be cleared
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          expect(board.getTile(r, c)).toBeNull();
        }
      }
    });
  });

  describe('non-special tiles', () => {
    it('returns null for non-special combination', () => {
      const result = combiner.getCombination(SpecialType.None, SpecialType.Rocket);
      expect(result).toBeNull();
    });
  });
});
