"use client";

import { useThree, useFrame } from '@react-three/fiber';
import { useState, useEffect, useRef } from 'react';

const FRAME_SMOOTHING = 0.9;
const TARGET_FPS = 55;
const MIN_DPR = 0.5;

const DynamicResolutionHandler = () => {
  const { gl, camera } = useThree();
  const maxDpr = useRef(window.devicePixelRatio);
  const [currentDpr, setCurrentDpr] = useState(maxDpr.current);
  const smoothedFps = useRef(TARGET_FPS);
  const lastCheck = useRef(0);

  useFrame((state, delta) => {
    // Update smoothed FPS
    const fps = 1 / delta;
    smoothedFps.current = smoothedFps.current * FRAME_SMOOTHING + fps * (1 - FRAME_SMOOTHING);

    // Only check every 500ms to avoid rapid fluctuations
    if (state.clock.elapsedTime - lastCheck.current < 0.5) {
      return;
    }
    lastCheck.current = state.clock.elapsedTime;

    let newDpr = currentDpr;
    if (smoothedFps.current < TARGET_FPS - 5) {
      newDpr = Math.max(currentDpr * 0.9, MIN_DPR);
    } else if (smoothedFps.current > TARGET_FPS + 10) {
      newDpr = Math.min(currentDpr * 1.1, maxDpr.current);
    }

    if (Math.abs(newDpr - currentDpr) > 0.01) {
      setCurrentDpr(newDpr);
    }
  });

  useEffect(() => {
    gl.setPixelRatio(currentDpr);
    // No need to update camera projection matrix for DPR changes
  }, [currentDpr, gl]);

  return null;
};

export default DynamicResolutionHandler;
