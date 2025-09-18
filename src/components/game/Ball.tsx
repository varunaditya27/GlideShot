import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface BallProps {
  positionRef: React.MutableRefObject<THREE.Vector3>;
  velocityRef?: React.MutableRefObject<THREE.Vector3>;
  radius?: number;
}

export default function Ball({ positionRef, velocityRef, radius = 0.2 }: BallProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const shadowRef = useRef<THREE.Mesh>(null!);
  const up = new THREE.Vector3(0, 1, 0);

  useFrame((_, dt) => {
    const pos = positionRef.current;
    const vel = velocityRef?.current ?? new THREE.Vector3();
    const spd = vel.length();

    if (meshRef.current) {
      meshRef.current.position.copy(pos);

      // Apply rolling rotation based on velocity
      if (spd > 1e-4) {
        const axis = new THREE.Vector3().copy(vel).cross(up).normalize();
        const angle = (spd * dt) / radius; // angle = distance/radius
        if (isFinite(axis.x) && isFinite(axis.y) && isFinite(axis.z)) {
          meshRef.current.rotateOnAxis(axis, angle);
        }
      }
    }

    // Simple blob shadow under the ball (cheap faux shadow)
    if (shadowRef.current) {
      shadowRef.current.position.set(pos.x, 0.001, pos.z);
      const s = velocityRef ? THREE.MathUtils.clamp(0.6 + Math.min(spd, 5) * 0.05, 0.6, 1.0) : 0.8;
      shadowRef.current.scale.set(s, s, 1);
    }
  });

  return (
    <group>
      <mesh ref={meshRef} castShadow={false}>
        <sphereGeometry args={[radius, 16, 16]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.05} />
      </mesh>
      <mesh ref={shadowRef} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius * 1.2, 16]} />
        <meshBasicMaterial color="black" transparent opacity={0.35} />
      </mesh>
    </group>
  );
}
