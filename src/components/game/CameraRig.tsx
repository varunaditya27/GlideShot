"use client";

import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useRef, useEffect } from 'react';

interface CameraRigProps {
  target: THREE.Vector3; // current ball position
  velocity: THREE.Vector3; // current ball velocity
  offset?: THREE.Vector3; // camera offset relative to target
  lookOffset?: THREE.Vector3; // lookAt offset above target
  damping?: number; // 0..1, higher = snappier
}

export default function CameraRig({
  target,
  velocity,
  offset = new THREE.Vector3(0, 9, 16),
  lookOffset = new THREE.Vector3(0, 2, 0),
  damping = 0.09,
}: CameraRigProps) {
  const { camera } = useThree();
  const desired = useRef(new THREE.Vector3());
  const lookAt = useRef(new THREE.Vector3());
  const temp = useRef(new THREE.Vector3());

  // Initialize camera to a consistent starting pose
  useEffect(() => {
    desired.current.copy(target).add(offset);
    camera.position.copy(desired.current);
    camera.lookAt(target.clone().add(lookOffset));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((_, dt) => {
    const lead = temp.current.copy(velocity).multiplyScalar(0.8); // slight velocity lead
    desired.current.copy(target).add(offset).add(lead);
    // exponential smoothing toward desired
    camera.position.lerp(desired.current, 1 - Math.pow(1 - damping, (dt || 0.016) * 60));
    lookAt.current.copy(target).add(lookOffset);
    camera.lookAt(lookAt.current);

    // FOV zoom based on speed (subtle)
    const speed = velocity.length();
    const baseFov = 55;
    const maxDelta = 6; // up to +6 degrees on fast shots
    const targetFov = baseFov + Math.min(speed * 1.8, maxDelta);
    if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
      const pc = camera as THREE.PerspectiveCamera;
      pc.fov += (targetFov - pc.fov) * 0.08;
      pc.updateProjectionMatrix();
    }
  });

  return null;
}
