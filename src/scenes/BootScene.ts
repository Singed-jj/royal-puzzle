import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    this.createPlaceholderTextures();
    this.createSpecialTextures();
  }

  create(): void {
    this.scene.start('MapScene');
  }

  private createPlaceholderTextures(): void {
    this.createCoffeeTexture();
    this.createDocumentTexture();
    this.createStaplerTexture();
    this.createPostItTexture();
  }

  /** ☕ 커피 - 갈색 컵 + 손잡이 + 증기 */
  private createCoffeeTexture(): void {
    const g = this.add.graphics();
    const size = 40;

    // 배경 라운드 사각형
    g.fillStyle(0xc17a50, 1);
    g.fillRoundedRect(0, 0, size, size, 6);
    g.lineStyle(1, 0x8b5a30, 1);
    g.strokeRoundedRect(0, 0, size, size, 6);

    // 컵 몸통
    g.fillStyle(0xf5f0e8, 1);
    g.fillRoundedRect(10, 16, 16, 16, 3);
    g.lineStyle(1, 0x8b5a30, 1);
    g.strokeRoundedRect(10, 16, 16, 16, 3);

    // 커피 액체
    g.fillStyle(0x6f4e37, 1);
    g.fillRect(12, 19, 12, 10);

    // 컵 손잡이
    g.lineStyle(2, 0x8b5a30, 1);
    g.beginPath();
    g.arc(27, 24, 4, -Math.PI / 2, Math.PI / 2, false);
    g.strokePath();

    // 증기 라인들
    g.lineStyle(1.5, 0xdddddd, 0.7);
    // 왼쪽 증기
    g.beginPath();
    g.moveTo(14, 14);
    g.lineTo(15, 10);
    g.lineTo(14, 6);
    g.strokePath();
    // 오른쪽 증기
    g.beginPath();
    g.moveTo(20, 14);
    g.lineTo(21, 10);
    g.lineTo(20, 6);
    g.strokePath();

    g.generateTexture('coffee', size, size);
    g.destroy();
  }

  /** 📄 서류 - 흰색 종이 + 텍스트 라인 + 접힌 모서리 */
  private createDocumentTexture(): void {
    const g = this.add.graphics();
    const size = 40;

    // 배경
    g.fillStyle(0xf5e6ca, 1);
    g.fillRoundedRect(0, 0, size, size, 6);
    g.lineStyle(1, 0xc4a882, 1);
    g.strokeRoundedRect(0, 0, size, size, 6);

    // 종이
    g.fillStyle(0xffffff, 1);
    g.fillRect(8, 6, 22, 28);
    g.lineStyle(1, 0xbbbbbb, 1);
    g.strokeRect(8, 6, 22, 28);

    // 접힌 모서리
    g.fillStyle(0xe0e0e0, 1);
    g.fillTriangle(24, 6, 30, 6, 30, 12);
    g.lineStyle(1, 0xbbbbbb, 1);
    g.lineBetween(24, 6, 24, 12);
    g.lineBetween(24, 12, 30, 12);

    // 텍스트 라인
    g.fillStyle(0xaaaaaa, 1);
    g.fillRect(11, 15, 16, 2);
    g.fillRect(11, 20, 14, 2);
    g.fillRect(11, 25, 16, 2);

    g.generateTexture('document', size, size);
    g.destroy();
  }

  /** 📎 스테이플러 - 파란 라운드 사각형 + 상단 부분 */
  private createStaplerTexture(): void {
    const g = this.add.graphics();
    const size = 40;

    // 배경
    g.fillStyle(0x7bafd4, 1);
    g.fillRoundedRect(0, 0, size, size, 6);
    g.lineStyle(1, 0x5a8ab0, 1);
    g.strokeRoundedRect(0, 0, size, size, 6);

    // 스테이플러 베이스
    g.fillStyle(0x4a7fb5, 1);
    g.fillRoundedRect(6, 22, 28, 10, 3);
    g.lineStyle(1, 0x3a6a9a, 1);
    g.strokeRoundedRect(6, 22, 28, 10, 3);

    // 스테이플러 상단 (힌지 부분)
    g.fillStyle(0x3a6a9a, 1);
    g.fillRoundedRect(6, 14, 28, 9, { tl: 4, tr: 4, bl: 0, br: 0 });
    g.lineStyle(1, 0x2a5a8a, 1);
    g.strokeRoundedRect(6, 14, 28, 9, { tl: 4, tr: 4, bl: 0, br: 0 });

    // 힌지 표시
    g.fillStyle(0xcccccc, 1);
    g.fillCircle(8, 22, 2);

    g.generateTexture('stapler', size, size);
    g.destroy();
  }

  /** 📝 포스트잇 - 연두색 + 약간 말린 모서리 + 줄 */
  private createPostItTexture(): void {
    const g = this.add.graphics();
    const size = 40;

    // 배경
    g.fillStyle(0x9dc183, 1);
    g.fillRoundedRect(0, 0, size, size, 6);
    g.lineStyle(1, 0x7da063, 1);
    g.strokeRoundedRect(0, 0, size, size, 6);

    // 포스트잇 종이
    g.fillStyle(0xf7f5a0, 1);
    g.fillRect(6, 6, 26, 26);
    g.lineStyle(1, 0xd4d280, 1);
    g.strokeRect(6, 6, 26, 26);

    // 말린 모서리 (오른쪽 아래)
    g.fillStyle(0xe8e690, 1);
    g.fillTriangle(26, 32, 32, 32, 32, 26);
    g.lineStyle(1, 0xc4c270, 1);
    g.lineBetween(26, 32, 32, 26);

    // 텍스트 줄
    g.lineStyle(1, 0xc4c270, 0.6);
    g.lineBetween(9, 14, 27, 14);
    g.lineBetween(9, 19, 25, 19);
    g.lineBetween(9, 24, 23, 24);

    g.generateTexture('postit', size, size);
    g.destroy();
  }

  private createSpecialTextures(): void {
    this.createRocketTexture();
    this.createPropellerTexture();
    this.createShredderTexture();
    this.createWifiTexture();
  }

  /** 🚀 로켓 - 빨간 길쭉한 형태 + 뾰족한 상단 */
  private createRocketTexture(): void {
    const g = this.add.graphics();
    const size = 40;

    // 배경
    g.fillStyle(0x333333, 0.3);
    g.fillRoundedRect(0, 0, size, size, 6);

    // 로켓 몸통
    g.fillStyle(0xe04040, 1);
    g.fillRoundedRect(14, 10, 12, 22, 3);

    // 뾰족한 상단
    g.fillStyle(0xe04040, 1);
    g.fillTriangle(14, 12, 26, 12, 20, 4);

    // 날개 (좌)
    g.fillStyle(0xcc3030, 1);
    g.fillTriangle(14, 26, 14, 32, 8, 32);
    // 날개 (우)
    g.fillTriangle(26, 26, 26, 32, 32, 32);

    // 창문
    g.fillStyle(0x87ceeb, 1);
    g.fillCircle(20, 17, 3);
    g.lineStyle(1, 0x6ab0d4, 1);
    g.strokeCircle(20, 17, 3);

    // 불꽃
    g.fillStyle(0xffa500, 1);
    g.fillTriangle(16, 32, 24, 32, 20, 37);

    g.generateTexture('rocket', size, size);
    g.destroy();
  }

  /** 🌀 프로펠러 - 하늘색 원 + 3개 날개 표시 */
  private createPropellerTexture(): void {
    const g = this.add.graphics();
    const size = 40;
    const cx = size / 2;
    const cy = size / 2;

    // 배경 원
    g.fillStyle(0x87ceeb, 1);
    g.fillCircle(cx, cy, 18);
    g.lineStyle(1.5, 0x5aa0c8, 1);
    g.strokeCircle(cx, cy, 18);

    // 프로펠러 날개 3개 (120도 간격)
    g.fillStyle(0x4a90b8, 1);
    for (let i = 0; i < 3; i++) {
      const angle = (i * 120 - 90) * (Math.PI / 180);
      const bx = cx + Math.cos(angle) * 12;
      const by = cy + Math.sin(angle) * 12;
      g.fillEllipse(
        (cx + bx) / 2,
        (cy + by) / 2,
        6,
        12,
      );
    }

    // 중앙 원
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx, cy, 4);
    g.lineStyle(1, 0x5aa0c8, 1);
    g.strokeCircle(cx, cy, 4);

    g.generateTexture('propeller', size, size);
    g.destroy();
  }

  /** 🗑️ 슈레더 - 주황 원 + 지그재그 패턴 */
  private createShredderTexture(): void {
    const g = this.add.graphics();
    const size = 40;
    const cx = size / 2;
    const cy = size / 2;

    // 배경 원
    g.fillStyle(0xf0a040, 1);
    g.fillCircle(cx, cy, 18);
    g.lineStyle(1.5, 0xc08030, 1);
    g.strokeCircle(cx, cy, 18);

    // 슈레더 본체 (사각형)
    g.fillStyle(0xd08020, 1);
    g.fillRoundedRect(10, 12, 20, 10, 2);

    // 지그재그 (파쇄된 종이)
    g.lineStyle(2, 0xffffff, 0.8);
    g.beginPath();
    g.moveTo(12, 22);
    g.lineTo(14, 28);
    g.lineTo(16, 22);
    g.lineTo(18, 28);
    g.lineTo(20, 22);
    g.lineTo(22, 28);
    g.lineTo(24, 22);
    g.lineTo(26, 28);
    g.lineTo(28, 22);
    g.strokePath();

    // 투입구 표시
    g.lineStyle(1, 0xffffff, 0.5);
    g.lineBetween(12, 12, 28, 12);

    g.generateTexture('shredder', size, size);
    g.destroy();
  }

  /** 📶 와이파이 - 보라색 원 + 아크 라인 */
  private createWifiTexture(): void {
    const g = this.add.graphics();
    const size = 40;
    const cx = size / 2;
    const cy = size / 2 + 4;

    // 배경 원
    g.fillStyle(0x9b59b6, 1);
    g.fillCircle(size / 2, size / 2, 18);
    g.lineStyle(1.5, 0x7d3c98, 1);
    g.strokeCircle(size / 2, size / 2, 18);

    // 와이파이 아크 라인들
    g.lineStyle(2.5, 0xffffff, 0.9);
    g.beginPath();
    g.arc(cx, cy, 14, -Math.PI * 0.8, -Math.PI * 0.2, false);
    g.strokePath();

    g.lineStyle(2.5, 0xffffff, 0.75);
    g.beginPath();
    g.arc(cx, cy, 10, -Math.PI * 0.75, -Math.PI * 0.25, false);
    g.strokePath();

    g.lineStyle(2.5, 0xffffff, 0.6);
    g.beginPath();
    g.arc(cx, cy, 6, -Math.PI * 0.7, -Math.PI * 0.3, false);
    g.strokePath();

    // 중앙 점
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx, cy, 2);

    g.generateTexture('wifi', size, size);
    g.destroy();
  }
}
