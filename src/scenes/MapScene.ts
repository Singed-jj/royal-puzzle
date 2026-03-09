import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { PlayerProgress } from '../game/PlayerProgress';
import { AreaDecoration } from '../game/AreaDecoration';
import { LivesDisplay } from '../ui/LivesDisplay';
import levelsData from '../data/levels.json';
import areasData from '../data/areas.json';

interface LevelEntry {
  id: number;
  area: string;
}

const AREA_EMOJI: Record<string, string> = {
  '지하주차장': '🅿️',
  '사무실': '💼',
  '회의실': '🪑',
};

const TOP_BAR_HEIGHT = 80;
const NODE_RADIUS = 24;
const NODE_SPACING_Y = 90;
const ZIGZAG_X_LEFT = 100;
const ZIGZAG_X_RIGHT = GAME_WIDTH - 100;

export class MapScene extends Phaser.Scene {
  private progress!: PlayerProgress;
  private areaDecoration!: AreaDecoration;
  private livesDisplay!: LivesDisplay;
  private scrollContainer!: Phaser.GameObjects.Container;
  private scrollY = 0;
  private maxScrollY = 0;

  constructor() {
    super({ key: 'MapScene' });
  }

  create(): void {
    this.progress = new PlayerProgress();
    this.areaDecoration = new AreaDecoration();

    // Background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xe8d5b7);

    this.createTopBar();
    this.createScrollableMap();
    this.setupScrollInput();
  }

  private createTopBar(): void {
    const barBg = this.add.graphics();
    barBg.fillStyle(0xfff0d4, 1);
    barBg.fillRect(0, 0, GAME_WIDTH, TOP_BAR_HEIGHT);
    barBg.lineStyle(2, 0xd4a574, 1);
    barBg.lineBetween(0, TOP_BAR_HEIGHT, GAME_WIDTH, TOP_BAR_HEIGHT);
    barBg.setDepth(200);

    // Title
    const title = this.add.text(GAME_WIDTH / 2, 18, '🐻 탈출! 곰사원', {
      fontSize: '20px',
      color: '#5C3D2E',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0).setDepth(201);

    // Lives display
    this.livesDisplay = new LivesDisplay(this, this.progress);
    const livesContainer = this.livesDisplay.create(10, 46);
    livesContainer.setDepth(201);

    // Coins
    const coins = this.progress.getCoins();
    const coinText = this.add.text(GAME_WIDTH - 15, 52, `☕🎫 ${coins}`, {
      fontSize: '14px',
      color: '#5C3D2E',
      fontFamily: 'Arial',
    }).setOrigin(1, 0).setDepth(201);
  }

  private createScrollableMap(): void {
    this.scrollContainer = this.add.container(0, TOP_BAR_HEIGHT);

    const levels = levelsData as LevelEntry[];
    const currentLevel = this.progress.getCurrentLevel();

    let nodeY = 40;
    let currentArea = '';
    let zigzagIndex = 0;

    for (let i = 0; i < levels.length; i++) {
      const lvl = levels[i];

      // Area label when area changes
      if (lvl.area !== currentArea) {
        currentArea = lvl.area;
        const areaEmoji = AREA_EMOJI[currentArea] ?? '';
        const areaLabel = this.add.text(GAME_WIDTH / 2, nodeY, `${areaEmoji} ${currentArea}`, {
          fontSize: '18px',
          color: '#5C3D2E',
          fontFamily: 'Arial',
          fontStyle: 'bold',
        }).setOrigin(0.5);
        this.scrollContainer.add(areaLabel);

        // Show unlocked decoration emojis for this area
        const areaData = (areasData as Array<{ id: number; name: string; decorations: Array<{ emoji: string }> }>)
          .find(a => a.name === currentArea);
        if (areaData) {
          const decoProgress = this.areaDecoration.getProgress(areaData.id);
          if (decoProgress.unlocked > 0) {
            const unlockedDecos = areaData.decorations
              .slice(0, decoProgress.unlocked)
              .map(d => d.emoji)
              .join(' ');
            const decoText = this.add.text(GAME_WIDTH / 2, nodeY + 22, unlockedDecos, {
              fontSize: '14px',
              fontFamily: 'Arial',
            }).setOrigin(0.5);
            this.scrollContainer.add(decoText);
          }
        }

        nodeY += 50;
        zigzagIndex = 0;
      }

      // Zigzag position
      const nodeX = zigzagIndex % 2 === 0 ? ZIGZAG_X_LEFT : ZIGZAG_X_RIGHT;
      const isUnlocked = lvl.id <= currentLevel;
      const stars = this.progress.getStars(lvl.id);

      // Draw path line to previous node (if not first in area)
      if (zigzagIndex > 0) {
        const prevX = (zigzagIndex - 1) % 2 === 0 ? ZIGZAG_X_LEFT : ZIGZAG_X_RIGHT;
        const prevY = nodeY - NODE_SPACING_Y;
        const pathLine = this.add.graphics();
        pathLine.lineStyle(3, isUnlocked ? 0xd4a574 : 0xcccccc, 0.6);
        pathLine.lineBetween(prevX, prevY, nodeX, nodeY);
        this.scrollContainer.add(pathLine);
      }

      // Level node circle
      const circleColor = isUnlocked ? 0xd4a574 : 0xbbbbbb;
      const circle = this.add.graphics();
      circle.fillStyle(circleColor, 1);
      circle.fillCircle(nodeX, nodeY, NODE_RADIUS);
      circle.lineStyle(2, isUnlocked ? 0x5c3d2e : 0x999999, 1);
      circle.strokeCircle(nodeX, nodeY, NODE_RADIUS);
      this.scrollContainer.add(circle);

      // Level number text
      const numText = this.add.text(nodeX, nodeY, `${lvl.id}`, {
        fontSize: '18px',
        color: isUnlocked ? '#FFFFFF' : '#777777',
        fontFamily: 'Arial',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      this.scrollContainer.add(numText);

      // Stars below completed levels
      if (stars > 0) {
        let starStr = '';
        for (let s = 0; s < 3; s++) {
          starStr += s < stars ? '⭐' : '☆';
        }
        const starText = this.add.text(nodeX, nodeY + NODE_RADIUS + 6, starStr, {
          fontSize: '12px',
          fontFamily: 'Arial',
        }).setOrigin(0.5);
        this.scrollContainer.add(starText);
      }

      // Click handler for unlocked levels
      if (isUnlocked) {
        const hitArea = this.add.rectangle(nodeX, nodeY, NODE_RADIUS * 2, NODE_RADIUS * 2)
          .setInteractive({ useHandCursor: true })
          .setAlpha(0.001);
        hitArea.on('pointerdown', () => {
          this.scene.start('GameScene', { levelId: lvl.id });
        });
        this.scrollContainer.add(hitArea);
      }

      nodeY += NODE_SPACING_Y;
      zigzagIndex++;
    }

    // Calculate max scroll
    const totalContentHeight = nodeY + 40;
    const visibleHeight = GAME_HEIGHT - TOP_BAR_HEIGHT;
    this.maxScrollY = Math.max(0, totalContentHeight - visibleHeight);

    // Start scrolled to bottom (latest levels) if many levels unlocked
    this.scrollY = 0;
  }

  private setupScrollInput(): void {
    // Mask so content doesn't show above top bar
    const maskShape = this.make.graphics({ x: 0, y: 0 });
    maskShape.fillRect(0, TOP_BAR_HEIGHT, GAME_WIDTH, GAME_HEIGHT - TOP_BAR_HEIGHT);
    const mask = maskShape.createGeometryMask();
    this.scrollContainer.setMask(mask);

    // Drag to scroll
    let dragStartY = 0;
    let dragStartScrollY = 0;

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.y < TOP_BAR_HEIGHT) return;
      dragStartY = pointer.y;
      dragStartScrollY = this.scrollY;
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown || pointer.y < TOP_BAR_HEIGHT) return;
      const dy = dragStartY - pointer.y;
      this.scrollY = Phaser.Math.Clamp(dragStartScrollY + dy, 0, this.maxScrollY);
      this.scrollContainer.y = TOP_BAR_HEIGHT - this.scrollY;
    });

    // Mouse wheel scroll
    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: unknown[], _dx: number, dy: number) => {
      this.scrollY = Phaser.Math.Clamp(this.scrollY + dy * 0.5, 0, this.maxScrollY);
      this.scrollContainer.y = TOP_BAR_HEIGHT - this.scrollY;
    });
  }
}
