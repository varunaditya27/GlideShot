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
    top: 16,
    left: 16,
    padding: '12px 16px',
    background: 'rgba(12,12,14,0.55)',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    color: '#f7f7f7',
    borderRadius: 12,
    fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
    fontSize: 16,
    lineHeight: 1.2,
    pointerEvents: 'none',
  };

  return (
    <div style={hudStyle}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
        <div style={{ fontWeight: 700, fontSize: 18 }}>Strokes</div>
        <div style={{ fontWeight: 800, fontSize: 22, letterSpacing: 0.3 }}>{strokes}</div>
        <div style={{ opacity: 0.7 }}>|</div>
        <div style={{ fontWeight: 700, fontSize: 18 }}>Par</div>
        <div style={{ fontWeight: 800, fontSize: 22, letterSpacing: 0.3 }}>{par}</div>
      </div>
      <div style={{ marginTop: 10, width: 200, height: 8, background: 'rgba(255,255,255,0.16)', borderRadius: 999, overflow: 'hidden', position: 'relative' }}>
        <div
          style={{
            width: `${(Math.min(power, 5) / 5) * 100}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #22c55e 0%, #facc15 50%, #ef4444 100%)',
            boxShadow: '0 0 10px rgba(250, 204, 21, 0.35) inset',
            transition: 'width 80ms linear',
          }}
        />
        <div style={{ position: 'absolute', top: -16, right: 0, fontSize: 11, opacity: 0.7 }}>Power</div>
      </div>
    </div>
  );
}
