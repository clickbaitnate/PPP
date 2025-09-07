import React from 'react';
import './SynthPanel.css';

interface SynthPanelProps {
  polygon: {
    id: number;
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
  };
  onUpdatePolygon: (polygonId: number, synthSettings: any) => void;
  onClose?: () => void;
}

export const SynthPanel: React.FC<SynthPanelProps> = ({ polygon, onUpdatePolygon, onClose }) => {

  // Update wave shape
  const updateWaveShape = (shape: 'sine' | 'square' | 'triangle' | 'sawtooth') => {
    const updatedSettings = {
      ...polygon.synthSettings,
      waveShape: shape
    };
    onUpdatePolygon(polygon.id, updatedSettings);
  };

  // Update envelope
  const updateEnvelope = (parameter: string, value: number) => {
    const updatedSettings = {
      ...polygon.synthSettings,
      [parameter]: value
    };
    onUpdatePolygon(polygon.id, updatedSettings);
  };

  // Update filter
  const updateFilter = (parameter: string, value: any) => {
    const updatedSettings = {
      ...polygon.synthSettings,
      [parameter]: value
    };
    onUpdatePolygon(polygon.id, updatedSettings);
  };

  // Update effects
  const updateEffect = (effectType: 'reverb' | 'delay' | 'distortion', parameter: string, value: any) => {
    const updatedSettings = {
      ...polygon.synthSettings,
      effects: {
        ...polygon.synthSettings.effects,
        [effectType]: {
          ...polygon.synthSettings.effects?.[effectType],
          [parameter]: value
        }
      }
    };
    onUpdatePolygon(polygon.id, updatedSettings);
  };

  // Update LFO
  const updateLFO = (parameter: string, value: any) => {
    const updatedSettings = {
      ...polygon.synthSettings,
      lfo: {
        ...polygon.synthSettings.lfo,
        [parameter]: value
      }
    };
    onUpdatePolygon(polygon.id, updatedSettings);
  };


  // Toggle synthesizer enabled
  const toggleEnabled = () => {
    const updatedSettings = {
      ...polygon.synthSettings,
      enabled: !polygon.synthSettings.enabled
    };
    onUpdatePolygon(polygon.id, updatedSettings);
  };

  return (
    <div className="synth-panel">
      <div className="panel-header">
        <h3>🎛️ Polygon Synthesizer</h3>
        {onClose && (
          <button className="close-button" onClick={onClose}>×</button>
        )}
      </div>

      <div className="panel-content">

        {/* Enable/Disable Toggle */}
        <div className="enable-control">
          <label>Synthesizer:</label>
          <button
            className={`enable-button ${polygon.synthSettings.enabled ? 'enabled' : 'disabled'}`}
            onClick={toggleEnabled}
          >
            {polygon.synthSettings.enabled ? '✅ ENABLED' : '❌ DISABLED'}
          </button>
        </div>

        {/* Wave Shape Selection */}
        <div className="wave-shape-section">
          <label>Wave Shape:</label>
          <div className="wave-shape-buttons">
            {(['sine', 'square', 'triangle', 'sawtooth'] as const).map(shape => (
              <button
                key={shape}
                className={`wave-shape-button ${polygon.synthSettings.waveShape === shape ? 'active' : ''}`}
                onClick={() => updateWaveShape(shape)}
                disabled={!polygon.synthSettings.enabled}
              >
                {shape.charAt(0).toUpperCase() + shape.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Envelope Section */}
        <div className="envelope-section">
          <label>Envelope (ADSR):</label>
          <div className="envelope-controls">
            <div className="envelope-control">
              <label>A:</label>
              <input
                type="range"
                min="0.001"
                max="0.5"
                step="0.01"
                value={polygon.synthSettings.attack || 0.01}
                onChange={(e) => updateEnvelope('attack', parseFloat(e.target.value))}
                className="envelope-slider"
                disabled={!polygon.synthSettings.enabled}
              />
              <span className="envelope-label">
                {Math.round((polygon.synthSettings.attack || 0.01) * 1000)}ms
              </span>
            </div>
            <div className="envelope-control">
              <label>D:</label>
              <input
                type="range"
                min="0.01"
                max="1"
                step="0.01"
                value={polygon.synthSettings.decay || 0.1}
                onChange={(e) => updateEnvelope('decay', parseFloat(e.target.value))}
                className="envelope-slider"
                disabled={!polygon.synthSettings.enabled}
              />
              <span className="envelope-label">
                {Math.round((polygon.synthSettings.decay || 0.1) * 1000)}ms
              </span>
            </div>
            <div className="envelope-control">
              <label>S:</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={polygon.synthSettings.sustain || 0.8}
                onChange={(e) => updateEnvelope('sustain', parseFloat(e.target.value))}
                className="envelope-slider"
                disabled={!polygon.synthSettings.enabled}
              />
              <span className="envelope-label">
                {Math.round((polygon.synthSettings.sustain || 0.8) * 100)}%
              </span>
            </div>
            <div className="envelope-control">
              <label>R:</label>
              <input
                type="range"
                min="0.01"
                max="2"
                step="0.01"
                value={polygon.synthSettings.release || 0.3}
                onChange={(e) => updateEnvelope('release', parseFloat(e.target.value))}
                className="envelope-slider"
                disabled={!polygon.synthSettings.enabled}
              />
              <span className="envelope-label">
                {Math.round((polygon.synthSettings.release || 0.3) * 1000)}ms
              </span>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="filter-section">
          <label>Filter:</label>
          <div className="filter-controls">
            <div className="filter-control">
              <label>Frq:</label>
              <input
                type="range"
                min="20"
                max="20000"
                step="10"
                value={polygon.synthSettings.filterFreq || 1000}
                onChange={(e) => updateFilter('filterFreq', parseFloat(e.target.value))}
                className="filter-slider"
                disabled={!polygon.synthSettings.enabled || !(polygon.synthSettings.filterEnabled ?? false)}
              />
              <span className="filter-label">
                {Math.round(polygon.synthSettings.filterFreq || 1000)}Hz
              </span>
            </div>
            <div className="filter-control">
              <label>Q:</label>
              <input
                type="range"
                min="0.1"
                max="20"
                step="0.1"
                value={polygon.synthSettings.filterQ || 1}
                onChange={(e) => updateFilter('filterQ', parseFloat(e.target.value))}
                className="filter-slider"
                disabled={!polygon.synthSettings.enabled || !(polygon.synthSettings.filterEnabled ?? false)}
              />
              <span className="filter-label">
                {(polygon.synthSettings.filterQ || 1).toFixed(1)}
              </span>
            </div>
          </div>
          <div className="filter-type-selector">
            {(['lowpass', 'highpass', 'bandpass', 'notch'] as const).map(type => (
              <button
                key={type}
                className={`filter-type-button ${polygon.synthSettings.filterType === type ? 'active' : ''}`}
                onClick={() => updateFilter('filterType', type)}
                disabled={!polygon.synthSettings.enabled || !(polygon.synthSettings.filterEnabled ?? false)}
              >
                {type.slice(0, 3).toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Effects Section */}
        <div className="effects-section">
          <label>Effects Chain:</label>
          <div className="effect-chain">
            {/* Reverb */}
            <div className="effect-slot">
              <div className="effect-header">
                <span className="effect-name">Reverb</span>
                <button
                  className={`effect-toggle ${(polygon.synthSettings.effects?.reverb?.enabled ?? false) ? 'active' : ''}`}
                  onClick={() => updateEffect('reverb', 'enabled', !polygon.synthSettings.effects?.reverb?.enabled)}
                  disabled={!polygon.synthSettings.enabled}
                >
                  {(polygon.synthSettings.effects?.reverb?.enabled ?? false) ? '✓' : '○'}
                </button>
              </div>
              {(polygon.synthSettings.effects?.reverb?.enabled ?? false) && (
                <div className="effect-controls">
                  <div className="effect-control">
                    <label>Mix:</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={polygon.synthSettings.effects?.reverb?.mix || 0.3}
                      onChange={(e) => updateEffect('reverb', 'mix', parseFloat(e.target.value))}
                      className="effect-slider"
                      disabled={!polygon.synthSettings.enabled}
                    />
                    <span className="effect-label">
                      {Math.round((polygon.synthSettings.effects?.reverb?.mix || 0.3) * 100)}%
                    </span>
                  </div>
                  <div className="effect-control">
                    <label>Dec:</label>
                    <input
                      type="range"
                      min="0.1"
                      max="10"
                      step="0.1"
                      value={polygon.synthSettings.effects?.reverb?.decay || 2}
                      onChange={(e) => updateEffect('reverb', 'decay', parseFloat(e.target.value))}
                      className="effect-slider"
                      disabled={!polygon.synthSettings.enabled}
                    />
                    <span className="effect-label">
                      {(polygon.synthSettings.effects?.reverb?.decay || 2).toFixed(1)}s
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Delay */}
            <div className="effect-slot">
              <div className="effect-header">
                <span className="effect-name">Delay</span>
                <button
                  className={`effect-toggle ${(polygon.synthSettings.effects?.delay?.enabled ?? false) ? 'active' : ''}`}
                  onClick={() => updateEffect('delay', 'enabled', !polygon.synthSettings.effects?.delay?.enabled)}
                  disabled={!polygon.synthSettings.enabled}
                >
                  {(polygon.synthSettings.effects?.delay?.enabled ?? false) ? '✓' : '○'}
                </button>
              </div>
              {(polygon.synthSettings.effects?.delay?.enabled ?? false) && (
                <div className="effect-controls">
                  <div className="effect-control">
                    <label>Mix:</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={polygon.synthSettings.effects?.delay?.mix || 0.3}
                      onChange={(e) => updateEffect('delay', 'mix', parseFloat(e.target.value))}
                      className="effect-slider"
                      disabled={!polygon.synthSettings.enabled}
                    />
                    <span className="effect-label">
                      {Math.round((polygon.synthSettings.effects?.delay?.mix || 0.3) * 100)}%
                    </span>
                  </div>
                  <div className="effect-control">
                    <label>FB:</label>
                    <input
                      type="range"
                      min="0"
                      max="0.9"
                      step="0.01"
                      value={polygon.synthSettings.effects?.delay?.feedback || 0.4}
                      onChange={(e) => updateEffect('delay', 'feedback', parseFloat(e.target.value))}
                      className="effect-slider"
                      disabled={!polygon.synthSettings.enabled}
                    />
                    <span className="effect-label">
                      {Math.round((polygon.synthSettings.effects?.delay?.feedback || 0.4) * 100)}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Distortion */}
            <div className="effect-slot">
              <div className="effect-header">
                <span className="effect-name">Distort</span>
                <button
                  className={`effect-toggle ${(polygon.synthSettings.effects?.distortion?.enabled ?? false) ? 'active' : ''}`}
                  onClick={() => updateEffect('distortion', 'enabled', !polygon.synthSettings.effects?.distortion?.enabled)}
                  disabled={!polygon.synthSettings.enabled}
                >
                  {(polygon.synthSettings.effects?.distortion?.enabled ?? false) ? '✓' : '○'}
                </button>
              </div>
              {(polygon.synthSettings.effects?.distortion?.enabled ?? false) && (
                <div className="effect-controls">
                  <div className="effect-control">
                    <label>Mix:</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={polygon.synthSettings.effects?.distortion?.mix || 0.3}
                      onChange={(e) => updateEffect('distortion', 'mix', parseFloat(e.target.value))}
                      className="effect-slider"
                      disabled={!polygon.synthSettings.enabled}
                    />
                    <span className="effect-label">
                      {Math.round((polygon.synthSettings.effects?.distortion?.mix || 0.3) * 100)}%
                    </span>
                  </div>
                  <div className="effect-control">
                    <label>Amt:</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={polygon.synthSettings.effects?.distortion?.amount || 20}
                      onChange={(e) => updateEffect('distortion', 'amount', parseFloat(e.target.value))}
                      className="effect-slider"
                      disabled={!polygon.synthSettings.enabled}
                    />
                    <span className="effect-label">
                      {polygon.synthSettings.effects?.distortion?.amount || 20}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* LFO Section */}
        <div className="lfo-section">
          <div className="lfo-header">
            <label>LFO (Low Frequency Oscillator):</label>
            <button
              className={`lfo-toggle ${polygon.synthSettings.lfo?.enabled ? 'active' : ''}`}
              onClick={() => updateLFO('enabled', !polygon.synthSettings.lfo?.enabled)}
              disabled={!polygon.synthSettings.enabled}
            >
              {(polygon.synthSettings.lfo?.enabled ?? false) ? '✓ ON' : '○ OFF'}
            </button>
          </div>
          <div className="lfo-controls">
            <div className="lfo-control">
              <label>Rate:</label>
              <input
                type="range"
                min="0.1"
                max="20"
                step="0.1"
                value={polygon.synthSettings.lfo?.rate || 1}
                onChange={(e) => updateLFO('rate', parseFloat(e.target.value))}
                className="lfo-slider"
                disabled={!polygon.synthSettings.enabled || !(polygon.synthSettings.lfo?.enabled ?? false)}
              />
              <span className="lfo-label">
                {(polygon.synthSettings.lfo?.rate || 1).toFixed(1)}Hz
              </span>
            </div>
            <div className="lfo-control">
              <label>Depth:</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={polygon.synthSettings.lfo?.depth || 0.5}
                onChange={(e) => updateLFO('depth', parseFloat(e.target.value))}
                className="lfo-slider"
                disabled={!polygon.synthSettings.enabled || !(polygon.synthSettings.lfo?.enabled ?? false)}
              />
              <span className="lfo-label">
                {Math.round((polygon.synthSettings.lfo?.depth || 0.5) * 100)}%
              </span>
            </div>
          </div>
          <div className="lfo-wave-selector">
            {(['sine', 'square', 'triangle', 'sawtooth', 'noise'] as const).map(shape => (
              <button
                key={shape}
                className={`lfo-wave-button ${polygon.synthSettings.lfo?.waveShape === shape ? 'active' : ''}`}
                onClick={() => updateLFO('waveShape', shape)}
                disabled={!polygon.synthSettings.enabled || !(polygon.synthSettings.lfo?.enabled ?? false)}
              >
                {shape.slice(0, 3).toUpperCase()}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};


export default SynthPanel;
