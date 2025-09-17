"use client";

import React, { useState, useRef, Dispatch, SetStateAction } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { User } from 'firebase/auth';
import Level from '@/components/game/Level';
import Ball from '@/components/game/Ball';
import PlayerControls from '@/components/game/PlayerControls';
import HUD from '@/components/ui/HUD';
import Leaderboard from '@/components/ui/Leaderboard';
import Auth from '@/components/auth/Auth';
import { useAuth } from '@/hooks/useAuth';
import { saveScore } from '@/lib/firestore';
import { useEffect } from 'react';

// This component will live inside the Canvas and handle the game loop
interface GameSceneProps {
  ballPosition: THREE.Vector3;
  ballVelocity: React.MutableRefObject<THREE.Vector3>;
  setBallPosition: Dispatch<SetStateAction<THREE.Vector3>>;
  onBallStop: () => void;
  onGoal: () => void;
  holePosition: THREE.Vector3;
}

function GameScene({ ballPosition, ballVelocity, setBallPosition, onBallStop, onGoal, holePosition }: GameSceneProps) {
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
  const [gameState, setGameState] = useState<'ready' | 'shot' | 'holed'>('ready');
  const [ballPosition, setBallPosition] = useState(new THREE.Vector3(0, 0.2, 10));
  const ballVelocity = useRef(new THREE.Vector3(0, 0, 0));
  const [strokes, setStrokes] = useState(0);
  const [levelIndex, setLevelIndex] = useState(0);
  const [levels, setLevels] = useState<Array<{ id: string; name: string; par: number; start: [number, number, number]; hole: [number, number, number] }>>([]);
  const [par, setPar] = useState(3);
  const [levelName, setLevelName] = useState('');
  const [, setHole] = useState<[number, number, number]>([0, 0.01, -10]);
  const [notice, setNotice] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(true);

  // Load level configs from public/levels
  useEffect(() => {
    const files = ['level-1.json', 'level-2.json', 'level-3.json'];
    Promise.all(
      files.map(async (f) => {
        const res = await fetch(`/levels/${f}`);
        const cfg = await res.json();
        return {
          id: f.replace('.json', ''),
          name: cfg.name as string,
          par: cfg.par as number,
          start: cfg.start as [number, number, number],
          hole: cfg.hole as [number, number, number],
        };
      })
    ).then((arr) => {
      setLevels(arr);
      if (arr.length > 0) {
        const l = arr[0];
        setPar(l.par);
        setLevelName(l.name);
        setHole(l.hole);
        setBallPosition(new THREE.Vector3(...l.start));
      }
    });
  }, []);

  const handleShoot = (velocity: THREE.Vector3) => {
    ballVelocity.current.copy(velocity);
    setStrokes(prevStrokes => prevStrokes + 1);
    setGameState('shot');
    if (showHelp) setShowHelp(false);
  };

  const handleBallStop = () => {
    setGameState('ready');
  };

  const handleGoal = () => {
    setGameState('holed');
    const finalStrokes = strokes + 1;
    const currentLevel = levels[levelIndex];
    const levelId = currentLevel ? currentLevel.id : `level-${levelIndex + 1}`;
  saveScore(user.uid, levelId, finalStrokes, par);
    setNotice(`Holed ${levelName} in ${finalStrokes} strokes!`);

    // Advance to next level after a short pause
    setTimeout(() => {
      const nextIndex = (levelIndex + 1) % Math.max(1, levels.length);
      setLevelIndex(nextIndex);
      const next = levels[nextIndex];
      if (next) {
        setPar(next.par);
        setLevelName(next.name);
        setHole(next.hole);
        ballVelocity.current.set(0, 0, 0);
        setBallPosition(new THREE.Vector3(...next.start));
        setStrokes(0);
        setGameState('ready');
        setNotice(null);
      }
    }, 1800);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: 'skyblue' }}>
      <HUD strokes={strokes} par={par} />
      <div style={{ position: 'absolute', top: 20, right: 20, maxWidth: 280, pointerEvents: 'none' }}>
        {levels[levelIndex]?.id && (
          <div style={{ pointerEvents: 'auto' }}>
            <Leaderboard levelId={levels[levelIndex].id} />
          </div>
        )}
      </div>
      {notice && (
        <div style={{ position: 'absolute', top: 80, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '10px 14px', borderRadius: 12, pointerEvents: 'none' }}>
          {notice}
        </div>
      )}
      {showHelp && (
        <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.5)', color: 'white', padding: '10px 12px', borderRadius: 10, pointerEvents: 'none' }}>
          Click and drag from the ball to aim; release to shoot.
        </div>
      )}
      <Canvas>
        {/* Camera */}
        <PerspectiveCamera makeDefault position={[0, 12, 22]} fov={55} />
        <OrbitControls enablePan={false} minDistance={12} maxDistance={30} maxPolarAngle={Math.PI/2.1} />

        {/* Lights */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[12, 18, 8]} intensity={1} />

        {/* Course */}
        <Level hole={levels[levelIndex]?.hole ?? [0, 0.01, -10]} />
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
          holePosition={new THREE.Vector3(...(levels[levelIndex]?.hole ?? [0, 0.01, -10]))}
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
