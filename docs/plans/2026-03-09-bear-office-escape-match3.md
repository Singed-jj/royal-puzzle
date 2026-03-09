# 탈출! 곰사원 (Bear Office Escape) - Match-3 퍼즐 게임 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Royal Match와 동일한 match-3 퍼즐 시스템을 가진 모바일 웹 게임을 귀여운 곰 회사원 + 악당 사장 탈출 테마로 구현한다.

**Architecture:** Phaser 3.90 기반 HTML5 Canvas 게임. TypeScript + Vite 빌드. PWA로 모바일 웹 배포. 게임 상태는 Phaser Registry + LocalStorage로 관리. 레벨 데이터는 JSON 파일로 분리.

**Tech Stack:** Phaser 3.90, TypeScript 5+, Vite 5+, PWA (Service Worker + Manifest)

---

## Phase 1: 프로젝트 셋업 & 빈 게임 보드

### Task 1: 프로젝트 초기화

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.ts`
- Create: `src/config.ts`

**Step 1: Phaser + Vite + TypeScript 프로젝트 생성**

```bash
cd /Users/jaejin/projects/toy/royal-puzzle
npm create vite@latest . -- --template vanilla-ts
npm install phaser@3.90.0
```

**Step 2: Vite 설정 파일 작성**

```typescript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    outDir: 'dist',
  },
  server: {
    port: 3000,
    open: true,
  },
});
```

**Step 3: Phaser 게임 설정 작성**

```typescript
// src/config.ts
import Phaser from 'phaser';

export const GAME_WIDTH = 390;
export const GAME_HEIGHT = 844;
export const GRID_COLS = 8;
export const GRID_ROWS = 8;
export const TILE_SIZE = 44;
export const GRID_OFFSET_X = 11;
export const GRID_OFFSET_Y = 180;

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#FFF8E7',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [],
};
```

**Step 4: 엔트리 포인트 작성**

```typescript
// src/main.ts
import Phaser from 'phaser';
import { gameConfig } from './config';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';

const config = {
  ...gameConfig,
  scene: [BootScene, GameScene],
};

new Phaser.Game(config);
```

**Step 5: 개발 서버 실행 확인**

Run: `npm run dev`
Expected: 브라우저에서 빈 크림색 화면 (390x844) 표시

**Step 6: Commit**

```bash
git add package.json tsconfig.json vite.config.ts index.html src/
git commit -m "chore: Phaser 3 + Vite + TypeScript 프로젝트 초기화"
```

---

### Task 2: 기본 씬 구조 생성

**Files:**
- Create: `src/scenes/BootScene.ts`
- Create: `src/scenes/GameScene.ts`

**Step 1: BootScene 작성 (에셋 로딩)**

```typescript
// src/scenes/BootScene.ts
import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // 플레이스홀더: 향후 에셋 로딩
    this.createPlaceholderTextures();
  }

  create(): void {
    this.scene.start('GameScene');
  }

  private createPlaceholderTextures(): void {
    const colors = [0xC17A50, 0xF5E6CA, 0x7BAFD4, 0x9DC183];
    const names = ['coffee', 'document', 'stapler', 'postit'];

    names.forEach((name, i) => {
      const graphics = this.add.graphics();
      graphics.fillStyle(colors[i], 1);
      graphics.fillRoundedRect(0, 0, 40, 40, 8);
      graphics.generateTexture(name, 40, 40);
      graphics.destroy();
    });
  }
}
```

**Step 2: 빈 GameScene 작성**

```typescript
// src/scenes/GameScene.ts
import Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      '탈출! 곰사원',
      { fontSize: '32px', color: '#5C3D2E', fontFamily: 'Arial' }
    ).setOrigin(0.5);
  }
}
```

**Step 3: 실행 확인**

Run: `npm run dev`
Expected: 화면 중앙에 "탈출! 곰사원" 텍스트 표시

**Step 4: Commit**

```bash
git add src/scenes/
git commit -m "feat: BootScene, GameScene 기본 씬 구조 생성"
```

---

### Task 3: 그리드 시스템 - 데이터 모델

**Files:**
- Create: `src/game/Board.ts`
- Create: `src/game/Tile.ts`
- Create: `src/game/types.ts`
- Test: `src/game/__tests__/Board.test.ts`

**Step 1: 타입 정의**

```typescript
// src/game/types.ts
export enum TileType {
  Coffee = 0,   // ☕ 커피
  Document = 1, // 📄 서류
  Stapler = 2,  // 📎 스테이플러
  PostIt = 3,   // 📝 포스트잇
}

export enum SpecialType {
  None = 0,
  Rocket = 1,     // 4매치 → 한 줄 제거
  Propeller = 2,  // 2x2 매치 → 랜덤 타겟 제거
  Shredder = 3,   // T/L 매치 → 범위 폭발 (TNT 대응)
  WiFi = 4,       // 5매치 → 같은 타입 전체 제거 (Light Ball 대응)
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
```

**Step 2: 보드 테스트 작성**

먼저 vitest 설치:
```bash
npm install -D vitest
```

```typescript
// src/game/__tests__/Board.test.ts
import { describe, it, expect } from 'vitest';
import { Board } from '../Board';
import { TileType } from '../types';

describe('Board', () => {
  it('8x8 그리드를 생성한다', () => {
    const board = new Board(8, 8);
    expect(board.rows).toBe(8);
    expect(board.cols).toBe(8);
  });

  it('모든 셀이 타일로 채워진다', () => {
    const board = new Board(8, 8);
    board.fill();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        expect(board.getTile(r, c)).not.toBeNull();
      }
    }
  });

  it('초기 생성 시 3매치가 없다', () => {
    const board = new Board(8, 8);
    board.fill();
    const matches = board.findAllMatches();
    expect(matches).toHaveLength(0);
  });
});
```

**Step 3: 테스트 실패 확인**

Run: `npx vitest run src/game/__tests__/Board.test.ts`
Expected: FAIL - Board 모듈 미존재

**Step 4: Board 클래스 구현**

```typescript
// src/game/Board.ts
import { TileData, TileType, SpecialType, MatchResult } from './types';

const TILE_TYPE_COUNT = 4;

export class Board {
  readonly rows: number;
  readonly cols: number;
  private grid: (TileData | null)[][];

  constructor(rows: number, cols: number) {
    this.rows = rows;
    this.cols = cols;
    this.grid = Array.from({ length: rows }, () => Array(cols).fill(null));
  }

  getTile(row: number, col: number): TileData | null {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return null;
    return this.grid[row][col];
  }

  setTile(row: number, col: number, tile: TileData | null): void {
    if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
      this.grid[row][col] = tile;
    }
  }

  fill(): void {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        let type: TileType;
        do {
          type = Math.floor(Math.random() * TILE_TYPE_COUNT) as TileType;
        } while (this.wouldMatch(r, c, type));

        this.grid[r][c] = {
          type,
          special: SpecialType.None,
          row: r,
          col: c,
        };
      }
    }
  }

  private wouldMatch(row: number, col: number, type: TileType): boolean {
    // 가로 3매치 체크
    if (
      col >= 2 &&
      this.grid[row][col - 1]?.type === type &&
      this.grid[row][col - 2]?.type === type
    ) {
      return true;
    }
    // 세로 3매치 체크
    if (
      row >= 2 &&
      this.grid[row - 1]?.[col]?.type === type &&
      this.grid[row - 2]?.[col]?.type === type
    ) {
      return true;
    }
    return false;
  }

  findAllMatches(): MatchResult[] {
    const matches: MatchResult[] = [];
    const visited = Array.from({ length: this.rows }, () =>
      Array(this.cols).fill(false)
    );

    // 가로 매치
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c <= this.cols - 3; c++) {
        const tile = this.grid[r][c];
        if (!tile) continue;

        let matchLen = 1;
        while (
          c + matchLen < this.cols &&
          this.grid[r][c + matchLen]?.type === tile.type
        ) {
          matchLen++;
        }

        if (matchLen >= 3) {
          const tiles: TileData[] = [];
          for (let i = 0; i < matchLen; i++) {
            tiles.push(this.grid[r][c + i]!);
          }
          matches.push({
            tiles,
            special: this.determineSpecial(matchLen, 'horizontal'),
            pattern: matchLen >= 5 ? 'line5' : 'horizontal',
          });
          c += matchLen - 1;
        }
      }
    }

    // 세로 매치
    for (let c = 0; c < this.cols; c++) {
      for (let r = 0; r <= this.rows - 3; r++) {
        const tile = this.grid[r][c];
        if (!tile) continue;

        let matchLen = 1;
        while (
          r + matchLen < this.rows &&
          this.grid[r + matchLen]?.[c]?.type === tile.type
        ) {
          matchLen++;
        }

        if (matchLen >= 3) {
          const tiles: TileData[] = [];
          for (let i = 0; i < matchLen; i++) {
            tiles.push(this.grid[r + i][c]!);
          }
          matches.push({
            tiles,
            special: this.determineSpecial(matchLen, 'vertical'),
            pattern: matchLen >= 5 ? 'line5' : 'vertical',
          });
          r += matchLen - 1;
        }
      }
    }

    return matches;
  }

  private determineSpecial(
    length: number,
    direction: 'horizontal' | 'vertical'
  ): SpecialType | null {
    if (length === 4) return SpecialType.Rocket;
    if (length >= 5) return SpecialType.WiFi;
    return null;
  }
}
```

**Step 5: 테스트 통과 확인**

Run: `npx vitest run src/game/__tests__/Board.test.ts`
Expected: 3 tests PASS

**Step 6: Commit**

```bash
git add src/game/ vitest.config.ts
git commit -m "feat: Board 데이터 모델 및 기본 매칭 로직 구현"
```

---

### Task 4: 스왑 & 매치 감지

**Files:**
- Modify: `src/game/Board.ts`
- Test: `src/game/__tests__/Board.test.ts`

**Step 1: 스왑 테스트 작성**

```typescript
// src/game/__tests__/Board.test.ts 에 추가
describe('Board - swap', () => {
  it('인접한 타일끼리 스왑한다', () => {
    const board = new Board(8, 8);
    board.fill();
    const tile1 = board.getTile(0, 0)!;
    const tile2 = board.getTile(0, 1)!;
    const type1 = tile1.type;
    const type2 = tile2.type;

    board.swap(0, 0, 0, 1);

    expect(board.getTile(0, 0)!.type).toBe(type2);
    expect(board.getTile(0, 1)!.type).toBe(type1);
  });

  it('인접하지 않은 타일은 스왑할 수 없다', () => {
    const board = new Board(8, 8);
    board.fill();
    const result = board.swap(0, 0, 2, 2);
    expect(result).toBe(false);
  });

  it('매치가 없는 스왑은 되돌린다', () => {
    const board = new Board(8, 8);
    board.fill();
    const type1 = board.getTile(0, 0)!.type;
    const type2 = board.getTile(0, 1)!.type;

    board.trySwap(0, 0, 0, 1);

    // 매치가 없으면 원래 위치로
    if (type1 !== type2) {
      // 대부분의 경우 매치가 안 되므로 원복
      expect(board.getTile(0, 0)!.type).toBe(type1);
      expect(board.getTile(0, 1)!.type).toBe(type2);
    }
  });
});
```

**Step 2: 테스트 실패 확인**

Run: `npx vitest run src/game/__tests__/Board.test.ts`
Expected: FAIL - swap, trySwap 미정의

**Step 3: swap, trySwap 구현**

```typescript
// Board.ts에 추가
swap(r1: number, c1: number, r2: number, c2: number): boolean {
  const dist = Math.abs(r1 - r2) + Math.abs(c1 - c2);
  if (dist !== 1) return false;

  const tile1 = this.grid[r1][c1];
  const tile2 = this.grid[r2][c2];
  if (!tile1 || !tile2) return false;

  // 위치 교환
  this.grid[r1][c1] = { ...tile2, row: r1, col: c1 };
  this.grid[r2][c2] = { ...tile1, row: r2, col: c2 };
  return true;
}

trySwap(r1: number, c1: number, r2: number, c2: number): MatchResult[] {
  if (!this.swap(r1, c1, r2, c2)) return [];

  const matches = this.findAllMatches();
  if (matches.length === 0) {
    // 매치 없으면 되돌리기
    this.swap(r1, c1, r2, c2);
  }
  return matches;
}
```

**Step 4: 테스트 통과 확인**

Run: `npx vitest run src/game/__tests__/Board.test.ts`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/game/
git commit -m "feat: 타일 스왑 및 유효성 검증 로직 구현"
```

---

### Task 5: 캐스케이드 (중력 낙하 + 새 타일 생성)

**Files:**
- Modify: `src/game/Board.ts`
- Test: `src/game/__tests__/Board.test.ts`

**Step 1: 캐스케이드 테스트 작성**

```typescript
describe('Board - cascade', () => {
  it('매치된 타일 제거 후 위 타일이 내려온다', () => {
    const board = new Board(8, 8);
    board.fill();

    // 수동으로 3매치 설정
    board.setTile(7, 0, { type: TileType.Coffee, special: SpecialType.None, row: 7, col: 0 });
    board.setTile(7, 1, { type: TileType.Coffee, special: SpecialType.None, row: 7, col: 1 });
    board.setTile(7, 2, { type: TileType.Coffee, special: SpecialType.None, row: 7, col: 2 });

    const cascade = board.removeAndCascade([
      board.getTile(7, 0)!,
      board.getTile(7, 1)!,
      board.getTile(7, 2)!,
    ]);

    // 빈 칸이 없어야 함
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 3; c++) {
        expect(board.getTile(r, c)).not.toBeNull();
      }
    }
    expect(cascade.moved.length).toBeGreaterThan(0);
    expect(cascade.spawned.length).toBe(3);
  });
});
```

**Step 2: 테스트 실패 확인**

Run: `npx vitest run src/game/__tests__/Board.test.ts`
Expected: FAIL - removeAndCascade 미정의

**Step 3: 캐스케이드 로직 구현**

```typescript
// Board.ts에 추가
removeAndCascade(tiles: TileData[]): CascadeStep {
  const moved: CascadeStep['moved'] = [];
  const spawned: TileData[] = [];

  // 1. 타일 제거
  for (const tile of tiles) {
    this.grid[tile.row][tile.col] = null;
  }

  // 2. 중력 낙하 (각 열별로 처리)
  const affectedCols = new Set(tiles.map((t) => t.col));

  for (const col of affectedCols) {
    let writeRow = this.rows - 1;

    // 아래부터 위로 스캔
    for (let readRow = this.rows - 1; readRow >= 0; readRow--) {
      const tile = this.grid[readRow][col];
      if (tile) {
        if (readRow !== writeRow) {
          moved.push({ tile, fromRow: readRow, toRow: writeRow });
          this.grid[writeRow][col] = { ...tile, row: writeRow };
          this.grid[readRow][col] = null;
        }
        writeRow--;
      }
    }

    // 3. 빈 칸에 새 타일 생성
    for (let r = writeRow; r >= 0; r--) {
      const newTile: TileData = {
        type: Math.floor(Math.random() * 4) as TileType,
        special: SpecialType.None,
        row: r,
        col,
      };
      this.grid[r][col] = newTile;
      spawned.push(newTile);
    }
  }

  return { removed: tiles, moved, spawned };
}
```

**Step 4: 테스트 통과 확인**

Run: `npx vitest run src/game/__tests__/Board.test.ts`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/game/
git commit -m "feat: 캐스케이드 (중력 낙하 + 새 타일 생성) 구현"
```

---

## Phase 2: 게임 보드 렌더링 & 인터랙션

### Task 6: 보드 비주얼 렌더링

**Files:**
- Create: `src/game/BoardRenderer.ts`
- Modify: `src/scenes/GameScene.ts`
- Modify: `src/scenes/BootScene.ts`

**Step 1: BoardRenderer 클래스 작성**

```typescript
// src/game/BoardRenderer.ts
import Phaser from 'phaser';
import { Board } from './Board';
import { TileData, TileType } from './types';
import { TILE_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y } from '../config';

const TILE_TEXTURE_MAP: Record<TileType, string> = {
  [TileType.Coffee]: 'coffee',
  [TileType.Document]: 'document',
  [TileType.Stapler]: 'stapler',
  [TileType.PostIt]: 'postit',
};

export class BoardRenderer {
  private scene: Phaser.Scene;
  private board: Board;
  private sprites: (Phaser.GameObjects.Sprite | null)[][];
  private container: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, board: Board) {
    this.scene = scene;
    this.board = board;
    this.container = scene.add.container(GRID_OFFSET_X, GRID_OFFSET_Y);
    this.sprites = Array.from({ length: board.rows }, () =>
      Array(board.cols).fill(null)
    );
  }

  renderAll(): void {
    for (let r = 0; r < this.board.rows; r++) {
      for (let c = 0; c < this.board.cols; c++) {
        this.renderTile(r, c);
      }
    }
  }

  private renderTile(row: number, col: number): void {
    const tile = this.board.getTile(row, col);
    if (!tile) return;

    const x = col * TILE_SIZE + TILE_SIZE / 2;
    const y = row * TILE_SIZE + TILE_SIZE / 2;
    const texture = TILE_TEXTURE_MAP[tile.type];

    const sprite = this.scene.add.sprite(x, y, texture);
    sprite.setInteractive();
    sprite.setData('row', row);
    sprite.setData('col', col);

    this.container.add(sprite);
    this.sprites[row][col] = sprite;
  }

  getSprite(row: number, col: number): Phaser.GameObjects.Sprite | null {
    return this.sprites[row][col];
  }

  // 스왑 애니메이션
  async animateSwap(
    r1: number, c1: number,
    r2: number, c2: number
  ): Promise<void> {
    const s1 = this.sprites[r1][c1];
    const s2 = this.sprites[r2][c2];
    if (!s1 || !s2) return;

    const duration = 150;

    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: s1,
        x: c2 * TILE_SIZE + TILE_SIZE / 2,
        y: r2 * TILE_SIZE + TILE_SIZE / 2,
        duration,
        ease: 'Power2',
      });
      this.scene.tweens.add({
        targets: s2,
        x: c1 * TILE_SIZE + TILE_SIZE / 2,
        y: r1 * TILE_SIZE + TILE_SIZE / 2,
        duration,
        ease: 'Power2',
        onComplete: () => {
          // 스프라이트 참조 교환
          this.sprites[r1][c1] = s2;
          this.sprites[r2][c2] = s1;
          s1.setData('row', r2).setData('col', c2);
          s2.setData('row', r1).setData('col', c1);
          resolve();
        },
      });
    });
  }

  // 매치 제거 애니메이션
  async animateRemove(tiles: TileData[]): Promise<void> {
    const promises = tiles.map((tile) => {
      const sprite = this.sprites[tile.row][tile.col];
      if (!sprite) return Promise.resolve();

      return new Promise<void>((resolve) => {
        this.scene.tweens.add({
          targets: sprite,
          scale: 1.3,
          alpha: 0,
          duration: 200,
          ease: 'Power2',
          onComplete: () => {
            sprite.destroy();
            this.sprites[tile.row][tile.col] = null;
            resolve();
          },
        });
      });
    });

    await Promise.all(promises);
  }

  // 낙하 애니메이션
  async animateCascade(
    moved: Array<{ tile: TileData; fromRow: number; toRow: number }>,
    spawned: TileData[]
  ): Promise<void> {
    const promises: Promise<void>[] = [];

    // 기존 타일 낙하
    for (const { tile, fromRow, toRow } of moved) {
      const sprite = this.sprites[fromRow][tile.col];
      if (!sprite) continue;

      this.sprites[toRow][tile.col] = sprite;
      this.sprites[fromRow][tile.col] = null;
      sprite.setData('row', toRow);

      promises.push(
        new Promise((resolve) => {
          this.scene.tweens.add({
            targets: sprite,
            y: toRow * TILE_SIZE + TILE_SIZE / 2,
            duration: 100 + (toRow - fromRow) * 40,
            ease: 'Bounce.easeOut',
            onComplete: () => resolve(),
          });
        })
      );
    }

    // 새 타일 생성 + 낙하
    for (const tile of spawned) {
      const x = tile.col * TILE_SIZE + TILE_SIZE / 2;
      const startY = -TILE_SIZE;
      const endY = tile.row * TILE_SIZE + TILE_SIZE / 2;
      const texture = TILE_TEXTURE_MAP[tile.type];

      const sprite = this.scene.add.sprite(x, startY, texture);
      sprite.setInteractive();
      sprite.setData('row', tile.row);
      sprite.setData('col', tile.col);
      this.container.add(sprite);
      this.sprites[tile.row][tile.col] = sprite;

      promises.push(
        new Promise((resolve) => {
          this.scene.tweens.add({
            targets: sprite,
            y: endY,
            duration: 200 + tile.row * 40,
            ease: 'Bounce.easeOut',
            onComplete: () => resolve(),
          });
        })
      );
    }

    await Promise.all(promises);
  }
}
```

**Step 2: GameScene에 보드 렌더링 연결**

```typescript
// src/scenes/GameScene.ts
import Phaser from 'phaser';
import { Board } from '../game/Board';
import { BoardRenderer } from '../game/BoardRenderer';
import { GRID_COLS, GRID_ROWS } from '../config';

export class GameScene extends Phaser.Scene {
  private board!: Board;
  private renderer!: BoardRenderer;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.board = new Board(GRID_ROWS, GRID_COLS);
    this.board.fill();
    this.renderer = new BoardRenderer(this, this.board);
    this.renderer.renderAll();
  }
}
```

**Step 3: 실행 확인**

Run: `npm run dev`
Expected: 8x8 그리드에 4가지 색상의 타일이 표시

**Step 4: Commit**

```bash
git add src/game/BoardRenderer.ts src/scenes/
git commit -m "feat: 8x8 보드 비주얼 렌더링"
```

---

### Task 7: 터치/클릭 입력으로 타일 스왑

**Files:**
- Create: `src/game/InputHandler.ts`
- Modify: `src/scenes/GameScene.ts`

**Step 1: InputHandler 작성**

```typescript
// src/game/InputHandler.ts
import Phaser from 'phaser';
import { TILE_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y } from '../config';

export type SwapCallback = (
  r1: number, c1: number,
  r2: number, c2: number
) => void;

export class InputHandler {
  private scene: Phaser.Scene;
  private selectedTile: { row: number; col: number } | null = null;
  private onSwap: SwapCallback;
  private enabled = true;

  constructor(scene: Phaser.Scene, onSwap: SwapCallback) {
    this.scene = scene;
    this.onSwap = onSwap;
    this.setupInput();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  private setupInput(): void {
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.enabled) return;
      const { row, col } = this.pointerToGrid(pointer);
      if (row < 0) return;

      if (!this.selectedTile) {
        this.selectedTile = { row, col };
      } else {
        const dr = Math.abs(row - this.selectedTile.row);
        const dc = Math.abs(col - this.selectedTile.col);

        if (dr + dc === 1) {
          this.onSwap(
            this.selectedTile.row, this.selectedTile.col,
            row, col
          );
        }
        this.selectedTile = null;
      }
    });
  }

  private pointerToGrid(pointer: Phaser.Input.Pointer): { row: number; col: number } {
    const col = Math.floor((pointer.x - GRID_OFFSET_X) / TILE_SIZE);
    const row = Math.floor((pointer.y - GRID_OFFSET_Y) / TILE_SIZE);

    if (row < 0 || row >= 8 || col < 0 || col >= 8) {
      return { row: -1, col: -1 };
    }
    return { row, col };
  }
}
```

**Step 2: GameScene에 입력 + 게임 루프 연결**

```typescript
// GameScene.ts create()에 추가
this.inputHandler = new InputHandler(this, this.handleSwap.bind(this));

// 새 메서드
private async handleSwap(r1: number, c1: number, r2: number, c2: number): Promise<void> {
  this.inputHandler.setEnabled(false);

  // 스왑 애니메이션
  await this.renderer.animateSwap(r1, c1, r2, c2);

  // 매치 확인
  const matches = this.board.trySwap(r1, c1, r2, c2);

  if (matches.length === 0) {
    // 매치 없음 → 되돌리기 애니메이션
    await this.renderer.animateSwap(r1, c1, r2, c2);
  } else {
    // 매치 처리 루프
    await this.processMatches(matches);
  }

  this.inputHandler.setEnabled(true);
}

private async processMatches(matches: MatchResult[]): Promise<void> {
  // 매치된 타일 수집
  const allTiles = matches.flatMap((m) => m.tiles);

  // 제거 애니메이션
  await this.renderer.animateRemove(allTiles);

  // 캐스케이드
  const cascade = this.board.removeAndCascade(allTiles);
  await this.renderer.animateCascade(cascade.moved, cascade.spawned);

  // 연쇄 매치 확인
  const newMatches = this.board.findAllMatches();
  if (newMatches.length > 0) {
    await this.processMatches(newMatches);
  }
}
```

**Step 3: 실행 확인**

Run: `npm run dev`
Expected: 타일 2개 순서대로 클릭하면 스왑 → 매치 시 제거 + 낙하 애니메이션

**Step 4: Commit**

```bash
git add src/game/InputHandler.ts src/scenes/GameScene.ts
git commit -m "feat: 터치/클릭 입력으로 타일 스왑 및 매치 처리"
```

---

## Phase 3: 파워업 시스템

### Task 8: 파워업 생성 로직

**Files:**
- Modify: `src/game/Board.ts`
- Create: `src/game/MatchDetector.ts`
- Test: `src/game/__tests__/MatchDetector.test.ts`

**Step 1: MatchDetector 테스트 작성**

```typescript
// src/game/__tests__/MatchDetector.test.ts
import { describe, it, expect } from 'vitest';
import { MatchDetector } from '../MatchDetector';
import { Board } from '../Board';
import { TileType, SpecialType } from '../types';

describe('MatchDetector', () => {
  it('4매치 → Rocket 생성', () => {
    const board = new Board(8, 8);
    board.fill();
    // 가로 4매치 수동 설정
    for (let c = 0; c < 4; c++) {
      board.setTile(0, c, { type: TileType.Coffee, special: SpecialType.None, row: 0, col: c });
    }
    const detector = new MatchDetector(board);
    const matches = detector.detectAll();
    const m = matches.find((m) => m.tiles.length >= 4);
    expect(m?.special).toBe(SpecialType.Rocket);
  });

  it('2x2 → Propeller 생성', () => {
    const board = new Board(8, 8);
    board.fill();
    // 2x2 수동 설정 (나머지가 매치 안 되게 주의)
    board.setTile(0, 0, { type: TileType.Stapler, special: SpecialType.None, row: 0, col: 0 });
    board.setTile(0, 1, { type: TileType.Stapler, special: SpecialType.None, row: 0, col: 1 });
    board.setTile(1, 0, { type: TileType.Stapler, special: SpecialType.None, row: 1, col: 0 });
    board.setTile(1, 1, { type: TileType.Stapler, special: SpecialType.None, row: 1, col: 1 });
    const detector = new MatchDetector(board);
    const matches = detector.detectAll();
    const m = matches.find((m) => m.pattern === 'square');
    expect(m?.special).toBe(SpecialType.Propeller);
  });

  it('T/L 형태 → Shredder 생성', () => {
    const board = new Board(8, 8);
    board.fill();
    // L형태: 가로3 + 세로3 (코너 공유)
    board.setTile(0, 0, { type: TileType.PostIt, special: SpecialType.None, row: 0, col: 0 });
    board.setTile(0, 1, { type: TileType.PostIt, special: SpecialType.None, row: 0, col: 1 });
    board.setTile(0, 2, { type: TileType.PostIt, special: SpecialType.None, row: 0, col: 2 });
    board.setTile(1, 0, { type: TileType.PostIt, special: SpecialType.None, row: 1, col: 0 });
    board.setTile(2, 0, { type: TileType.PostIt, special: SpecialType.None, row: 2, col: 0 });
    const detector = new MatchDetector(board);
    const matches = detector.detectAll();
    const m = matches.find((m) => m.pattern === 'L' || m.pattern === 'T');
    expect(m?.special).toBe(SpecialType.Shredder);
  });

  it('5매치 → WiFi 생성', () => {
    const board = new Board(8, 8);
    board.fill();
    for (let c = 0; c < 5; c++) {
      board.setTile(0, c, { type: TileType.Document, special: SpecialType.None, row: 0, col: c });
    }
    const detector = new MatchDetector(board);
    const matches = detector.detectAll();
    const m = matches.find((m) => m.tiles.length >= 5);
    expect(m?.special).toBe(SpecialType.WiFi);
  });
});
```

**Step 2: 테스트 실패 확인**

Run: `npx vitest run src/game/__tests__/MatchDetector.test.ts`
Expected: FAIL

**Step 3: MatchDetector 구현**

```typescript
// src/game/MatchDetector.ts
import { Board } from './Board';
import { TileData, MatchResult, SpecialType } from './types';

export class MatchDetector {
  private board: Board;

  constructor(board: Board) {
    this.board = board;
  }

  detectAll(): MatchResult[] {
    const horizontal = this.findHorizontal();
    const vertical = this.findVertical();
    const merged = this.mergeIntersecting(horizontal, vertical);
    const squares = this.findSquares();

    return [...merged, ...squares];
  }

  private findHorizontal(): MatchResult[] {
    const results: MatchResult[] = [];
    for (let r = 0; r < this.board.rows; r++) {
      let c = 0;
      while (c < this.board.cols) {
        const tile = this.board.getTile(r, c);
        if (!tile) { c++; continue; }

        let len = 1;
        while (c + len < this.board.cols && this.board.getTile(r, c + len)?.type === tile.type) {
          len++;
        }

        if (len >= 3) {
          const tiles: TileData[] = [];
          for (let i = 0; i < len; i++) tiles.push(this.board.getTile(r, c + i)!);
          results.push({
            tiles,
            special: len >= 5 ? SpecialType.WiFi : len === 4 ? SpecialType.Rocket : null,
            pattern: len >= 5 ? 'line5' : 'horizontal',
          });
        }
        c += Math.max(len, 1);
      }
    }
    return results;
  }

  private findVertical(): MatchResult[] {
    const results: MatchResult[] = [];
    for (let c = 0; c < this.board.cols; c++) {
      let r = 0;
      while (r < this.board.rows) {
        const tile = this.board.getTile(r, c);
        if (!tile) { r++; continue; }

        let len = 1;
        while (r + len < this.board.rows && this.board.getTile(r + len, c)?.type === tile.type) {
          len++;
        }

        if (len >= 3) {
          const tiles: TileData[] = [];
          for (let i = 0; i < len; i++) tiles.push(this.board.getTile(r + i, c)!);
          results.push({
            tiles,
            special: len >= 5 ? SpecialType.WiFi : len === 4 ? SpecialType.Rocket : null,
            pattern: len >= 5 ? 'line5' : 'vertical',
          });
        }
        r += Math.max(len, 1);
      }
    }
    return results;
  }

  private mergeIntersecting(horizontal: MatchResult[], vertical: MatchResult[]): MatchResult[] {
    const results: MatchResult[] = [];
    const usedH = new Set<number>();
    const usedV = new Set<number>();

    for (let hi = 0; hi < horizontal.length; hi++) {
      for (let vi = 0; vi < vertical.length; vi++) {
        const hTiles = horizontal[hi].tiles;
        const vTiles = vertical[vi].tiles;

        // 교차점 찾기
        const intersects = hTiles.some((ht) =>
          vTiles.some((vt) => ht.row === vt.row && ht.col === vt.col)
        );

        if (intersects && hTiles[0].type === vTiles[0].type) {
          usedH.add(hi);
          usedV.add(vi);

          const merged = [...hTiles];
          for (const vt of vTiles) {
            if (!merged.some((mt) => mt.row === vt.row && mt.col === vt.col)) {
              merged.push(vt);
            }
          }

          const total = merged.length;
          results.push({
            tiles: merged,
            special: total >= 5 ? SpecialType.Shredder : null,
            pattern: total >= 5 ? 'T' : 'L',
          });
        }
      }
    }

    // 교차하지 않은 매치는 그대로 추가
    horizontal.forEach((h, i) => { if (!usedH.has(i)) results.push(h); });
    vertical.forEach((v, i) => { if (!usedV.has(i)) results.push(v); });

    return results;
  }

  private findSquares(): MatchResult[] {
    const results: MatchResult[] = [];
    for (let r = 0; r < this.board.rows - 1; r++) {
      for (let c = 0; c < this.board.cols - 1; c++) {
        const t00 = this.board.getTile(r, c);
        const t01 = this.board.getTile(r, c + 1);
        const t10 = this.board.getTile(r + 1, c);
        const t11 = this.board.getTile(r + 1, c + 1);

        if (t00 && t01 && t10 && t11 &&
            t00.type === t01.type &&
            t00.type === t10.type &&
            t00.type === t11.type) {
          results.push({
            tiles: [t00, t01, t10, t11],
            special: SpecialType.Propeller,
            pattern: 'square',
          });
        }
      }
    }
    return results;
  }
}
```

**Step 4: 테스트 통과 확인**

Run: `npx vitest run src/game/__tests__/MatchDetector.test.ts`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/game/MatchDetector.ts src/game/__tests__/
git commit -m "feat: 패턴별 파워업 생성 로직 (Rocket/Propeller/Shredder/WiFi)"
```

---

### Task 9: 파워업 발동 로직

**Files:**
- Create: `src/game/PowerUpExecutor.ts`
- Test: `src/game/__tests__/PowerUpExecutor.test.ts`

**Step 1: 파워업 발동 테스트 작성**

```typescript
// src/game/__tests__/PowerUpExecutor.test.ts
import { describe, it, expect } from 'vitest';
import { PowerUpExecutor } from '../PowerUpExecutor';
import { Board } from '../Board';
import { TileType, SpecialType } from '../types';

describe('PowerUpExecutor', () => {
  it('Rocket: 가로 한 줄 제거', () => {
    const board = new Board(8, 8);
    board.fill();
    board.setTile(3, 4, {
      type: TileType.Coffee, special: SpecialType.Rocket, row: 3, col: 4,
    });
    const executor = new PowerUpExecutor(board);
    const removed = executor.execute(3, 4, 'horizontal');
    // 3번 행 전체 = 8개
    expect(removed.length).toBe(8);
    expect(removed.every((t) => t.row === 3)).toBe(true);
  });

  it('Shredder: 3x3 범위 제거', () => {
    const board = new Board(8, 8);
    board.fill();
    board.setTile(4, 4, {
      type: TileType.Coffee, special: SpecialType.Shredder, row: 4, col: 4,
    });
    const executor = new PowerUpExecutor(board);
    const removed = executor.execute(4, 4);
    // 3x3 = 최대 9개 (보드 경계 내)
    expect(removed.length).toBeLessThanOrEqual(9);
    expect(removed.length).toBeGreaterThanOrEqual(9);
  });

  it('WiFi: 같은 타입 전체 제거', () => {
    const board = new Board(8, 8);
    board.fill();
    const targetType = TileType.Document;
    board.setTile(0, 0, {
      type: targetType, special: SpecialType.WiFi, row: 0, col: 0,
    });
    const executor = new PowerUpExecutor(board);
    const removed = executor.execute(0, 0, undefined, targetType);
    // 보드에서 Document 타입 전부
    for (const tile of removed) {
      expect(tile.type === targetType || (tile.row === 0 && tile.col === 0)).toBe(true);
    }
  });
});
```

**Step 2: 테스트 실패 확인**

Run: `npx vitest run src/game/__tests__/PowerUpExecutor.test.ts`
Expected: FAIL

**Step 3: PowerUpExecutor 구현**

```typescript
// src/game/PowerUpExecutor.ts
import { Board } from './Board';
import { TileData, TileType, SpecialType } from './types';

export class PowerUpExecutor {
  private board: Board;

  constructor(board: Board) {
    this.board = board;
  }

  execute(
    row: number,
    col: number,
    direction?: 'horizontal' | 'vertical',
    swappedType?: TileType
  ): TileData[] {
    const tile = this.board.getTile(row, col);
    if (!tile) return [];

    switch (tile.special) {
      case SpecialType.Rocket:
        return this.executeRocket(row, col, direction ?? 'horizontal');
      case SpecialType.Propeller:
        return this.executePropeller(row, col);
      case SpecialType.Shredder:
        return this.executeShredder(row, col);
      case SpecialType.WiFi:
        return this.executeWiFi(row, col, swappedType);
      default:
        return [];
    }
  }

  private executeRocket(row: number, col: number, direction: 'horizontal' | 'vertical'): TileData[] {
    const removed: TileData[] = [];
    if (direction === 'horizontal') {
      for (let c = 0; c < this.board.cols; c++) {
        const t = this.board.getTile(row, c);
        if (t) removed.push(t);
      }
    } else {
      for (let r = 0; r < this.board.rows; r++) {
        const t = this.board.getTile(r, col);
        if (t) removed.push(t);
      }
    }
    return removed;
  }

  private executePropeller(row: number, col: number): TileData[] {
    // 주변 제거 + 랜덤 타겟 1개
    const removed: TileData[] = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const t = this.board.getTile(row + dr, col + dc);
        if (t) removed.push(t);
      }
    }
    return removed;
  }

  private executeShredder(row: number, col: number): TileData[] {
    const removed: TileData[] = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const t = this.board.getTile(row + dr, col + dc);
        if (t) removed.push(t);
      }
    }
    return removed;
  }

  private executeWiFi(row: number, col: number, swappedType?: TileType): TileData[] {
    const removed: TileData[] = [];
    const targetType = swappedType ?? this.findMostCommonType();

    for (let r = 0; r < this.board.rows; r++) {
      for (let c = 0; c < this.board.cols; c++) {
        const t = this.board.getTile(r, c);
        if (t && (t.type === targetType || (t.row === row && t.col === col))) {
          removed.push(t);
        }
      }
    }
    return removed;
  }

  private findMostCommonType(): TileType {
    const counts = [0, 0, 0, 0];
    for (let r = 0; r < this.board.rows; r++) {
      for (let c = 0; c < this.board.cols; c++) {
        const t = this.board.getTile(r, c);
        if (t) counts[t.type]++;
      }
    }
    return counts.indexOf(Math.max(...counts)) as TileType;
  }
}
```

**Step 4: 테스트 통과 확인**

Run: `npx vitest run src/game/__tests__/PowerUpExecutor.test.ts`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/game/PowerUpExecutor.ts src/game/__tests__/
git commit -m "feat: 파워업 발동 로직 (Rocket/Propeller/Shredder/WiFi)"
```

---

### Task 10: 파워업 조합 로직

**Files:**
- Create: `src/game/PowerUpCombiner.ts`
- Test: `src/game/__tests__/PowerUpCombiner.test.ts`

**Step 1: 조합 테스트 작성**

```typescript
// src/game/__tests__/PowerUpCombiner.test.ts
import { describe, it, expect } from 'vitest';
import { PowerUpCombiner, CombinationType } from '../PowerUpCombiner';
import { SpecialType } from '../types';

describe('PowerUpCombiner', () => {
  const combiner = new PowerUpCombiner();

  it('Rocket + Rocket → Cross (십자형)', () => {
    const result = combiner.getCombination(SpecialType.Rocket, SpecialType.Rocket);
    expect(result).toBe(CombinationType.Cross);
  });

  it('Rocket + Shredder → BigCross (3줄 십자)', () => {
    const result = combiner.getCombination(SpecialType.Rocket, SpecialType.Shredder);
    expect(result).toBe(CombinationType.BigCross);
  });

  it('WiFi + WiFi → ClearAll (전체 제거)', () => {
    const result = combiner.getCombination(SpecialType.WiFi, SpecialType.WiFi);
    expect(result).toBe(CombinationType.ClearAll);
  });

  it('Shredder + Shredder → MegaExplosion', () => {
    const result = combiner.getCombination(SpecialType.Shredder, SpecialType.Shredder);
    expect(result).toBe(CombinationType.MegaExplosion);
  });

  it('순서와 무관하게 같은 조합 반환', () => {
    const a = combiner.getCombination(SpecialType.Rocket, SpecialType.Shredder);
    const b = combiner.getCombination(SpecialType.Shredder, SpecialType.Rocket);
    expect(a).toBe(b);
  });
});
```

**Step 2: 테스트 실패 확인**

Run: `npx vitest run src/game/__tests__/PowerUpCombiner.test.ts`
Expected: FAIL

**Step 3: PowerUpCombiner 구현**

```typescript
// src/game/PowerUpCombiner.ts
import { SpecialType } from './types';

export enum CombinationType {
  None = 0,
  Cross = 1,            // Rocket + Rocket: 십자형
  BigCross = 2,         // Rocket + Shredder: 3줄 십자
  RocketToTarget = 3,   // Rocket + Propeller: 타겟에 로켓
  AllToRocket = 4,      // Rocket + WiFi: 타입 전부 → 로켓
  MegaExplosion = 5,    // Shredder + Shredder: 4타일 반경
  ShredderToTarget = 6, // Shredder + Propeller: 타겟에 폭발
  AllToShredder = 7,    // Shredder + WiFi: 타입 전부 → 폭발
  TriplePropeller = 8,  // Propeller + Propeller: 3개 타겟
  AllToPropeller = 9,   // Propeller + WiFi: 타입 전부 → 프로펠러
  ClearAll = 10,        // WiFi + WiFi: 전체 제거
}

const COMBINATION_MAP: Record<string, CombinationType> = {
  [`${SpecialType.Rocket}_${SpecialType.Rocket}`]: CombinationType.Cross,
  [`${SpecialType.Rocket}_${SpecialType.Shredder}`]: CombinationType.BigCross,
  [`${SpecialType.Rocket}_${SpecialType.Propeller}`]: CombinationType.RocketToTarget,
  [`${SpecialType.Rocket}_${SpecialType.WiFi}`]: CombinationType.AllToRocket,
  [`${SpecialType.Shredder}_${SpecialType.Shredder}`]: CombinationType.MegaExplosion,
  [`${SpecialType.Shredder}_${SpecialType.Propeller}`]: CombinationType.ShredderToTarget,
  [`${SpecialType.Shredder}_${SpecialType.WiFi}`]: CombinationType.AllToShredder,
  [`${SpecialType.Propeller}_${SpecialType.Propeller}`]: CombinationType.TriplePropeller,
  [`${SpecialType.Propeller}_${SpecialType.WiFi}`]: CombinationType.AllToPropeller,
  [`${SpecialType.WiFi}_${SpecialType.WiFi}`]: CombinationType.ClearAll,
};

export class PowerUpCombiner {
  getCombination(a: SpecialType, b: SpecialType): CombinationType {
    if (a === SpecialType.None || b === SpecialType.None) return CombinationType.None;

    const sorted = [a, b].sort((x, y) => x - y);
    const key = `${sorted[0]}_${sorted[1]}`;
    return COMBINATION_MAP[key] ?? CombinationType.None;
  }
}
```

**Step 4: 테스트 통과 확인**

Run: `npx vitest run src/game/__tests__/PowerUpCombiner.test.ts`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/game/PowerUpCombiner.ts src/game/__tests__/
git commit -m "feat: 10가지 파워업 조합 로직 구현"
```

---

## Phase 4: 레벨 시스템 & 목표

### Task 11: 레벨 데이터 구조

**Files:**
- Create: `src/game/Level.ts`
- Create: `src/data/levels.json`
- Test: `src/game/__tests__/Level.test.ts`

**Step 1: 레벨 테스트 작성**

```typescript
// src/game/__tests__/Level.test.ts
import { describe, it, expect } from 'vitest';
import { Level, LevelObjective } from '../Level';

describe('Level', () => {
  it('레벨 데이터를 로드한다', () => {
    const level = new Level({
      id: 1,
      moves: 20,
      objectives: [
        { type: 'collect', tileType: 0, count: 10 },
      ],
      grid: { rows: 8, cols: 8 },
    });
    expect(level.movesLeft).toBe(20);
    expect(level.objectives).toHaveLength(1);
  });

  it('이동 시 무브가 감소한다', () => {
    const level = new Level({ id: 1, moves: 5, objectives: [], grid: { rows: 8, cols: 8 } });
    level.useMove();
    expect(level.movesLeft).toBe(4);
  });

  it('목표 달성 시 레벨 클리어', () => {
    const level = new Level({
      id: 1, moves: 20,
      objectives: [{ type: 'collect', tileType: 0, count: 3 }],
      grid: { rows: 8, cols: 8 },
    });
    level.addProgress('collect', 0, 3);
    expect(level.isComplete()).toBe(true);
  });

  it('무브 소진 시 실패', () => {
    const level = new Level({ id: 1, moves: 1, objectives: [{ type: 'collect', tileType: 0, count: 99 }], grid: { rows: 8, cols: 8 } });
    level.useMove();
    expect(level.isFailed()).toBe(true);
  });
});
```

**Step 2: 테스트 실패 확인**

Run: `npx vitest run src/game/__tests__/Level.test.ts`
Expected: FAIL

**Step 3: Level 클래스 구현**

```typescript
// src/game/Level.ts
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
  objectives: Array<{ type: string; tileType?: number; obstacleType?: string; count: number }>;
  grid: { rows: number; cols: number };
}

export class Level {
  readonly id: number;
  movesLeft: number;
  objectives: LevelObjective[];
  readonly gridConfig: { rows: number; cols: number };

  constructor(data: LevelData) {
    this.id = data.id;
    this.movesLeft = data.moves;
    this.gridConfig = data.grid;
    this.objectives = data.objectives.map((o) => ({
      type: o.type as 'collect' | 'clear_obstacle',
      tileType: o.tileType,
      obstacleType: o.obstacleType,
      count: o.count,
      current: 0,
    }));
  }

  useMove(): void {
    this.movesLeft = Math.max(0, this.movesLeft - 1);
  }

  addProgress(type: string, tileType: number, amount: number): void {
    for (const obj of this.objectives) {
      if (obj.type === type && obj.tileType === tileType) {
        obj.current = Math.min(obj.count, obj.current + amount);
      }
    }
  }

  isComplete(): boolean {
    return this.objectives.every((o) => o.current >= o.count);
  }

  isFailed(): boolean {
    return this.movesLeft <= 0 && !this.isComplete();
  }
}
```

**Step 4: 초기 레벨 데이터 10개 작성**

```json
// src/data/levels.json
[
  {
    "id": 1,
    "area": "지하주차장",
    "moves": 25,
    "objectives": [{ "type": "collect", "tileType": 0, "count": 15 }],
    "grid": { "rows": 8, "cols": 8 }
  },
  {
    "id": 2,
    "area": "지하주차장",
    "moves": 22,
    "objectives": [{ "type": "collect", "tileType": 1, "count": 20 }],
    "grid": { "rows": 8, "cols": 8 }
  },
  {
    "id": 3,
    "area": "지하주차장",
    "moves": 20,
    "objectives": [
      { "type": "collect", "tileType": 0, "count": 10 },
      { "type": "collect", "tileType": 2, "count": 10 }
    ],
    "grid": { "rows": 8, "cols": 8 }
  },
  {
    "id": 4,
    "area": "사무실",
    "moves": 25,
    "objectives": [{ "type": "collect", "tileType": 3, "count": 25 }],
    "grid": { "rows": 8, "cols": 8 }
  },
  {
    "id": 5,
    "area": "사무실",
    "moves": 20,
    "objectives": [
      { "type": "collect", "tileType": 0, "count": 15 },
      { "type": "collect", "tileType": 1, "count": 15 }
    ],
    "grid": { "rows": 8, "cols": 8 }
  },
  {
    "id": 6,
    "area": "사무실",
    "moves": 18,
    "objectives": [{ "type": "clear_obstacle", "obstacleType": "box", "count": 12 }],
    "grid": { "rows": 8, "cols": 8 }
  },
  {
    "id": 7,
    "area": "사무실",
    "moves": 22,
    "objectives": [
      { "type": "collect", "tileType": 2, "count": 20 },
      { "type": "clear_obstacle", "obstacleType": "box", "count": 5 }
    ],
    "grid": { "rows": 8, "cols": 8 }
  },
  {
    "id": 8,
    "area": "회의실",
    "moves": 20,
    "objectives": [{ "type": "collect", "tileType": 0, "count": 30 }],
    "grid": { "rows": 8, "cols": 8 }
  },
  {
    "id": 9,
    "area": "회의실",
    "moves": 18,
    "objectives": [
      { "type": "collect", "tileType": 1, "count": 15 },
      { "type": "collect", "tileType": 3, "count": 15 }
    ],
    "grid": { "rows": 8, "cols": 8 }
  },
  {
    "id": 10,
    "area": "회의실",
    "moves": 15,
    "objectives": [
      { "type": "collect", "tileType": 0, "count": 10 },
      { "type": "collect", "tileType": 1, "count": 10 },
      { "type": "collect", "tileType": 2, "count": 10 }
    ],
    "grid": { "rows": 8, "cols": 8 }
  }
]
```

**Step 5: 테스트 통과 확인**

Run: `npx vitest run src/game/__tests__/Level.test.ts`
Expected: ALL PASS

**Step 6: Commit**

```bash
git add src/game/Level.ts src/data/levels.json src/game/__tests__/
git commit -m "feat: 레벨 시스템 + 목표 추적 + 초기 10레벨 데이터"
```

---

## Phase 5: UI 화면들

### Task 12: HUD (상단 정보 표시)

**Files:**
- Create: `src/ui/HUD.ts`
- Modify: `src/scenes/GameScene.ts`

**Step 1: HUD 구현**

```typescript
// src/ui/HUD.ts
import Phaser from 'phaser';
import { Level } from '../game/Level';
import { TileType } from '../game/types';
import { GAME_WIDTH } from '../config';

const TILE_EMOJI: Record<number, string> = {
  [TileType.Coffee]: '☕',
  [TileType.Document]: '📄',
  [TileType.Stapler]: '📎',
  [TileType.PostIt]: '📝',
};

export class HUD {
  private scene: Phaser.Scene;
  private movesText!: Phaser.GameObjects.Text;
  private objectiveTexts: Phaser.GameObjects.Text[] = [];
  private container: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);
  }

  create(level: Level): void {
    // 배경
    const bg = this.scene.add.rectangle(GAME_WIDTH / 2, 60, GAME_WIDTH - 20, 100, 0xFFF0D4, 0.9);
    bg.setStrokeStyle(2, 0xD4A574);
    this.container.add(bg);

    // 레벨 번호
    const levelText = this.scene.add.text(20, 20, `Level ${level.id}`, {
      fontSize: '18px', color: '#5C3D2E', fontFamily: 'Arial', fontStyle: 'bold',
    });
    this.container.add(levelText);

    // 남은 무브
    this.movesText = this.scene.add.text(GAME_WIDTH - 20, 20, `${level.movesLeft}`, {
      fontSize: '28px', color: '#D4532B', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(1, 0);
    this.container.add(this.movesText);

    const movesLabel = this.scene.add.text(GAME_WIDTH - 20, 50, 'moves', {
      fontSize: '12px', color: '#8B7355', fontFamily: 'Arial',
    }).setOrigin(1, 0);
    this.container.add(movesLabel);

    // 목표
    const startX = 30;
    level.objectives.forEach((obj, i) => {
      const emoji = obj.tileType !== undefined ? TILE_EMOJI[obj.tileType] : '📦';
      const text = this.scene.add.text(
        startX + i * 90, 65,
        `${emoji} ${obj.current}/${obj.count}`,
        { fontSize: '16px', color: '#5C3D2E', fontFamily: 'Arial' }
      );
      this.objectiveTexts.push(text);
      this.container.add(text);
    });
  }

  update(level: Level): void {
    this.movesText.setText(`${level.movesLeft}`);

    level.objectives.forEach((obj, i) => {
      if (this.objectiveTexts[i]) {
        const emoji = obj.tileType !== undefined ? TILE_EMOJI[obj.tileType] : '📦';
        const done = obj.current >= obj.count;
        this.objectiveTexts[i].setText(`${emoji} ${done ? '✅' : `${obj.current}/${obj.count}`}`);
      }
    });
  }
}
```

**Step 2: GameScene에 HUD 연결**

```typescript
// GameScene create()에 추가
this.hud = new HUD(this);
this.hud.create(this.level);

// handleSwap()에서 매치 처리 후:
this.level.useMove();
this.hud.update(this.level);
```

**Step 3: 실행 확인**

Run: `npm run dev`
Expected: 상단에 레벨 번호, 남은 무브, 목표가 표시

**Step 4: Commit**

```bash
git add src/ui/HUD.ts src/scenes/GameScene.ts
git commit -m "feat: HUD - 레벨 정보, 남은 무브, 목표 표시"
```

---

### Task 13: 레벨 완료/실패 화면

**Files:**
- Create: `src/scenes/ResultScene.ts`
- Modify: `src/main.ts`

**Step 1: ResultScene 구현**

```typescript
// src/scenes/ResultScene.ts
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

export class ResultScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ResultScene' });
  }

  create(data: { success: boolean; levelId: number; stars: number }): void {
    // 배경 오버레이
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6);

    // 결과 패널
    const panel = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, 300, 280, 0xFFF8E7);
    panel.setStrokeStyle(3, 0xD4A574);

    if (data.success) {
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 130, '🎉', { fontSize: '48px' }).setOrigin(0.5);
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 70, '탈출 성공!', {
        fontSize: '28px', color: '#5C3D2E', fontFamily: 'Arial', fontStyle: 'bold',
      }).setOrigin(0.5);

      // 별 표시
      const starStr = '⭐'.repeat(data.stars) + '☆'.repeat(3 - data.stars);
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, starStr, { fontSize: '32px' }).setOrigin(0.5);
    } else {
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 130, '😱', { fontSize: '48px' }).setOrigin(0.5);
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 70, '사장에게 잡혔다!', {
        fontSize: '24px', color: '#D4532B', fontFamily: 'Arial', fontStyle: 'bold',
      }).setOrigin(0.5);
    }

    // 다음/재시도 버튼
    const btnLabel = data.success ? '다음 층으로' : '다시 도전';
    const btn = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, 200, 50, 0xD4A574);
    btn.setInteractive({ useHandCursor: true });
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, btnLabel, {
      fontSize: '20px', color: '#FFFFFF', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);

    btn.on('pointerdown', () => {
      const nextLevel = data.success ? data.levelId + 1 : data.levelId;
      this.scene.start('GameScene', { levelId: nextLevel });
    });
  }
}
```

**Step 2: GameScene에 레벨 완료/실패 체크 연결**

```typescript
// GameScene handleSwap() 마지막에 추가
if (this.level.isComplete()) {
  this.time.delayedCall(500, () => {
    this.scene.start('ResultScene', {
      success: true,
      levelId: this.level.id,
      stars: this.calculateStars(),
    });
  });
} else if (this.level.isFailed()) {
  this.time.delayedCall(500, () => {
    this.scene.start('ResultScene', {
      success: false,
      levelId: this.level.id,
      stars: 0,
    });
  });
}

private calculateStars(): number {
  const ratio = this.level.movesLeft / this.level.totalMoves;
  if (ratio > 0.5) return 3;
  if (ratio > 0.2) return 2;
  return 1;
}
```

**Step 3: 실행 확인**

Run: `npm run dev`
Expected: 레벨 클리어 시 성공 화면, 무브 소진 시 실패 화면

**Step 4: Commit**

```bash
git add src/scenes/ResultScene.ts src/scenes/GameScene.ts src/main.ts
git commit -m "feat: 레벨 완료/실패 결과 화면"
```

---

### Task 14: 레벨 선택 맵 화면

**Files:**
- Create: `src/scenes/MapScene.ts`
- Create: `src/game/PlayerProgress.ts`
- Modify: `src/main.ts`

**Step 1: PlayerProgress 구현 (LocalStorage)**

```typescript
// src/game/PlayerProgress.ts
const STORAGE_KEY = 'bear_office_escape_progress';

export interface ProgressData {
  currentLevel: number;
  stars: Record<number, number>;
  coins: number;
  lives: number;
  lastLifeTime: number;
}

export class PlayerProgress {
  private data: ProgressData;

  constructor() {
    this.data = this.load();
  }

  private load(): ProgressData {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    return { currentLevel: 1, stars: {}, coins: 100, lives: 5, lastLifeTime: Date.now() };
  }

  save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  get currentLevel(): number { return this.data.currentLevel; }
  get coins(): number { return this.data.coins; }
  get lives(): number { return this.data.lives; }

  completeLevel(id: number, stars: number): void {
    this.data.stars[id] = Math.max(this.data.stars[id] ?? 0, stars);
    if (id >= this.data.currentLevel) {
      this.data.currentLevel = id + 1;
    }
    this.save();
  }

  getStars(levelId: number): number {
    return this.data.stars[levelId] ?? 0;
  }

  useLive(): boolean {
    if (this.data.lives <= 0) return false;
    this.data.lives--;
    this.save();
    return true;
  }
}
```

**Step 2: MapScene 구현**

```typescript
// src/scenes/MapScene.ts
import Phaser from 'phaser';
import { PlayerProgress } from '../game/PlayerProgress';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

export class MapScene extends Phaser.Scene {
  private progress!: PlayerProgress;

  constructor() {
    super({ key: 'MapScene' });
  }

  create(): void {
    this.progress = new PlayerProgress();

    // 배경
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xE8D5B7);

    // 타이틀
    this.add.text(GAME_WIDTH / 2, 40, '🐻 탈출! 곰사원', {
      fontSize: '24px', color: '#5C3D2E', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);

    // 에어리어 제목들
    const areas = ['🅿️ 지하주차장', '💼 사무실', '🪑 회의실'];

    // 레벨 노드들 (스크롤 가능)
    const container = this.add.container(0, 0);
    const totalLevels = 10;

    for (let i = 1; i <= totalLevels; i++) {
      const row = i - 1;
      const x = GAME_WIDTH / 2 + (row % 2 === 0 ? -40 : 40);
      const y = GAME_HEIGHT - 100 - row * 70;

      const unlocked = i <= this.progress.currentLevel;
      const stars = this.progress.getStars(i);

      // 레벨 원형 노드
      const circle = this.add.circle(x, y, 25, unlocked ? 0xD4A574 : 0xBBBBBB);
      container.add(circle);

      this.add.text(x, y, `${i}`, {
        fontSize: '18px', color: '#FFF', fontFamily: 'Arial', fontStyle: 'bold',
      }).setOrigin(0.5);
      container.add(this.children.list[this.children.list.length - 1] as Phaser.GameObjects.Text);

      // 별 표시
      if (stars > 0) {
        this.add.text(x, y + 30, '⭐'.repeat(stars), { fontSize: '10px' }).setOrigin(0.5);
      }

      if (unlocked) {
        circle.setInteractive({ useHandCursor: true });
        circle.on('pointerdown', () => {
          this.scene.start('GameScene', { levelId: i });
        });
      }
    }
  }
}
```

**Step 3: main.ts 씬 순서 변경**

```typescript
// src/main.ts - scene 배열에 MapScene 추가
scene: [BootScene, MapScene, GameScene, ResultScene],
// BootScene → MapScene으로 시작
```

**Step 4: 실행 확인**

Run: `npm run dev`
Expected: 레벨 맵 화면에서 레벨 선택 가능

**Step 5: Commit**

```bash
git add src/scenes/MapScene.ts src/game/PlayerProgress.ts src/main.ts
git commit -m "feat: 레벨 선택 맵 화면 + 진행도 저장 (LocalStorage)"
```

---

## Phase 6: 장애물 시스템

### Task 15: 장애물 타입 구현

**Files:**
- Create: `src/game/Obstacle.ts`
- Modify: `src/game/types.ts`
- Modify: `src/game/Board.ts`
- Test: `src/game/__tests__/Obstacle.test.ts`

**Step 1: 장애물 타입 정의 및 테스트**

```typescript
// types.ts에 추가
export enum ObstacleType {
  Box = 'box',           // 택배 상자 (1히트)
  FileCabinet = 'cabinet', // 서류함 (2히트)
  Printer = 'printer',    // 프린터 잼 (매치로 해제)
  CoffeeSplash = 'splash', // 커피 얼룩 (확산형)
}

export interface ObstacleData {
  type: ObstacleType;
  row: number;
  col: number;
  hp: number;
}
```

```typescript
// src/game/__tests__/Obstacle.test.ts
import { describe, it, expect } from 'vitest';
import { Obstacle } from '../Obstacle';
import { ObstacleType } from '../types';

describe('Obstacle', () => {
  it('Box는 인접 매치 1회로 제거', () => {
    const obs = new Obstacle(ObstacleType.Box, 0, 0);
    obs.hit();
    expect(obs.isDestroyed()).toBe(true);
  });

  it('FileCabinet은 2회 히트 필요', () => {
    const obs = new Obstacle(ObstacleType.FileCabinet, 0, 0);
    obs.hit();
    expect(obs.isDestroyed()).toBe(false);
    obs.hit();
    expect(obs.isDestroyed()).toBe(true);
  });
});
```

**Step 2: 테스트 실패 확인 → 구현 → 테스트 통과**

```typescript
// src/game/Obstacle.ts
import { ObstacleType } from './types';

const HP_MAP: Record<ObstacleType, number> = {
  [ObstacleType.Box]: 1,
  [ObstacleType.FileCabinet]: 2,
  [ObstacleType.Printer]: 1,
  [ObstacleType.CoffeeSplash]: 1,
};

export class Obstacle {
  readonly type: ObstacleType;
  readonly row: number;
  readonly col: number;
  hp: number;

  constructor(type: ObstacleType, row: number, col: number) {
    this.type = type;
    this.row = row;
    this.col = col;
    this.hp = HP_MAP[type];
  }

  hit(): void {
    this.hp = Math.max(0, this.hp - 1);
  }

  isDestroyed(): boolean {
    return this.hp <= 0;
  }
}
```

**Step 3: Commit**

```bash
git add src/game/Obstacle.ts src/game/types.ts src/game/__tests__/
git commit -m "feat: 장애물 시스템 (Box, FileCabinet, Printer, CoffeeSplash)"
```

---

## Phase 7: 야근 비상! (타임어택 모드)

### Task 16: Nightmare 모드 (사장 쫓아옴)

**Files:**
- Create: `src/scenes/NightmareScene.ts`
- Modify: `src/scenes/MapScene.ts`

**Step 1: NightmareScene 구현**

Royal Match의 "King's Nightmare" 대응. 60초 타임어택으로, 사장이 점점 다가오는 연출.

```typescript
// src/scenes/NightmareScene.ts
import Phaser from 'phaser';
import { Board } from '../game/Board';
import { BoardRenderer } from '../game/BoardRenderer';
import { InputHandler } from '../game/InputHandler';
import { GAME_WIDTH, GAME_HEIGHT, GRID_ROWS, GRID_COLS } from '../config';

export class NightmareScene extends Phaser.Scene {
  private board!: Board;
  private renderer!: BoardRenderer;
  private timeLeft = 60;
  private timerText!: Phaser.GameObjects.Text;
  private bossY = -100;
  private bossSprite!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'NightmareScene' });
  }

  create(): void {
    // 빨간 배경 (긴장감)
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x2A1A0E);

    // 사장 캐릭터 (위에서 내려옴)
    this.bossSprite = this.add.text(GAME_WIDTH / 2, this.bossY, '😡', { fontSize: '64px' }).setOrigin(0.5);

    // 타이머
    this.timerText = this.add.text(GAME_WIDTH / 2, 30, '60', {
      fontSize: '36px', color: '#FF4444', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);

    // 경고 텍스트
    this.add.text(GAME_WIDTH / 2, 75, '⚠️ 야근 비상! 사장이 온다!', {
      fontSize: '16px', color: '#FFD700', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);

    // 보드
    this.board = new Board(GRID_ROWS, GRID_COLS);
    this.board.fill();
    this.renderer = new BoardRenderer(this, this.board);
    this.renderer.renderAll();

    // 입력
    new InputHandler(this, this.handleSwap.bind(this));

    // 타이머 이벤트
    this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.timeLeft--;
        this.timerText.setText(`${this.timeLeft}`);

        // 사장이 점점 내려옴
        this.bossY = -100 + ((60 - this.timeLeft) / 60) * 250;
        this.bossSprite.setY(this.bossY);

        if (this.timeLeft <= 10) {
          this.timerText.setColor('#FF0000');
          this.cameras.main.shake(100, 0.005);
        }

        if (this.timeLeft <= 0) {
          this.scene.start('ResultScene', { success: false, levelId: 0, stars: 0 });
        }
      },
      repeat: 59,
    });
  }

  private async handleSwap(r1: number, c1: number, r2: number, c2: number): Promise<void> {
    // Task 7과 동일한 매치 처리 로직 (시간 기반이므로 무브 제한 없음)
    await this.renderer.animateSwap(r1, c1, r2, c2);
    const matches = this.board.trySwap(r1, c1, r2, c2);
    if (matches.length === 0) {
      await this.renderer.animateSwap(r1, c1, r2, c2);
    } else {
      // 매치 성공 시 시간 보너스 +2초
      this.timeLeft = Math.min(60, this.timeLeft + 2);
      const allTiles = matches.flatMap((m) => m.tiles);
      await this.renderer.animateRemove(allTiles);
      const cascade = this.board.removeAndCascade(allTiles);
      await this.renderer.animateCascade(cascade.moved, cascade.spawned);
    }
  }
}
```

**Step 2: 실행 확인**

Expected: 60초 타이머 + 사장 이모지가 위에서 내려옴 + 매치 시 시간 보너스

**Step 3: Commit**

```bash
git add src/scenes/NightmareScene.ts
git commit -m "feat: 야근 비상! 타임어택 모드 (사장 추격)"
```

---

## Phase 8: 메타 게임 (사무실 탈출 꾸미기)

### Task 17: 에어리어 데코레이션 시스템

**Files:**
- Create: `src/game/AreaDecoration.ts`
- Create: `src/data/areas.json`
- Modify: `src/scenes/MapScene.ts`

**Step 1: 에어리어 데이터**

```json
// src/data/areas.json
[
  {
    "id": 1,
    "name": "지하주차장",
    "emoji": "🅿️",
    "levels": [1, 2, 3],
    "decorations": [
      { "id": "car", "name": "곰사원의 자동차", "starCost": 1, "emoji": "🚗" },
      { "id": "exit_sign", "name": "비상구 표시등", "starCost": 1, "emoji": "🚨" },
      { "id": "elevator", "name": "엘리베이터 수리", "starCost": 2, "emoji": "🛗" }
    ]
  },
  {
    "id": 2,
    "name": "사무실",
    "emoji": "💼",
    "levels": [4, 5, 6, 7],
    "decorations": [
      { "id": "desk", "name": "곰사원 책상", "starCost": 1, "emoji": "🪑" },
      { "id": "plant", "name": "화분 놓기", "starCost": 1, "emoji": "🪴" },
      { "id": "monitor", "name": "모니터 켜기", "starCost": 2, "emoji": "🖥️" },
      { "id": "snack", "name": "간식 서랍", "starCost": 1, "emoji": "🍪" }
    ]
  },
  {
    "id": 3,
    "name": "회의실",
    "emoji": "🪑",
    "levels": [8, 9, 10],
    "decorations": [
      { "id": "whiteboard", "name": "화이트보드", "starCost": 1, "emoji": "📋" },
      { "id": "projector", "name": "프로젝터", "starCost": 2, "emoji": "📽️" },
      { "id": "window", "name": "탈출용 창문", "starCost": 2, "emoji": "🪟" }
    ]
  }
]
```

**Step 2: AreaDecoration 클래스 구현**

```typescript
// src/game/AreaDecoration.ts
export interface Decoration {
  id: string;
  name: string;
  starCost: number;
  emoji: string;
  unlocked: boolean;
}

export interface AreaData {
  id: number;
  name: string;
  emoji: string;
  levels: number[];
  decorations: Decoration[];
}

export class AreaDecoration {
  private areas: AreaData[];

  constructor(areas: AreaData[]) {
    this.areas = areas;
  }

  getArea(id: number): AreaData | undefined {
    return this.areas.find((a) => a.id === id);
  }

  getAreaForLevel(levelId: number): AreaData | undefined {
    return this.areas.find((a) => a.levels.includes(levelId));
  }

  unlockDecoration(areaId: number, decoId: string): boolean {
    const area = this.getArea(areaId);
    if (!area) return false;
    const deco = area.decorations.find((d) => d.id === decoId);
    if (!deco || deco.unlocked) return false;
    deco.unlocked = true;
    return true;
  }

  getProgress(areaId: number): { total: number; unlocked: number } {
    const area = this.getArea(areaId);
    if (!area) return { total: 0, unlocked: 0 };
    return {
      total: area.decorations.length,
      unlocked: area.decorations.filter((d) => d.unlocked).length,
    };
  }
}
```

**Step 3: Commit**

```bash
git add src/game/AreaDecoration.ts src/data/areas.json
git commit -m "feat: 에어리어 데코레이션 시스템 (탈출 루트 꾸미기)"
```

---

## Phase 9: 라이프 시스템 & 코인

### Task 18: 라이프 & 코인 시스템

**Files:**
- Modify: `src/game/PlayerProgress.ts`
- Create: `src/ui/LivesDisplay.ts`

**Step 1: PlayerProgress에 라이프 타이머 추가**

```typescript
// PlayerProgress.ts에 추가
refreshLives(): void {
  const now = Date.now();
  const elapsed = now - this.data.lastLifeTime;
  const recovered = Math.floor(elapsed / (30 * 60 * 1000)); // 30분당 1개

  if (recovered > 0 && this.data.lives < 5) {
    this.data.lives = Math.min(5, this.data.lives + recovered);
    this.data.lastLifeTime = now;
    this.save();
  }
}

getTimeToNextLife(): number {
  if (this.data.lives >= 5) return 0;
  const elapsed = Date.now() - this.data.lastLifeTime;
  return Math.max(0, 30 * 60 * 1000 - (elapsed % (30 * 60 * 1000)));
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
```

**Step 2: Commit**

```bash
git add src/game/PlayerProgress.ts src/ui/LivesDisplay.ts
git commit -m "feat: 라이프 시스템 (30분 회복) + 코인 관리"
```

---

## Phase 10: PWA & 모바일 최적화

### Task 19: PWA 설정

**Files:**
- Create: `public/manifest.json`
- Create: `public/sw.js`
- Modify: `index.html`

**Step 1: Web App Manifest**

```json
// public/manifest.json
{
  "name": "탈출! 곰사원",
  "short_name": "곰사원",
  "description": "귀여운 곰사원의 회사 탈출 Match-3 퍼즐",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#FFF8E7",
  "theme_color": "#D4A574",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

**Step 2: Service Worker**

```javascript
// public/sw.js
const CACHE_NAME = 'bear-office-v1';
const ASSETS = ['/', '/index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
```

**Step 3: index.html에 PWA 등록**

```html
<!-- index.html <head>에 추가 -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<meta name="apple-mobile-web-app-capable" content="yes">
<link rel="manifest" href="/manifest.json">
<script>
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
  }
</script>
```

**Step 4: Commit**

```bash
git add public/ index.html
git commit -m "feat: PWA 설정 (오프라인 캐시 + 홈화면 설치)"
```

---

### Task 20: 터치 최적화 & 스와이프 입력

**Files:**
- Modify: `src/game/InputHandler.ts`

**Step 1: 드래그 스와이프 추가**

```typescript
// InputHandler.ts - setupInput()에 드래그 로직 추가
private setupInput(): void {
  let dragStart: { row: number; col: number } | null = null;

  this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
    if (!this.enabled) return;
    const grid = this.pointerToGrid(pointer);
    if (grid.row >= 0) dragStart = grid;
  });

  this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
    if (!this.enabled || !dragStart) return;
    const grid = this.pointerToGrid(pointer);

    const dx = pointer.x - pointer.downX;
    const dy = pointer.y - pointer.downY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // 최소 드래그 거리
    if (absDx < 10 && absDy < 10) {
      dragStart = null;
      return;
    }

    let targetRow = dragStart.row;
    let targetCol = dragStart.col;

    if (absDx > absDy) {
      targetCol += dx > 0 ? 1 : -1;
    } else {
      targetRow += dy > 0 ? 1 : -1;
    }

    if (targetRow >= 0 && targetRow < 8 && targetCol >= 0 && targetCol < 8) {
      this.onSwap(dragStart.row, dragStart.col, targetRow, targetCol);
    }

    dragStart = null;
  });
}
```

**Step 2: Commit**

```bash
git add src/game/InputHandler.ts
git commit -m "feat: 모바일 스와이프 입력 지원"
```

---

## Phase 11: 비주얼 폴리시

### Task 21: 파티클 이펙트

**Files:**
- Create: `src/effects/ParticleManager.ts`
- Modify: `src/game/BoardRenderer.ts`

매치 시 파티클 폭발, 파워업 발동 시 이펙트, 레벨 클리어 시 confetti.

**Step 1: ParticleManager 구현 → Step 2: BoardRenderer에 연결 → Step 3: Commit**

---

### Task 22: 사운드 이펙트

**Files:**
- Create: `src/audio/SoundManager.ts`
- Create: `public/audio/` (매치, 스왑, 파워업, 클리어 SFX)

웹 오디오 API로 간단한 음향 효과. 매치 시 통통 소리, 파워업 시 짜잔 효과.

**Step 1: SoundManager 구현 → Step 2: 각 씬에 연결 → Step 3: Commit**

---

### Task 23: 그래픽 에셋 교체 (플레이스홀더 → 실제 에셋)

**Files:**
- Create: `public/assets/sprites/` (곰사원, 사장, 타일, 장애물 스프라이트)
- Modify: `src/scenes/BootScene.ts`

플레이스홀더 색상 사각형 → 실제 SVG/PNG 에셋으로 교체.
- 곰사원: 망곰이 스타일 둥글둥글한 곰
- 사장: 화난 표정의 곰/사람 캐릭터
- 타일: 사무용품 아이콘 (커피잔, 서류, 스테이플러, 포스트잇)

**Step 1: SVG 에셋 생성 → Step 2: BootScene에서 로딩 → Step 3: Commit**

---

## Phase 12: 배포

### Task 24: Vercel 배포

**Files:**
- Create: `vercel.json`

**Step 1: 빌드 확인**

```bash
npm run build
```

**Step 2: Vercel 배포**

```bash
npx vercel --prod
```

**Step 3: Commit**

```bash
git add vercel.json
git commit -m "chore: Vercel 배포 설정"
```

---

## 구현 우선순위 요약

| Phase | 태스크 | 핵심 기능 | 예상 |
|-------|--------|----------|------|
| 1 | Task 1-5 | 프로젝트 셋업 + 보드 로직 | 코어 |
| 2 | Task 6-7 | 보드 렌더링 + 입력 | 코어 |
| 3 | Task 8-10 | 파워업 시스템 | 코어 |
| 4 | Task 11 | 레벨 시스템 | 코어 |
| 5 | Task 12-14 | UI 화면들 | 필수 |
| 6 | Task 15 | 장애물 시스템 | 중요 |
| 7 | Task 16 | 야근 비상! 모드 | 차별화 |
| 8 | Task 17 | 데코레이션 | 메타 |
| 9 | Task 18 | 라이프/코인 | 경제 |
| 10 | Task 19-20 | PWA + 모바일 | 배포 |
| 11 | Task 21-23 | 비주얼 폴리시 | 품질 |
| 12 | Task 24 | 배포 | 출시 |

---

## 테마 매핑 (Royal Match → 곰사원)

| Royal Match | 탈출! 곰사원 |
|-------------|-------------|
| King Robert | 곰사원 🐻 |
| 성 (Castle) | 회사 빌딩 🏢 |
| 방 (Room) | 층/구역 (주차장→사무실→회의실→구내식당→옥상) |
| 왕관/책/방패/잎 타일 | ☕커피/📄서류/📎스테이플러/📝포스트잇 |
| King's Nightmare | 야근 비상! (사장 추격 😡) |
| Light Ball | WiFi 📶 (같은 타입 전체 삭제) |
| TNT | 파쇄기 🗑️ (범위 폭발) |
| Rocket | 로켓 🚀 (한 줄 제거) |
| Propeller | 선풍기 💨 (랜덤 타겟) |
| 별 (Star) | 별 ⭐ (데코 해금용) |
| 보너스 레벨 | 점심시간 🍱 (간식 수집) |
| 코인 | 커피 쿠폰 ☕🎫 |
