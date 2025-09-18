"use client";

import React from 'react';

interface HUDProps {
  strokes: number;
  par: number;
  power?: number; // optional aiming power 0..5
}

export default function HUD({ strokes, par, power = 0 }: HUDProps) {
  const hudStyle: React.CSSProperties = {
    position: 'absolute',
    top: '20px',
    left: '20px',
    padding: '10px 20px',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    color: 'white',
    borderRadius: '10px',
    fontFamily: 'Arial, sans-serif',
    fontSize: '24px',
    pointerEvents: 'none',
  };

  return (
    <div style={hudStyle}>
      <p>Strokes: {strokes}</p>
      <p>Par: {par}</p>
      <div style={{ marginTop: 6, width: 160, height: 10, background: 'rgba(255,255,255,0.2)', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ width: `${(Math.min(power, 5) / 5) * 100}%`, height: '100%', background: '#ffcc00' }} />
      </div>
    </div>
  );
}
