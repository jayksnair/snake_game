/**
 * SoundFX — synthetic retro sounds via Web Audio API.
 * No external assets. All sounds generated programmatically.
 * Handles browser autoplay restrictions: context created on first user interaction.
 */

type SoundEvent = 'startup' | 'menu' | 'click' | 'food' | 'pause' | 'collision' | 'gameover';

class SoundFXEngine {
  private ctx: AudioContext | null = null;
  private enabled = true;

  /** Call on first user interaction to unlock AudioContext */
  unlock() {
    if (this.ctx) return;
    try {
      this.ctx = new AudioContext();
    } catch {
      // Audio not available — silently ignore
    }
  }

  setEnabled(v: boolean) { this.enabled = v; }
  isEnabled() { return this.enabled; }

  play(event: SoundEvent) {
    if (!this.enabled || !this.ctx) return;
    try {
      switch (event) {
        case 'startup':   this.playStartup();   break;
        case 'menu':      this.playMenu();       break;
        case 'click':     this.playClick();      break;
        case 'food':      this.playFood();       break;
        case 'pause':     this.playPause();      break;
        case 'collision': this.playCollision();  break;
        case 'gameover':  this.playGameOver();   break;
      }
    } catch { /* silent */ }
  }

  private beep(freq: number, dur: number, type: OscillatorType = 'square', gain = 0.3) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gainNode.gain.setValueAtTime(gain, this.ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + dur);
  }

  private playStartup() {
    [440, 554, 659, 880].forEach((f, i) => {
      setTimeout(() => this.beep(f, 0.15), i * 120);
    });
  }
  private playMenu()      { this.beep(440, 0.08, 'square', 0.2); }
  private playClick()     { this.beep(880, 0.05, 'square', 0.25); }
  private playFood()      { this.beep(660, 0.1, 'square', 0.3); }
  private playPause()     { this.beep(330, 0.15, 'square', 0.2); }
  private playCollision() { this.beep(110, 0.3,  'sawtooth', 0.4); }
  private playGameOver()  {
    [440, 330, 220, 110].forEach((f, i) => {
      setTimeout(() => this.beep(f, 0.2, 'sawtooth', 0.3), i * 150);
    });
  }
}

export const SoundFX = new SoundFXEngine();
