import { describe, it, expect } from 'vitest';
import { Obstacle } from '../Obstacle';
import { ObstacleType } from '../types';

describe('Obstacle', () => {
  describe('Box (택배상자)', () => {
    it('has 1 HP', () => {
      const box = new Obstacle(ObstacleType.Box, 0, 0);
      expect(box.hp).toBe(1);
    });

    it('is destroyed in 1 hit', () => {
      const box = new Obstacle(ObstacleType.Box, 0, 0);
      box.hit();
      expect(box.isDestroyed()).toBe(true);
    });
  });

  describe('FileCabinet (서류함)', () => {
    it('has 2 HP', () => {
      const cabinet = new Obstacle(ObstacleType.FileCabinet, 2, 3);
      expect(cabinet.hp).toBe(2);
    });

    it('is not destroyed after 1 hit', () => {
      const cabinet = new Obstacle(ObstacleType.FileCabinet, 2, 3);
      cabinet.hit();
      expect(cabinet.isDestroyed()).toBe(false);
      expect(cabinet.hp).toBe(1);
    });

    it('is destroyed after 2 hits', () => {
      const cabinet = new Obstacle(ObstacleType.FileCabinet, 2, 3);
      cabinet.hit();
      cabinet.hit();
      expect(cabinet.isDestroyed()).toBe(true);
    });
  });

  describe('Printer (프린터 잼)', () => {
    it('has 1 HP', () => {
      const printer = new Obstacle(ObstacleType.Printer, 1, 1);
      expect(printer.hp).toBe(1);
    });

    it('is destroyed in 1 hit', () => {
      const printer = new Obstacle(ObstacleType.Printer, 1, 1);
      printer.hit();
      expect(printer.isDestroyed()).toBe(true);
    });

    it('blocks movement', () => {
      const printer = new Obstacle(ObstacleType.Printer, 1, 1);
      expect(printer.blocksMovement).toBe(true);
    });
  });

  describe('CoffeeSplash (커피 얼룩)', () => {
    it('has 1 HP', () => {
      const splash = new Obstacle(ObstacleType.CoffeeSplash, 4, 4);
      expect(splash.hp).toBe(1);
    });

    it('is destroyed in 1 hit', () => {
      const splash = new Obstacle(ObstacleType.CoffeeSplash, 4, 4);
      splash.hit();
      expect(splash.isDestroyed()).toBe(true);
    });

    it('can spread', () => {
      const splash = new Obstacle(ObstacleType.CoffeeSplash, 4, 4);
      expect(splash.canSpread).toBe(true);
    });
  });

  describe('HP tracking', () => {
    it('stores position correctly', () => {
      const obstacle = new Obstacle(ObstacleType.Box, 3, 5);
      expect(obstacle.row).toBe(3);
      expect(obstacle.col).toBe(5);
    });

    it('stores type correctly', () => {
      const obstacle = new Obstacle(ObstacleType.FileCabinet, 0, 0);
      expect(obstacle.type).toBe(ObstacleType.FileCabinet);
    });

    it('does not reduce HP below 0', () => {
      const box = new Obstacle(ObstacleType.Box, 0, 0);
      box.hit();
      box.hit();
      expect(box.hp).toBe(0);
    });

    it('returns ObstacleData via toData()', () => {
      const obstacle = new Obstacle(ObstacleType.FileCabinet, 2, 3);
      const data = obstacle.toData();
      expect(data).toEqual({
        type: ObstacleType.FileCabinet,
        row: 2,
        col: 3,
        hp: 2,
      });
    });
  });
});
