"use client";

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Box } from '@react-three/drei';

export interface MovingObstacleData {
  id: string;
  shape: 'box'; // For now, only box is supported
  size: [number, number, number];
  path: [number, number, number][];
  speed: number;
  mode: 'loop' | 'ping-pong';
}

export interface MovingObstacleRef {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
}

interface MovingObstacleProps {
  data: MovingObstacleData;
  obstacleRef: React.RefObject<MovingObstacleRef>;
}

const MovingObstacle: React.FC<MovingObstacleProps> = ({ data, obstacleRef }) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const lastPosition = useRef(new THREE.Vector3());

  const { path, speed, mode, size } = data;
  const points = path.map(p => new THREE.Vector3(...p));

  // For now, let's assume a simple path between two points for ping-pong
  const startPoint = points[0];
  const endPoint = points[1];
  const journeyLength = startPoint.distanceTo(endPoint);
  const duration = journeyLength / speed;

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const time = state.clock.getElapsedTime();
    let progress = 0;

    if (mode === 'ping-pong') {
      const pingPongTime = time % (duration * 2);
      if (pingPongTime <= duration) {
        progress = pingPongTime / duration;
        meshRef.current.position.lerpVectors(startPoint, endPoint, progress);
      } else {
        progress = (pingPongTime - duration) / duration;
        meshRef.current.position.lerpVectors(endPoint, startPoint, progress);
      }
    } else { // 'loop' mode for CatmullRomCurve3 would be needed for more points
      progress = (time % duration) / duration;
      meshRef.current.position.lerpVectors(startPoint, endPoint, progress);
    }

    if (obstacleRef.current) {
        obstacleRef.current.velocity.subVectors(meshRef.current.position, lastPosition.current).divideScalar(delta);
        lastPosition.current.copy(meshRef.current.position);
        obstacleRef.current.position.copy(meshRef.current.position);
    }
  });

  // Set initial position
  React.useEffect(() => {
    if(meshRef.current) {
        meshRef.current.position.copy(startPoint);
        lastPosition.current.copy(startPoint);
        if (obstacleRef.current) {
            obstacleRef.current.position.copy(startPoint);
            obstacleRef.current.velocity.set(0,0,0);
        }
    }
  }, [startPoint, obstacleRef]);

  return (
    <Box args={size} ref={meshRef}>
      <meshStandardMaterial color="#ff6347" roughness={0.7} metalness={0.1} />
    </Box>
  );
};

export default MovingObstacle;
