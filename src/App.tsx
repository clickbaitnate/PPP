import React, { useState, useRef, useEffect, useCallback } from 'react';
import './App.css';
import { audioEngine } from './audio/AudioEngine';
import { createScaleSystem } from './components/ScaleSystem';
import SynthPanel from './components/SynthPanel';
import { SettingsPopup } from './components/SettingsPopup';

// Types for polygon system
interface Polygon {
  id: number;
  sides: number;
  radius: number;
  color: string;
  active: boolean;
  notes: (string | null)[];
  synthSettings: {
    waveShape: 'sine' | 'square' | 'triangle' | 'sawtooth';
    enabled: boolean;
    attack?: number;
    decay?: number;
    sustain?: number;
    release?: number;
    filterType?: 'lowpass' | 'highpass' | 'bandpass' | 'notch';
    filterFreq?: number;
    filterQ?: number;
    filterEnabled?: boolean;
    effects?: {
      reverb?: { enabled: boolean; mix: number; decay: number };
      delay?: { enabled: boolean; mix: number; time: number; feedback: number };
      distortion?: { enabled: boolean; mix: number; amount: number };
    };
    lfo?: {
      enabled: boolean;
      waveShape: 'sine' | 'square' | 'triangle' | 'sawtooth' | 'noise';
      rate: number;
      depth: number;
      target: 'filter' | 'pitch' | 'volume';
    };
  };
}

interface PlayheadState {
  angle: number;
  isPlaying: boolean;
  rpm: number; // revolutions per minute
}

interface PolygonSettings {
  spacing: number; // spacing between polygon layers
}

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
    rpm: 15 // 15 RPM - like a slow record
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

  // Check for note triggers based on playhead angle
  const checkNoteTriggers = useCallback((angle: number) => {
    console.log(`checkNoteTriggers called with angle: ${angle.toFixed(1)}°`);

    // Process polygons synchronously to not block animation
    polygons.forEach(polygon => {
      if (!polygon.active) return;

      // Calculate angle per vertex
      const anglePerVertex = 360 / polygon.sides;

      // Check each vertex
      for (let i = 0; i < polygon.sides; i++) {
        const vertexAngle = (i * anglePerVertex) % 360;
        const angleDiff = Math.abs(angle - vertexAngle);

        // Trigger if playhead is close to vertex (within 5 degrees)
        if (angleDiff < 5 || angleDiff > 355) {
          const note = polygon.notes[i];
          if (note) {
            const noteId = `${polygon.id}_${i}_${note}`;
            // Check if this note was recently triggered to prevent stuttering
            const now = performance.now();
            const lastTrigger = lastTriggerTimeRef.current[noteId];
            if (!lastTrigger || now - lastTrigger > 100) { // Minimum 100ms between same note triggers
              console.log(`🎵 TRIGGERING note: ${note} at angle ${angle.toFixed(1)}°, vertex angle: ${vertexAngle.toFixed(1)}°, diff: ${angleDiff.toFixed(1)}°`);
              lastTriggerTimeRef.current[noteId] = now;
              // Play note
              audioEngine.playNoteWithPolygonSynth(note, 1.0, polygon.synthSettings, 0.5);
            }
          }
        }
      }
    });
  }, [polygons, audioEngine]);

  // Initialize scale system
  const scaleSystem = createScaleSystem();

  // Simple animation loop for playhead
  useEffect(() => {
    if (playhead.isPlaying) {
      const startTime = performance.now();

      const animate = () => {
        if (!playhead.isPlaying) {
          return;
        }

        // Don't animate if we're in a manual jump
        if (isManualJumpRef.current) {
          animationRef.current = requestAnimationFrame(animate);
          return;
        }

        const elapsed = (performance.now() - startTime) / 1000; // elapsed time in seconds (more precise)
        const secondsPerRevolution = 60 / playhead.rpm; // convert RPM to seconds per revolution
        const progress = (elapsed % secondsPerRevolution) / secondsPerRevolution; // 0 to 1
        const newAngle = progress * 360; // 0 to 360 degrees

        // Check for note triggers
        checkNoteTriggers(newAngle);

        setPlayhead(prev => ({
          ...prev,
          angle: newAngle
        }));

        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [playhead.isPlaying, playhead.rpm, polygons, checkNoteTriggers]);


  // Control functions
  const togglePlay = async () => {
    console.log('Toggle play clicked, current state:', playhead.isPlaying);
    
    // Resume audio context if needed
    await audioEngine.resumeContext();
    
    setPlayhead(prev => {
      const newState = { ...prev, isPlaying: !prev.isPlaying };
      console.log('New play state:', newState.isPlaying);
      return newState;
    });
  };

  const resetPlayhead = () => {
    console.log('Reset button clicked');
    setPlayhead(prev => ({ ...prev, angle: 0, isPlaying: false }));
  };

  const updateRPM = (rpm: number) => {
    setPlayhead(prev => ({ ...prev, rpm: rpm }));
  };

  const updateMasterVolume = (volume: number) => {
    setMasterVolume(volume);
    audioEngine.setMasterVolume(volume / 100); // Convert 0-100 to 0-1
  };

  const addPolygon = () => {
    console.log('Add polygon clicked!');
    const newSides = polygons.length + 3; // 3, 4, 5, 6, etc.
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
    console.log('New polygon added:', newPolygon);
  };

  const updatePolygonSides = (polygonId: number, newSides: number) => {
    if (newSides < 3 || newSides > 12) return; // Limit to reasonable range
    
    setPolygons(prev => prev.map(p => {
      if (p.id === polygonId) {
        // Create new notes array with the new number of sides
        const newNotes = [...p.notes];
        if (newSides > p.sides) {
          // Add null notes for new vertices
          for (let i = p.sides; i < newSides; i++) {
            newNotes.push(null);
          }
        } else if (newSides < p.sides) {
          // Remove notes for removed vertices
          newNotes.splice(newSides);
        }
        
        return { ...p, sides: newSides, notes: newNotes };
      }
      return p;
    }));
    
    // Update selected polygon if it's the one being edited
    if (selectedPolygon && selectedPolygon.id === polygonId) {
      setSelectedPolygon(prev => {
        if (!prev) return null;
        const newNotes = [...prev.notes];
        if (newSides > prev.sides) {
          for (let i = prev.sides; i < newSides; i++) {
            newNotes.push(null);
          }
        } else if (newSides < prev.sides) {
          newNotes.splice(newSides);
        }
        return { ...prev, sides: newSides, notes: newNotes };
      });
    }
    
    console.log(`Updated polygon ${polygonId} to ${newSides}-gon`);
  };

  // Update all polygon radii when spacing changes
  const updateAllPolygonRadii = useCallback(() => {
    setPolygons(prev => prev.map((polygon, index) => ({
      ...polygon,
      radius: 60 + (index * polygonSettings.spacing)
    })));
  }, [polygonSettings.spacing]);

  // Effect to update polygon radii when spacing changes
  useEffect(() => {
    updateAllPolygonRadii();
  }, [polygonSettings.spacing, updateAllPolygonRadii]);

  // Effect to update polygon notes when scale or root note changes
  useEffect(() => {
    const { updatedPolygons, updatedSelectedPolygon } = scaleSystem.updatePolygonNotesForNewScale(
      polygons, 
      selectedPolygon, 
      selectedScale, 
      rootNote
    );
    
    setPolygons(updatedPolygons);
    if (updatedSelectedPolygon) {
      setSelectedPolygon(updatedSelectedPolygon);
    }
  }, [selectedScale, rootNote, polygons, selectedPolygon, scaleSystem]);




  const openEditPopup = (polygon: Polygon) => {
    setSelectedPolygon(polygon);
    setShowEditPopup(true);
  };

  const closeEditPopup = () => {
    setShowEditPopup(false);
    setSelectedPolygon(null);
  };

  
  const getScaleNotes = (scaleName: string, root: string = rootNote) => {
    return scaleSystem.getScaleNotes(scaleName, root);
  };


  const cycleNote = (polygonId: number, vertexIndex: number) => {
    const polygon = polygons.find(p => p.id === polygonId);
    if (!polygon) return;
    
    const scale = getScaleNotes(selectedScale);
    const currentNote = polygon.notes[vertexIndex];
    const currentIndex = currentNote ? scale.indexOf(currentNote) : -1;
    const nextIndex = (currentIndex + 1) % scale.length;
    const nextNote = scale[nextIndex];
    
    // Update the note
    setPolygons(prev => prev.map(p => {
      if (p.id === polygonId) {
        const newNotes = [...p.notes];
        newNotes[vertexIndex] = nextNote;
        return { ...p, notes: newNotes };
      }
      return p;
    }));
    
    // Update selected polygon if it's the one being edited
    if (selectedPolygon && selectedPolygon.id === polygonId) {
      setSelectedPolygon(prev => {
        if (!prev) return null;
        const newNotes = [...prev.notes];
        newNotes[vertexIndex] = nextNote;
        return { ...prev, notes: newNotes };
      });
    }
    
    // Calculate the angle for this vertex
    const vertexAngle = (vertexIndex * 360 / polygon.sides - 90) * Math.PI / 180;
    const vertexAngleDegrees = (vertexAngle * 180 / Math.PI + 360) % 360;
    
    // Jump playhead to just before this vertex (5 degrees before)
    const targetAngle = (vertexAngleDegrees - 5 + 360) % 360;
    
    // Set manual jump flag and jump playhead
    isManualJumpRef.current = true;
    setPlayhead(prev => ({
      ...prev,
      angle: targetAngle
    }));
    
    // Play the note immediately using polygon's synthesizer settings
    if (nextNote) {
      console.log(`🎵 Playing preview note: ${nextNote} at angle ${targetAngle.toFixed(1)}°`);
      audioEngine.resumeContext();
      audioEngine.playNoteWithPolygonSynth(nextNote, 1.0, polygon.synthSettings, 0.5);
    }
    
    // Resume animation after a short delay
    setTimeout(() => {
      isManualJumpRef.current = false;
      console.log(`Resumed animation from ${targetAngle.toFixed(1)}°`);
    }, 500);
    
    console.log(`Cycled note to ${nextNote} and jumped playhead to ${targetAngle.toFixed(1)}°`);
  };

  // Update polygon synthesizer settings
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

  const deleteNote = (polygonId: number, vertexIndex: number) => {
    const polygon = polygons.find(p => p.id === polygonId);
    if (!polygon) return;
    
    // Update the note to null
    setPolygons(prev => prev.map(p => {
      if (p.id === polygonId) {
        const newNotes = [...p.notes];
        newNotes[vertexIndex] = null;
        return { ...p, notes: newNotes };
      }
      return p;
    }));
    
    // Update selected polygon if it's the one being edited
    if (selectedPolygon && selectedPolygon.id === polygonId) {
      setSelectedPolygon(prev => {
        if (!prev) return null;
        const newNotes = [...prev.notes];
        newNotes[vertexIndex] = null;
        return { ...prev, notes: newNotes };
      });
    }
    
    // Calculate the angle for this vertex
    const vertexAngle = (vertexIndex * 360 / polygon.sides - 90) * Math.PI / 180;
    const vertexAngleDegrees = (vertexAngle * 180 / Math.PI + 360) % 360;
    
    // Jump playhead to just before this vertex (5 degrees before)
    const targetAngle = (vertexAngleDegrees - 5 + 360) % 360;
    
    // Set manual jump flag and jump playhead
    isManualJumpRef.current = true;
    setPlayhead(prev => ({
      ...prev,
      angle: targetAngle
    }));
    
    // Resume animation after a short delay
    setTimeout(() => {
      isManualJumpRef.current = false;
      console.log(`Resumed animation from ${targetAngle.toFixed(1)}°`);
    }, 500);
    
    console.log(`Deleted note and jumped playhead to ${targetAngle.toFixed(1)}°`);
  };

  // Get note color based on scale degree
  const getNoteColor = (note: string | null, polygonColor: string = '#00ff00') => {
    return scaleSystem.getNoteColor(note, polygonColor, selectedScale, rootNote);
  };

  // Render polygon vertices and lines
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
    
    // Draw lines connecting vertices
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
    
    // Draw vertices with clickable note editing
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
          onClick={(e) => {
            e.stopPropagation();
            console.log('Canvas vertex clicked:', i, 'Current note:', note);
            cycleNote(polygon.id, i);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Canvas vertex right-clicked:', i);
            deleteNote(polygon.id, i);
          }}
        />
      );
    }
    
    return [...lines, ...vertices];
  };

  // Render playhead
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
        {/* Center dot */}
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
              {/* Render playhead behind polygons */}
              {renderPlayhead()}
              
              {/* Render all polygons */}
              {polygons.map(polygon => (
                <g key={polygon.id} className="polygon-group">
                  {renderPolygon(polygon)}
                </g>
              ))}
          </svg>
          </div>
                    </div>
                    
        <div className="control-panel">
          <div className="transport-controls">
            <button
              className="play-button"
              onClick={(e) => {
                e.preventDefault();
                console.log('Play button clicked directly');
                togglePlay();
              }}
              style={{ zIndex: 1000, position: 'relative' }}
            >
              <span className="button-emoji">{playhead.isPlaying ? '⏸️' : '▶️'}</span>
              {playhead.isPlaying ? 'PAUSE' : 'PLAY'}
            </button>
            <button
              className="reset-button"
              onClick={(e) => {
                e.preventDefault();
                console.log('Reset button clicked directly');
                resetPlayhead();
              }}
              style={{ zIndex: 1000, position: 'relative' }}
            >
              <span className="button-emoji">🔄</span> RESET
            </button>
            <button
              onClick={() => console.log('Test button works!')}
              style={{ 
                background: '#ff0000', 
                color: '#ffffff', 
                padding: '5px', 
                border: '1px solid #ffffff',
                zIndex: 1000,
                position: 'relative'
              }}
            >
              TEST
            </button>
          </div>

          <div className="rpm-control">
            <label>RPM:</label>
            <input 
              type="number" 
              value={playhead.rpm}
              onChange={(e) => {
                const value = Number(e.target.value);
                console.log('RPM changed to:', value);
                updateRPM(value);
              }}
                        onClick={(e) => {
                          e.stopPropagation();
                console.log('RPM input clicked');
              }}
              onFocus={(e) => {
                console.log('RPM input focused');
                e.target.select();
              }}
              min="1" 
              max="120" 
              step="1"
              style={{
                background: '#000000',
                border: '2px solid #00ff00',
                color: '#00ff00',
                padding: '6px',
                fontSize: '12px',
                fontFamily: 'Courier New, monospace',
                fontWeight: 'bold',
                width: '60px',
                zIndex: 1000,
                position: 'relative',
                cursor: 'text'
              }}
            />
            <span>RPM</span>
                    </div>
          
          <div className="volume-control">
            <label>Volume:</label>
            <input 
              type="range" 
              min="0" 
              max="100" 
              step="5"
              value={masterVolume}
              onChange={(e) => updateMasterVolume(Number(e.target.value))}
              className="volume-slider"
            />
            <span className="volume-value">{masterVolume}%</span>
          </div>

          <div className="scale-control">
            <label>Scale:</label>
            <select
              value={selectedScale}
              onChange={(e) => setSelectedScale(e.target.value)}
              className="scale-selector"
            >
              <option value="Major">Major</option>
              <option value="Minor">Minor</option>
              <option value="Pentatonic">Pentatonic</option>
              <option value="Dorian">Dorian</option>
              <option value="Mixolydian">Mixolydian</option>
            </select>
          </div>

          <div className="root-note-control">
            <label>Root Note:</label>
            <div className="root-note-buttons">
              {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map((note, index) => (
                <button
                  key={note}
                  className={`root-note-button ${rootNote === note ? 'selected' : ''}`}
                  onClick={() => setRootNote(note)}
                  style={{
                    backgroundColor: getNoteColor(note, '#00ff00')
                  }}
                >
                  {note}
                </button>
              ))}
            </div>
          </div>

          {/* Settings Button */}
          <div className="settings-control">
            <button
              className="settings-button"
              onClick={() => setShowSettingsPopup(true)}
              title="Settings & Export"
            >
              <span className="button-emoji">⚙️</span> SETTINGS
            </button>
          </div>
      </div>
      
        <div className="layer-panel">
          <h3>Polygon Layers</h3>
          
          {/* Spacing Controls */}
          <div className="spacing-controls">
            <div className="control-group">
              <label>Spacing:</label>
              <input
                type="range"
                min="20"
                max="100"
                step="5"
                value={polygonSettings.spacing}
                            onChange={(e) => {
                  const newValue = Number(e.target.value);
                  console.log('Spacing changed:', e.target.value, 'parsed:', newValue);
                  setPolygonSettings(prev => {
                    console.log('Previous settings:', prev);
                    const newSettings = { ...prev, spacing: newValue };
                    console.log('New settings:', newSettings);
                    return newSettings;
                              });
                            }}
                className="spacing-slider"
              />
              <span className="control-value">{polygonSettings.spacing}</span>
                        </div>
                        </div>

          <div className="layer-list">
            {polygons.map(polygon => (
              <div key={polygon.id} className="layer-item">
                <div className="layer-info">
                  <span className="layer-name">{polygon.sides}-gon</span>
                  <span className="layer-radius">R: {polygon.radius}</span>
                </div>
                <div className="layer-sides-control">
                  <label>Sides:</label>
                          <input
                    type="number"
                    min="3"
                    max="12"
                    value={polygon.sides}
                    onChange={(e) => {
                      const newSides = Number(e.target.value);
                      updatePolygonSides(polygon.id, newSides);
                    }}
                    className="sides-input"
                          />
                        </div>
                <div className="layer-controls">
                  <button 
                    className="edit-layer"
                    onClick={() => openEditPopup(polygon)}
                  >
                    ✏️
                  </button>
                                <button
                    className="remove-layer"
                                  onClick={() => {
                      console.log('Remove polygon clicked for:', polygon.id);
                      setPolygons(prev => prev.filter(p => p.id !== polygon.id));
                    }}
                  >
                    ×
                                </button>
                          </div>
        </div>
            ))}
            <button className="add-layer" onClick={addPolygon}>
              <span className="button-emoji">+</span> ADD POLYGON
            </button>
                            </div>
                        </div>
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
