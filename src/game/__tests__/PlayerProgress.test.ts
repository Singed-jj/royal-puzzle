import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PlayerProgress } from '../PlayerProgress';

const STORAGE_KEY = 'bear_office_escape_progress';

describe('PlayerProgress', () => {
  let progress: PlayerProgress;
  let store: Record<string, string>;

  beforeEach(() => {
    store = {};
    const localStorageMock = {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
      removeItem: vi.fn((key: string) => { delete store[key]; }),
      clear: vi.fn(() => { store = {}; }),
      length: 0,
      key: vi.fn(() => null),
    };
    vi.stubGlobal('localStorage', localStorageMock);
    progress = new PlayerProgress();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('default state', () => {
    it('기본 레벨은 1이다', () => {
      expect(progress.getCurrentLevel()).toBe(1);
    });

    it('기본 코인은 100이다', () => {
      expect(progress.getCoins()).toBe(100);
    });

    it('기본 라이프는 5이다', () => {
      expect(progress.getLives()).toBe(5);
    });
  });

  describe('completeLevel', () => {
    it('레벨을 완료하면 별이 저장된다', () => {
      progress.completeLevel(1, 3);
      expect(progress.getStars(1)).toBe(3);
    });

    it('더 높은 별 수로 갱신할 수 있다', () => {
      progress.completeLevel(1, 2);
      progress.completeLevel(1, 3);
      expect(progress.getStars(1)).toBe(3);
    });

    it('더 낮은 별 수로는 갱신되지 않는다', () => {
      progress.completeLevel(1, 3);
      progress.completeLevel(1, 1);
      expect(progress.getStars(1)).toBe(3);
    });

    it('현재 레벨보다 높은 레벨을 완료하면 currentLevel이 증가한다', () => {
      progress.completeLevel(1, 2);
      expect(progress.getCurrentLevel()).toBe(2);
    });

    it('이미 통과한 레벨을 다시 완료해도 currentLevel은 변하지 않는다', () => {
      progress.completeLevel(1, 2);
      progress.completeLevel(2, 1);
      progress.completeLevel(1, 3);
      expect(progress.getCurrentLevel()).toBe(3);
    });
  });

  describe('getStars', () => {
    it('플레이하지 않은 레벨은 0을 반환한다', () => {
      expect(progress.getStars(5)).toBe(0);
    });
  });

  describe('lives', () => {
    it('라이프를 사용하면 1 줄어든다', () => {
      progress.useLive();
      expect(progress.getLives()).toBe(4);
    });

    it('라이프가 0이면 useLive는 false를 반환한다', () => {
      for (let i = 0; i < 5; i++) progress.useLive();
      expect(progress.useLive()).toBe(false);
      expect(progress.getLives()).toBe(0);
    });

    it('라이프가 있으면 useLive는 true를 반환한다', () => {
      expect(progress.useLive()).toBe(true);
    });
  });

  describe('refreshLives', () => {
    it('30분이 지나면 라이프 1이 회복된다', () => {
      progress.useLive();
      progress.useLive();
      expect(progress.getLives()).toBe(3);

      // 30분 경과 시뮬레이션
      const thirtyMinutes = 30 * 60 * 1000;
      vi.spyOn(Date, 'now').mockReturnValue(Date.now() + thirtyMinutes);

      progress.refreshLives();
      expect(progress.getLives()).toBe(4);
    });

    it('60분이 지나면 라이프 2가 회복된다', () => {
      for (let i = 0; i < 4; i++) progress.useLive();
      expect(progress.getLives()).toBe(1);

      const sixtyMinutes = 60 * 60 * 1000;
      vi.spyOn(Date, 'now').mockReturnValue(Date.now() + sixtyMinutes);

      progress.refreshLives();
      expect(progress.getLives()).toBe(3);
    });

    it('최대 5를 초과하여 회복되지 않는다', () => {
      progress.useLive();
      expect(progress.getLives()).toBe(4);

      const twoHours = 2 * 60 * 60 * 1000;
      vi.spyOn(Date, 'now').mockReturnValue(Date.now() + twoHours);

      progress.refreshLives();
      expect(progress.getLives()).toBe(5);
    });

    it('라이프가 이미 최대이면 변화 없다', () => {
      const oneHour = 60 * 60 * 1000;
      vi.spyOn(Date, 'now').mockReturnValue(Date.now() + oneHour);

      progress.refreshLives();
      expect(progress.getLives()).toBe(5);
    });
  });

  describe('getTimeToNextLife', () => {
    it('라이프가 최대이면 0을 반환한다', () => {
      expect(progress.getTimeToNextLife()).toBe(0);
    });

    it('라이프를 사용한 직후 약 30분을 반환한다', () => {
      const now = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(now);
      progress.useLive();

      const timeToNext = progress.getTimeToNextLife();
      expect(timeToNext).toBeGreaterThan(0);
      expect(timeToNext).toBeLessThanOrEqual(30 * 60 * 1000);
    });
  });

  describe('coins', () => {
    it('코인을 추가할 수 있다', () => {
      progress.addCoins(50);
      expect(progress.getCoins()).toBe(150);
    });

    it('코인을 사용할 수 있다', () => {
      const result = progress.spendCoins(30);
      expect(result).toBe(true);
      expect(progress.getCoins()).toBe(70);
    });

    it('코인이 부족하면 spendCoins는 false를 반환한다', () => {
      const result = progress.spendCoins(200);
      expect(result).toBe(false);
      expect(progress.getCoins()).toBe(100);
    });
  });

  describe('persistence', () => {
    it('localStorage에 저장된다', () => {
      progress.completeLevel(1, 3);
      expect(store[STORAGE_KEY]).toBeDefined();
    });

    it('localStorage에서 복원된다', () => {
      progress.completeLevel(1, 3);
      progress.addCoins(50);

      const progress2 = new PlayerProgress();
      expect(progress2.getStars(1)).toBe(3);
      expect(progress2.getCoins()).toBe(150);
      expect(progress2.getCurrentLevel()).toBe(2);
    });
  });
});
