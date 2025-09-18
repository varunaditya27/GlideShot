import React from 'react';
import { Plane, Box } from '@react-three/drei';

export default function Level({ hole = [0, 0.01, -10] as [number, number, number] }) {
  const groundSize = [20, 30]; // width, height
  const wallThickness = 0.5;
  const wallHeight = 2;

  return (
    <>
      {/* Ground */}
      <Plane args={[groundSize[0], groundSize[1]]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#8bc34a" roughness={0.8} metalness={0.05} />
      </Plane>

      {/* Walls */}
      {/* Back Wall */}
      <Box args={[groundSize[0] + wallThickness, wallHeight, wallThickness]} position={[0, wallHeight / 2, -groundSize[1] / 2]}>
        <meshStandardMaterial color="#5f5f5f" roughness={0.9} metalness={0.02} />
      </Box>
      {/* Front Wall */}
      <Box args={[groundSize[0] + wallThickness, wallHeight, wallThickness]} position={[0, wallHeight / 2, groundSize[1] / 2]}>
        <meshStandardMaterial color="#5f5f5f" roughness={0.9} metalness={0.02} />
      </Box>
      {/* Left Wall */}
      <Box args={[wallThickness, wallHeight, groundSize[1]]} position={[-groundSize[0] / 2, wallHeight / 2, 0]}>
        <meshStandardMaterial color="#5f5f5f" roughness={0.9} metalness={0.02} />
      </Box>
      {/* Right Wall */}
      <Box args={[wallThickness, wallHeight, groundSize[1]]} position={[groundSize[0] / 2, wallHeight / 2, 0]}>
        <meshStandardMaterial color="#5f5f5f" roughness={0.9} metalness={0.02} />
      </Box>

      {/* Hole with enhanced visibility */}
      {/* Hole rim for better definition */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[hole[0], hole[1] + 0.001, hole[2]]}>
        <ringGeometry args={[0.2, 0.28, 32]} />
        <meshStandardMaterial color="#2e2e2e" roughness={0.8} />
      </mesh>
      {/* Main hole */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={hole}>
        <cylinderGeometry args={[0.2, 0.2, 0.15, 32]} />
        <meshStandardMaterial color="black" />
      </mesh>
      {/* Glowing ring around hole for better visibility */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[hole[0], hole[1] + 0.002, hole[2]]}>
        <ringGeometry args={[0.28, 0.32, 32]} />
        <meshStandardMaterial color="#ffeb3b" emissive="#ffeb3b" emissiveIntensity={0.3} />
      </mesh>

      {/* Flag pole and flag */}
      <mesh position={[hole[0], 1, hole[2]]}>
        <cylinderGeometry args={[0.03, 0.03, 2, 12]} />
        <meshStandardMaterial color="#e0e0e0" metalness={0.2} roughness={0.6} />
      </mesh>
      <mesh position={[hole[0] + 0.35, 1.8, hole[2]]} rotation={[0, Math.PI, 0]}>
        <boxGeometry args={[0.7, 0.35, 0.01]} />
        <meshStandardMaterial color="#f44336" />
      </mesh>
    </>
  );
}
