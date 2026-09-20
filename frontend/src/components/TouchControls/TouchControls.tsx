/**
 * TouchControls — D-pad for mobile devices.
 * Visible only on touch devices (CSS: hover:none + pointer:coarse).
 */
import React from 'react';
import type { Direction } from '../../game/Direction';

interface Props {
  onDirection: (dir: Direction) => void;
  onAction:    (a: 'ENTER' | 'ESCAPE') => void;
}

const btn = (label: string, title: string, onClick: () => void, style?: React.CSSProperties) => (
  <button
    key={label}
    aria-label={title}
    onClick={onClick}
    style={{
      background: 'rgba(168,184,106,0.2)',
      border: '2px solid rgba(168,184,106,0.4)',
      color: '#A8B86A',
      borderRadius: 6,
      width: 44, height: 44,
      fontSize: 18, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      WebkitTapHighlightColor: 'transparent',
      ...style,
    }}
  >
    {label}
  </button>
);

const TouchControls: React.FC<Props> = ({ onDirection, onAction }) => (
  <div className="touch-controls" role="group" aria-label="Directional controls">
    {/* Pause button — top right of controls area */}
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
      {btn('⏸', 'Pause / Resume', () => onAction('ESCAPE'), { fontSize: 14 })}
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '44px 44px 44px', gap: 6 }}>
      <div />
      {btn('▲', 'Up',    () => onDirection('UP'))}
      <div />
      {btn('◀', 'Left',  () => onDirection('LEFT'))}
      <button
        aria-label="Action / Select"
        onClick={() => onAction('ENTER')}
        style={{
          background: 'rgba(36,59,22,0.6)',
          border: '2px solid rgba(168,184,106,0.5)',
          borderRadius: '50%',
          width: 44, height: 44, cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
        }}
      />
      {btn('▶', 'Right', () => onDirection('RIGHT'))}
      <div />
      {btn('▼', 'Down',  () => onDirection('DOWN'))}
      <div />
    </div>
  </div>
);

export default TouchControls;
