"use client";

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';

/**
 * AimAssist
 * Lightweight, allocation-free (per frame) predictive trajectory + power gradient line.
 * Props are kept simple so PlayerControls can drive it without re-renders.
 */
export interface AimAssistProps {
  active: boolean;                // whether user is currently aiming
  origin: THREE.Vector3;          // ball world position (reference, not cloned)
  direction: THREE.Vector3;       // normalized shot direction
  power: number;                  // raw power 0..5
  maxPower?: number;              // default 5
}

export default function AimAssist({ active, origin, direction, power, maxPower = 5 }: AimAssistProps) {
  // Refs for ghost ball + trajectory dots
  const ghostRef = useRef<THREE.Mesh>(null!);
  const dotsRef = useRef<THREE.Mesh[]>([]);
  const dotCount = 12;
  const positions = useRef<THREE.Vector3[]>([]);

  // Initialize dot meshes once
  useEffect(() => {
    if (dotsRef.current.length) return; // already built
    dotsRef.current = [];
    positions.current = [];
    for (let i = 0; i < dotCount; i++) {
      positions.current.push(new THREE.Vector3());
    }
  }, []);

  // Pre-allocate line points (start + end)
  const linePoints = useRef([new THREE.Vector3(), new THREE.Vector3()]);

  // Power color gradient (green->yellow->red) without HSL conversions each frame
  const computeColor = (t: number) => {
    // Interpolate in two segments: green(0) -> yellow(0.5) -> red(1)
    const clamp = (v: number) => Math.min(1, Math.max(0, v));
    t = clamp(t);
    let r: number, g: number, b: number;
    if (t < 0.5) {
      const k = t / 0.5; // 0..1
      r = k; g = 1; b = 0; // (0,1,0) -> (1,1,0)
    } else {
      const k = (t - 0.5) / 0.5; // 0..1
      r = 1; g = 1 - k; b = 0; // (1,1,0) -> (1,0,0)
    }
    const toHex = (c: number) => Math.round(c * 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  const powerNorm = Math.min(power, maxPower) / maxPower;
  const color = computeColor(powerNorm);

  // Update visual geometry every frame when active
  useFrame(() => {
    if (!active) return;
    // Line
    linePoints.current[0].copy(origin);
    linePoints.current[1].copy(origin).addScaledVector(direction, 0.5 + powerNorm * 3.2);
    // Ghost ball position (at exaggerated end)
    if (ghostRef.current) {
      ghostRef.current.position.copy(origin).addScaledVector(direction, 0.5 + powerNorm * 3.0);
      const mat = ghostRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.15 + 0.35 * powerNorm;
    }
    // Predictive decay dots (geometric falloff approximation)
    const baseStep = 0.55 + powerNorm * 0.9;
    const decay = 0.80;
    for (let i = 0; i < dotCount; i++) {
      const geoSum = (1 - Math.pow(decay, i + 1)) / (1 - decay);
      const dist = baseStep * geoSum;
      positions.current[i].copy(origin).addScaledVector(direction, dist);
      const mesh = dotsRef.current[i];
      if (mesh) {
        mesh.position.set(positions.current[i].x, 0.02, positions.current[i].z);
        const t = i / dotCount;
        const alpha = 0.85 * (1 - t);
        const mat = mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = alpha;
        mesh.scale.setScalar(0.08 + t * 0.07);
      }
    }
  });

  if (!active) return null;

  return (
    <group>
      {/* Main direction line (double: sharp + glow) */}
      <Line points={linePoints.current} color={color} lineWidth={2} />
      <Line points={linePoints.current} color={color} lineWidth={5} transparent opacity={0.18} />

      {/* Ghost ball */}
      <mesh ref={ghostRef} position={[origin.x, origin.y, origin.z]}>
        <sphereGeometry args={[0.2, 20, 20]} />
        <meshBasicMaterial color={color} transparent opacity={0.2} depthWrite={false} />
      </mesh>

      {/* Dots */}
      {positions.current.map((_, i) => (
        <mesh
          key={i}
          ref={(m) => { if (m) dotsRef.current[i] = m; }}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <circleGeometry args={[0.08, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.0} />
        </mesh>
      ))}
    </group>
  );
}
