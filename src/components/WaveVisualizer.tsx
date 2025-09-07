import React, { useRef, useEffect } from 'react';
import './WaveVisualizer.css';

interface WaveVisualizerProps {
  waveShape: 'sine' | 'square' | 'triangle' | 'sawtooth';
  width?: number;
  height?: number;
  backgroundColor?: string;
  waveColor?: string;
}

export const WaveVisualizer: React.FC<WaveVisualizerProps> = ({
  waveShape,
  width = 280,
  height = 80,
  backgroundColor = '#000000',
  waveColor = '#00ff00'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate static wave shape for visualization
  const generateWaveShape = (shape: string, length: number): Float32Array => {
    const wavetable = new Float32Array(length);

    for (let i = 0; i < length; i++) {
      const phase = (i / length) * 2 * Math.PI; // 0 to 2π for proper wave shapes

      switch (shape) {
        case 'sine':
          wavetable[i] = Math.sin(phase); // Pure sine wave: sin(0) to sin(2π)
          break;
        case 'square':
          wavetable[i] = Math.sin(phase) >= 0 ? 1 : -1; // Perfect square wave
          break;
        case 'triangle':
          // Triangle wave: proper triangle shape
          wavetable[i] = Math.asin(Math.sin(phase)) * 2 / Math.PI;
          break;
        case 'sawtooth':
          // Sawtooth wave: linear ramp from -1 to 1
          wavetable[i] = (phase / Math.PI) - 1;
          break;
        case 'noise':
          // Generate consistent noise pattern (not random each time)
          const seed = shape.charCodeAt(0) + i * 0.1;
          wavetable[i] = (Math.sin(seed) * Math.cos(seed * 1.3) + Math.sin(seed * 0.7)) * 0.5;
          break;
        default:
          wavetable[i] = Math.sin(phase);
      }
    }

    return wavetable;
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Generate wave shape
    const wave = generateWaveShape(waveShape, 512);

    // Draw waveform
    ctx.lineWidth = 2;
    ctx.strokeStyle = waveColor;
    ctx.beginPath();

    const centerY = height / 2;
    const amplitude = height * 0.4; // 40% of height for wave amplitude

    for (let i = 0; i < 512; i++) {
      const x = (i / 512) * width;
      const y = centerY - (wave[i] * amplitude);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();

    // Draw center line
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

  }, [waveShape, width, height, backgroundColor, waveColor]);

  return (
    <div className="wave-visualizer">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="wave-canvas"
      />
    </div>
  );
};

export default WaveVisualizer;
