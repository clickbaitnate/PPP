// Audio Engine for Pythagorus' Polyrhythm Phactory
// Handles Web Audio API, synthesis, and polyrhythmic timing

import { PolygonSynthSettings } from './SynthEngine';

export interface Note {
  frequency: number;
  duration: number;
  velocity: number;
}

export interface SynthSettings {
  oscillatorType: OscillatorType;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  filterFreq: number;
  filterQ: number;
  volume: number;
  pan: number;
}

export interface AudioEngineState {
  context: AudioContext | null;
  isInitialized: boolean;
  isPlaying: boolean;
  masterVolume: number;
  bpm: number;
}

export class AudioEngine {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeOscillators: Map<string, OscillatorNode> = new Map();
  private activeGains: Map<string, GainNode> = new Map();
  private isInitialized = false;
  private isPlaying = false;
  private bpm = 120;
  private masterVolume = 0.5;

  // Note frequency mapping (MIDI note numbers)
  private noteFrequencies: { [key: string]: number } = {
    'C': 261.63,   // C4
    'C#': 277.18,  // C#4
    'D': 293.66,   // D4
    'D#': 311.13,  // D#4
    'E': 329.63,   // E4
    'F': 349.23,   // F4
    'F#': 369.99,  // F#4
    'G': 392.00,   // G4
    'G#': 415.30,  // G#4
    'A': 440.00,   // A4
    'A#': 466.16,  // A#4
    'B': 493.88    // B4
  };

  constructor() {
    this.initializeAudio();
  }

  private async initializeAudio(): Promise<void> {
    try {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.context.createGain();
      this.masterGain.connect(this.context.destination);
      this.masterGain.gain.value = this.masterVolume;
      this.isInitialized = true;
      console.log('Audio engine initialized');
    } catch (error) {
      console.error('Failed to initialize audio engine:', error);
    }
  }

  // Resume audio context (required for user interaction)
  async resumeContext(): Promise<void> {
    if (this.context && this.context.state === 'suspended') {
      await this.context.resume();
    }
  }

  // Play a note
  playNote(noteName: string, duration: number = 0.5, settings: Partial<SynthSettings> = {}): void {
    if (!this.context || !this.masterGain) {
      console.warn('Audio engine not initialized');
      return;
    }

    const frequency = this.noteFrequencies[noteName];
    if (!frequency) {
      console.warn(`Unknown note: ${noteName}`);
      return;
    }

    const noteId = `${noteName}_${Date.now()}_${Math.random()}`;
    
    // Default synth settings
    const synthSettings: SynthSettings = {
      oscillatorType: 'sine',
      attack: 0.1,
      decay: 0.2,
      sustain: 0.7,
      release: 0.3,
      filterFreq: 2000,
      filterQ: 1,
      volume: 0.3,
      pan: 0,
      ...settings
    };

    try {
      // Create oscillator
      const oscillator = this.context.createOscillator();
      oscillator.type = synthSettings.oscillatorType;
      oscillator.frequency.value = frequency;

      // Create gain node for volume and envelope
      const gainNode = this.context.createGain();
      gainNode.gain.value = 0;

      // Create filter
      const filter = this.context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = synthSettings.filterFreq;
      filter.Q.value = synthSettings.filterQ;

      // Create panner
      const panner = this.context.createStereoPanner();
      panner.pan.value = synthSettings.pan;

      // Connect audio graph
      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(panner);
      panner.connect(this.masterGain);

      // Apply ADSR envelope
      const now = this.context.currentTime;
      const attack = synthSettings.attack;
      const decayTime = synthSettings.decay;
      const sustainLevel = synthSettings.sustain;
      const releaseTime = synthSettings.release;

      // Attack
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(synthSettings.volume, now + attack);
      
      // Decay
      gainNode.gain.linearRampToValueAtTime(synthSettings.volume * sustainLevel, now + attack + decayTime);
      
      // Sustain (held until release)
      gainNode.gain.setValueAtTime(synthSettings.volume * sustainLevel, now + attack + decayTime);
      
      // Release
      gainNode.gain.linearRampToValueAtTime(0, now + duration);

      // Start oscillator
      oscillator.start(now);
      oscillator.stop(now + duration);

      // Store references for cleanup
      this.activeOscillators.set(noteId, oscillator);
      this.activeGains.set(noteId, gainNode);

      // Clean up after note ends
      setTimeout(() => {
        this.activeOscillators.delete(noteId);
        this.activeGains.delete(noteId);
      }, (duration + attack + 0.1) * 1000);

    } catch (error) {
      console.error('Error playing note:', error);
    }
  }

  // Stop all notes
  stopAllNotes(): void {
    this.activeOscillators.forEach(oscillator => {
      try {
        oscillator.stop();
      } catch (error) {
        // Oscillator might already be stopped
      }
    });
    this.activeOscillators.clear();
    this.activeGains.clear();
  }

  // Set master volume
  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.value = this.masterVolume;
    }
  }

  // Set BPM
  setBPM(bpm: number): void {
    this.bpm = Math.max(60, Math.min(300, bpm));
  }

  // Generate wavetable for polygon synthesizer
  generateWavetable(settings: PolygonSynthSettings, length: number = 2048): Float32Array {

    // Generate base wave shapes
    const generateBaseWave = (shape: string): Float32Array => {
      const wave = new Float32Array(length);
      for (let i = 0; i < length; i++) {
        const t = (i / length) * 4 - 2; // -2 to 2 for better wave shapes

        switch (shape) {
          case 'sine':
            wave[i] = Math.sin(t * Math.PI / 2);
            break;
          case 'square':
            wave[i] = Math.sign(Math.sin(t * Math.PI / 2));
            break;
          case 'triangle':
            wave[i] = 2 * Math.abs((t % 4) - 2) / 2 - 1;
            break;
          case 'sawtooth':
            wave[i] = (t % 4) / 2 - 1;
            break;
          case 'noise':
            wave[i] = (Math.random() - 0.5) * 2;
            break;
          default:
            wave[i] = Math.sin(t * Math.PI / 2); // default to sine
        }
      }
      return wave;
    };

    // Use the waveShape directly
    return generateBaseWave(settings.waveShape);
  }

  // Play note with polygon synthesizer settings (wavetable synthesis)
  playNoteWithPolygonSynth(noteName: string, duration: number = 0.5, polygonSettings: PolygonSynthSettings, volume: number = 0.3): void {
    if (!this.context || !this.masterGain) {
      console.warn('Audio engine not initialized');
      return;
    }

    if (!polygonSettings.enabled) {
      // Fall back to basic synth if polygon synth is disabled
      this.playNote(noteName, duration, { volume });
      return;
    }

    const frequency = this.noteFrequencies[noteName];
    if (!frequency) {
      console.warn(`Unknown note: ${noteName}`);
      return;
    }

    const noteId = `${noteName}_${Date.now()}_${Math.random()}`;

    try {
      // Create oscillator
      const oscillator = this.context.createOscillator();
      const gainNode = this.context.createGain();
      const filter = this.context.createBiquadFilter();

      // Set frequency
      oscillator.frequency.value = frequency;

      // Set oscillator type directly from settings
      oscillator.type = polygonSettings.waveShape as OscillatorType;

      // Connect audio graph (no filter)
      oscillator.connect(gainNode);
      gainNode.connect(this.masterGain);

      // ADSR envelope using polygon settings
      const now = this.context.currentTime;
      const attack = polygonSettings.attack || 0.01;
      const decay = polygonSettings.decay || 0.1;
      const sustain = polygonSettings.sustain || 0.8;
      const release = polygonSettings.release || 0.3;

      // Attack: Start at 0, ramp to full volume
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume, now + attack);

      // Decay: Ramp down to sustain level
      gainNode.gain.linearRampToValueAtTime(volume * sustain, now + attack + decay);

      // Sustain: Hold sustain level until release starts
      const sustainStart = now + attack + decay;
      const releaseStart = now + duration - release;

      if (releaseStart > sustainStart) {
        gainNode.gain.setValueAtTime(volume * sustain, sustainStart);
        // Release: Ramp down to 0
        gainNode.gain.linearRampToValueAtTime(0, now + duration);
      } else {
        // If note is too short for full ADS, just fade out
        gainNode.gain.linearRampToValueAtTime(0, now + duration);
      }

      // Start and stop oscillator
      oscillator.start(now);
      oscillator.stop(now + duration + 0.1); // Stop slightly after fade out

      // Store references for cleanup
      this.activeOscillators.set(noteId, oscillator);
      this.activeGains.set(noteId, gainNode);

      // Clean up after note ends
      setTimeout(() => {
        this.activeOscillators.delete(noteId);
        this.activeGains.delete(noteId);
      }, (duration + attack + 0.1) * 1000);

    } catch (error) {
      console.error('Error playing note with polygon synth:', error);
    }
  }

  // Get current state
  getState(): AudioEngineState {
    return {
      context: this.context,
      isInitialized: this.isInitialized,
      isPlaying: this.isPlaying,
      masterVolume: this.masterVolume,
      bpm: this.bpm
    };
  }

  // Cleanup
  destroy(): void {
    this.stopAllNotes();
    if (this.context) {
      this.context.close();
    }
  }
}

// Singleton instance
export const audioEngine = new AudioEngine();
