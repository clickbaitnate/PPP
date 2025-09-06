// Scale System - Handles all scale-related logic
export interface ScaleSystem {
  selectedScale: string;
  rootNote: string;
  getScaleNotes: (scaleName: string, root: string) => string[];
  getNoteColor: (note: string | null, polygonColor: string, selectedScale: string, rootNote: string) => string;
  updatePolygonNotesForNewScale: (polygons: any[], selectedPolygon: any | null, selectedScale: string, rootNote: string) => { updatedPolygons: any[], updatedSelectedPolygon: any | null };
}

export const createScaleSystem = (): ScaleSystem => {
  const noteOrder = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  const scaleIntervals = {
    'Major': [0, 2, 4, 5, 7, 9, 11],
    'Minor': [0, 2, 3, 5, 7, 8, 10],
    'Pentatonic': [0, 2, 4, 7, 9],
    'Dorian': [0, 2, 3, 5, 7, 9, 10],
    'Mixolydian': [0, 2, 4, 5, 7, 9, 10]
  };

  const getScaleNotes = (scaleName: string, root: string): string[] => {
    const rootIndex = noteOrder.indexOf(root);
    const intervals = scaleIntervals[scaleName as keyof typeof scaleIntervals] || scaleIntervals.Major;
    return intervals.map(interval => noteOrder[(rootIndex + interval) % 12]);
  };

  const getNoteColor = (note: string | null, polygonColor: string = '#00ff00', selectedScale: string, rootNote: string): string => {
    if (!note) return 'transparent';
    
    // Get the scale notes for the current scale and root
    const scaleNotes = getScaleNotes(selectedScale, rootNote);
    const scaleDegree = scaleNotes.indexOf(note);
    
    if (scaleDegree === -1) return polygonColor; // Fallback if note not in scale
    
    // Color scheme based on scale degree (1st, 2nd, 3rd, etc.)
    const scaleDegreeColors = [
      '#ff0000',    // 1st degree - Red (Root)
      '#ff4000',    // 2nd degree - Red-Orange
      '#ff8000',    // 3rd degree - Orange
      '#ffbf00',    // 4th degree - Yellow-Orange
      '#ffff00',    // 5th degree - Yellow
      '#bfff00',    // 6th degree - Yellow-Green
      '#80ff00',    // 7th degree - Green
      '#40ff00',    // 8th degree - Green (Octave)
      '#00ff40',    // 9th degree - Green-Blue
      '#00ff80',    // 10th degree - Blue-Green
      '#00ffbf',    // 11th degree - Blue-Green
      '#00ffff'     // 12th degree - Cyan
    ];
    
    return scaleDegreeColors[scaleDegree] || polygonColor;
  };

  const updatePolygonNotesForNewScale = (polygons: any[], selectedPolygon: any | null, selectedScale: string, rootNote: string) => {
    const newScaleNotes = getScaleNotes(selectedScale, rootNote);
    
    const updatedPolygons = polygons.map(polygon => {
      const updatedNotes = polygon.notes.map((note: string | null) => {
        if (!note) return null;
        
        // Check if the note is still in the new scale
        if (newScaleNotes.includes(note)) {
          return note; // Keep the note if it's still valid
        } else {
          // Find the closest note in the new scale
          const currentIndex = noteOrder.indexOf(note);
          const newScaleIndices = newScaleNotes.map(n => noteOrder.indexOf(n));
          
          // Find the closest valid note
          let closestIndex = newScaleIndices[0];
          let minDistance = Math.abs(currentIndex - closestIndex);
          
          for (const scaleIndex of newScaleIndices) {
            const distance = Math.abs(currentIndex - scaleIndex);
            if (distance < minDistance) {
              minDistance = distance;
              closestIndex = scaleIndex;
            }
          }
          
          return noteOrder[closestIndex];
        }
      });
      
      return { ...polygon, notes: updatedNotes };
    });
    
    // Update selected polygon if it exists
    let updatedSelectedPolygon = null;
    if (selectedPolygon) {
      const updatedSelectedNotes = selectedPolygon.notes.map((note: string | null) => {
        if (!note) return null;
        
        if (newScaleNotes.includes(note)) {
          return note;
        } else {
          const currentIndex = noteOrder.indexOf(note);
          const newScaleIndices = newScaleNotes.map(n => noteOrder.indexOf(n));
          
          let closestIndex = newScaleIndices[0];
          let minDistance = Math.abs(currentIndex - closestIndex);
          
          for (const scaleIndex of newScaleIndices) {
            const distance = Math.abs(currentIndex - scaleIndex);
            if (distance < minDistance) {
              minDistance = distance;
              closestIndex = scaleIndex;
            }
          }
          
          return noteOrder[closestIndex];
        }
      });
      
      updatedSelectedPolygon = { ...selectedPolygon, notes: updatedSelectedNotes };
    }
    
    return { updatedPolygons, updatedSelectedPolygon };
  };

  return {
    selectedScale: 'Major',
    rootNote: 'C',
    getScaleNotes,
    getNoteColor,
    updatePolygonNotesForNewScale
  };
};
