"use client";

import React from 'react';

interface HUDProps {
  strokes: number;
  par: number;
}

export default function HUD({ strokes, par }: HUDProps) {
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
  };

  return (
    <div style={hudStyle}>
      <p>Strokes: {strokes}</p>
      <p>Par: {par}</p>
    </div>
  );
}
