import Phaser from 'phaser';
import { PlayerProgress } from '../game/PlayerProgress';

const MAX_LIVES = 5;

export class LivesDisplay {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;
  private heartsText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private progress: PlayerProgress;
  private timerEvent?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, progress: PlayerProgress) {
    this.scene = scene;
    this.progress = progress;
  }

  create(x: number, y: number): Phaser.GameObjects.Container {
    this.container = this.scene.add.container(x, y);

    this.heartsText = this.scene.add.text(0, 0, '', {
      fontSize: '16px',
      fontFamily: 'Arial',
    });
    this.container.add(this.heartsText);

    this.timerText = this.scene.add.text(0, 20, '', {
      fontSize: '11px',
      color: '#8B7355',
      fontFamily: 'Arial',
    });
    this.container.add(this.timerText);

    this.refresh();

    // Update timer every second
    this.timerEvent = this.scene.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => this.refresh(),
    });

    return this.container;
  }

  refresh(): void {
    this.progress.refreshLives();
    const lives = this.progress.getLives();

    let hearts = '';
    for (let i = 0; i < MAX_LIVES; i++) {
      hearts += i < lives ? '❤️' : '🤍';
    }
    this.heartsText.setText(hearts);

    if (lives < MAX_LIVES) {
      const ms = this.progress.getTimeToNextLife();
      const totalSec = Math.ceil(ms / 1000);
      const min = Math.floor(totalSec / 60);
      const sec = totalSec % 60;
      this.timerText.setText(`⏱️ ${min}:${sec.toString().padStart(2, '0')}`);
    } else {
      this.timerText.setText('');
    }
  }

  destroy(): void {
    if (this.timerEvent) {
      this.timerEvent.destroy();
    }
    this.container.destroy();
  }
}
