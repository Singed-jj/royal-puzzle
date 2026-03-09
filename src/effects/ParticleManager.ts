import Phaser from 'phaser';
import { TileType } from '../game/types';
import { GAME_WIDTH } from '../config';

/** 타일 타입별 파티클 색상 매핑 */
const TILE_COLORS: Record<TileType, number> = {
  [TileType.Coffee]: 0xc17a50,
  [TileType.Document]: 0xf5e6ca,
  [TileType.Stapler]: 0x7bafd4,
  [TileType.PostIt]: 0x9dc183,
};

/** 컨페티용 색상 팔레트 */
const CONFETTI_COLORS = [0xff6b6b, 0xffd93d, 0x6bcb77, 0x4d96ff, 0xc17a50, 0x9dc183];

/**
 * Phaser Graphics + Tweens 기반 경량 파티클 이펙트 매니저.
 * fire-and-forget 방식으로 호출하며, 내부에서 생성한 오브젝트를 자동 정리한다.
 */
export class ParticleManager {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /** 씬 전환 시 새 씬으로 교체 */
  setScene(scene: Phaser.Scene): void {
    this.scene = scene;
  }

  // ─── 1. Match Explosion ───────────────────────────────────────

  /**
   * 매치된 타일 제거 시 해당 위치에 색상 파티클 버스트.
   * @param x 타일 중심 X
   * @param y 타일 중심 Y
   * @param tileType 타일 종류 (색상 결정)
   */
  matchExplosion(x: number, y: number, tileType: TileType): void {
    const color = TILE_COLORS[tileType] ?? 0xffffff;
    const count = 6 + Math.floor(Math.random() * 3); // 6-8개

    for (let i = 0; i < count; i++) {
      const size = 2 + Math.random() * 3;
      const circle = this.scene.add.circle(x, y, size, color, 1);
      circle.setDepth(1000);

      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const distance = 20 + Math.random() * 25;
      const targetX = x + Math.cos(angle) * distance;
      const targetY = y + Math.sin(angle) * distance;

      this.scene.tweens.add({
        targets: circle,
        x: targetX,
        y: targetY,
        alpha: 0,
        scaleX: 0.3,
        scaleY: 0.3,
        duration: 250 + Math.random() * 100,
        ease: 'Power2',
        onComplete: () => circle.destroy(),
      });
    }
  }

  // ─── 2. Power-up Creation ─────────────────────────────────────

  /**
   * 파워업 타일 생성 시 흰색 플래시 + 확장 링 이펙트.
   * @param x 파워업 중심 X
   * @param y 파워업 중심 Y
   */
  powerUpCreation(x: number, y: number): void {
    // 흰색 플래시 원
    const flash = this.scene.add.circle(x, y, 20, 0xffffff, 0.8);
    flash.setDepth(1001);

    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 300,
      ease: 'Power2',
      onComplete: () => flash.destroy(),
    });

    // 확장 링
    const ring = this.scene.add.graphics();
    ring.setDepth(1001);
    const ringData = { radius: 5, alpha: 1 };

    this.scene.tweens.add({
      targets: ringData,
      radius: 30,
      alpha: 0,
      duration: 400,
      ease: 'Power1',
      onUpdate: () => {
        ring.clear();
        ring.lineStyle(2, 0xffffff, ringData.alpha);
        ring.strokeCircle(x, y, ringData.radius);
      },
      onComplete: () => ring.destroy(),
    });

    // 반짝이 스파클 4개
    for (let i = 0; i < 4; i++) {
      const sparkle = this.scene.add.star(x, y, 4, 2, 5, 0xffffff, 1);
      sparkle.setDepth(1002);
      sparkle.setScale(0);

      const angle = (Math.PI / 2) * i;
      const dist = 18;

      this.scene.tweens.add({
        targets: sparkle,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        scaleX: 1,
        scaleY: 1,
        alpha: 0,
        duration: 400,
        ease: 'Back.easeOut',
        delay: 50,
        onComplete: () => sparkle.destroy(),
      });
    }
  }

  // ─── 3. Level Complete Confetti ───────────────────────────────

  /**
   * 레벨 성공 시 화면 상단에서 컨페티가 떨어지는 이펙트.
   * 약 2초간 지속.
   */
  levelCompleteConfetti(): void {
    const totalPieces = 40;
    const spawnDuration = 800; // 0.8초간 나눠 생성

    for (let i = 0; i < totalPieces; i++) {
      const delay = Math.random() * spawnDuration;
      const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
      const startX = Math.random() * GAME_WIDTH;
      const startY = -10 - Math.random() * 30;
      const width = 4 + Math.random() * 4;
      const height = 6 + Math.random() * 6;

      this.scene.time.delayedCall(delay, () => {
        // 씬이 아직 유효한지 확인
        if (!this.scene.scene.isActive()) return;

        const piece = this.scene.add.rectangle(startX, startY, width, height, color, 1);
        piece.setDepth(2000);
        piece.setRotation(Math.random() * Math.PI);

        const drift = (Math.random() - 0.5) * 80;
        const fallDuration = 1200 + Math.random() * 800;

        // 떨어지는 애니메이션
        this.scene.tweens.add({
          targets: piece,
          y: startY + 500 + Math.random() * 200,
          x: startX + drift,
          rotation: piece.rotation + (Math.random() - 0.5) * 6,
          alpha: { from: 1, to: 0 },
          duration: fallDuration,
          ease: 'Sine.easeIn',
          delay: 0,
          onComplete: () => piece.destroy(),
        });

        // 좌우 흔들림
        this.scene.tweens.add({
          targets: piece,
          x: `+=${(Math.random() - 0.5) * 30}`,
          duration: 300 + Math.random() * 200,
          yoyo: true,
          repeat: 3,
          ease: 'Sine.easeInOut',
        });
      });
    }
  }

  // ─── 4. Combo Counter ─────────────────────────────────────────

  /**
   * 연쇄 매치 시 "+N Combo!" 텍스트가 떠오르며 페이드아웃.
   * @param x 표시 위치 X
   * @param y 표시 위치 Y
   * @param comboCount 콤보 수
   */
  comboCounter(x: number, y: number, comboCount: number): void {
    if (comboCount < 2) return;

    const text = this.scene.add.text(x, y, `+${comboCount} Combo!`, {
      fontSize: '22px',
      color: '#FFD700',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#5C3D2E',
      strokeThickness: 3,
    });
    text.setOrigin(0.5);
    text.setDepth(1500);
    text.setScale(0);

    // 바운시 등장
    this.scene.tweens.add({
      targets: text,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 150,
      ease: 'Back.easeOut',
      onComplete: () => {
        // 원래 크기로 줄어들기
        this.scene.tweens.add({
          targets: text,
          scaleX: 1,
          scaleY: 1,
          duration: 100,
          ease: 'Power2',
        });
      },
    });

    // 위로 떠오르며 페이드아웃
    this.scene.tweens.add({
      targets: text,
      y: y - 60,
      alpha: 0,
      duration: 800,
      ease: 'Power1',
      delay: 300,
      onComplete: () => text.destroy(),
    });
  }
}
