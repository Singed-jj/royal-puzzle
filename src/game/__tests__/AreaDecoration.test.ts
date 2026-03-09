import { describe, it, expect, beforeEach } from 'vitest';
import { AreaDecoration } from '../AreaDecoration';

describe('AreaDecoration', () => {
  let areaDecoration: AreaDecoration;

  beforeEach(() => {
    areaDecoration = new AreaDecoration();
  });

  describe('getArea', () => {
    it('id로 영역을 조회할 수 있다', () => {
      const area = areaDecoration.getArea(1);
      expect(area).toBeDefined();
      expect(area!.name).toBe('지하주차장');
      expect(area!.emoji).toBe('🅿️');
    });

    it('존재하지 않는 id는 undefined를 반환한다', () => {
      const area = areaDecoration.getArea(999);
      expect(area).toBeUndefined();
    });

    it('모든 영역을 조회할 수 있다', () => {
      expect(areaDecoration.getArea(1)!.name).toBe('지하주차장');
      expect(areaDecoration.getArea(2)!.name).toBe('사무실');
      expect(areaDecoration.getArea(3)!.name).toBe('회의실');
    });
  });

  describe('getAreaForLevel', () => {
    it('레벨 1-3은 지하주차장에 속한다', () => {
      expect(areaDecoration.getAreaForLevel(1)!.id).toBe(1);
      expect(areaDecoration.getAreaForLevel(2)!.id).toBe(1);
      expect(areaDecoration.getAreaForLevel(3)!.id).toBe(1);
    });

    it('레벨 4-7은 사무실에 속한다', () => {
      expect(areaDecoration.getAreaForLevel(4)!.id).toBe(2);
      expect(areaDecoration.getAreaForLevel(7)!.id).toBe(2);
    });

    it('레벨 8-10은 회의실에 속한다', () => {
      expect(areaDecoration.getAreaForLevel(8)!.id).toBe(3);
      expect(areaDecoration.getAreaForLevel(10)!.id).toBe(3);
    });

    it('존재하지 않는 레벨은 undefined를 반환한다', () => {
      expect(areaDecoration.getAreaForLevel(99)).toBeUndefined();
    });
  });

  describe('unlockDecoration', () => {
    it('데코레이션을 해금할 수 있다', () => {
      const result = areaDecoration.unlockDecoration(1, 'car');
      expect(result).toBe(true);
    });

    it('이미 해금된 데코레이션은 false를 반환한다', () => {
      areaDecoration.unlockDecoration(1, 'car');
      const result = areaDecoration.unlockDecoration(1, 'car');
      expect(result).toBe(false);
    });

    it('존재하지 않는 영역의 데코레이션은 false를 반환한다', () => {
      expect(areaDecoration.unlockDecoration(999, 'car')).toBe(false);
    });

    it('존재하지 않는 데코레이션은 false를 반환한다', () => {
      expect(areaDecoration.unlockDecoration(1, 'nonexistent')).toBe(false);
    });
  });

  describe('getProgress', () => {
    it('초기 진행도는 0이다', () => {
      const progress = areaDecoration.getProgress(1);
      expect(progress).toEqual({ total: 3, unlocked: 0 });
    });

    it('데코레이션 해금 시 진행도가 증가한다', () => {
      areaDecoration.unlockDecoration(1, 'car');
      expect(areaDecoration.getProgress(1)).toEqual({ total: 3, unlocked: 1 });

      areaDecoration.unlockDecoration(1, 'exit_sign');
      expect(areaDecoration.getProgress(1)).toEqual({ total: 3, unlocked: 2 });
    });

    it('사무실 영역의 총 데코레이션 수는 4개이다', () => {
      const progress = areaDecoration.getProgress(2);
      expect(progress).toEqual({ total: 4, unlocked: 0 });
    });

    it('존재하지 않는 영역은 total 0을 반환한다', () => {
      const progress = areaDecoration.getProgress(999);
      expect(progress).toEqual({ total: 0, unlocked: 0 });
    });
  });
});
