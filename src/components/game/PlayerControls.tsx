"use client";

import React, { useState, useRef } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { Intersection } from 'three';
import { Line } from '@react-three/drei';

interface PlayerControlsProps {
  ballPosition: [number, number, number];
  onShoot: (velocity: THREE.Vector3) => void;
  onAimStart?: () => void;
  onAimEnd?: () => void;
  onAimChange?: (power: number) => void;
}

export default function PlayerControls({ ballPosition, onShoot, onAimStart, onAimEnd, onAimChange }: PlayerControlsProps) {
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

  // We need to calculate the arrow's direction vector from the aim state
  const arrowVector = new THREE.Vector3(aim.direction.x, aim.direction.y, aim.direction.z).multiplyScalar(aim.power + 0.5);
  const start = new THREE.Vector3(ballPosition[0], ballPosition[1], ballPosition[2]);
  const end = new THREE.Vector3(start.x + arrowVector.x, start.y + arrowVector.y, start.z + arrowVector.z);
  // Removed 3D cone arrowhead to keep aim assist minimal and clean

  // Power-based color (green -> yellow -> red)
  const powerNorm = Math.min(aim.power, 5) / 5; // 0..1
  const hue = 120 - 120 * powerNorm; // 120 (green) to 0 (red)
  const hslToHex = (h: number, s: number, l: number) => {
    s /= 100; l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (0 <= h && h < 60) { r = c; g = x; b = 0; }
    else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
    else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
    else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
    else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };
  const powerColor = hslToHex(hue, 90, 55);

  // Predictive trajectory preview (very cheap): geometric falloff to mimic damping
  const dotCount = 10;
  const baseStep = 0.6 + powerNorm * 0.9; // scaled by power
  const decay = 0.82; // 0..1, lower = quicker slowdown
  const dots: THREE.Vector3[] = [];
  if (isDragging) {
    for (let i = 0; i < dotCount; i++) {
      const geoSum = (1 - Math.pow(decay, i + 1)) / (1 - decay); // geometric sum
      const dist = baseStep * geoSum;
      const p = new THREE.Vector3(
        start.x + aim.direction.x * dist,
        0.02,
        start.z + aim.direction.z * dist
      );
      dots.push(p);
    }
  }

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

      {/* Aiming line + soft glow */}
      {isDragging && (
        <>
          <Line points={[start, end]} color={powerColor} lineWidth={2} />
          <Line points={[start, end]} color={powerColor} lineWidth={5} transparent opacity={0.15} />
        </>
      )}
      {/* Aiming ring at the ball */}
      {isDragging && (
        <>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[ballPosition[0], 0.02, ballPosition[2]]}>
            <ringGeometry args={[0.22, 0.25 + Math.min(aim.power, 5) * 0.05, 48]} />
            <meshBasicMaterial color={powerColor} transparent opacity={0.9} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[ballPosition[0], 0.021, ballPosition[2]]}>
            <ringGeometry args={[0.26, 0.34, 48]} />
            <meshBasicMaterial color={powerColor} transparent opacity={0.22} blending={THREE.AdditiveBlending} />
          </mesh>
        </>
      )}
      {/* Arrowhead removed per design refinement */}

      {/* Dotted trajectory with falloff */}
      {isDragging && dots.map((p, idx) => {
        const t = idx / dotCount; // 0..1
        const size = 0.065 + t * 0.05;
        const alpha = 0.9 * (1 - t);
        return (
          <group key={idx}>
            <mesh position={[p.x, p.y, p.z]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[size, 16]} />
              <meshBasicMaterial color={powerColor} transparent opacity={alpha} />
            </mesh>
            <mesh position={[p.x, p.y + 0.0005, p.z]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[size * 1.25, 16]} />
              <meshBasicMaterial color={powerColor} transparent opacity={alpha * 0.18} blending={THREE.AdditiveBlending} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
