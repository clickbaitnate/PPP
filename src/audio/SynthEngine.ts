// Simple Synth Engine for Shape Sequencer
// Uses built-in Web Audio oscillators for clean, simple synthesis

export interface PolygonSynthSettings {
  waveShape: 'sine' | 'square' | 'triangle' | 'sawtooth';
  enabled: boolean;
  attack?: number;
  decay?: number;
  sustain?: number;
  release?: number;
}

export class SynthEngine {
  private context: AudioContext;
  private masterGain: GainNode;
  private analyserNode: AnalyserNode;
  private activeOscillators: Map<string, OscillatorNode> = new Map();
  private activeGains: Map<string, GainNode> = new Map();

  // Note frequency mapping
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

  constructor(context: AudioContext) {
    this.context = context;
    this.masterGain = context.createGain();
    this.masterGain.gain.value = 1.0; // Ensure master gain is at full volume
    this.masterGain.connect(context.destination);
    this.analyserNode = context.createAnalyser();
    this.analyserNode.fftSize = 2048;
    this.analyserNode.connect(this.masterGain);
  }

  // Simple method to play a note using built-in oscillator
  playNoteWithPolygonSynth(noteName: string, duration: number = 1.0, polygonSettings: PolygonSynthSettings, volume: number = 0.5): void {
    if (!polygonSettings.enabled) {
      return; // Don't play if disabled
    }

    const frequency = this.noteFrequencies[noteName];
    if (!frequency) {
      console.warn(`Unknown note: ${noteName}`);
      return;
    }

    const noteId = `${noteName}_${Date.now()}_${Math.random()}`;

    try {
      // Create oscillator using built-in Web Audio API
      const oscillator = this.context.createOscillator();
      const gainNode = this.context.createGain();

      // Set frequency
      oscillator.frequency.value = frequency;

      // Set oscillator type directly from settings
      oscillator.type = polygonSettings.waveShape as OscillatorType;

      // Connect: oscillator -> gain -> master gain -> destination
      oscillator.connect(gainNode);
      gainNode.connect(this.masterGain);

      const now = this.context.currentTime;

      // ADSR envelope using polygon settings
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

      // Store for cleanup
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

  // Get analyser node for visualization
  getAnalyserNode(): AnalyserNode {
    return this.analyserNode;
  }

  // Resume audio context
  resumeContext(): Promise<void> {
    if (this.context.state === 'suspended') {
      return this.context.resume();
    }
    return Promise.resolve();
  }

  // Get current audio context state
  getState(): { context: AudioContext } {
    return { context: this.context };
  }
}
