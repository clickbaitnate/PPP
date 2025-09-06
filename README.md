# PYTHAGORUS' POLYRYTHM PHACTORY

An avant-garde, browser-based DAW for experimentation with polyrhythmic patterns using nested polygons.

## Concept

This is a polyrhythm sequencer that uses nested polygons (like tree rings) to create complex rhythmic patterns. Each polygon represents a different rhythmic layer that plays simultaneously, creating polyrhythmic compositions.

### Key Features
- **Nested Polygons**: 3-gon, 4-gon, 5-gon, etc. stacked concentrically
- **Single Polar Playhead**: One rotating hand that triggers all polygons
- **Direct Note Editing**: Click vertices in the canvas to edit notes
- **Scale-based Colors**: Notes are color-coded red through purple
- **RPM Control**: Turntable-like speed control
- **Real-time Audio**: Immediate note preview when editing

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation
```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Usage
1. **Add Polygons**: Use the "Add Polygon" button to create new rhythmic layers
2. **Edit Notes**: Click on any vertex in the canvas to cycle through scale notes
3. **Delete Notes**: Right-click vertices to remove notes
4. **Change Scale**: Use the scale selector in the edit popup
5. **Control Playback**: Use Play/Pause and RPM controls
6. **Adjust Spacing**: Use the spacing slider to control polygon separation

## Architecture

### Simplified Design
- **Single Animation Loop**: Simple useEffect with requestAnimationFrame
- **Direct State Updates**: Immediate playhead position changes
- **Canvas-based Editing**: Click vertices directly to edit notes
- **Immediate Audio**: Notes play instantly when edited

### File Structure
```
src/
├── App.tsx          # Main component with all logic
├── App.css          # Styling with retro/geocities aesthetic
├── audio/
│   └── AudioEngine.ts # Basic Web Audio API implementation
└── types/
    └── DAW.ts       # TypeScript type definitions
```

## Development

### Current Status
- ✅ Basic polygon rendering and playhead
- ✅ Note editing with scale system
- ✅ Canvas-based interaction
- ✅ Basic audio engine
- 🚧 Playhead jumping and audio sync (in progress)

### Next Steps
- Advanced synth engine (additive, subtractive, wavetable)
- Effects system (reverb, echo, bitcrusher)
- Improved audio synchronization
- More scale options and note mappings

## Philosophy

This project embraces the mathematical beauty of polyrhythms through geometric relationships. Each polygon's side count creates natural rhythmic patterns that, when combined, produce complex and beautiful musical structures.

The interface is designed to be intuitive and immediate - click to edit, hear instantly, create polyrhythmic magic.
