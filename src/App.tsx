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
  synthSettings: any;
}

interface PlayheadState {
  angle: number;
  isPlaying: boolean;
  rpm: number;
}

interface PolygonSettings {
  spacing: number;
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
  const checkNoteTriggers = useCallback((angle: number) => {
    polygons.forEach(polygon => {
      if (!polygon.active) return;

      const anglePerVertex = 360 / polygon.sides;

      for (let i = 0; i < polygon.sides; i++) {
        const vertexAngle = (i * anglePerVertex) % 360;
        const angleDiff = Math.abs(angle - vertexAngle);

        if (angleDiff < 5 || angleDiff > 355) {
          const note = polygon.notes[i];
          if (note) {
            const noteId = `${polygon.id}_${i}_${note}`;
            const now = performance.now();
            const lastTrigger = lastTriggerTimeRef.current[noteId];
            const minInterval = Math.max(50, (60 / rpmRef.current) * 1000 / polygons.length);

            if (!lastTrigger || now - lastTrigger > minInterval) {
              lastTriggerTimeRef.current[noteId] = now;
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

    const animate = (currentTime: number) => {
      const elapsed = (currentTime - startTime) / 1000;
      const secondsPerRevolution = 60 / rpmRef.current;
      const revolutions = elapsed / secondsPerRevolution;
      const progress = revolutions - Math.floor(revolutions);
      const newAngle = progress * 360;

        checkNoteTriggers(newAngle);
        
        setPlayhead(prev => ({
          ...prev,
          angle: newAngle
        }));
        
        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = undefined;
      }
    };
  }, [playhead.isPlaying]);

  // Update RPM ref
  useEffect(() => {
    rpmRef.current = playhead.rpm;
  }, [playhead.rpm]);

  // Control functions
  const togglePlay = async () => {
    console.log('Toggle play clicked');
    await audioEngine.resumeContext();
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
    const currentNote = polygon.notes[vertexIndex];
    const currentIndex = currentNote ? scale.indexOf(currentNote) : -1;
    const nextIndex = (currentIndex + 1) % scale.length;
    const nextNote = scale[nextIndex];
    
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
          onClick={() => cycleNote(polygon.id, i)}
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
                    
        <div className="control-panel">
          <div className="transport-controls">
            <button
              className="play-button"
              onClick={() => {
                console.log('Play button clicked!');
                togglePlay();
              }}
            >
              {playhead.isPlaying ? '⏸️' : '▶️'}
            </button>
            <button
              className="reset-button"
              onClick={() => {
                console.log('Reset button clicked!');
                resetPlayhead();
              }}
            >
              🔄
            </button>
            <button
              className="settings-button"
              onClick={() => setShowSettingsPopup(true)}
              title="Global Settings"
            >
              ⚙️
            </button>
          </div>

          <div className="settings-section">
            <div className="setting-group">
              <label className="setting-label">RPM</label>
            <input
              type="range"
                min="30"
                max="300"
                step="10"
                value={playhead.rpm}
                onChange={(e) => {
                  console.log('RPM slider changed:', e.target.value);
                  updateRPM(Number(e.target.value));
                }}
                className="rpm-slider"
              />
              <span className="control-value">{playhead.rpm}</span>
          </div>

            <div className="setting-group">
              <label className="setting-label">Scale</label>
            <select
              value={selectedScale}
              onChange={(e) => {
                console.log('Scale dropdown clicked, value:', e.target.value);
                setSelectedScale(e.target.value);
              }}
                className="scale-select"
            >
              <option value="Major">Major</option>
              <option value="Minor">Minor</option>
              <option value="Pentatonic">Pentatonic</option>
              <option value="Dorian">Dorian</option>
              <option value="Mixolydian">Mixolydian</option>
            </select>
          </div>

            <div className="setting-group">
              <label className="setting-label">Root Note</label>
              <select
                value={rootNote}
                onChange={(e) => {
                  console.log('Root note dropdown clicked, value:', e.target.value);
                  setRootNote(e.target.value);
                }}
                className="root-note-select"
              >
                {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map(note => (
                  <option key={note} value={note}>{note}</option>
                ))}
              </select>
          </div>

            <div className="setting-group">
              <label className="setting-label">Spacing</label>
              <input
                type="range"
                min="20"
                max="100"
                step="5"
                value={polygonSettings.spacing}
                            onChange={(e) => {
                  const newValue = Number(e.target.value);
                  setPolygonSettings(prev => ({
                    ...prev,
                    spacing: newValue
                  }));
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
                  <span className="layer-notes">{polygon.notes.filter(n => n).length} notes</span>
                        </div>
                <div className="layer-controls">
                  <button
                    className="edit-button"
                    onClick={() => openEditPopup(polygon)}
                    title="Edit Synth"
                  >
                    🎛️
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
