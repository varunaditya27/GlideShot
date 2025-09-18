import React from 'react';
import { Sphere } from '@react-three/drei';

interface BallProps {
  position: [number, number, number];
}

export default function Ball({ position }: BallProps) {
  return (
    <Sphere args={[0.2, 16, 16]} position={position}>
      <meshStandardMaterial color="white" />
    </Sphere>
  );
}
