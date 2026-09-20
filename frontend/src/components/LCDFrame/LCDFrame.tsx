/**
 * LCDFrame — renders the bezel + canvas.
 * Computes the maximum LCD size that fits the available area while
 * preserving the 84:48 = 1.75 aspect ratio.
 *
 * This component owns the canvas ref and drives CanvasRenderer.
 */
import React, { useRef, useEffect, useMemo } from 'react';
import { renderFrame } from '../../rendering/CanvasRenderer';
import type { GameState } from '../../game/GameState';
import '../../styles/lcd.css';

const ASPECT = 84 / 48; // 1.75 — IMMUTABLE

interface Props {
  gameState:     GameState;
  availableWidth:  number;
  availableHeight: number;
}

const LCDFrame: React.FC<Props> = ({ gameState, availableWidth, availableHeight }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Compute the largest LCD that fits while preserving 1.75:1
  const { lcdW, lcdH } = useMemo(() => {
    const fromH = availableHeight * ASPECT;
    const w = Math.min(availableWidth, fromH);
    const h = w / ASPECT;
    return { lcdW: Math.floor(w), lcdH: Math.floor(h) };
  }, [availableWidth, availableHeight]);

  // Render every time game state changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderFrame(canvas, gameState);
  }, [gameState]);

  return (
    <div
      className="lcd-frame"
      style={{ width: lcdW, height: lcdH }}
      data-testid="lcd-frame"
    >
      <div className="lcd-bezel" style={{ width: '100%', height: '100%' }}>
        <canvas
          ref={canvasRef}
          className="lcd-canvas"
          aria-label="Nokia Snake game display"
          role="img"
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
};

export default LCDFrame;
