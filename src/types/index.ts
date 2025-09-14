// Shared types for the ShapeSequencer application

export interface Polygon {
  id: number;
  sides: number;
  radius: number;
  color: string;
  active: boolean;
  notes: (string | null)[];
  synthSettings: any;
}

export interface PlayheadState {
  angle: number;
  isPlaying: boolean;
  rpm: number;
}

export interface PolygonSettings {
  spacing: number;
}
