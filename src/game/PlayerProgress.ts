const STORAGE_KEY = 'bear_office_escape_progress';
const MAX_LIVES = 5;
const LIFE_RECOVERY_MS = 30 * 60 * 1000; // 30 minutes

interface ProgressData {
  currentLevel: number;
  starsPerLevel: Record<number, number>;
  coins: number;
  lives: number;
  lastLifeTime: number;
}

function defaultState(): ProgressData {
  return {
    currentLevel: 1,
    starsPerLevel: {},
    coins: 100,
    lives: 5,
    lastLifeTime: Date.now(),
  };
}

export class PlayerProgress {
  private data: ProgressData;

  constructor() {
    this.data = this.load();
  }

  private load(): ProgressData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as ProgressData;
    } catch {
      // ignore parse errors
    }
    return defaultState();
  }

  private save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  getCurrentLevel(): number {
    return this.data.currentLevel;
  }

  completeLevel(id: number, stars: number): void {
    const prev = this.data.starsPerLevel[id] ?? 0;
    if (stars > prev) {
      this.data.starsPerLevel[id] = stars;
    }
    if (id >= this.data.currentLevel) {
      this.data.currentLevel = id + 1;
    }
    this.save();
  }

  getStars(levelId: number): number {
    return this.data.starsPerLevel[levelId] ?? 0;
  }

  getLives(): number {
    return this.data.lives;
  }

  useLive(): boolean {
    if (this.data.lives <= 0) return false;
    this.data.lives--;
    if (this.data.lives < MAX_LIVES && this.data.lastLifeTime === 0) {
      this.data.lastLifeTime = Date.now();
    }
    if (this.data.lives < MAX_LIVES) {
      this.data.lastLifeTime = Date.now();
    }
    this.save();
    return true;
  }

  refreshLives(): void {
    if (this.data.lives >= MAX_LIVES) return;

    const now = Date.now();
    const elapsed = now - this.data.lastLifeTime;
    const recovered = Math.floor(elapsed / LIFE_RECOVERY_MS);

    if (recovered > 0) {
      this.data.lives = Math.min(MAX_LIVES, this.data.lives + recovered);
      if (this.data.lives >= MAX_LIVES) {
        this.data.lastLifeTime = 0;
      } else {
        this.data.lastLifeTime = this.data.lastLifeTime + recovered * LIFE_RECOVERY_MS;
      }
      this.save();
    }
  }

  getTimeToNextLife(): number {
    if (this.data.lives >= MAX_LIVES) return 0;
    const now = Date.now();
    const elapsed = now - this.data.lastLifeTime;
    const remaining = LIFE_RECOVERY_MS - (elapsed % LIFE_RECOVERY_MS);
    return remaining;
  }

  getCoins(): number {
    return this.data.coins;
  }

  addCoins(amount: number): void {
    this.data.coins += amount;
    this.save();
  }

  spendCoins(amount: number): boolean {
    if (this.data.coins < amount) return false;
    this.data.coins -= amount;
    this.save();
    return true;
  }
}
