import React from 'react';
import { Polygon, PlayheadState, PolygonSettings } from '../types';

interface ControlPanelProps {
  playhead: PlayheadState;
  selectedScale: string;
  rootNote: string;
  polygonSettings: PolygonSettings;
  polygons: Polygon[];
  onPlayToggle: () => void;
  onReset: () => void;
  onRPMChange: (rpm: number) => void;
  onScaleChange: (scale: string) => void;
  onRootNoteChange: (note: string) => void;
  onSpacingChange: (spacing: number) => void;
  onSettingsClick: () => void;
  onAddPolygon: () => void;
  onEditPolygon: (polygon: Polygon) => void;
  onDeletePolygon: (polygonId: number) => void;
  onChangePolygonSides: (polygonId: number, sides: number) => void;
  onRandomPopulate: (polygonId: number) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  playhead,
  selectedScale,
  rootNote,
  polygonSettings,
  polygons,
  onPlayToggle,
  onReset,
  onRPMChange,
  onScaleChange,
  onRootNoteChange,
  onSpacingChange,
  onSettingsClick,
  onAddPolygon,
  onEditPolygon,
  onDeletePolygon,
  onChangePolygonSides,
  onRandomPopulate,
}) => {
  return (
    <div style={{
      width: '250px',
      backgroundColor: '#000000',
      border: '3px solid #00ff00',
      padding: '15px',
      display: 'flex',
      flexDirection: 'column',
      gap: '15px',
      position: 'relative'
    }}>
      <div style={{
        display: 'flex',
        gap: '8px'
      }}>
        <button
          style={{
            flex: 1,
            padding: '10px',
            border: '2px solid #ffff00',
            borderStyle: 'outset',
            background: 'linear-gradient(180deg, #00ff00, #00cc00)',
            color: '#000000',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontFamily: 'Comic Sans MS, sans-serif'
          }}
          onClick={onPlayToggle}
        >
          {playhead.isPlaying ? '⏸️' : '▶️'}
        </button>
        <button
          style={{
            flex: 1,
            padding: '10px',
            border: '2px solid #ffff00',
            borderStyle: 'outset',
            background: 'linear-gradient(180deg, #ff6600, #cc5500)',
            color: '#000000',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontFamily: 'Comic Sans MS, sans-serif'
          }}
          onClick={onReset}
        >
          🔄
        </button>
        <button
          style={{
            flex: 1,
            padding: '10px',
            border: '2px solid #ffff00',
            borderStyle: 'outset',
            background: 'linear-gradient(180deg, #666666, #333333)',
            color: '#00ff00',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontFamily: 'Courier New, monospace'
          }}
          onClick={onSettingsClick}
          title="Global Settings"
        >
          ⚙️
        </button>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '5px'
        }}>
          <label style={{
            color: '#00ff00',
            fontSize: '12px',
            fontWeight: 'bold',
            textTransform: 'uppercase'
          }}>RPM</label>
          <input
            type="number"
            min="0.1"
            max="1000"
            step="0.1"
            value={playhead.rpm}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              if (!isNaN(value) && value > 0) {
                onRPMChange(value);
              }
            }}
            style={{
              width: '100%',
              padding: '4px 8px',
              background: '#000000',
              border: '2px solid #00ff00',
              borderStyle: 'inset',
              color: '#00ff00',
              fontSize: '12px',
              fontFamily: 'Courier New, monospace',
              fontWeight: 'bold',
              outline: 'none',
              textAlign: 'center'
            }}
            placeholder="Enter RPM"
          />
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '5px'
        }}>
          <label style={{
            color: '#00ff00',
            fontSize: '12px',
            fontWeight: 'bold',
            textTransform: 'uppercase'
          }}>Scale</label>
          <select
            value={selectedScale}
            onChange={(e) => {
              console.log('Scale selector changed to:', e.target.value);
              onScaleChange(e.target.value);
            }}
            style={{
              width: '100%',
              padding: '6px',
              background: '#000000',
              border: '2px solid #00ff00',
              color: '#00ff00',
              fontSize: '12px',
              fontFamily: 'Courier New, monospace',
              fontWeight: 'bold',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="Major">Major</option>
            <option value="Minor">Minor</option>
            <option value="Pentatonic">Pentatonic</option>
            <option value="Dorian">Dorian</option>
            <option value="Mixolydian">Mixolydian</option>
          </select>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '5px'
        }}>
          <label style={{
            color: '#00ff00',
            fontSize: '12px',
            fontWeight: 'bold',
            textTransform: 'uppercase'
          }}>Root Note</label>
          <select
            value={rootNote}
            onChange={(e) => {
              console.log('Root note selector changed to:', e.target.value);
              onRootNoteChange(e.target.value);
            }}
            style={{
              width: '100%',
              padding: '6px',
              background: '#000000',
              border: '2px solid #00ff00',
              color: '#00ff00',
              fontSize: '12px',
              fontFamily: 'Courier New, monospace',
              fontWeight: 'bold',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map(note => (
              <option key={note} value={note}>{note}</option>
            ))}
          </select>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '5px'
        }}>
          <label style={{
            color: '#00ff00',
            fontSize: '12px',
            fontWeight: 'bold',
            textTransform: 'uppercase'
          }}>Spacing</label>
          <input
            type="range"
            min="20"
            max="100"
            step="5"
            value={polygonSettings.spacing}
            onChange={(e) => onSpacingChange(Number(e.target.value))}
            style={{
              width: '100%',
              height: '20px',
              background: '#000000',
              border: '2px solid #00ff00',
              borderStyle: 'inset',
              outline: 'none',
              cursor: 'pointer'
            }}
          />
          <span style={{
            color: '#00ff00',
            fontSize: '12px',
            fontFamily: 'Courier New, monospace',
            textAlign: 'center'
          }}>{polygonSettings.spacing}</span>
        </div>
      </div>

      <div style={{
        marginTop: '15px'
      }}>
        {polygons.map(polygon => (
          <div key={polygon.id} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            padding: '8px',
            marginBottom: '8px',
            background: 'rgba(0, 0, 0, 0.5)',
            border: '1px solid #00ff00',
            borderRadius: '4px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <span style={{
                  color: '#00ff00',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>{polygon.sides}-gon</span>
                <span style={{
                  color: '#00ff00',
                  fontSize: '10px',
                  marginLeft: '8px'
                }}>{polygon.notes.filter(n => n).length} notes</span>
              </div>
              <div style={{
                display: 'flex',
                gap: '4px'
              }}>
                <button
                  style={{
                    padding: '4px 6px',
                    background: '#333333',
                    border: '1px solid #00ff00',
                    color: '#00ff00',
                    fontSize: '12px',
                    cursor: 'pointer',
                    borderRadius: '3px'
                  }}
                  onClick={() => onEditPolygon(polygon)}
                  title="Edit Synth"
                >
                  🎛️
                </button>
                <button
                  style={{
                    padding: '4px 6px',
                    background: '#cc0000',
                    border: '1px solid #ff4444',
                    color: '#ffffff',
                    fontSize: '12px',
                    cursor: 'pointer',
                    borderRadius: '3px'
                  }}
                  onClick={() => onDeletePolygon(polygon.id)}
                  title="Delete Polygon"
                  disabled={polygons.length <= 1}
                >
                  🗑️
                </button>
                <button
                  style={{
                    padding: '4px 6px',
                    background: '#0066cc',
                    border: '1px solid #0099ff',
                    color: '#ffffff',
                    fontSize: '12px',
                    cursor: 'pointer',
                    borderRadius: '3px'
                  }}
                  onClick={() => onRandomPopulate(polygon.id)}
                  title="Random Populate"
                >
                  🎲
                </button>
              </div>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <label style={{
                color: '#00ff00',
                fontSize: '10px',
                fontWeight: 'bold'
              }}>Sides:</label>
              <select
                value={polygon.sides}
                onChange={(e) => onChangePolygonSides(polygon.id, Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '4px',
                  background: '#000000',
                  border: '1px solid #00ff00',
                  color: '#00ff00',
                  fontSize: '11px',
                  fontFamily: 'Courier New, monospace',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {[3, 4, 5, 6, 7, 8, 9, 10, 12].map(sides => (
                  <option key={sides} value={sides}>{sides}-gon</option>
                ))}
              </select>
            </div>
          </div>
        ))}
        <button style={{
          width: '100%',
          padding: '10px',
          background: 'linear-gradient(180deg, #666666, #333333)',
          border: '2px solid #00ff00',
          borderStyle: 'outset',
          color: '#00ff00',
          fontSize: '12px',
          fontWeight: 'bold',
          cursor: 'pointer',
          fontFamily: 'Courier New, monospace',
          marginTop: '10px'
        }} onClick={onAddPolygon}>
          <span>+</span> ADD POLYGON
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;
