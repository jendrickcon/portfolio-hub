/**
 * CYBER DEFENDER — Audio System
 * Web Audio API procedural sound synthesizer with zero external dependencies.
 * Generates authentic retro cybersecurity sound effects and supports audio files.
 */

import { state } from "./state.js";

class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.initialized = false;
    this.muted = false;
  }

  init() {
    if (this.initialized) return;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        console.warn("[AudioManager]: Web Audio API not supported in this browser.");
        return;
      }

      this.ctx = new AudioContext();

      // Master Gain Node
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(state.settings.masterVolume ?? 0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // SFX Gain Node
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(state.settings.sfxVolume ?? 0.8, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Music Gain Node
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(state.settings.musicVolume ?? 0.6, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.initialized = true;
      console.log("[AudioManager]: Web Audio Engine Initialized.");

      // Resume context on user interaction if suspended (browser autoplay policy)
      const resumeAudio = () => {
        if (this.ctx && this.ctx.state === "suspended") {
          this.ctx.resume().then(() => {
            console.log("[AudioManager]: AudioContext resumed.");
          });
        }
        window.removeEventListener("pointerdown", resumeAudio);
        window.removeEventListener("keydown", resumeAudio);
      };
      window.addEventListener("pointerdown", resumeAudio);
      window.addEventListener("keydown", resumeAudio);

    } catch (err) {
      console.warn("[AudioManager]: Failed to initialize Web Audio context:", err);
    }
  }

  setMasterVolume(val) {
    if (!this.masterGain || !this.ctx) return;
    const clamped = Math.max(0, Math.min(1, val));
    this.masterGain.gain.setTargetAtTime(clamped, this.ctx.currentTime, 0.05);
  }

  setSfxVolume(val) {
    if (!this.sfxGain || !this.ctx) return;
    const clamped = Math.max(0, Math.min(1, val));
    this.sfxGain.gain.setTargetAtTime(clamped, this.ctx.currentTime, 0.05);
  }

  setMusicVolume(val) {
    if (!this.musicGain || !this.ctx) return;
    const clamped = Math.max(0, Math.min(1, val));
    this.musicGain.gain.setTargetAtTime(clamped, this.ctx.currentTime, 0.05);
  }

  /**
   * Procedural Sound Effects Generator
   * Generates crisp retro-cyber synthesizer sounds on demand.
   */
  playSFX(name) {
    if (!this.initialized || !this.ctx) {
      this.init();
      if (!this.ctx) return;
    }

    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }

    const t = this.ctx.currentTime;

    switch (name) {
      case "menu_click": {
        // High-tech short blip
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, t);
        osc.frequency.exponentialRampToValueAtTime(1760, t + 0.05);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.05);
        break;
      }

      case "boot_beep": {
        // BIOS confirmation chirp
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(520, t);
        osc.frequency.setValueAtTime(650, t + 0.04);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.08);
        break;
      }

      case "deploy": {
        // Deep sector authorization power-up
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(110, t);
        osc.frequency.exponentialRampToValueAtTime(440, t + 0.25);
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.3);
        break;
      }

      case "step": {
        // Subtle PCB movement click
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(240, t);
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.03);
        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.03);
        break;
      }

      case "attack_firewall": {
        // Energy shield burst
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.linearRampToValueAtTime(200, t + 0.18);
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.2);
        break;
      }

      case "attack_antivirus": {
        // High frequency cryptographic scan burst
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(1200, t);
        osc.frequency.exponentialRampToValueAtTime(300, t + 0.22);
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.25);
        break;
      }

      case "damage": {
        // Noise static crunch
        const bufferSize = this.ctx.sampleRate * 0.15;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.45, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
        noise.connect(gain);
        gain.connect(this.sfxGain);
        noise.start(t);
        break;
      }

      case "heal": {
        // Rising arpeggio chime
        const freqs = [330, 440, 554, 659];
        freqs.forEach((freq, idx) => {
          const st = t + idx * 0.05;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, st);
          gain.gain.setValueAtTime(0.2, st);
          gain.gain.exponentialRampToValueAtTime(0.001, st + 0.12);
          osc.connect(gain);
          gain.connect(this.sfxGain);
          osc.start(st);
          osc.stop(st + 0.12);
        });
        break;
      }

      case "scan": {
        // Sweeping radar pulse
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.exponentialRampToValueAtTime(1400, t + 0.2);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.25);
        break;
      }

      case "level_up": {
        // Triumphant fanfare
        const notes = [440, 554, 659, 880];
        notes.forEach((f, i) => {
          const st = t + i * 0.08;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(f, st);
          gain.gain.setValueAtTime(0.3, st);
          gain.gain.exponentialRampToValueAtTime(0.001, st + 0.2);
          osc.connect(gain);
          gain.connect(this.sfxGain);
          osc.start(st);
          osc.stop(st + 0.2);
        });
        break;
      }

      case "warning": {
        // Urgent double pulse siren
        [0, 0.12].forEach((offset) => {
          const st = t + offset;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(800, st);
          osc.frequency.linearRampToValueAtTime(600, st + 0.08);
          gain.gain.setValueAtTime(0.3, st);
          gain.gain.exponentialRampToValueAtTime(0.001, st + 0.09);
          osc.connect(gain);
          gain.connect(this.sfxGain);
          osc.start(st);
          osc.stop(st + 0.09);
        });
        break;
      }

      default:
        console.warn(`[AudioManager]: Unknown sound cue "${name}"`);
    }
  }
}

export const audio = new AudioManager();

if (typeof window !== "undefined") {
  window.CyberAudio = audio;
}

