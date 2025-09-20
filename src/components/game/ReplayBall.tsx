"use client";

import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Sphere } from '@react-three/drei';

export interface PathEntry {
  time: number;
  position: THREE.Vector3;
}

interface ReplayBallProps {
  path: PathEntry[];
  onReplayFinish: () => void;
  ballPositionRef: React.MutableRefObject<THREE.Vector3>;
}

const ReplayBall: React.FC<ReplayBallProps> = ({ path, onReplayFinish, ballPositionRef }) => {
  const replayStartClockTime = useRef(0);

  useEffect(() => {
    replayStartClockTime.current = performance.now() / 1000;
  }, [path]);

  useFrame(() => {
    if (path.length < 2) {
      onReplayFinish();
      return;
    }

    const pathStartTime = path[0].time;
    const elapsedPathTime = (performance.now() / 1000 - replayStartClockTime.current) + pathStartTime;

    const nextPointIndex = path.findIndex(p => p.time > elapsedPathTime);

    if (nextPointIndex === -1) {
      // Reached the end
      ballPositionRef.current.copy(path[path.length - 1].position);
      onReplayFinish();
      return;
    }

    const prevPoint = path[nextPointIndex - 1] || path[0];
    const nextPoint = path[nextPointIndex];
    
    const segmentDuration = nextPoint.time - prevPoint.time;
    const timeIntoSegment = elapsedPathTime - prevPoint.time;
    const alpha = Math.max(0, Math.min(1, timeIntoSegment / segmentDuration));

    ballPositionRef.current.lerpVectors(prevPoint.position, nextPoint.position, alpha);
  });

  return (
    <Sphere args={[0.2, 32, 32]} position={ballPositionRef.current}>
      <meshStandardMaterial color="lightblue" transparent opacity={0.7} wireframe />
    </Sphere>
  );
};

export default ReplayBall;
