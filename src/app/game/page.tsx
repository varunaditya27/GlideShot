"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
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

// This component will live inside the Canvas and handle the game loop
interface GameSceneProps {
  ballPosRef: React.MutableRefObject<THREE.Vector3>;
  ballVelocity: React.MutableRefObject<THREE.Vector3>;
  onBallStop: () => void;
  onGoal: () => void;
  holePosition: THREE.Vector3;
  onPositionUpdate: (pos: [number, number, number]) => void;
}

function GameScene({ ballPosRef, ballVelocity, onBallStop, onGoal, holePosition, onPositionUpdate }: GameSceneProps) {
  useFrame((state, delta) => {
    const v = ballVelocity.current;
    if (v.lengthSq() < 0.001) {
      if (ballVelocity.current.length() > 0) {
        v.set(0, 0, 0);
        onBallStop();
      }
      return;
    }
    
    // Improved delta time handling for smoother movement
    const dt = Math.min(delta, 1 / 60);
    const dampingFactor = Math.pow(0.98, dt * 60); // Frame-rate independent damping
    
    // Apply velocity to position
    const displacement = v.clone().multiplyScalar(dt);
    const newPosition = ballPosRef.current.clone().add(displacement);
    
    // Apply damping
    v.multiplyScalar(dampingFactor);

    const groundSize = [20, 30];
    const ballRadius = 0.2;
    const minX = -groundSize[0] / 2 + ballRadius;
    const maxX = groundSize[0] / 2 - ballRadius;
    const minZ = -groundSize[1] / 2 + ballRadius;
    const maxZ = groundSize[1] / 2 - ballRadius;

    if (newPosition.x <= minX || newPosition.x >= maxX) {
      v.x = -v.x * 0.8;
      newPosition.x = Math.max(minX, Math.min(newPosition.x, maxX));
    }
    if (newPosition.z <= minZ || newPosition.z >= maxZ) {
      v.z = -v.z * 0.8;
      newPosition.z = Math.max(minZ, Math.min(newPosition.z, maxZ));
    }

    const holeRadius = 0.25;
    if (newPosition.distanceTo(holePosition) < holeRadius && v.length() < 1.5) {
      onGoal();
    } else {
      ballPosRef.current.copy(newPosition);
      // Update the visual position for smooth animation
      onPositionUpdate([newPosition.x, newPosition.y, newPosition.z]);
    }
  });

  return null;
}

// The actual game content
function GameContent({ user }: { user: User }) {
  const [gameState, setGameState] = useState<'ready' | 'shot' | 'holed'>('ready');
  const ballPosition = useRef(new THREE.Vector3(0, 0.2, 10));
  const ballVelocity = useRef(new THREE.Vector3(0, 0, 0));
  const [ballRenderPosition, setBallRenderPosition] = useState<[number, number, number]>([0, 0.2, 10]);
  const [strokes, setStrokes] = useState(0);
  const [levelIndex, setLevelIndex] = useState(0);
  const [levels, setLevels] = useState<Array<{ id: string; name: string; par: number; start: [number, number, number]; hole: [number, number, number] }>>([]);
  const [par, setPar] = useState(3);
  const [levelName, setLevelName] = useState('');
  const [, setHole] = useState<[number, number, number]>([0, 0.01, -10]);
  const [notice, setNotice] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(true);
  const [aiming, setAiming] = useState(false);
  const [aimPower, setAimPower] = useState(0);
  

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
        // set ball before first frame so camera rig initializes at correct position
        ballPosition.current.set(l.start[0], l.start[1], l.start[2]);
        setBallRenderPosition([l.start[0], l.start[1], l.start[2]]);
      }
    });
  }, []);

  const handlePositionUpdate = (pos: [number, number, number]) => {
    setBallRenderPosition(pos);
  };

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
        ballPosition.current.set(next.start[0], next.start[1], next.start[2]);
        setBallRenderPosition([next.start[0], next.start[1], next.start[2]]);
        setStrokes(0);
        setGameState('ready');
        setNotice(null);
      }
    }, 1800);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: 'skyblue' }}>
  <HUD strokes={strokes} par={par} power={aimPower} />
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
  <Canvas
    style={{ cursor: aiming ? 'crosshair' : 'default' }}
    camera={{ position: [0, 15, 20], fov: 50 }}
  >
        {/* Lights */}
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 10, 5]} intensity={1} />

  {/* Course */}
        <Level hole={levels[levelIndex]?.hole ?? [0, 0.01, -10]} />
        <Ball position={ballRenderPosition} />
        {gameState === 'ready' && (
          <PlayerControls
            ballPosition={ballRenderPosition}
            onShoot={handleShoot}
            onAimStart={() => setAiming(true)}
            onAimEnd={() => setAiming(false)}
            onAimChange={setAimPower}
          />
        )}
        <GameScene
          ballPosRef={ballPosition}
          ballVelocity={ballVelocity}
          onBallStop={handleBallStop}
          onGoal={handleGoal}
          holePosition={new THREE.Vector3(...(levels[levelIndex]?.hole ?? [0, 0.01, -10]))}
          onPositionUpdate={handlePositionUpdate}
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
