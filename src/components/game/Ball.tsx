import React from 'react';
import { Sphere, Trail } from '@react-three/drei';

interface BallProps {
  position: [number, number, number];
}

export default function Ball({ position }: BallProps) {
  return (
    <group>
      <Trail width={2} color="#ffcc00" length={0.4} decay={0.9} attenuation={(t) => t}>
        <Sphere args={[0.2, 32, 32]} position={position}>
          <meshPhysicalMaterial color="#ffffff" roughness={0.2} metalness={0.1} clearcoat={0.7} />
        </Sphere>
      </Trail>
    </group>
  );
}
