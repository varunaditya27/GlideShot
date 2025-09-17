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
        <meshStandardMaterial color="limegreen" />
      </Plane>

      {/* Walls */}
      {/* Back Wall */}
      <Box args={[groundSize[0] + wallThickness, wallHeight, wallThickness]} position={[0, wallHeight / 2, -groundSize[1] / 2]}>
        <meshStandardMaterial color="darkgrey" />
      </Box>
      {/* Front Wall */}
      <Box args={[groundSize[0] + wallThickness, wallHeight, wallThickness]} position={[0, wallHeight / 2, groundSize[1] / 2]}>
        <meshStandardMaterial color="darkgrey" />
      </Box>
      {/* Left Wall */}
      <Box args={[wallThickness, wallHeight, groundSize[1]]} position={[-groundSize[0] / 2, wallHeight / 2, 0]}>
        <meshStandardMaterial color="darkgrey" />
      </Box>
      {/* Right Wall */}
      <Box args={[wallThickness, wallHeight, groundSize[1]]} position={[groundSize[0] / 2, wallHeight / 2, 0]}>
        <meshStandardMaterial color="darkgrey" />
      </Box>

      {/* Hole */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={hole}>
        <cylinderGeometry args={[0.2, 0.2, 0.1, 32]} />
        <meshStandardMaterial color="black" />
      </mesh>
    </>
  );
}
