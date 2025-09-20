"use client";

import React from 'react';

interface HUDProps {
  strokes: number;
  par: number;
  power?: number; // optional aiming power 0..5
  onReplay: () => void;
  canReplay: boolean;
}

export default function HUD({ strokes, par, power = 0, onReplay, canReplay }: HUDProps) {
  const relative = strokes - par; // could be negative / zero / positive
  const relLabel = relative === 0 ? 'E' : (relative > 0 ? `+${relative}` : `${relative}`);
  const relColor = relative === 0 ? '#e2e8f0' : (relative > 0 ? '#ef4444' : '#22c55e');

  const card: React.CSSProperties = {
    position: 'absolute',
    top: 16,
    left: 16,
    padding: '14px 18px 16px 18px',
    background: 'linear-gradient(145deg, rgba(15,17,22,0.72) 0%, rgba(19,22,29,0.55) 60%)',
    border: '1px solid rgba(255,255,255,0.09)',
    boxShadow: '0 4px 16px -2px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03) inset',
    backdropFilter: 'blur(9px)',
    WebkitBackdropFilter: 'blur(9px)',
    color: '#f8fafc',
    borderRadius: 18,
    fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
    fontSize: 15,
    lineHeight: 1.25,
    minWidth: 240,
  };

  const label: React.CSSProperties = { fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', opacity: 0.6, fontWeight: 600 };
  const number: React.CSSProperties = { fontWeight: 800, fontSize: 26, letterSpacing: 0.5 };

  const barOuter: React.CSSProperties = {
    marginTop: 14,
    width: 230,
    height: 10,
    background: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    overflow: 'hidden',
    position: 'relative',
  };
  const barInner: React.CSSProperties = {
    width: `${(Math.min(power, 5) / 5) * 100}%`,
    height: '100%',
    background: 'linear-gradient(90deg, #22c55e 0%, #facc15 55%, #ef4444 100%)',
    boxShadow: '0 0 0 1px rgba(0,0,0,0.4) inset, 0 0 12px -2px rgba(250,204,21,0.35)',
    transition: 'width 70ms linear',
  };

  const ticks: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    justifyContent: 'space-between',
    pointerEvents: 'none',
  };

  const tickElem = Array.from({ length: 6 }, (_, i) => (
    <div key={i} style={{ width: 1, height: '100%', background: 'rgba(255,255,255,0.22)', opacity: i === 0 || i === 5 ? 0.35 : 0.18 }} />
  ));

  const replayBtn: React.CSSProperties = {
    pointerEvents: 'auto',
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.15)',
    color: 'white',
    padding: '8px 14px',
    borderRadius: 99,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 150ms, transform 150ms',
  };

  return (
    <div style={card} aria-label={`Score card: strokes ${strokes}, par ${par}, relative ${relLabel}`}>
      <div style={{ display: 'flex', gap: 22, alignItems: 'flex-end' }}>
        <div>
          <div style={label}>Strokes</div>
          <div style={number}>{strokes}</div>
        </div>
        <div>
          <div style={label}>Par</div>
          <div style={number}>{par}</div>
        </div>
        <div>
          <div style={label}>Relative</div>
          <div style={{ ...number, fontSize: 22, color: relColor }}>{relLabel}</div>
        </div>
        <button
          onClick={onReplay}
          disabled={!canReplay}
          style={{ ...replayBtn, opacity: canReplay ? 1 : 0.4, cursor: canReplay ? 'pointer' : 'not-allowed' }}
          onMouseOver={e => canReplay ? (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)') : null}
          onMouseOut={e => canReplay ? (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)') : null}
        >
          Replay
        </button>
      </div>
      <div style={{ marginTop: 6, fontSize: 11, opacity: 0.55, letterSpacing: 0.5 }}>Drag from ball to aim – release to shoot</div>
      <div style={barOuter} aria-label={`Power ${(Math.min(power, 5) / 5 * 100).toFixed(0)} percent`}>
        <div style={barInner} />
        <div style={ticks}>{tickElem}</div>
        <div style={{ position: 'absolute', top: -16, right: 0, fontSize: 11, opacity: 0.7 }}>Power</div>
      </div>
    </div>
  );
}
