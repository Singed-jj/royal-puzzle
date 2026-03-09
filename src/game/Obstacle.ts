import { ObstacleType, ObstacleData } from './types';

const OBSTACLE_HP: Record<ObstacleType, number> = {
  [ObstacleType.Box]: 1,
  [ObstacleType.FileCabinet]: 2,
  [ObstacleType.Printer]: 1,
  [ObstacleType.CoffeeSplash]: 1,
};

export class Obstacle {
  readonly type: ObstacleType;
  row: number;
  col: number;
  private _hp: number;

  constructor(type: ObstacleType, row: number, col: number) {
    this.type = type;
    this.row = row;
    this.col = col;
    this._hp = OBSTACLE_HP[type];
  }

  get hp(): number {
    return this._hp;
  }

  get blocksMovement(): boolean {
    return this.type === ObstacleType.Printer;
  }

  get canSpread(): boolean {
    return this.type === ObstacleType.CoffeeSplash;
  }

  hit(): void {
    if (this._hp > 0) {
      this._hp--;
    }
  }

  isDestroyed(): boolean {
    return this._hp <= 0;
  }

  toData(): ObstacleData {
    return {
      type: this.type,
      row: this.row,
      col: this.col,
      hp: this._hp,
    };
  }
}
