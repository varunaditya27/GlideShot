"use client";

import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { Intersection } from 'three';

export interface PlayerControlsProps {
  ballPosition: [number, number, number];
  onShoot: (velocity: THREE.Vector3) => void;
  onAimStart?: () => void;
  onAimEnd?: () => void;
  onAimChange?: (power: number) => void;
}

export interface PlayerControlsHandle {
  getDirection: () => THREE.Vector3;
  getPower: () => number;
  isAiming: () => boolean;
}

const PlayerControls = forwardRef<PlayerControlsHandle, PlayerControlsProps>(function PlayerControls({ ballPosition, onShoot, onAimStart, onAimEnd, onAimChange }, ref) {
  const [aim, setAim] = useState({ direction: new THREE.Vector3(0, 0, -1), power: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const startDragPoint = useRef<THREE.Vector3 | null>(null);

  const planeRef = useRef<THREE.Mesh>(null!);
  const getPointOnPlane = (event: ThreeEvent<PointerEvent>): THREE.Vector3 | null => {
    const intersection = event.intersections.find((i: Intersection) => i.object === planeRef.current);
    return intersection ? intersection.point : null;
  };

  const onPointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    const point = getPointOnPlane(event);
    if (point) {
      setIsDragging(true);
      startDragPoint.current = point;
      onAimStart?.();
    }
  };

  const onPointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (isDragging) event.stopPropagation();
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
    onAimChange?.(power);
  };

  const onPointerUp = (event?: ThreeEvent<PointerEvent>) => {
    if (event) event.stopPropagation();
    if (isDragging) {
      const shotVelocity = aim.direction.clone().multiplyScalar(aim.power * 2); // Multiply power for more oomph
      onShoot(shotVelocity);
      setIsDragging(false);
      startDragPoint.current = null;
      setAim({ direction: aim.direction, power: 0 }); // Reset power but keep direction
      onAimEnd?.();
      onAimChange?.(0);
    }
  };

  // (Aiming visuals + prediction handled by AimAssist component now)

  useImperativeHandle(ref, () => ({
    getDirection: () => aim.direction,
    getPower: () => aim.power,
    isAiming: () => isDragging,
  }), [aim.direction, aim.power, isDragging]);

  return (
    <group>
      <mesh
        ref={planeRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, 0]}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerOut={onPointerUp} // Also trigger on pointer out
      >
        <planeGeometry args={[20, 30]} />
        {/* Transparent material to keep mesh in raycast without visually blocking */}
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* (Visual aim elements moved to AimAssist component) */}
    </group>
  );
});

export default PlayerControls;
