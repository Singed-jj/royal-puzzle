/**
 * SoundManager - Web Audio API 기반 프로그래밍 방식 사운드 생성
 * 외부 오디오 파일 없이 게임 효과음을 실시간 합성
 */
export class SoundManager {
  private static instance: SoundManager | null = null;

  private audioContext: AudioContext | null = null;
  private _muted = false;
  private contextResumed = false;

  private constructor() {
    try {
      this.audioContext = new AudioContext();
    } catch {
      console.warn('Web Audio API를 사용할 수 없습니다.');
    }
  }

  static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  get muted(): boolean {
    return this._muted;
  }

  set muted(value: boolean) {
    this._muted = value;
  }

  /**
   * 브라우저 정책상 첫 사용자 인터랙션 시 AudioContext를 resume해야 함
   */
  async resumeContext(): Promise<void> {
    if (this.contextResumed || !this.audioContext) return;
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    this.contextResumed = true;
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.3,
  ): void {
    if (this._muted || !this.audioContext) return;
    const ctx = this.audioContext;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      ctx.currentTime + duration / 1000,
    );
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration / 1000);
  }

  private playSweep(
    startFreq: number,
    endFreq: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.3,
  ): void {
    if (this._muted || !this.audioContext) return;
    const ctx = this.audioContext;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      endFreq,
      ctx.currentTime + duration / 1000,
    );
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      ctx.currentTime + duration / 1000,
    );
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration / 1000);
  }

  private playNoiseBurst(duration: number, volume = 0.15): void {
    if (this._muted || !this.audioContext) return;
    const ctx = this.audioContext;
    const bufferSize = ctx.sampleRate * (duration / 1000);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * volume;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      ctx.currentTime + duration / 1000,
    );
    source.connect(gain).connect(ctx.destination);
    source.start();
    source.stop(ctx.currentTime + duration / 1000);
  }

  /** 짧은 스우시 효과 (400→200Hz, 100ms) */
  playSwap(): void {
    this.playSweep(400, 200, 100);
  }

  /** 매치 시 팝/딩 효과 (800Hz, 150ms) */
  playMatch(): void {
    this.playTone(800, 150);
  }

  /** 연쇄 매치 시 높은 팝 (1000Hz, 100ms) */
  playCascade(): void {
    this.playTone(1000, 100);
  }

  /** 파워업 생성 시 상승 톤 (400→1200Hz, 300ms) */
  playPowerUp(): void {
    this.playSweep(400, 1200, 300, 'sine', 0.25);
  }

  /** 실패 시 하강 톤 (400→200Hz, 500ms) */
  playFail(): void {
    this.playSweep(400, 200, 500, 'sine', 0.2);
  }

  /** 성공 시 해피 징글 (C5, E5, G5, C6 각 150ms) */
  playSuccess(): void {
    if (this._muted || !this.audioContext) return;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const noteDuration = 150;
    notes.forEach((freq, i) => {
      const ctx = this.audioContext!;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const startTime = ctx.currentTime + (i * noteDuration) / 1000;
      gain.gain.setValueAtTime(0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        startTime + noteDuration / 1000,
      );
      osc.connect(gain).connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + noteDuration / 1000);
    });
  }

  /** 타일 선택 시 소프트 클릭 (노이즈 버스트, 50ms) */
  playSelect(): void {
    this.playNoiseBurst(50);
  }

  /** UI 버튼 클릭 (600Hz, 80ms) */
  playButton(): void {
    this.playTone(600, 80, 'sine', 0.2);
  }
}
