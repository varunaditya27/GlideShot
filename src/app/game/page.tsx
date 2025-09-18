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
import CameraRig from '@/components/game/CameraRig';

// This component will live inside the Canvas and handle the game loop
interface GameSceneProps {
  ballPosRef: React.MutableRefObject<THREE.Vector3>;
  ballVelocity: React.MutableRefObject<THREE.Vector3>;
  onBallStop: () => void;
  onGoal: () => void;
  holePosition: THREE.Vector3;
  onBounce?: (pos: THREE.Vector3) => void;
}

function GameScene({ ballPosRef, ballVelocity, onBallStop, onGoal, holePosition, onBounce }: GameSceneProps) {
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
      onBounce?.(newPosition.clone());
    }
    if (newPosition.z <= minZ || newPosition.z >= maxZ) {
      v.z = -v.z * 0.8;
      newPosition.z = Math.max(minZ, Math.min(newPosition.z, maxZ));
      onBounce?.(newPosition.clone());
    }

    const holeRadius = 0.25;
    if (newPosition.distanceTo(holePosition) < holeRadius && v.length() < 1.5) {
      onGoal();
    } else {
      ballPosRef.current.copy(newPosition);
    }
  });

  return null;
}

// Lightweight hole pulse visual effect
function HolePulse({ centerRef, triggerRef }: { centerRef: React.MutableRefObject<THREE.Vector3>; triggerRef: React.MutableRefObject<(() => void) | null> }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  // pulseRef holds timestamp in ms when pulse started; 0 means inactive
  const pulseRef = useRef<number>(0);

  // Provide trigger to parent via ref
  useEffect(() => {
    triggerRef.current = () => { pulseRef.current = performance.now(); };
    return () => { triggerRef.current = null; };
  }, [triggerRef]);

  useFrame(() => {
    if (!meshRef.current) return;
    const start = pulseRef.current;
    if (start === 0) {
      meshRef.current.visible = false;
      return;
    }
    const t = (performance.now() - start) / 1000; // seconds
    const duration = 0.7;
    if (t > duration) {
      meshRef.current.visible = false;
      pulseRef.current = 0;
      return;
    }
    // Animate ring: expand and fade
    const k = t / duration; // 0..1
    const scale = 1 + k * 3;
    const opacity = 0.6 * (1 - k);
    meshRef.current.visible = true;
    meshRef.current.position.set(centerRef.current.x, 0.02, centerRef.current.z);
    meshRef.current.scale.set(scale, scale, 1);
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = opacity;
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
      <ringGeometry args={[0.25, 0.35, 64]} />
      <meshBasicMaterial color="#ffeb3b" transparent opacity={0.0} />
    </mesh>
  );
}

// Lightweight particles burst (no allocations per frame)
function ParticlesBurst({ color = '#ffcc00', count = 16, triggerRef }: { color?: string; count?: number; triggerRef: React.MutableRefObject<((pos: THREE.Vector3) => void) | null> }) {
  const groupRef = useRef<THREE.Group>(null!);
  const centers = useRef(new THREE.Vector3());
  const activeRef = useRef(false);
  const timeRef = useRef(0);
  const life = 0.6;
  const velocities = useRef(Array.from({ length: count }, () => new THREE.Vector3()));
  const positions = useRef(Array.from({ length: count }, () => new THREE.Vector3()));
  const opacities = useRef(Array.from({ length: count }, () => 0));

  // Prepare meshes
  const meshesRef = useRef<THREE.Mesh[]>([]);
  useEffect(() => {
    meshesRef.current = [];
    if (!groupRef.current) return;
    groupRef.current.clear();
    for (let i = 0; i < count; i++) {
      const m = new THREE.Mesh(
        new THREE.CircleGeometry(0.06, 10),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.0 })
      );
      m.rotation.x = -Math.PI / 2;
      groupRef.current.add(m);
      meshesRef.current.push(m);
    }
  }, [color, count]);

  // Expose trigger
  useEffect(() => {
    triggerRef.current = (pos: THREE.Vector3) => {
      centers.current.copy(pos);
      timeRef.current = 0;
      activeRef.current = true;
      for (let i = 0; i < count; i++) {
        // random direction on XZ plane
        const a = Math.random() * Math.PI * 2;
        const s = 1.2 + Math.random() * 1.8;
        velocities.current[i].set(Math.cos(a) * s, 0, Math.sin(a) * s);
        positions.current[i].set(pos.x, 0.02, pos.z);
        opacities.current[i] = 1.0;
        const mesh = meshesRef.current[i];
        if (mesh) {
          mesh.position.set(pos.x, 0.02, pos.z);
          (mesh.material as THREE.MeshBasicMaterial).opacity = 1.0;
          mesh.scale.setScalar(1);
        }
      }
    };
    return () => { triggerRef.current = null; };
  }, [count, triggerRef]);

  useFrame((_, dt) => {
    if (!activeRef.current) return;
    const t = timeRef.current + dt;
    timeRef.current = t;
    const k = Math.min(t / life, 1);
    for (let i = 0; i < count; i++) {
      // simple kinematic: outward drift, slight scale up, fade
      positions.current[i].x += velocities.current[i].x * dt;
      positions.current[i].z += velocities.current[i].z * dt;
      opacities.current[i] = 1 - k;
      const mesh = meshesRef.current[i];
      if (!mesh) continue;
      mesh.position.set(positions.current[i].x, 0.02, positions.current[i].z);
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = opacities.current[i] * 0.8;
      const scale = 1 + k * 0.7;
      mesh.scale.set(scale, scale, 1);
    }
    if (k >= 1) {
      activeRef.current = false;
      // hide
      meshesRef.current.forEach((m) => {
        if (m) (m.material as THREE.MeshBasicMaterial).opacity = 0;
      });
    }
  });

  return <group ref={groupRef} />;
}

// The actual game content
function GameContent({ user }: { user: User }) {
  const [gameState, setGameState] = useState<'ready' | 'shot' | 'holed'>('ready');
  const ballPosition = useRef(new THREE.Vector3(0, 0.2, 10));
  const ballVelocity = useRef(new THREE.Vector3(0, 0, 0));
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
  const holeVecRef = useRef(new THREE.Vector3(0, 0.01, -10));
  const holePulseTriggerRef = useRef<(() => void) | null>(null);
  const bounceBurstTriggerRef = useRef<((pos: THREE.Vector3) => void) | null>(null);
  const goalBurstTriggerRef = useRef<((pos: THREE.Vector3) => void) | null>(null);

  // Minimal WebAudio beeps for feedback
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ensureCtx = () => {
    if (audioCtxRef.current) return audioCtxRef.current;
  const w = window as (Window & { webkitAudioContext?: typeof AudioContext });
  const Ctx: typeof AudioContext | undefined = typeof AudioContext !== 'undefined' ? AudioContext : w.webkitAudioContext;
    if (!Ctx) return null;
    audioCtxRef.current = new Ctx();
    return audioCtxRef.current;
  };
  const playBeep = (freq: number, duration = 0.08, type: OscillatorType = 'sine', volume = 0.05) => {
    const ctx = ensureCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.value = volume;
    osc.frequency.value = freq;
    osc.type = type;
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    osc.start(now);
    osc.stop(now + duration);
  };
  

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
        holeVecRef.current.set(l.hole[0], l.hole[1], l.hole[2]);
        // set ball before first frame so camera rig initializes at correct position
  ballPosition.current.set(l.start[0], l.start[1], l.start[2]);
      }
    });
  }, []);

  // no-op: position is driven via refs for performance

  const handleShoot = (velocity: THREE.Vector3) => {
    ballVelocity.current.copy(velocity);
    setStrokes(prevStrokes => prevStrokes + 1);
    setGameState('shot');
    if (showHelp) setShowHelp(false);
    // Audio cue
    playBeep(880, 0.06, 'triangle', 0.06);
  };

  const handleBallStop = () => {
    setGameState('ready');
    playBeep(330, 0.05, 'sine', 0.04);
  };

  const handleGoal = () => {
    setGameState('holed');
    const finalStrokes = strokes + 1;
    const currentLevel = levels[levelIndex];
    const levelId = currentLevel ? currentLevel.id : `level-${levelIndex + 1}`;
  saveScore(user.uid, levelId, finalStrokes, par);
    setNotice(`Holed ${levelName} in ${finalStrokes} strokes!`);
    // Success jingle
    playBeep(523.25, 0.08, 'sine', 0.06); // C5
    setTimeout(() => playBeep(659.25, 0.08, 'sine', 0.06), 80); // E5
    setTimeout(() => playBeep(783.99, 0.12, 'sine', 0.06), 160); // G5
    // Trigger pulse
    holePulseTriggerRef.current?.();

    // Advance to next level after a short pause
    setTimeout(() => {
      const nextIndex = (levelIndex + 1) % Math.max(1, levels.length);
      setLevelIndex(nextIndex);
      const next = levels[nextIndex];
      if (next) {
        setPar(next.par);
        setLevelName(next.name);
        setHole(next.hole);
        holeVecRef.current.set(next.hole[0], next.hole[1], next.hole[2]);
        ballVelocity.current.set(0, 0, 0);
        ballPosition.current.set(next.start[0], next.start[1], next.start[2]);
        // setBallRenderPosition([next.start[0], next.start[1], next.start[2]]);
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
        <ambientLight intensity={0.6} />
        <hemisphereLight args={[0xffffff, 0x334433, 0.5]} />
        <directionalLight position={[10, 10, 5]} intensity={1} />

  {/* Smooth camera follow (lightweight) */}
  <CameraRig target={ballPosition.current} velocity={ballVelocity.current} offset={new THREE.Vector3(0, 10, 18)} damping={0.06} />

  {/* Course */}
  <Level hole={levels[levelIndex]?.hole ?? [0, 0.01, -10]} />
  <HolePulse centerRef={holeVecRef} triggerRef={holePulseTriggerRef} />
  {/* Particles: bounce near ball, goal at hole */}
  <ParticlesBurst color="#ffffff" count={14} triggerRef={bounceBurstTriggerRef} />
  <ParticlesBurst color="#ffeb3b" count={18} triggerRef={goalBurstTriggerRef} />
  <Ball positionRef={ballPosition} velocityRef={ballVelocity} />
        {gameState === 'ready' && (
          <PlayerControls
            ballPosition={[ballPosition.current.x, ballPosition.current.y, ballPosition.current.z]}
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
          onBounce={(pos) => { playBeep(440, 0.03, 'square', 0.04); bounceBurstTriggerRef.current?.(pos); }}
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
