// Synth Engine for Pythagorus' Polyrhythm Phactory
// Handles different synthesis methods and effects

export type SynthType = 'additive' | 'subtractive' | 'wavetable' | 'fm' | 'granular';

export interface AdditiveSettings {
  harmonics: number[];
  amplitudes: number[];
  phases: number[];
}

export interface SubtractiveSettings {
  oscillatorType: OscillatorType;
  filterType: BiquadFilterType;
  filterFreq: number;
  filterQ: number;
  filterEnvelope: {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
  };
}

export interface WavetableSettings {
  waveform: Float32Array;
  position: number;
  loopStart: number;
  loopEnd: number;
}

export interface FMSettings {
  carrierFreq: number;
  modulatorFreq: number;
  modulationIndex: number;
  modulatorType: OscillatorType;
}

export interface GranularSettings {
  grainSize: number;
  grainSpacing: number;
  grainPitch: number;
  grainEnvelope: 'gaussian' | 'hann' | 'rect';
}

export interface SynthPreset {
  id: string;
  name: string;
  type: SynthType;
  settings: AdditiveSettings | SubtractiveSettings | WavetableSettings | FMSettings | GranularSettings;
}

export class SynthEngine {
  private context: AudioContext;
  private presets: Map<string, SynthPreset> = new Map();

  constructor(context: AudioContext) {
    this.context = context;
    this.initializePresets();
  }

  private initializePresets(): void {
    // Additive synthesis presets
    this.addPreset({
      id: 'additive_bell',
      name: 'Bell',
      type: 'additive',
      settings: {
        harmonics: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        amplitudes: [1, 0.5, 0.25, 0.125, 0.0625, 0.03125, 0.015625, 0.0078125, 0.00390625, 0.001953125],
        phases: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      }
    });

    this.addPreset({
      id: 'additive_string',
      name: 'String',
      type: 'additive',
      settings: {
        harmonics: [1, 2, 3, 4, 5, 6, 7, 8],
        amplitudes: [1, 0.8, 0.6, 0.4, 0.3, 0.2, 0.1, 0.05],
        phases: [0, 0, 0, 0, 0, 0, 0, 0]
      }
    });

    // Subtractive synthesis presets
    this.addPreset({
      id: 'subtractive_bass',
      name: 'Bass',
      type: 'subtractive',
      settings: {
        oscillatorType: 'sawtooth',
        filterType: 'lowpass',
        filterFreq: 800,
        filterQ: 2,
        filterEnvelope: {
          attack: 0.1,
          decay: 0.3,
          sustain: 0.5,
          release: 0.2
        }
      }
    });

    this.addPreset({
      id: 'subtractive_lead',
      name: 'Lead',
      type: 'subtractive',
      settings: {
        oscillatorType: 'square',
        filterType: 'lowpass',
        filterFreq: 2000,
        filterQ: 1,
        filterEnvelope: {
          attack: 0.05,
          decay: 0.2,
          sustain: 0.8,
          release: 0.1
        }
      }
    });

    // FM synthesis presets
    this.addPreset({
      id: 'fm_bell',
      name: 'FM Bell',
      type: 'fm',
      settings: {
        carrierFreq: 1,
        modulatorFreq: 1,
        modulationIndex: 5,
        modulatorType: 'sine'
      }
    });

    this.addPreset({
      id: 'fm_bass',
      name: 'FM Bass',
      type: 'fm',
      settings: {
        carrierFreq: 1,
        modulatorFreq: 0.5,
        modulationIndex: 3,
        modulatorType: 'sine'
      }
    });
  }

  addPreset(preset: SynthPreset): void {
    this.presets.set(preset.id, preset);
  }

  getPreset(id: string): SynthPreset | undefined {
    return this.presets.get(id);
  }

  getAllPresets(): SynthPreset[] {
    return Array.from(this.presets.values());
  }

  // Create additive synthesis node
  createAdditiveSynth(settings: AdditiveSettings): AudioNode {
    const merger = this.context.createChannelMerger(1);
    
    settings.harmonics.forEach((harmonic, index) => {
      const oscillator = this.context.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.value = 0; // Will be set when playing
      
      const gain = this.context.createGain();
      gain.gain.value = settings.amplitudes[index] || 0;
      
      oscillator.connect(gain);
      gain.connect(merger);
    });

    return merger;
  }

  // Create subtractive synthesis node
  createSubtractiveSynth(settings: SubtractiveSettings): AudioNode {
    const oscillator = this.context.createOscillator();
    oscillator.type = settings.oscillatorType;

    const filter = this.context.createBiquadFilter();
    filter.type = settings.filterType;
    filter.frequency.value = settings.filterFreq;
    filter.Q.value = settings.filterQ;

    const gain = this.context.createGain();
    gain.gain.value = 0;

    oscillator.connect(filter);
    filter.connect(gain);

    return gain;
  }

  // Create wavetable synthesis node
  createWavetableSynth(settings: WavetableSettings): AudioNode {
    const buffer = this.context.createBuffer(1, settings.waveform.length, this.context.sampleRate);
    buffer.copyToChannel(settings.waveform, 0);

    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.loopStart = settings.loopStart;
    source.loopEnd = settings.loopEnd;

    const gain = this.context.createGain();
    gain.gain.value = 0;

    source.connect(gain);
    return gain;
  }

  // Create FM synthesis node
  createFMSynth(settings: FMSettings): AudioNode {
    const carrier = this.context.createOscillator();
    carrier.type = 'sine';

    const modulator = this.context.createOscillator();
    modulator.type = settings.modulatorType;

    const modGain = this.context.createGain();
    modGain.gain.value = settings.modulationIndex;

    const carrierGain = this.context.createGain();
    carrierGain.gain.value = 0;

    // FM synthesis: modulator modulates carrier frequency
    modulator.connect(modGain);
    modGain.connect(carrier.frequency);
    carrier.connect(carrierGain);

    return carrierGain;
  }

  // Create granular synthesis node
  createGranularSynth(settings: GranularSettings): AudioNode {
    // This is a simplified granular synthesis implementation
    // In a full implementation, you'd have a more complex grain scheduler
    const oscillator = this.context.createOscillator();
    oscillator.type = 'sine';

    const gain = this.context.createGain();
    gain.gain.value = 0;

    // Apply grain envelope
    const envelope = this.createGrainEnvelope(settings.grainEnvelope, settings.grainSize);
    envelope.connect(gain.gain);

    oscillator.connect(gain);
    return gain;
  }

  private createGrainEnvelope(type: string, duration: number): AudioNode {
    const gain = this.context.createGain();
    const now = this.context.currentTime;

    switch (type) {
      case 'gaussian':
        // Gaussian envelope approximation
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(1, now + duration * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.1, now + duration * 0.9);
        gain.gain.linearRampToValueAtTime(0, now + duration);
        break;
      case 'hann':
        // Hann window
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(1, now + duration * 0.5);
        gain.gain.linearRampToValueAtTime(0, now + duration);
        break;
      case 'rect':
        // Rectangular window
        gain.gain.setValueAtTime(1, now);
        gain.gain.setValueAtTime(0, now + duration);
        break;
    }

    return gain;
  }

  // Generate wavetable from function
  generateWavetable(length: number, generator: (t: number) => number): Float32Array {
    const wavetable = new Float32Array(length);
    for (let i = 0; i < length; i++) {
      const t = i / length;
      wavetable[i] = generator(t);
    }
    return wavetable;
  }

  // Common wavetable generators
  static generateSine(length: number): Float32Array {
    const synth = new SynthEngine(new AudioContext());
    return synth.generateWavetable(length, (t) => Math.sin(2 * Math.PI * t));
  }

  static generateSquare(length: number): Float32Array {
    const synth = new SynthEngine(new AudioContext());
    return synth.generateWavetable(length, (t) => t < 0.5 ? 1 : -1);
  }

  static generateSawtooth(length: number): Float32Array {
    const synth = new SynthEngine(new AudioContext());
    return synth.generateWavetable(length, (t) => 2 * t - 1);
  }

  static generateTriangle(length: number): Float32Array {
    const synth = new SynthEngine(new AudioContext());
    return synth.generateWavetable(length, (t) => t < 0.5 ? 4 * t - 1 : 3 - 4 * t);
  }
}
