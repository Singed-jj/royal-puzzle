export interface LevelObjective {
  type: 'collect' | 'clear_obstacle';
  tileType?: number;
  obstacleType?: string;
  count: number;
  current: number;
}

export interface LevelData {
  id: number;
  moves: number;
  objectives: Array<{
    type: string;
    tileType?: number;
    obstacleType?: string;
    count: number;
  }>;
  grid: { rows: number; cols: number };
}

export class Level {
  readonly id: number;
  readonly totalMoves: number;
  readonly grid: { rows: number; cols: number };
  readonly objectives: LevelObjective[];

  private _movesLeft: number;

  constructor(data: LevelData) {
    this.id = data.id;
    this.totalMoves = data.moves;
    this._movesLeft = data.moves;
    this.grid = { ...data.grid };
    this.objectives = data.objectives.map((obj) => ({
      type: obj.type as 'collect' | 'clear_obstacle',
      tileType: obj.tileType,
      obstacleType: obj.obstacleType,
      count: obj.count,
      current: 0,
    }));
  }

  get movesLeft(): number {
    return this._movesLeft;
  }

  useMove(): void {
    if (this._movesLeft > 0) {
      this._movesLeft--;
    }
  }

  addProgress(
    type: string,
    tileType?: number,
    amount: number = 1,
    obstacleType?: string,
  ): void {
    for (const obj of this.objectives) {
      if (obj.type !== type) continue;

      if (type === 'collect' && obj.tileType !== tileType) continue;
      if (type === 'clear_obstacle' && obj.obstacleType !== obstacleType)
        continue;

      obj.current = Math.min(obj.current + amount, obj.count);
    }
  }

  isComplete(): boolean {
    return this.objectives.every((obj) => obj.current >= obj.count);
  }

  isFailed(): boolean {
    return this._movesLeft <= 0 && !this.isComplete();
  }
}
