import { describe, it, expect, beforeEach } from 'vitest';
import { Level, LevelData } from '../Level';

const sampleLevel: LevelData = {
  id: 1,
  moves: 15,
  objectives: [
    { type: 'collect', tileType: 0, count: 10 },
    { type: 'clear_obstacle', obstacleType: 'box', count: 3 },
  ],
  grid: { rows: 8, cols: 8 },
};

describe('Level', () => {
  let level: Level;

  beforeEach(() => {
    level = new Level(sampleLevel);
  });

  describe('initialization', () => {
    it('loads level data correctly', () => {
      expect(level.id).toBe(1);
      expect(level.totalMoves).toBe(15);
      expect(level.movesLeft).toBe(15);
      expect(level.grid).toEqual({ rows: 8, cols: 8 });
    });

    it('initializes objectives with current = 0', () => {
      const objectives = level.objectives;
      expect(objectives).toHaveLength(2);
      expect(objectives[0]).toEqual({
        type: 'collect',
        tileType: 0,
        count: 10,
        current: 0,
      });
      expect(objectives[1]).toEqual({
        type: 'clear_obstacle',
        obstacleType: 'box',
        count: 3,
        current: 0,
      });
    });
  });

  describe('move counting', () => {
    it('decrements moves on useMove()', () => {
      level.useMove();
      expect(level.movesLeft).toBe(14);
    });

    it('decrements multiple moves', () => {
      level.useMove();
      level.useMove();
      level.useMove();
      expect(level.movesLeft).toBe(12);
    });

    it('does not go below 0', () => {
      for (let i = 0; i < 20; i++) {
        level.useMove();
      }
      expect(level.movesLeft).toBe(0);
    });

    it('totalMoves stays constant', () => {
      level.useMove();
      level.useMove();
      expect(level.totalMoves).toBe(15);
    });
  });

  describe('objective progress', () => {
    it('adds progress to collect objective', () => {
      level.addProgress('collect', 0, 3);
      expect(level.objectives[0].current).toBe(3);
    });

    it('adds progress to clear_obstacle objective', () => {
      level.addProgress('clear_obstacle', undefined, 1, 'box');
      expect(level.objectives[1].current).toBe(1);
    });

    it('accumulates progress over multiple calls', () => {
      level.addProgress('collect', 0, 4);
      level.addProgress('collect', 0, 6);
      expect(level.objectives[0].current).toBe(10);
    });

    it('does not add progress to non-matching objectives', () => {
      level.addProgress('collect', 1, 5);
      expect(level.objectives[0].current).toBe(0);
    });

    it('does not exceed target count', () => {
      level.addProgress('collect', 0, 20);
      expect(level.objectives[0].current).toBe(10);
    });
  });

  describe('completion conditions', () => {
    it('isComplete returns false initially', () => {
      expect(level.isComplete()).toBe(false);
    });

    it('isComplete returns true when all objectives met', () => {
      level.addProgress('collect', 0, 10);
      level.addProgress('clear_obstacle', undefined, 3, 'box');
      expect(level.isComplete()).toBe(true);
    });

    it('isComplete returns false when only some objectives met', () => {
      level.addProgress('collect', 0, 10);
      expect(level.isComplete()).toBe(false);
    });

    it('isFailed returns false when moves remain', () => {
      expect(level.isFailed()).toBe(false);
    });

    it('isFailed returns true when no moves left and not complete', () => {
      for (let i = 0; i < 15; i++) {
        level.useMove();
      }
      expect(level.isFailed()).toBe(true);
    });

    it('isFailed returns false when no moves left but complete', () => {
      level.addProgress('collect', 0, 10);
      level.addProgress('clear_obstacle', undefined, 3, 'box');
      for (let i = 0; i < 15; i++) {
        level.useMove();
      }
      expect(level.isFailed()).toBe(false);
    });
  });
});
