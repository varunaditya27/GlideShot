"use client";

import React, { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { User } from 'firebase/auth';
import Level from '@/components/game/Level';
import Ball from '@/components/game/Ball';
import PlayerControls from '@/components/game/PlayerControls';
import HUD from '@/components/ui/HUD';
import Auth from '@/components/auth/Auth';
import { useAuth } from '@/hooks/useAuth';
import { saveScore } from '@/lib/firestore';

// This component will live inside the Canvas and handle the game loop
function GameScene({ ballPosition, ballVelocity, setBallPosition, onBallStop, onGoal }) {
  useFrame((state, delta) => {
    if (ballVelocity.current.length() < 0.01) {
      if (ballVelocity.current.length() > 0) {
        ballVelocity.current.set(0, 0, 0);
        onBallStop();
      }
      return;
    }

    const newPosition = ballPosition.clone().add(ballVelocity.current.clone().multiplyScalar(delta));
    const friction = 0.98;
    ballVelocity.current.multiplyScalar(friction);

    const groundSize = [20, 30];
    const ballRadius = 0.2;
    const minX = -groundSize[0] / 2 + ballRadius;
    const maxX = groundSize[0] / 2 - ballRadius;
    const minZ = -groundSize[1] / 2 + ballRadius;
    const maxZ = groundSize[1] / 2 - ballRadius;

    if (newPosition.x <= minX || newPosition.x >= maxX) {
      ballVelocity.current.x = -ballVelocity.current.x * 0.8;
      newPosition.x = Math.max(minX, Math.min(newPosition.x, maxX));
    }
    if (newPosition.z <= minZ || newPosition.z >= maxZ) {
      ballVelocity.current.z = -ballVelocity.current.z * 0.8;
      newPosition.z = Math.max(minZ, Math.min(newPosition.z, maxZ));
    }

    const holePosition = new THREE.Vector3(0, 0.01, -10);
    const holeRadius = 0.2;
    if (newPosition.distanceTo(holePosition) < holeRadius && ballVelocity.current.length() < 1.0) {
      onGoal();
    } else {
      setBallPosition(newPosition);
    }
  });

  return null;
}

// The actual game content
function GameContent({ user }: { user: User }) {
  const [gameState, setGameState] = useState('ready');
  const [ballPosition, setBallPosition] = useState(new THREE.Vector3(0, 0.2, 10));
  const ballVelocity = useRef(new THREE.Vector3(0, 0, 0));
  const [strokes, setStrokes] = useState(0);
  const par = 3;
  const levelId = 'level-1';

  const handleShoot = (velocity: THREE.Vector3) => {
    ballVelocity.current.copy(velocity);
    setStrokes(prevStrokes => prevStrokes + 1);
    setGameState('shot');
  };

  const handleBallStop = () => {
    setGameState('ready');
  };

  const handleGoal = () => {
    setGameState('holed');
    const finalStrokes = strokes + 1;
    console.log(`Holed in ${finalStrokes} strokes!`);
    saveScore(user.uid, levelId, finalStrokes);

    setTimeout(() => {
      ballVelocity.current.set(0, 0, 0);
      setBallPosition(new THREE.Vector3(0, 0.2, 10));
      setStrokes(0);
      setGameState('ready');
    }, 2000);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: 'skyblue' }}>
      <HUD strokes={strokes} par={par} />
      <Canvas>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Level />
        <Ball position={[ballPosition.x, ballPosition.y, ballPosition.z]} />
        {gameState === 'ready' && (
          <PlayerControls ballPosition={[ballPosition.x, ballPosition.y, ballPosition.z]} onShoot={handleShoot} />
        )}
        <GameScene
          ballPosition={ballPosition}
          ballVelocity={ballVelocity}
          setBallPosition={setBallPosition}
          onBallStop={handleBallStop}
          onGoal={handleGoal}
        />
      </Canvas>
    </div>
  );
}


// Main Page Component that handles Authentication
export default function GamePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#333' }}>
        <h1 style={{color: 'white'}}>Loading...</h1>
      </div>
    );
  }

  if (user) {
    return <GameContent user={user} />;
  }

  return <Auth />;
}
