/**
 * Tiny WebAudio synth — zero external assets, graceful fallback when the
 * browser blocks audio or the API is missing.
 */
export type SfxName =
  | "click"
  | "correct"
  | "wrong"
  | "jump"
  | "land"
  | "checkpoint"
  | "energy"
  | "streak"
  | "finish"
  | "warning";

interface Tone {
  freq: number[];
  dur: number;
  type: OscillatorType;
  gain: number;
}

const SFX: Record<SfxName, Tone> = {
  click: { freq: [520, 720], dur: 0.08, type: "triangle", gain: 0.16 },
  correct: { freq: [660, 880, 1180], dur: 0.16, type: "triangle", gain: 0.2 },
  wrong: { freq: [300, 190], dur: 0.22, type: "sawtooth", gain: 0.15 },
  jump: { freq: [420, 700], dur: 0.1, type: "square", gain: 0.12 },
  land: { freq: [200, 150], dur: 0.07, type: "sine", gain: 0.12 },
  checkpoint: { freq: [700, 950, 1250], dur: 0.14, type: "sine", gain: 0.2 },
  energy: { freq: [880, 1320], dur: 0.1, type: "sine", gain: 0.14 },
  streak: { freq: [700, 1050, 1400, 1750], dur: 0.12, type: "triangle", gain: 0.18 },
  finish: { freq: [523, 659, 784, 1046, 1318], dur: 0.2, type: "triangle", gain: 0.22 },
  warning: { freq: [880, 660], dur: 0.16, type: "square", gain: 0.14 },
};

const MELODY = [
  0, 4, 7, 12, 7, 4, 9, 7, 5, 9, 12, 9, 5, 2, 5, 7,
];

export class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private musicTimer: number | null = null;
  private step = 0;
  sfxEnabled = true;
  musicEnabled = true;
  soundEnabled = true;

  private ensure(): AudioContext | null {
    if (typeof window === "undefined") return null;
    try {
      if (!this.ctx) {
        const Ctor =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (!Ctor) return null;
        this.ctx = new Ctor();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.7;
        this.master.connect(this.ctx.destination);
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.16;
        this.musicGain.connect(this.master);
      }
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return this.ctx;
    } catch {
      return null;
    }
  }

  unlock() {
    this.ensure();
  }

  play(name: SfxName) {
    if (!this.soundEnabled || !this.sfxEnabled) return;
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const tone = SFX[name];
    const now = ctx.currentTime;
    tone.freq.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = tone.type;
      osc.frequency.value = f;
      const start = now + i * (tone.dur * 0.55);
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(tone.gain, start + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, start + tone.dur);
      osc.connect(g).connect(this.master!);
      osc.start(start);
      osc.stop(start + tone.dur + 0.02);
    });
  }

  startMusic() {
    if (!this.soundEnabled || !this.musicEnabled) return;
    const ctx = this.ensure();
    if (!ctx || this.musicTimer !== null) return;
    const tick = () => {
      if (!this.ctx || !this.musicGain) return;
      const semi = MELODY[this.step % MELODY.length]!;
      const freq = 220 * Math.pow(2, semi / 12);
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = this.step % 4 === 0 ? "triangle" : "sine";
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.5, now + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);
      osc.connect(g).connect(this.musicGain);
      osc.start(now);
      osc.stop(now + 0.38);

      if (this.step % 2 === 0) {
        const bass = this.ctx.createOscillator();
        const bg = this.ctx.createGain();
        bass.type = "sine";
        bass.frequency.value = 110 * Math.pow(2, (semi % 12) / 12);
        bg.gain.setValueAtTime(0.0001, now);
        bg.gain.exponentialRampToValueAtTime(0.35, now + 0.02);
        bg.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
        bass.connect(bg).connect(this.musicGain);
        bass.start(now);
        bass.stop(now + 0.34);
      }
      this.step++;
    };
    tick();
    this.musicTimer = window.setInterval(tick, 260);
  }

  stopMusic() {
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  applySettings(s: { sound: boolean; music: boolean; sfx: boolean }) {
    this.soundEnabled = s.sound;
    this.musicEnabled = s.music;
    this.sfxEnabled = s.sfx;
    if (!s.sound || !s.music) this.stopMusic();
  }
}

export const audio = new AudioManager();
