"use client";

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

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
  // CONFIG (easy tweak section)
  const TRAIL_POINT_COUNT = 24;           // resolution of curved trail
  const MAX_TRAIL_DIST = 3.6;             // max raw length
  const ARC_HEIGHT_FACTOR = 0.12;         // vertical lift factor for arc illusion
  const DOT_COUNT = 10;                   // floor dots
  const DIST_TICK_SPACING = 0.75;         // distance tick spacing
  const POWER_LERP = 0.18;                // smoothing factor per frame
  const HUE_SHIFT = 40;                   // degrees hue shift across trail
  const GHOST_PULSE_SPEED = 2.2;          // Hz (cycles per second)
  const GHOST_BASE_SCALE = 0.22;
  const GHOST_PULSE_AMPLITUDE = 0.05;
  const RING_INNER = 0.28;
  const RING_OUTER = 0.40;
  const RING_SEGMENTS = 48;

  // Refs
  const trailRef = useRef<THREE.Line | null>(null);
  const trailGlowRef = useRef<THREE.Line | null>(null);
  const trailGeomRef = useRef<THREE.BufferGeometry>(new THREE.BufferGeometry());
  const trailPositions = useRef<Float32Array>(new Float32Array(TRAIL_POINT_COUNT * 3));
  const ghostRef = useRef<THREE.Mesh>(null!);
  const ghostFresnelMat = useRef<THREE.ShaderMaterial | null>(null);
  const floorDots: React.MutableRefObject<THREE.Mesh[]> = useRef([]);
  const distanceTicks: React.MutableRefObject<THREE.Mesh[]> = useRef([]);
  const ringArcRef = useRef<THREE.Mesh>(null!);
  const ringBgRef = useRef<THREE.Mesh>(null!);
  const smoothedPower = useRef(0);

  // Generate ring geometry (static background & dynamic arc)
  const ringArcGeomRef = useRef<THREE.RingGeometry | null>(null);
  if (!ringArcGeomRef.current) {
    ringArcGeomRef.current = new THREE.RingGeometry(RING_INNER, RING_OUTER, RING_SEGMENTS, 1, 0, Math.PI * 2);
  }

  // Initialize geometries and objects once
  useEffect(() => {
    trailGeomRef.current.setAttribute('position', new THREE.BufferAttribute(trailPositions.current, 3));
    // Floor dots
    if (!floorDots.current.length) {
      for (let i = 0; i < DOT_COUNT; i++) floorDots.current.push(undefined as unknown as THREE.Mesh);
    }
    if (!trailRef.current) {
      trailRef.current = new THREE.Line(
        trailGeomRef.current,
        new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.95, linewidth: 2 })
      );
    }
    if (!trailGlowRef.current) {
      trailGlowRef.current = new THREE.Line(
        trailGeomRef.current,
        new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.20, linewidth: 6 })
      );
    }
  }, []);

  // Utility: color from normalized power & local t
  const colorAt = (t: number, base: number) => {
    const p = base; // overall power normalized
    // base gradient green->yellow->red
    const seg = p < 0.5 ? p / 0.5 : (p - 0.5) / 0.5;
    let r: number, g: number, b: number;
    if (p < 0.5) { r = seg; g = 1; b = 0; } else { r = 1; g = 1 - seg; b = 0; }
    // shift hue slightly along t
    const shift = (t - 0.5) * (HUE_SHIFT * Math.PI / 180);
    const c = new THREE.Color(r, g, b);
    // convert to HSL for hue shift
  const hsl: { h: number; s: number; l: number } = { h: 0, s: 0, l: 0 };
    c.getHSL(hsl);
    hsl.h = (hsl.h + shift) % 1;
    c.setHSL(hsl.h, hsl.s, hsl.l);
    return c;
  };

  // Build distance ticks (up to MAX_TRAIL_DIST)
  const tickCount = Math.floor(MAX_TRAIL_DIST / DIST_TICK_SPACING);
  const ensureTicks = () => {
    if (distanceTicks.current.length >= tickCount) return;
    for (let i = distanceTicks.current.length; i < tickCount; i++) {
      distanceTicks.current.push(undefined as unknown as THREE.Mesh);
    }
  };
  ensureTicks();

  // Fresnel shader for ghost
  const fresnelShader: { uniforms: { uColor: { value: THREE.Color }; uPower: { value: number }; uOpacity: { value: number } }; vertexShader: string; fragmentShader: string; transparent: boolean; depthWrite: boolean } = {
    uniforms: {
      uColor: { value: new THREE.Color('#ffffff') },
      uPower: { value: 2.5 },
      uOpacity: { value: 0.6 },
    },
    vertexShader: `
      precision highp float;
      uniform float uPower;
      varying float vIntensity;
      void main(){
        vec3 n = normalize(normalMatrix * normal);
        vec3 eye = normalize((modelViewMatrix * vec4(position,1.0)).xyz);
        vIntensity = pow(1.0 - max(dot(n, eye), 0.0), uPower);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
      }
    `,
    fragmentShader: ` 
      varying float vIntensity;
      uniform vec3 uColor;
      uniform float uOpacity;
      void main(){
        gl_FragColor = vec4(uColor, vIntensity * uOpacity);
      }
    `,
    transparent: true,
    depthWrite: false,
  };

  // Create shader material once
  if (!ghostFresnelMat.current) ghostFresnelMat.current = new THREE.ShaderMaterial(fresnelShader);

  useFrame((state) => {
    if (!active) return;
    const targetPowerNorm = Math.min(power, maxPower) / maxPower;
    smoothedPower.current += (targetPowerNorm - smoothedPower.current) * (1 - Math.pow(1 - POWER_LERP, state.clock.getDelta() * 60));
    const p = smoothedPower.current;

    // Trail curve with slight vertical arc (purely visual) using a quadratic ease
    const dist = 0.8 + p * (MAX_TRAIL_DIST - 0.8);
  // up vector not needed for current simple arc computation
    // (right vector not needed currently for straight projection)
    for (let i = 0; i < TRAIL_POINT_COUNT; i++) {
      const t = i / (TRAIL_POINT_COUNT - 1);
      const eased = t; // linear for forward distance; could apply ease if desired
      const pos = new THREE.Vector3().copy(origin).addScaledVector(direction, dist * eased);
      // vertical arc (parabolic) for style
      const arc = Math.sin(Math.PI * t) * dist * ARC_HEIGHT_FACTOR * (0.4 + 0.6 * p);
      pos.y += arc;
      trailPositions.current[i * 3 + 0] = pos.x;
      trailPositions.current[i * 3 + 1] = pos.y + 0.02; // slight lift
      trailPositions.current[i * 3 + 2] = pos.z;
    }
    trailGeomRef.current.attributes.position.needsUpdate = true;

    // Re-color trail via vertex colors (allocate once)
    if (!trailGeomRef.current.getAttribute('color')) {
      const colorArray = new Float32Array(TRAIL_POINT_COUNT * 3);
      for (let i = 0; i < TRAIL_POINT_COUNT; i++) {
        const c = colorAt(i / (TRAIL_POINT_COUNT - 1), p);
        colorArray[i * 3 + 0] = c.r; colorArray[i * 3 + 1] = c.g; colorArray[i * 3 + 2] = c.b;
      }
      trailGeomRef.current.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
    } else {
      const colorAttr = trailGeomRef.current.getAttribute('color') as THREE.BufferAttribute;
      for (let i = 0; i < TRAIL_POINT_COUNT; i++) {
        const c = colorAt(i / (TRAIL_POINT_COUNT - 1), p);
        colorAttr.setXYZ(i, c.r, c.g, c.b);
      }
      colorAttr.needsUpdate = true;
    }

    // Pulsing ghost ball at end of trail
    if (ghostRef.current) {
      const endIndex = (TRAIL_POINT_COUNT - 1) * 3;
      const gx = trailPositions.current[endIndex];
      const gy = trailPositions.current[endIndex + 1];
      const gz = trailPositions.current[endIndex + 2];
      ghostRef.current.position.set(gx, gy, gz);
      const pulse = Math.sin(state.clock.elapsedTime * Math.PI * 2 * GHOST_PULSE_SPEED) * 0.5 + 0.5;
      const scale = GHOST_BASE_SCALE + GHOST_PULSE_AMPLITUDE * pulse * (0.5 + 0.5 * p);
      ghostRef.current.scale.setScalar(scale);
      if (ghostFresnelMat.current) {
        ghostFresnelMat.current.uniforms.uColor.value.copy(colorAt(1, p));
        ghostFresnelMat.current.uniforms.uOpacity.value = 0.55 + 0.25 * p;
      }
    }

    // Floor dots along first half of distance (decay)
    const baseStep = 0.5 + p * 0.9;
    const decay = 0.78;
    for (let i = 0; i < DOT_COUNT; i++) {
      const geoSum = (1 - Math.pow(decay, i + 1)) / (1 - decay);
      const d = baseStep * geoSum;
      const pos = new THREE.Vector3().copy(origin).addScaledVector(direction, d);
      const mesh = floorDots.current[i];
      if (mesh) {
        mesh.position.set(pos.x, 0.015, pos.z);
        const t = i / DOT_COUNT;
        const mat = mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = (1 - t) * 0.75 * (0.3 + 0.7 * p);
        mesh.scale.setScalar(0.07 + t * 0.06 + p * 0.05);
        (mesh.material as THREE.MeshBasicMaterial).color.copy(colorAt(t * 0.7, p));
      }
    }

    // Distance ticks (ring-like marks on ground)
    for (let i = 0; i < tickCount; i++) {
      const d = (i + 1) * DIST_TICK_SPACING;
      const t = d / dist;
      const mesh = distanceTicks.current[i];
      if (!mesh) continue;
      if (t <= 1) {
        const pos = new THREE.Vector3().copy(origin).addScaledVector(direction, d);
        mesh.visible = true;
        mesh.position.set(pos.x, 0.011, pos.z);
        const fade = 1 - Math.pow(t, 1.5);
        const mat = mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = fade * 0.45 * (0.4 + 0.6 * p);
        (mesh.material as THREE.MeshBasicMaterial).color.copy(colorAt(t, p));
        mesh.scale.setScalar(0.15 + 0.1 * p);
      } else {
        mesh.visible = false;
      }
    }

    // Power ring arc (modify geometry's thetaLength via scale & rotation trick)
    if (ringArcRef.current) {
      ringArcRef.current.rotation.z = -Math.PI / 2; // start at top
      ringArcRef.current.scale.set(1, 1, 1);
      // Use material opacity + custom clipping via geometry groups? Simplify: scale Y to fill proportion.
      (ringArcRef.current.material as THREE.MeshBasicMaterial).opacity = 0.85;
      // Mask approach: we just change visible segment by updating geometry's drawRange
      const drawCount = Math.floor(RING_SEGMENTS * p);
      ringArcRef.current.geometry.setDrawRange(0, Math.max(1, drawCount * 3));
      (ringArcRef.current.material as THREE.MeshBasicMaterial).color.copy(colorAt(p, p));
    }
  });

  if (!active) return null;

  return (
    <group>
      {/* Curved multi-color trail (vertex-colored) */}
      {trailRef.current && <primitive object={trailRef.current} />}
      {/* Outer glow duplicate */}
      {trailGlowRef.current && <primitive object={trailGlowRef.current} />}

      {/* Ghost ball with Fresnel pulse */}
      <mesh ref={ghostRef}>
        <sphereGeometry args={[1, 32, 32]} />
  {ghostFresnelMat.current && <primitive object={ghostFresnelMat.current} attach="material" />}
      </mesh>

      {/* Floor dots */}
      {Array.from({ length: DOT_COUNT }).map((_, i) => (
        <mesh
          key={`dot-${i}`}
          ref={(m) => { if (m) floorDots.current[i] = m; }}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <circleGeometry args={[0.08, 20]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}

      {/* Distance ticks */}
      {Array.from({ length: tickCount }).map((_, i) => (
        <mesh
          key={`tick-${i}`}
          ref={(m) => { if (m) distanceTicks.current[i] = m; }}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.10, 0.16, 24]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}

      {/* Power ring (background) */}
      <mesh ref={ringBgRef} position={[origin.x, origin.y + 0.01, origin.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[RING_INNER, RING_OUTER, RING_SEGMENTS]} />
        <meshBasicMaterial color={'#111'} transparent opacity={0.55} depthWrite={false} />
      </mesh>
      {/* Power ring arc (dynamic fill) */}
  <mesh ref={ringArcRef} geometry={ringArcGeomRef.current!} position={[origin.x, origin.y + 0.012, origin.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <meshBasicMaterial color={'#0f0'} transparent opacity={0.9} depthWrite={false} />
      </mesh>
    </group>
  );
}
