"use client";

import React, { useState, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { Arrow } from '@react-three/drei';
import * as THREE from 'three';

interface PlayerControlsProps {
  ballPosition: [number, number, number];
  onShoot: (velocity: THREE.Vector3) => void;
}

export default function PlayerControls({ ballPosition, onShoot }: PlayerControlsProps) {
  const [aim, setAim] = useState({ direction: new THREE.Vector3(0, 0, -1), power: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const startDragPoint = useRef<THREE.Vector3 | null>(null);

  const planeRef = useRef<THREE.Mesh>(null!);
  const { camera } = useThree();

  const getPointOnPlane = (event: any): THREE.Vector3 | null => {
    const intersection = event.intersections.find((i: any) => i.object === planeRef.current);
    return intersection ? intersection.point : null;
  };

  const onPointerDown = (event: any) => {
    const point = getPointOnPlane(event);
    if (point) {
      setIsDragging(true);
      startDragPoint.current = point;
    }
  };

  const onPointerMove = (event: any) => {
    const point = getPointOnPlane(event);
    if (!point) return;

    const ballVector = new THREE.Vector3(...ballPosition);
    let direction = point.clone().sub(ballVector).normalize();
    let power = 0;

    if (isDragging && startDragPoint.current) {
      direction = startDragPoint.current.clone().sub(point).normalize();
      power = Math.min(startDragPoint.current.distanceTo(point), 5); // Max power of 5
    }

    setAim({ direction, power });
  };

  const onPointerUp = () => {
    if (isDragging) {
      const shotVelocity = aim.direction.clone().multiplyScalar(aim.power * 2); // Multiply power for more oomph
      onShoot(shotVelocity);
      setIsDragging(false);
      startDragPoint.current = null;
      setAim({ direction: aim.direction, power: 0 }); // Reset power but keep direction
    }
  };

  // We need to calculate the arrow's direction vector from the aim state
  const arrowVector = new THREE.Vector3().copy(aim.direction).multiplyScalar(aim.power + 0.5);

  return (
    <>
      <mesh
        ref={planeRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, 0]}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerOut={onPointerUp} // Also trigger on pointer out
        visible={false}
      >
        <planeGeometry args={[20, 30]} />
      </mesh>

      {/* Aiming Arrow: its length now represents power */}
      <Arrow
        args={[arrowVector.normalize(), arrowVector.length(), 0.2, 0.5]}
        position={ballPosition}
        color={isDragging ? 'red' : 'yellow'}
      />
    </>
  );
}
