import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    this.createPlaceholderTextures();
  }

  create(): void {
    this.scene.start('MapScene');
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
