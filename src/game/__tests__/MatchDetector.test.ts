import { describe, it, expect, beforeEach } from 'vitest';
import { MockBoard } from './MockBoard';
import { MatchDetector } from '../MatchDetector';
import { TileType, SpecialType } from '../types';

describe('MatchDetector', () => {
  let board: MockBoard;
  let detector: MatchDetector;

  beforeEach(() => {
    board = new MockBoard(9, 9);
    detector = new MatchDetector(board);
  });

  describe('3 in a row (basic match, no special)', () => {
    it('detects horizontal 3-match', () => {
      board.fillRow(0, 0, 3, TileType.Coffee);
      const results = detector.detectAll();
      expect(results.length).toBe(1);
      expect(results[0].tiles.length).toBe(3);
      expect(results[0].pattern).toBe('horizontal');
      expect(results[0].special).toBeNull();
    });

    it('detects vertical 3-match', () => {
      board.fillCol(0, 0, 3, TileType.Document);
      const results = detector.detectAll();
      expect(results.length).toBe(1);
      expect(results[0].tiles.length).toBe(3);
      expect(results[0].pattern).toBe('vertical');
      expect(results[0].special).toBeNull();
    });
  });

  describe('4 in a row → Rocket', () => {
    it('detects horizontal 4-match as Rocket', () => {
      board.fillRow(0, 0, 4, TileType.Coffee);
      const results = detector.detectAll();
      expect(results.length).toBe(1);
      expect(results[0].tiles.length).toBe(4);
      expect(results[0].special).toBe(SpecialType.Rocket);
      expect(results[0].pattern).toBe('horizontal');
    });

    it('detects vertical 4-match as Rocket', () => {
      board.fillCol(0, 0, 4, TileType.Stapler);
      const results = detector.detectAll();
      expect(results.length).toBe(1);
      expect(results[0].tiles.length).toBe(4);
      expect(results[0].special).toBe(SpecialType.Rocket);
      expect(results[0].pattern).toBe('vertical');
    });
  });

  describe('5 in a row → WiFi', () => {
    it('detects horizontal 5-match as WiFi', () => {
      board.fillRow(0, 0, 5, TileType.PostIt);
      const results = detector.detectAll();
      expect(results.length).toBe(1);
      expect(results[0].tiles.length).toBe(5);
      expect(results[0].special).toBe(SpecialType.WiFi);
      expect(results[0].pattern).toBe('line5');
    });

    it('detects vertical 5-match as WiFi', () => {
      board.fillCol(0, 0, 5, TileType.Coffee);
      const results = detector.detectAll();
      expect(results.length).toBe(1);
      expect(results[0].tiles.length).toBe(5);
      expect(results[0].special).toBe(SpecialType.WiFi);
      expect(results[0].pattern).toBe('line5');
    });
  });

  describe('2x2 square → Propeller', () => {
    it('detects 2x2 square as Propeller', () => {
      board.place(0, 0, TileType.Coffee);
      board.place(0, 1, TileType.Coffee);
      board.place(1, 0, TileType.Coffee);
      board.place(1, 1, TileType.Coffee);
      const results = detector.detectAll();
      expect(results.length).toBe(1);
      expect(results[0].tiles.length).toBe(4);
      expect(results[0].special).toBe(SpecialType.Propeller);
      expect(results[0].pattern).toBe('square');
    });
  });

  describe('T-shape and L-shape → Shredder', () => {
    it('detects T-shape as Shredder', () => {
      // T-shape:
      //  X X X
      //    X
      //    X
      board.fillRow(0, 0, 3, TileType.Coffee);
      board.place(1, 1, TileType.Coffee);
      board.place(2, 1, TileType.Coffee);
      const results = detector.detectAll();
      expect(results.length).toBe(1);
      expect(results[0].tiles.length).toBe(5);
      expect(results[0].special).toBe(SpecialType.Shredder);
      expect(results[0].pattern).toBe('T');
    });

    it('detects L-shape as Shredder', () => {
      // L-shape:
      //  X
      //  X
      //  X X X
      board.place(0, 0, TileType.Document);
      board.place(1, 0, TileType.Document);
      board.place(2, 0, TileType.Document);
      board.place(2, 1, TileType.Document);
      board.place(2, 2, TileType.Document);
      const results = detector.detectAll();
      expect(results.length).toBe(1);
      expect(results[0].tiles.length).toBe(5);
      expect(results[0].special).toBe(SpecialType.Shredder);
      expect(results[0].pattern).toBe('L');
    });
  });

  describe('no match', () => {
    it('returns empty array when no matches exist', () => {
      board.place(0, 0, TileType.Coffee);
      board.place(0, 1, TileType.Document);
      board.place(0, 2, TileType.Stapler);
      const results = detector.detectAll();
      expect(results.length).toBe(0);
    });

    it('returns empty array for empty board', () => {
      const results = detector.detectAll();
      expect(results.length).toBe(0);
    });
  });

  describe('multiple matches', () => {
    it('detects two separate matches', () => {
      board.fillRow(0, 0, 3, TileType.Coffee);
      board.fillRow(3, 0, 3, TileType.Document);
      const results = detector.detectAll();
      expect(results.length).toBe(2);
    });
  });
});
