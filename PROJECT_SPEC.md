# PYTHAGORUS' POLYRYTHM PHACTORY

## Project Vision
A polyrhythm sequencer that uses nested polygons (like tree rings) to create complex rhythmic patterns. Each polygon represents a different rhythmic layer that plays simultaneously, creating polyrhythmic compositions.

## Core Concept
- **Polygons as Rhythmic Layers**: 3-gon, 4-gon, 5-gon, etc. stacked concentrically
- **Single Polar Playhead**: One rotating hand that triggers all polygons
- **Polyrhythmic Timing**: All polygons start together and play until measure end
- **Pythagorean Philosophy**: Mathematical relationships between polygon sides create natural polyrhythms

## Technical Architecture

### Layout
- **Main Canvas**: Central area with nested polygons
- **Control Panel**: BPM, time signature, play/pause
- **Layer Panel**: Add/remove polygon layers
- **Mixer Panel**: Volume, effects per layer

### Polygon System
- Each polygon has N sides (3, 4, 5, 6, 7, 8, etc.)
- Polygons are concentric (like tree rings)
- Each vertex is a note trigger point
- All polygons share the same center point
- Single playhead rotates around center, triggering all polygons

### Audio System
- **Web Audio API**: Modern browser audio synthesis
- **Polygon-based triggering**: Each vertex triggers specific notes
- **Polyrhythmic timing**: Different polygons complete at different times
- **Layer-based instruments**: Each polygon can have unique synth settings
- **Real-time audio**: Low-latency note triggering and synthesis

### Audio Engine Architecture
- **AudioContext**: Central Web Audio API context
- **Oscillator Management**: Create/destroy oscillators per note
- **Envelope System**: ADSR envelopes for note shaping
- **Filter System**: Low-pass, high-pass, band-pass filters
- **Effects Chain**: Reverb, delay, distortion, bitcrusher
- **Polyrhythm Timing**: Mathematical timing based on polygon sides

### Synth Engine (Scalable)
- **Additive Synthesis**: Multiple sine waves for complex timbres
- **Subtractive Synthesis**: Oscillator + filter + envelope
- **Wavetable Synthesis**: Pre-recorded waveforms for unique sounds
- **FM Synthesis**: Frequency modulation for metallic/bell tones
- **Granular Synthesis**: Micro-samples for texture and ambience
- **Effects Processing**: Real-time audio effects chain

## Current Status
- [x] Project documentation
- [x] Basic React app structure
- [x] Canvas layout with nested polygons
- [x] Single polar playhead
- [x] Layer management with spacing controls
- [x] Edit popup system with note editor
- [x] Basic audio engine with note triggering
- [x] Note editing with scale system and color coding
- [x] Canvas-based note editing (click vertices directly)
- [x] Playhead preview jumping
- [ ] Advanced synth engine (additive, subtractive, wavetable)
- [ ] Effects system (reverb, echo, bitcrusher)

## Audio Engine Implementation Plan

### Phase 1: Basic Audio Engine
- [x] Web Audio API setup and context management
- [x] Note frequency mapping (MIDI note numbers)
- [x] Basic oscillator creation and management
- [x] Playhead triggering system
- [x] Polygon vertex note detection

### Phase 2: Synth Engine Foundation
- [x] Oscillator types (sine, square, sawtooth, triangle)
- [x] ADSR envelope system
- [x] Basic filter implementation
- [x] Volume and panning controls
- [x] Per-polygon synth settings

### Phase 3: Advanced Synthesis
- [ ] Additive synthesis engine
- [ ] Subtractive synthesis with filters
- [ ] Wavetable synthesis
- [ ] FM synthesis
- [ ] Granular synthesis

### Phase 4: Effects System
- [ ] Reverb (convolution and algorithmic)
- [ ] Delay/Echo with feedback
- [ ] Distortion and overdrive
- [ ] Bitcrusher and sample rate reduction
- [ ] Chorus and phaser
- [ ] EQ and filtering

## Edit Popup System (Current Focus)
### Synth Panel (Left Half)
- **Scalable Synth Engine**: Support for additive, subtractive, and wavetable synthesis
- **Effects Chain**: Reverb, echo, bitcrusher, and more
- **Parameter Controls**: Oscillator settings, filters, envelopes
- **Visual Feedback**: Real-time parameter visualization

### Note Editor Panel (Right Half)
- **Polygon Replica**: Exact copy of selected polygon with same color
- **Scale System**: Selectable scales (major, minor, pentatonic, etc.)
- **Note Mapping**: Red through purple color coding for scale notes
- **Interactive Editing**: Left-click to cycle notes, right-click to delete
- **Visual Feedback**: Active notes highlighted, scale notes color-coded

## Simplified Architecture (Current)

### Playhead System
- **Simple Animation Loop**: Single useEffect with requestAnimationFrame
- **RPM-based Timing**: Revolutions per minute for turntable-like feel
- **Direct State Updates**: setPlayhead() for immediate position changes
- **No Complex Timing**: No pause/resume flags or start time adjustments

### Note Editing System
- **Direct Canvas Editing**: Click vertices in main canvas to edit notes
- **Immediate Audio Preview**: Notes play instantly when edited
- **Playhead Jumping**: Playhead jumps to 5° before edited vertex
- **Color-coded Vertices**: Scale notes show in red-to-purple spectrum
- **Scale-based Cycling**: Left-click cycles through selected scale notes

### Audio System
- **Basic Oscillator Synthesis**: Sine wave with ADSR envelopes
- **Direct Note Playing**: audioEngine.playNote() for immediate playback
- **Polygon-based Triggering**: Each vertex can trigger different notes
- **Real-time Context**: Audio context resumes automatically

## Next Steps
1. ✅ Create basic React app structure
2. ✅ Implement polygon rendering system
3. ✅ Add single polar playhead
4. ✅ Add layer management with spacing controls
5. ✅ Build edit popup with synth and note editor
6. ✅ Build basic audio engine
7. ✅ Implement scale system and note mapping
8. ✅ Add canvas-based note editing
9. 🚧 Fix playhead jumping and audio synchronization
10. Add advanced synth engine and effects

## Notes
- Keep it simple and focused
- One playhead, multiple polygons
- Polyrhythmic = different polygons complete at different times
- Mathematical beauty through geometric relationships
