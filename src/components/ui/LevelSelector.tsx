// src/components/ui/LevelSelector.tsx
"use client";

import React from 'react';

interface Level {
  id: string;
  name: string;
  par: number;
}

interface LevelSelectorProps {
  levels: Level[];
  onSelectLevel: (index: number) => void;
}

const LevelSelector: React.FC<LevelSelectorProps> = ({ levels, onSelectLevel }) => {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      color: 'white',
      zIndex: 100,
      fontFamily: "'Montserrat', 'Geist', 'Fira Sans', Arial, sans-serif",
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '2rem', fontWeight: 800 }}>Select a Level</h1>
      <div style={{ display: 'flex', gap: '2rem' }}>
        {levels.map((level, index) => (
          <div key={level.id} style={{
            padding: '2rem',
            border: '2px solid white',
            borderRadius: '10px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'transform 0.2s, background-color 0.2s',
          }} 
          onClick={() => onSelectLevel(index)}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          >
            <h2 style={{ fontSize: '2rem', margin: 0, fontWeight: 700 }}>{level.name}</h2>
            <p style={{ fontSize: '1.2rem', margin: '0.5rem 0 0' }}>Par: {level.par}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LevelSelector;
