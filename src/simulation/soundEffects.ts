// Browser-native Web Audio API synthesizer for ambulance siren and signal tones
// No external audio files needed

class SoundSystem {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;
  private sirenOsc: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private sirenTimer: number | null = null;

  constructor() {
    // Start muted by default or read from storage to prevent unexpected sound
    const savedMute = typeof localStorage !== 'undefined' ? localStorage.getItem('traffic_sim_muted') : null;
    this.isMuted = savedMute !== null ? savedMute === 'true' : false;
  }

  private initContext() {
    if (typeof window === 'undefined') return;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('traffic_sim_muted', String(muted));
    }
    if (muted) {
      this.stopSiren();
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public playBeep(freq: number = 440, duration: number = 0.1, type: OscillatorType = 'sine'): void {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch {
      // Audio playback might be restricted until user gesture
    }
  }

  public playPedestrianChirp(): void {
    if (this.isMuted) return;
    this.playBeep(880, 0.08, 'square');
  }

  public startSiren(): void {
    if (this.isMuted || this.sirenOsc) return;
    try {
      this.initContext();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(650, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(0.06, this.audioCtx.currentTime);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      this.sirenOsc = osc;
      this.sirenGain = gain;

      // Modulate frequency to create wailing ambulance siren
      let high = false;
      this.sirenTimer = window.setInterval(() => {
        if (!this.audioCtx || !this.sirenOsc) return;
        const targetFreq = high ? 650 : 920;
        this.sirenOsc.frequency.exponentialRampToValueAtTime(targetFreq, this.audioCtx.currentTime + 0.25);
        high = !high;
      }, 400);
    } catch {
      // Ignore
    }
  }

  public stopSiren(): void {
    if (this.sirenTimer) {
      clearInterval(this.sirenTimer);
      this.sirenTimer = null;
    }
    if (this.sirenOsc && this.audioCtx) {
      try {
        if (this.sirenGain) {
          this.sirenGain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.1);
        }
        setTimeout(() => {
          this.sirenOsc?.stop();
          this.sirenOsc?.disconnect();
          this.sirenOsc = null;
          this.sirenGain = null;
        }, 120);
      } catch {
        this.sirenOsc = null;
      }
    }
  }
}

export const soundEffects = new SoundSystem();
