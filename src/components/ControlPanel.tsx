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
          onClick={() => {
            console.log('PLAY BUTTON CLICKED DIRECTLY');
            alert('PLAY BUTTON WORKS!');
            onPlayToggle();
          }}
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
          onClick={() => {
            console.log('RESET BUTTON CLICKED DIRECTLY');
            alert('RESET BUTTON WORKS!');
            onReset();
          }}
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
            type="range"
            min="30"
            max="300"
            step="10"
            value={playhead.rpm}
            onChange={(e) => {
              console.log('RPM SLIDER CHANGED DIRECTLY:', e.target.value);
              alert('RPM SLIDER WORKS! Value: ' + e.target.value);
              onRPMChange(Number(e.target.value));
            }}
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
          }}>{playhead.rpm}</span>
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
              console.log('SCALE DROPDOWN CHANGED DIRECTLY:', e.target.value);
              alert('SCALE DROPDOWN WORKS! Value: ' + e.target.value);
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
              console.log('ROOT NOTE DROPDOWN CHANGED DIRECTLY:', e.target.value);
              alert('ROOT NOTE DROPDOWN WORKS! Value: ' + e.target.value);
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
                onClick={() => onEditPolygon(polygon)}
                title="Edit Synth"
              >
                🎛️
              </button>
            </div>
          </div>
        ))}
        <button className="add-layer" onClick={onAddPolygon}>
          <span className="button-emoji">+</span> ADD POLYGON
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;
