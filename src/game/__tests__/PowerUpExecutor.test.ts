import { describe, it, expect, beforeEach } from 'vitest';
import { MockBoard } from './MockBoard';
import { PowerUpExecutor } from '../PowerUpExecutor';
import { TileType, SpecialType } from '../types';

describe('PowerUpExecutor', () => {
  let board: MockBoard;
  let executor: PowerUpExecutor;

  beforeEach(() => {
    board = new MockBoard(9, 9);
    // Fill the board so we can see what gets cleared
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        board.place(r, c, (r + c) % 4 as TileType);
      }
    }
    executor = new PowerUpExecutor(board);
  });

  describe('Rocket', () => {
    it('clears entire row when direction is horizontal', () => {
      board.place(4, 4, TileType.Coffee, SpecialType.Rocket);
      const cleared = executor.execute(4, 4, 'horizontal');
      // Should clear all 9 tiles in row 4
      const rowTiles = cleared.filter((t) => t.row === 4);
      expect(rowTiles.length).toBe(9);
      // Row 4 should be empty
      for (let c = 0; c < 9; c++) {
        expect(board.getTile(4, c)).toBeNull();
      }
    });

    it('clears entire column when direction is vertical', () => {
      board.place(4, 4, TileType.Coffee, SpecialType.Rocket);
      const cleared = executor.execute(4, 4, 'vertical');
      const colTiles = cleared.filter((t) => t.col === 4);
      expect(colTiles.length).toBe(9);
      for (let r = 0; r < 9; r++) {
        expect(board.getTile(r, 4)).toBeNull();
      }
    });
  });

  describe('Propeller', () => {
    it('clears 3x3 area around position', () => {
      board.place(4, 4, TileType.Coffee, SpecialType.Propeller);
      const cleared = executor.execute(4, 4);
      // 3x3 area = 9 tiles (center at 4,4)
      expect(cleared.length).toBe(9);
      for (let r = 3; r <= 5; r++) {
        for (let c = 3; c <= 5; c++) {
          expect(board.getTile(r, c)).toBeNull();
        }
      }
    });

    it('handles edge positions correctly', () => {
      board.place(0, 0, TileType.Coffee, SpecialType.Propeller);
      const cleared = executor.execute(0, 0);
      // Only 2x2 area at corner
      expect(cleared.length).toBe(4);
    });
  });

  describe('Shredder', () => {
    it('clears 3x3 area (like TNT)', () => {
      board.place(4, 4, TileType.Coffee, SpecialType.Shredder);
      const cleared = executor.execute(4, 4);
      expect(cleared.length).toBe(9);
      for (let r = 3; r <= 5; r++) {
        for (let c = 3; c <= 5; c++) {
          expect(board.getTile(r, c)).toBeNull();
        }
      }
    });
  });

  describe('WiFi', () => {
    it('clears all tiles of the swapped type', () => {
      // Place some Coffee tiles specifically
      board.place(0, 0, TileType.Coffee);
      board.place(2, 3, TileType.Coffee);
      board.place(5, 7, TileType.Coffee);
      board.place(4, 4, TileType.Coffee, SpecialType.WiFi);

      const cleared = executor.execute(4, 4, undefined, TileType.Coffee);
      // All Coffee tiles should be cleared
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          const tile = board.getTile(r, c);
          if (tile) {
            expect(tile.type).not.toBe(TileType.Coffee);
          }
        }
      }
      // Should have cleared at least the Coffee tiles we placed + others
      expect(cleared.length).toBeGreaterThan(0);
      expect(cleared.every((t) => t.type === TileType.Coffee)).toBe(true);
    });

    it('clears most common type when no swappedType provided', () => {
      // Reset board and fill with known distribution
      board = new MockBoard(3, 3);
      board.place(0, 0, TileType.Coffee);
      board.place(0, 1, TileType.Coffee);
      board.place(0, 2, TileType.Coffee);
      board.place(1, 0, TileType.Document);
      board.place(1, 1, TileType.Document);
      board.place(1, 2, TileType.Stapler, SpecialType.WiFi);
      board.place(2, 0, TileType.Stapler);
      board.place(2, 1, TileType.PostIt);
      board.place(2, 2, TileType.PostIt);

      executor = new PowerUpExecutor(board);
      const cleared = executor.execute(1, 2);
      // Coffee is most common (3 tiles), should clear them
      expect(cleared.every((t) => t.type === TileType.Coffee)).toBe(true);
      expect(cleared.length).toBe(3);
    });
  });

  describe('edge cases', () => {
    it('returns empty array when no special at position', () => {
      board.place(4, 4, TileType.Coffee, SpecialType.None);
      const cleared = executor.execute(4, 4);
      expect(cleared.length).toBe(0);
    });

    it('returns empty array when position is null', () => {
      board.setTile(4, 4, null);
      const cleared = executor.execute(4, 4);
      expect(cleared.length).toBe(0);
    });
  });
});
