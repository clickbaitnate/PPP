import React, { useState, useRef, useEffect, useCallback } from 'react';
import './App.css';
import { audioEngine } from './audio/AudioEngine';
import { createScaleSystem } from './components/ScaleSystem';
import SynthPanel from './components/SynthPanel';
import { SettingsPopup } from './components/SettingsPopup';
import ControlPanel from './components/ControlPanel';
import { Polygon, PlayheadState, PolygonSettings } from './types';

function App() {
  // State management
  const [polygons, setPolygons] = useState<Polygon[]>([
    {
      id: 1,
      sides: 3,
      radius: 80,
      color: '#00ff00',
      active: true,
      notes: ['C', 'E', 'G'],
      synthSettings: {
        waveShape: 'sine',
        enabled: true,
        attack: 0.01,
        decay: 0.1,
        sustain: 0.8,
        release: 0.3,
        filterType: 'lowpass',
        filterFreq: 1000,
        filterQ: 1,
        filterEnabled: false,
        effects: {
          reverb: { enabled: false, mix: 0.3, decay: 2 },
          delay: { enabled: false, mix: 0.3, time: 0.3, feedback: 0.4 },
          distortion: { enabled: false, mix: 0.3, amount: 20 }
        },
        lfo: {
          enabled: false,
          waveShape: 'sine',
          rate: 1,
          depth: 0.5,
          target: 'filter'
        }
      }
    }
  ]);
  
  const [playhead, setPlayhead] = useState<PlayheadState>({
    angle: 0,
    isPlaying: false,
    rpm: 15
  });
  
  const [polygonSettings, setPolygonSettings] = useState<PolygonSettings>({
    spacing: 40
  });
  
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showSettingsPopup, setShowSettingsPopup] = useState(false);
  const [selectedPolygon, setSelectedPolygon] = useState<Polygon | null>(null);
  const [selectedScale, setSelectedScale] = useState('Major');
  const [rootNote, setRootNote] = useState('C');
  const [masterVolume, setMasterVolume] = useState(50);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const isManualJumpRef = useRef<boolean>(false);
  const lastTriggerTimeRef = useRef<{ [key: string]: number }>({});
  const rpmRef = useRef<number>(playhead.rpm);

  // Initialize scale system
  const scaleSystem = createScaleSystem();

  // Get scale notes
  const getScaleNotes = (scaleName: string, root: string = rootNote) => {
    return scaleSystem.getScaleNotes(scaleName, root);
  };

  // Get note color
  const getNoteColor = (note: string | null, polygonColor: string = '#00ff00') => {
    return scaleSystem.getNoteColor(note, polygonColor, selectedScale, rootNote);
  };

  // Check for note triggers
  const checkNoteTriggers = useCallback((angle: number, lastAngle: number) => {
    polygons.forEach(polygon => {
      if (!polygon.active) return;

      const anglePerVertex = 360 / polygon.sides;

      for (let i = 0; i < polygon.sides; i++) {
        const vertexAngle = (i * anglePerVertex) % 360;

        // Check if the playhead has crossed this vertex angle
        let crossedVertex = false;

        if (lastAngle < angle) {
          // Normal progression (no wraparound)
          crossedVertex = (lastAngle < vertexAngle && angle >= vertexAngle);
        } else {
          // Wraparound case (angle went from high to low)
          crossedVertex = (lastAngle < vertexAngle || angle >= vertexAngle);
        }

        if (crossedVertex) {
          const note = polygon.notes[i];
          if (note) {
            const noteId = `${polygon.id}_${i}_${note}`;
            const now = performance.now();
            const lastTrigger = lastTriggerTimeRef.current[noteId];
            // Use a more generous minimum interval based on current RPM
            const currentRPM = rpmRef.current;
            const minInterval = Math.max(100, (60 / currentRPM) * 1000 / 4);

            if (!lastTrigger || now - lastTrigger > minInterval) {
              lastTriggerTimeRef.current[noteId] = now;
              console.log(`🎵 Playing note: ${note} at vertex ${i} (angle: ${vertexAngle.toFixed(1)}°, playhead: ${angle.toFixed(1)}°)`);
              audioEngine.playNoteWithPolygonSynth(note, 1.0, polygon.synthSettings, 0.5);
            }
          }
        }
      }
    });
  }, [polygons]);

  // Animation loop
  useEffect(() => {
      if (!playhead.isPlaying) {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = undefined;
    }
        return;
      }

    if (animationRef.current) {
      return; // Animation already running
    }

    const startTime = performance.now();
    let lastAngle = playhead.angle;

    const animate = (currentTime: number) => {
      const elapsed = (currentTime - startTime) / 1000;
      const secondsPerRevolution = 60 / rpmRef.current;
      const revolutions = elapsed / secondsPerRevolution;
      const progress = revolutions - Math.floor(revolutions);
      const newAngle = progress * 360;

        checkNoteTriggers(newAngle, lastAngle);

        setPlayhead(prev => ({
          ...prev,
          angle: newAngle
        }));

        lastAngle = newAngle;
        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = undefined;
      }
    };
  }, [playhead.isPlaying, checkNoteTriggers, playhead.angle]);

  // Update RPM ref
  useEffect(() => {
    rpmRef.current = playhead.rpm;
  }, [playhead.rpm]);

  // Control functions
  const togglePlay = () => {
    console.log('Toggle play clicked - synchronous version');
    audioEngine.resumeContext().catch(err => console.error('Audio context error:', err));
    setPlayhead(prev => {
      const newState = {
        ...prev,
        isPlaying: !prev.isPlaying
      };
      console.log('New playhead state:', newState);
      return newState;
    });
  };

  const resetPlayhead = () => {
    setPlayhead(prev => ({ ...prev, angle: 0, isPlaying: false }));
  };

  const updateRPM = (rpm: number) => {
    console.log('RPM updated to:', rpm);
    setPlayhead(prev => ({ ...prev, rpm: rpm }));
  };

  const updateMasterVolume = (volume: number) => {
    setMasterVolume(volume);
    audioEngine.setMasterVolume(volume / 100);
  };

  const addPolygon = () => {
    const newSides = polygons.length + 3;
    const colors = ['#00ff00', '#ff00ff', '#ffff00', '#00ffff', '#ff6600'];
    const newPolygon: Polygon = {
      id: Date.now(),
      sides: newSides,
      radius: 60 + (polygons.length * polygonSettings.spacing),
      color: colors[polygons.length % colors.length],
      active: true,
      notes: Array(newSides).fill(null),
      synthSettings: {
        waveShape: 'sine',
        enabled: true,
        attack: 0.01,
        decay: 0.1,
        sustain: 0.8,
        release: 0.3,
        filterType: 'lowpass',
        filterFreq: 1000,
        filterQ: 1,
        filterEnabled: false,
        effects: {
          reverb: { enabled: false, mix: 0.3, decay: 2 },
          delay: { enabled: false, mix: 0.3, time: 0.3, feedback: 0.4 },
          distortion: { enabled: false, mix: 0.3, amount: 20 }
        },
        lfo: {
          enabled: false,
          waveShape: 'sine',
          rate: 1,
          depth: 0.5,
          target: 'filter'
        }
      }
    };
    setPolygons(prev => [...prev, newPolygon]);
  };

  const cycleNote = (polygonId: number, vertexIndex: number) => {
    const polygon = polygons.find(p => p.id === polygonId);
    if (!polygon) return;
    
    const scale = getScaleNotes(selectedScale);
    console.log('🎼 Available scale notes:', scale);
    const currentNote = polygon.notes[vertexIndex];
    console.log(`🔄 Cycling note at vertex ${vertexIndex}: ${currentNote} → ?`);
    const currentIndex = currentNote ? scale.indexOf(currentNote) : -1;
    const nextIndex = (currentIndex + 1) % scale.length;
    const nextNote = scale[nextIndex];
    console.log(`✅ Set note at vertex ${vertexIndex} to: ${nextNote}`);
    
    setPolygons(prev => prev.map(p => {
      if (p.id === polygonId) {
        const newNotes = [...p.notes];
        newNotes[vertexIndex] = nextNote;
        return { ...p, notes: newNotes };
      }
      return p;
    }));
    
    if (selectedPolygon && selectedPolygon.id === polygonId) {
      setSelectedPolygon(prev => {
        if (!prev) return null;
        const newNotes = [...prev.notes];
        newNotes[vertexIndex] = nextNote;
        return { ...prev, notes: newNotes };
      });
    }
    
    // Jump playhead to vertex
    const vertexAngle = (vertexIndex * 360 / polygon.sides) % 360;
    const targetAngle = (vertexAngle - 5 + 360) % 360;

    isManualJumpRef.current = true;
    setPlayhead(prev => ({ ...prev, angle: targetAngle }));
    
    if (nextNote) {
      audioEngine.resumeContext();
      audioEngine.playNoteWithPolygonSynth(nextNote, 1.0, polygon.synthSettings, 0.5);
    }
    
    setTimeout(() => {
      isManualJumpRef.current = false;
    }, 500);
  };

  const deleteNote = (polygonId: number, vertexIndex: number) => {
    const polygon = polygons.find(p => p.id === polygonId);
    if (!polygon) return;

    setPolygons(prev => prev.map(p => {
      if (p.id === polygonId) {
        const newNotes = [...p.notes];
        newNotes[vertexIndex] = null;
        return { ...p, notes: newNotes };
      }
      return p;
    }));

    if (selectedPolygon && selectedPolygon.id === polygonId) {
      setSelectedPolygon(prev => {
        if (!prev) return null;
        const newNotes = [...prev.notes];
        newNotes[vertexIndex] = null;
        return { ...prev, notes: newNotes };
      });
    }
  };

  const openEditPopup = (polygon: Polygon) => {
    setSelectedPolygon(polygon);
    setShowEditPopup(true);
  };

  const closeEditPopup = () => {
    setShowEditPopup(false);
    setSelectedPolygon(null);
  };

  // Simple handlers for ControlPanel component
  const handlePlayToggle = () => {
    togglePlay();
  };

  const handleReset = () => {
    resetPlayhead();
  };

  const handleRPMChange = (rpm: number) => {
    updateRPM(rpm);
  };

  const handleScaleChange = (scale: string) => {
    console.log(`🎼 Changing scale from ${selectedScale} to ${scale}`);

    // Update existing polygon notes to match the new scale
    const { updatedPolygons, updatedSelectedPolygon } = scaleSystem.updatePolygonNotesForNewScale(
      polygons,
      selectedPolygon,
      scale,
      rootNote
    );

    console.log(`🔄 Updated ${updatedPolygons.length} polygons to match new scale`);
    setPolygons(updatedPolygons);
    setSelectedPolygon(updatedSelectedPolygon);
    setSelectedScale(scale);
  };

  const handleRootNoteChange = (note: string) => {
    console.log(`🎵 Changing root note from ${rootNote} to ${note}`);

    // Update existing polygon notes to match the new root note
    const { updatedPolygons, updatedSelectedPolygon } = scaleSystem.updatePolygonNotesForNewScale(
      polygons,
      selectedPolygon,
      selectedScale,
      note
    );

    console.log(`🔄 Updated ${updatedPolygons.length} polygons to match new root note`);
    setPolygons(updatedPolygons);
    setSelectedPolygon(updatedSelectedPolygon);
    setRootNote(note);
  };

  const handleSpacingChange = (spacing: number) => {
    setPolygonSettings(prev => ({
      ...prev,
      spacing: spacing
    }));
  };

  const handleSettingsClick = () => {
    setShowSettingsPopup(true);
  };

  const handleAddPolygon = () => {
    addPolygon();
  };

  const handleEditPolygon = (polygon: Polygon) => {
    openEditPopup(polygon);
  };

  const updatePolygonSynthSettings = (polygonId: number, synthSettings: any) => {
    setPolygons(prev => prev.map(p =>
      p.id === polygonId
        ? { ...p, synthSettings }
        : p
    ));

    // Also update selected polygon if it's the one being edited
    if (selectedPolygon && selectedPolygon.id === polygonId) {
      setSelectedPolygon(prev => prev ? { ...prev, synthSettings } : null);
    }
  };

  // Update polygon radii when spacing changes
  const updateAllPolygonRadii = useCallback(() => {
    setPolygons(prev => prev.map((polygon, index) => ({
      ...polygon,
      radius: 60 + (index * polygonSettings.spacing)
    })));
  }, [polygonSettings.spacing]);

  useEffect(() => {
    updateAllPolygonRadii();
  }, [polygonSettings.spacing, updateAllPolygonRadii]);

  // Render components
  const renderPolygon = (polygon: Polygon) => {
    const centerX = 250;
    const centerY = 250;
    const vertices = [];
    const lines = [];
    
    // Calculate vertex positions
    const vertexPositions = [];
    for (let i = 0; i < polygon.sides; i++) {
      const angle = (i * 360 / polygon.sides - 90) * Math.PI / 180;
      const x = centerX + polygon.radius * Math.cos(angle);
      const y = centerY + polygon.radius * Math.sin(angle);
      vertexPositions.push({ x, y });
    }
    
    // Draw lines
    for (let i = 0; i < polygon.sides; i++) {
      const current = vertexPositions[i];
      const next = vertexPositions[(i + 1) % polygon.sides];
      
      lines.push(
        <line
          key={`line-${i}`}
          x1={current.x}
          y1={current.y}
          x2={next.x}
          y2={next.y}
          stroke={polygon.color}
          strokeWidth="2"
          className="polygon-line"
        />
      );
    }
    
    // Draw vertices
    for (let i = 0; i < polygon.sides; i++) {
      const { x, y } = vertexPositions[i];
      const note = polygon.notes[i];
      const noteColor = getNoteColor(note, polygon.color);
      
      vertices.push(
        <circle
          key={i}
          cx={x}
          cy={y}
          r="10"
          fill={noteColor}
          stroke={polygon.color}
          strokeWidth="2"
          className="polygon-vertex canvas-vertex"
          onClick={() => {
            console.log('Polygon vertex clicked:', polygon.id, i);

            // Get the current note before cycling
            const currentNote = polygon.notes[i];
            console.log('Current note before cycling:', currentNote);

            // Preview the current note immediately
            if (currentNote) {
              console.log('🎵 Previewing current note:', currentNote);
              audioEngine.playNote(currentNote, 0.5, { volume: 0.3 });
            }

            // Then cycle to the next note
            cycleNote(polygon.id, i);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            deleteNote(polygon.id, i);
          }}
        />
      );
    }
    
    return [...lines, ...vertices];
  };

  const renderPlayhead = () => {
    const centerX = 250;
    const centerY = 250;
    const playheadLength = 180;
    const x = centerX + playheadLength * Math.cos((playhead.angle - 90) * Math.PI / 180);
    const y = centerY + playheadLength * Math.sin((playhead.angle - 90) * Math.PI / 180);
    
    return (
      <g className="playhead" style={{ opacity: 0.6 }}>
        <line
          x1={centerX}
          y1={centerY}
          x2={x}
          y2={y}
          stroke={playhead.isPlaying ? "#ff0000" : "#666666"}
                strokeWidth="3"
          strokeLinecap="round"
        />
        <circle
          cx={x}
          cy={y}
          r="6"
          fill={playhead.isPlaying ? "#ff0000" : "#666666"}
          stroke="#ffffff"
          strokeWidth="2"
        />
        <circle
          cx={centerX}
          cy={centerY}
          r="3"
          fill="#ffffff"
          stroke="#000000"
          strokeWidth="1"
        />
      </g>
    );
  };

                    return (
    <div className="app">
      <header className="app-header">
        <h1>🎵 PYTHAGORUS' POLYRYTHM PHACTORY 🎵</h1>
        <p>★ an avant-garde, browser based daw for experimentation ★</p>
        <div className="blink-text">✨ UNDER CONSTRUCTION ✨</div>
      </header>
      
      <main className="app-main">
        <div className="canvas-container">
          <div className="polygon-canvas" ref={canvasRef}>
            <svg width="500" height="500" className="polygon-svg">
              {renderPlayhead()}
              {polygons.map(polygon => (
                <g key={polygon.id} className="polygon-group">
                  {renderPolygon(polygon)}
                </g>
              ))}
          </svg>
          </div>
                    </div>
                    
        <ControlPanel
          playhead={playhead}
          selectedScale={selectedScale}
          rootNote={rootNote}
          polygonSettings={polygonSettings}
          polygons={polygons}
          onPlayToggle={handlePlayToggle}
          onReset={handleReset}
          onRPMChange={handleRPMChange}
          onScaleChange={handleScaleChange}
          onRootNoteChange={handleRootNoteChange}
          onSpacingChange={handleSpacingChange}
          onSettingsClick={handleSettingsClick}
          onAddPolygon={handleAddPolygon}
          onEditPolygon={handleEditPolygon}
        />
      </main>

      {/* Edit Popup */}
      {showEditPopup && selectedPolygon && (
        <div className="edit-popup-overlay" onClick={closeEditPopup}>
          <div className="edit-popup" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h3>Edit {selectedPolygon.sides}-gon</h3>
              <button className="close-popup" onClick={closeEditPopup}>×</button>
                    </div>

            <div className="popup-content">
              {/* Synth Panel (Full Width) */}
              <SynthPanel
                polygon={selectedPolygon!}
                onUpdatePolygon={updatePolygonSynthSettings}
                onClose={() => setSelectedPolygon(null)}
              />
            </div>
                    </div>
            </div>
          )}

      {/* Settings Popup */}
      <SettingsPopup
        isOpen={showSettingsPopup}
        onClose={() => setShowSettingsPopup(false)}
        polygons={polygons}
        scaleSystem={scaleSystem}
        selectedScale={selectedScale}
        rootNote={rootNote}
      />
    </div>
  );
}

export default App;
