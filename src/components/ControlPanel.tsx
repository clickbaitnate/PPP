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
    <div className="control-panel">
      <div className="transport-controls">
        <button
          className="play-button"
          onClick={onPlayToggle}
        >
          {playhead.isPlaying ? '⏸️' : '▶️'}
        </button>
        <button
          className="reset-button"
          onClick={onReset}
        >
          🔄
        </button>
        <button
          className="settings-button"
          onClick={onSettingsClick}
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
            onChange={(e) => onRPMChange(Number(e.target.value))}
            className="rpm-slider"
          />
          <span className="control-value">{playhead.rpm}</span>
        </div>

        <div className="setting-group">
          <label className="setting-label">Scale</label>
          <select
            value={selectedScale}
            onChange={(e) => onScaleChange(e.target.value)}
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
            onChange={(e) => onRootNoteChange(e.target.value)}
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
            onChange={(e) => onSpacingChange(Number(e.target.value))}
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
