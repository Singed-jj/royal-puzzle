export enum TileType {
  Coffee = 0,
  Document = 1,
  Stapler = 2,
  PostIt = 3,
}

export enum SpecialType {
  None = 0,
  Rocket = 1,
  Propeller = 2,
  Shredder = 3,
  WiFi = 4,
}

export enum ObstacleType {
  Box = 'box',
  FileCabinet = 'cabinet',
  Printer = 'printer',
  CoffeeSplash = 'splash',
}

export interface TileData {
  type: TileType;
  special: SpecialType;
  row: number;
  col: number;
}

export interface MatchResult {
  tiles: TileData[];
  special: SpecialType | null;
  pattern: 'horizontal' | 'vertical' | 'L' | 'T' | 'square' | 'line5';
}

export interface SwapResult {
  valid: boolean;
  matches: MatchResult[];
  cascades: CascadeStep[];
}

export interface CascadeStep {
  removed: TileData[];
  moved: Array<{ tile: TileData; fromRow: number; toRow: number }>;
  spawned: TileData[];
}

export interface ObstacleData {
  type: ObstacleType;
  row: number;
  col: number;
  hp: number;
}

export interface BoardLike {
  readonly rows: number;
  readonly cols: number;
  getTile(row: number, col: number): TileData | null;
  setTile(row: number, col: number, tile: TileData | null): void;
}
