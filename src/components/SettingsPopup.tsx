import React from 'react';
import './SettingsPopup.css';

interface SettingsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  polygons: any[];
  scaleSystem: any;
  selectedScale: string;
  rootNote: string;
}

export const SettingsPopup: React.FC<SettingsPopupProps> = ({
  isOpen,
  onClose,
  polygons,
  scaleSystem,
  selectedScale,
  rootNote
}) => {
  const [exportMeasures, setExportMeasures] = React.useState(4);
  const [selectedTheme, setSelectedTheme] = React.useState('default');

  if (!isOpen) return null;

  const handleMidiExport = () => {
    try {
      // Create MIDI file content as text
      let midiContent = '';

      // MIDI Header Chunk
      midiContent += 'MThd'; // Chunk type
      midiContent += String.fromCharCode(0x00, 0x00, 0x00, 0x06); // Chunk length
      midiContent += String.fromCharCode(0x00, 0x00); // Format 0
      midiContent += String.fromCharCode(0x00, 0x01); // 1 track
      midiContent += String.fromCharCode(0x00, 0x60); // 96 ticks per quarter note

      // Track Chunk
      midiContent += 'MTrk';

      // Build track data
      let trackData = '';

      // Tempo meta event (120 BPM)
      trackData += String.fromCharCode(0x00); // Delta time
      trackData += String.fromCharCode(0xFF, 0x51, 0x03); // Tempo meta event
      trackData += String.fromCharCode(0x07, 0xA1, 0x20); // 500,000 microseconds per quarter note

      let currentTime = 0;

      // Process all polygons and notes
      polygons.forEach((polygon, polygonIndex) => {
        if (polygon.synthSettings.enabled && polygon.notes) {
          polygon.notes.forEach((note: string | null, vertexIndex: number) => {
            if (note) {
              const midiNote = noteNameToMidiNumber(note, selectedScale, rootNote, scaleSystem) || 60;
              const noteStart = vertexIndex * 96; // 96 ticks per beat
              const noteDuration = 48; // Eighth note duration

              // Note on event
              const deltaTime = noteStart - currentTime;
              trackData += writeVariableLength(deltaTime);
              trackData += String.fromCharCode(0x90); // Note on, channel 0
              trackData += String.fromCharCode(midiNote); // Note number
              trackData += String.fromCharCode(0x64); // Velocity

              // Note off event
              trackData += writeVariableLength(noteDuration);
              trackData += String.fromCharCode(0x80); // Note off, channel 0
              trackData += String.fromCharCode(midiNote); // Note number
              trackData += String.fromCharCode(0x40); // Release velocity

              currentTime = noteStart + noteDuration;
            }
          });
        }
      });

      // End of track
      trackData += String.fromCharCode(0x00); // Delta time
      trackData += String.fromCharCode(0xFF, 0x2F, 0x00); // End of track

      // Write track length
      const trackLength = trackData.length;
      midiContent += String.fromCharCode(
        (trackLength >> 24) & 0xFF,
        (trackLength >> 16) & 0xFF,
        (trackLength >> 8) & 0xFF,
        trackLength & 0xFF
      );
      midiContent += trackData;

      // Create download link
      const blob = new Blob([midiContent], { type: 'audio/midi' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `shape-sequencer-rhythm-${exportMeasures}-measures.mid`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('MIDI export completed successfully');
    } catch (error) {
      console.error('MIDI export failed:', error);
      alert('Failed to export MIDI file. Check console for details.');
    }
  };

  // Helper function for MIDI variable-length encoding
  const writeVariableLength = (value: number): string => {
    let result = '';
    let buffer = value & 0x7F;

    while ((value >>= 7) > 0) {
      buffer <<= 8;
      buffer |= 0x80;
      buffer += (value & 0x7F);
    }

    while (true) {
      result += String.fromCharCode(buffer & 0xFF);
      if ((buffer & 0x80) !== 0) {
        buffer >>= 8;
      } else {
        break;
      }
    }

    return result;
  };

  const handleWavExport = async () => {
    try {
      // Use the existing audio context or create a new one
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Resume audio context if needed
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
        console.log('Audio context resumed');
      }

      // Create a MediaRecorder to capture audio
      const destination = audioContext.createMediaStreamDestination();
      console.log('Audio context state:', audioContext.state);

      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(destination.stream);
        console.log('MediaRecorder created successfully');
      } catch (error) {
        console.error('Failed to create MediaRecorder:', error);
        alert('MediaRecorder not supported in this browser');
        return;
      }

      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `shape-sequencer-rhythm-${exportMeasures}-measures.wav`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      };

      // Start recording
      recorder.start();

      // Use proper rhythmic timing matching the sequencer
      const BPM = 120;
      const beatsPerSecond = BPM / 60;
      const secondsPerBeat = 1 / beatsPerSecond;
      const totalBeats = exportMeasures * 4; // 4 beats per measure
      const totalDuration = totalBeats * secondsPerBeat; // Total duration in seconds

      // Calculate timing based on polygon vertices (assuming 8 vertices max per polygon)
      const maxVertices = 8;
      const noteDuration = secondsPerBeat * 0.8; // 80% of a beat duration
      const timeBetweenNotes = secondsPerBeat; // One beat between notes

      console.log(`WAV Export: ${exportMeasures} measures, ${BPM} BPM, ${totalDuration}s total`);
      console.log('Polygons:', polygons.map(p => ({ enabled: p.synthSettings.enabled, notes: p.notes })));

      // Test basic audio functionality first
      console.log('Testing basic audio...');
      const testOsc = audioContext.createOscillator();
      const testGain = audioContext.createGain();
      testOsc.frequency.setValueAtTime(440, audioContext.currentTime); // A4 note
      testOsc.type = 'sine';
      testGain.gain.setValueAtTime(0.1, audioContext.currentTime);
      testGain.gain.setValueAtTime(0, audioContext.currentTime + 0.5);
      testOsc.connect(testGain);
      testGain.connect(destination);
      testOsc.start(audioContext.currentTime);
      testOsc.stop(audioContext.currentTime + 0.5);
      console.log('Test tone scheduled: 440Hz for 0.5s');

      // Create simple audio chain for each polygon - test basic functionality first
      polygons.forEach((polygon, polygonIndex) => {
        console.log(`Polygon ${polygonIndex}: enabled=${polygon.synthSettings.enabled}, notes=${polygon.notes?.length || 0}`);
        if (polygon.synthSettings.enabled && polygon.notes) {
          polygon.notes.forEach((note: string | null, vertexIndex: number) => {
            console.log(`Note ${vertexIndex}: ${note}`);
            if (note) {
              // Calculate frequency from note name
              const frequency = noteToFrequency(note, selectedScale, rootNote, scaleSystem);
              console.log(`Frequency for ${note}: ${frequency}`);

              if (frequency) {
                // Calculate note timing - space notes evenly across the measure duration
                const noteStartTime = audioContext.currentTime + (vertexIndex * timeBetweenNotes);

                // Create basic oscillator with gain
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                // Apply polygon synth settings
                oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
                oscillator.type = polygon.synthSettings.waveShape as 'sine' | 'square' | 'sawtooth' | 'triangle';

                // Simple envelope
                gainNode.gain.setValueAtTime(0, noteStartTime);
                gainNode.gain.linearRampToValueAtTime(0.3, noteStartTime + 0.01);
                gainNode.gain.linearRampToValueAtTime(0, noteStartTime + noteDuration);

                // Simple connection - oscillator -> gain -> destination
                oscillator.connect(gainNode);
                gainNode.connect(destination);

                oscillator.start(noteStartTime);
                oscillator.stop(noteStartTime + noteDuration);

                console.log(`Note ${vertexIndex} from polygon ${polygonIndex}: ${note} at ${(vertexIndex * timeBetweenNotes).toFixed(2)}s, freq=${frequency}Hz`);
              }
            }
          });
        }
      });

      // Stop recording after the full measure duration
      const totalPlaybackTime = totalDuration + 2.0; // Add extra time for effects tail
      setTimeout(() => {
        recorder.stop();
        audioContext.close();
        console.log(`WAV export completed: ${totalPlaybackTime}s recorded (${exportMeasures} measures at ${BPM} BPM)`);
      }, totalPlaybackTime * 1000);
    } catch (error) {
      console.error('WAV export failed:', error);
      alert('Failed to export WAV file. Check console for details.');
    }
  };

  // Helper function to convert note names to frequencies
  const noteToFrequency = (note: string, scaleName: string, rootNote: string, scaleSystem: any): number | null => {
    try {
      // Get scale notes from the scale system
      const scaleNotes = scaleSystem.getScaleNotes(scaleName, rootNote);
      const noteIndex = scaleNotes.indexOf(note);

      if (noteIndex !== -1) {
        // Calculate frequency using equal temperament
        // A4 = 440Hz as reference
        const rootMidi = noteToMidi(rootNote);
        const midiNote = rootMidi + noteIndex;
        return 440 * Math.pow(2, (midiNote - 69) / 12);
      }

      // Fallback: try to use the note directly as a basic note
      console.log(`Note ${note} not found in scale, using fallback`);
      const midiNote = noteToMidi(note);
      if (midiNote !== 60) { // 60 is our fallback, so if it's different, use it
        return 440 * Math.pow(2, (midiNote - 69) / 12);
      }

      return null;
    } catch (error) {
      console.error('Error converting note to frequency:', error);
      return null;
    }
  };

  // Simple note to MIDI conversion
  const noteToMidi = (note: string): number => {
    const noteMap: { [key: string]: number } = {
      'C': 60, 'C#': 61, 'D': 62, 'D#': 63, 'E': 64, 'F': 65,
      'F#': 66, 'G': 67, 'G#': 68, 'A': 69, 'A#': 70, 'B': 71
    };
    return noteMap[note] || 60;
  };

  const handleThemeChange = (theme: string) => {
    setSelectedTheme(theme);
    document.documentElement.setAttribute('data-theme', theme);
  };

  // Helper function to convert note names to MIDI note numbers
  const noteNameToMidiNumber = (note: string, scaleName: string, rootNote: string, scaleSystem: any): number | null => {
    try {
      // Get scale notes from the scale system
      const scaleNotes = scaleSystem.getScaleNotes(scaleName, rootNote);
      const noteIndex = scaleNotes.indexOf(note);

      if (noteIndex !== -1) {
        // Calculate MIDI note number using equal temperament
        const rootMidi = noteToMidi(rootNote);
        return rootMidi + noteIndex;
      }

      // Fallback: try to parse the note directly
      return noteToMidi(note);
    } catch (error) {
      console.error('Error converting note to MIDI:', error);
      return null;
    }
  };

  return (
    <div className="settings-overlay">
      <div className="settings-popup">
        <div className="settings-header">
          <h3><span className="settings-emoji">⚙️</span> Settings</h3>
          <button className="close-settings" onClick={onClose}>×</button>
        </div>

        <div className="settings-content">
          {/* Export Section */}
          <div className="settings-section">
            <h4>📤 Export</h4>

            <div className="export-controls">
              <div className="export-control">
                <label>Measures to Export:</label>
                <input
                  type="number"
                  min="1"
                  max="16"
                  value={exportMeasures}
                  onChange={(e) => setExportMeasures(parseInt(e.target.value))}
                  className="measures-input"
                />
              </div>

              <div className="export-buttons">
                <button className="export-button midi-export" onClick={handleMidiExport}>
                  <span className="export-emoji">🎵</span> Export MIDI
                </button>
                <button className="export-button wav-export" onClick={handleWavExport}>
                  <span className="export-emoji">🎵</span> Export WAV
                </button>
              </div>
            </div>
          </div>

          {/* Theme Section */}
          <div className="settings-section">
            <h4>🎨 Theme</h4>

            <div className="theme-selector">
              <select
                value={selectedTheme}
                onChange={(e) => handleThemeChange(e.target.value)}
                className="theme-dropdown"
              >
                <option value="default">Default</option>
                <option value="kawaii">🌸 Kawaii</option>
                <option value="cyberpunk">🤖 Cyberpunk</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPopup;
