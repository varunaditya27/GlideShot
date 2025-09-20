"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { User } from 'firebase/auth';
import Level from '@/components/game/Level';
import { updateBall, Slope, MovingObstacleState } from '@/lib/physics';
import Ball from '@/components/game/Ball';
import ReplayBall, { PathEntry } from '@/components/game/ReplayBall';
import MovingObstacle, { MovingObstacleData, MovingObstacleRef } from '@/components/game/MovingObstacle';
import PlayerControls, { PlayerControlsHandle } from '@/components/game/PlayerControls';
import AimAssist from '@/components/game/AimAssist';
import DynamicResolutionHandler from '@/components/game/DynamicResolutionHandler';
import HUD from '@/components/ui/HUD';
import LevelSelector from '@/components/ui/LevelSelector';
import Leaderboard from '@/components/ui/Leaderboard';
import Auth from '@/components/auth/Auth';
import { useAuth } from '@/hooks/useAuth';
import { saveScore } from '@/lib/firestore';
import CameraRig from '@/components/game/CameraRig';

// This component will live inside the Canvas and handle the game loop
interface ObstacleInfo {
  ref: React.RefObject<MovingObstacleRef>;
  data: MovingObstacleData;
}

interface GameSceneProps {
  ballPosRef: React.MutableRefObject<THREE.Vector3>;
  ballVelocity: React.MutableRefObject<THREE.Vector3>;
  onMoveStart: () => void;
  onBallStop: () => void;
  onGoal: () => void;
  holePosition: THREE.Vector3;
  onBounce?: (pos: THREE.Vector3) => void;
  slopes: Slope[];
  obstacles: ObstacleInfo[];
  pathRecorder: React.MutableRefObject<PathEntry[]>;
}

function GameScene({ ballPosRef, ballVelocity, onMoveStart, onBallStop, onGoal, holePosition, onBounce, slopes, obstacles, pathRecorder }: GameSceneProps) {
  // Tuned thresholds (squared speeds) after user feedback
  const START_SPEED_SQ = 0.0009;  // ~0.03 m/s start detection (easier to enter moving state)
  const STOP_SPEED_SQ  = 0.00015; // ~0.012 m/s primary stop threshold
  const HARD_STOP_SQ   = 0.00005; // immediate snap & stop if below
  const LOW_SPEED_FRAMES_REQUIRED = 2; // frames below STOP_SPEED_SQ before declaring rest
  const MAX_MOVING_GRACE_SECONDS = 8;   // absolute cap (safety)
  const isMovingRef = React.useRef(false);
  const lowSpeedFramesRef = React.useRef(0);
  const movingElapsedRef = React.useRef(0);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 60);
    const speedSq = ballVelocity.current.lengthSq();

    // Start transition
    if (!isMovingRef.current && speedSq > START_SPEED_SQ) {
      isMovingRef.current = true;
      movingElapsedRef.current = 0;
      lowSpeedFramesRef.current = 0;
      onMoveStart();
    }

    if (isMovingRef.current) {
      movingElapsedRef.current += dt;

      // Hard snap / force stop if absurdly low speed or time cap reached
      if (speedSq < HARD_STOP_SQ || movingElapsedRef.current > MAX_MOVING_GRACE_SECONDS) {
        isMovingRef.current = false;
        ballVelocity.current.set(0,0,0);
        onBallStop();
      } else if (speedSq < STOP_SPEED_SQ) {
        lowSpeedFramesRef.current += 1;
        if (lowSpeedFramesRef.current >= LOW_SPEED_FRAMES_REQUIRED) {
          isMovingRef.current = false;
          ballVelocity.current.set(0,0,0);
          onBallStop();
        }
      } else {
        lowSpeedFramesRef.current = 0; // reset since speed rose again
      }

      // Only integrate physics while considered moving
      if (isMovingRef.current) {
        pathRecorder.current.push({ time: state.clock.elapsedTime, position: ballPosRef.current.clone() });
        const obstacleStates: MovingObstacleState[] = obstacles.map(info => ({
          position: info.ref.current?.position || new THREE.Vector3(),
          velocity: info.ref.current?.velocity || new THREE.Vector3(),
          size: info.data.size,
        }));
        const { newState, bounced } = updateBall(
          { position: ballPosRef.current, velocity: ballVelocity.current },
          slopes,
          obstacleStates,
          dt
        );
        ballPosRef.current.copy(newState.position);
        ballVelocity.current.copy(newState.velocity);
        if (bounced) onBounce?.(ballPosRef.current.clone());
      }
    }

    // Hole detection when slow (allow slight motion)
    const holeRadius = 0.25;
    if (ballPosRef.current.distanceTo(holePosition) < holeRadius && ballVelocity.current.length() < 1.5) {
      onGoal();
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
  const [appState, setAppState] = useState<'level-select' | 'playing'>('level-select');
  const [gameState, setGameState] = useState<'ready' | 'shot' | 'holed'>('ready');
  const ballPosition = useRef(new THREE.Vector3(0, 0.2, 10));
  const ballVelocity = useRef(new THREE.Vector3(0, 0, 0));
  const [strokes, setStrokes] = useState(0);
  const [levelIndex, setLevelIndex] = useState(-1);
  const [levels, setLevels] = useState<Array<{ id: string; name: string; par: number; start: [number, number, number]; hole: [number, number, number]; slopes: Slope[]; movingObstacles: MovingObstacleData[] }>>([]);
  const [par, setPar] = useState(3);
  const [levelName, setLevelName] = useState('');
  const [, setHole] = useState<[number, number, number]>([0, 0.01, -10]);
  const [slopes, setSlopes] = useState<Slope[]>([]);
  const [movingObstacles, setMovingObstacles] = useState<MovingObstacleData[]>([]);
  const obstacleRefs = useRef<React.RefObject<MovingObstacleRef>[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(true);
  const [aiming, setAiming] = useState(false);
  const [aimPower, setAimPower] = useState(0);
  const holeVecRef = useRef(new THREE.Vector3(0, 0.01, -10));
  const holePulseTriggerRef = useRef<(() => void) | null>(null);
  const bounceBurstTriggerRef = useRef<((pos: THREE.Vector3) => void) | null>(null);
  const goalBurstTriggerRef = useRef<((pos: THREE.Vector3) => void) | null>(null);
  const playerControlsRef = useRef<PlayerControlsHandle | null>(null); // internal ref to access aim data
  const [lastShotPath, setLastShotPath] = useState<PathEntry[]>([]);
  const [isReplaying, setIsReplaying] = useState(false);
  const pathRecorder = useRef<PathEntry[]>([]);

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
  interface RawSlope { vertices: [number[], number[], number[]]; }
  interface RawMovingObstacle { size: [number, number, number]; speed?: number; path?: [number, number, number][]; [key: string]: unknown; }
  interface RawLevelConfig {
    name: string;
    par: number;
    start: [number, number, number];
    hole: [number, number, number];
    slopes?: RawSlope[];
    movingObstacles?: RawMovingObstacle[];
  }
  useEffect(() => {
    const files = ['level-1.json', 'level-2.json', 'level-3.json'];
    Promise.all(
      files.map(async (f) => {
        const res = await fetch(`/levels/${f}`);
        const cfg: RawLevelConfig = await res.json();
        const levelSlopes: Slope[] = (cfg.slopes || []).map((s) => {
          const v1 = new THREE.Vector3(...s.vertices[0]);
          const v2 = new THREE.Vector3(...s.vertices[1]);
          const v3 = new THREE.Vector3(...s.vertices[2]);
          const normal = new THREE.Plane().setFromCoplanarPoints(v1, v2, v3).normal;
          return { vertices: [v1, v2, v3], normal };
        });
        const levelObstacles: MovingObstacleData[] = (cfg.movingObstacles || []).map((o, i: number) => ({
          id: `obs-${i}`,
          shape: 'box',
          size: o.size ?? [1,1,1],
          path: o.path && o.path.length >= 2 ? o.path : [[0,0,0],[0,0,0.01]],
          speed: typeof o.speed === 'number' ? o.speed : 1,
          mode: (o as { mode?: 'loop' | 'ping-pong' }).mode ?? 'ping-pong'
        }));
        return {
          id: f.replace('.json', ''),
          name: cfg.name,
          par: cfg.par,
          start: cfg.start,
          hole: cfg.hole,
          slopes: levelSlopes,
          movingObstacles: levelObstacles,
        };
      })
    ).then((arr) => {
      setLevels(arr);
    });
  }, []);

  // no-op: position is driven via refs for performance

  const MIN_SHOT_SPEED_SQ = 0.001; // ignore micro-drags
  const handleShoot = (velocity: THREE.Vector3) => {
    // Cancel negligible shots (acts like mis-click)
    if (velocity.lengthSq() < MIN_SHOT_SPEED_SQ) {
      playBeep(220, 0.04, 'sine', 0.03); // soft dud cue
      return;
    }
    ballVelocity.current.copy(velocity);
    setStrokes(prevStrokes => prevStrokes + 1);
    pathRecorder.current = [];
    if (showHelp) setShowHelp(false);
    playBeep(880, 0.06, 'triangle', 0.06);
  };

  const handleBallStop = () => {
    setGameState('ready');
    setLastShotPath(pathRecorder.current);
    playBeep(330, 0.05, 'sine', 0.04);
  };

  const handleReplay = () => {
    if (lastShotPath.length > 0 && !isReplaying) {
      setIsReplaying(true);
    }
  };

  const handleReplayFinish = () => {
    setIsReplaying(false);
  };

  const postedRef = useRef(false);

  const handleGoal = () => {
    if (postedRef.current) return; // already handled this goal
    postedRef.current = true;
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
      // Instead of advancing, go back to level select
      setAppState('level-select');
      setNotice(null);
    }, 2500);
  };

  const handleSelectLevel = (index: number) => {
    const level = levels[index];
    if (!level) return;
    setLevelIndex(index);
    setPar(level.par);
    setLevelName(level.name);
    setHole(level.hole);
    setSlopes(level.slopes);
    setMovingObstacles(level.movingObstacles);

    // Create refs for the obstacles
  obstacleRefs.current = level.movingObstacles.map(() => ({ current: { position: new THREE.Vector3(), velocity: new THREE.Vector3() } }));

    holeVecRef.current.set(level.hole[0], level.hole[1], level.hole[2]);
    ballPosition.current.set(level.start[0], level.start[1], level.start[2]);
    ballVelocity.current.set(0, 0, 0);
    setStrokes(0);
    setGameState('ready');
    setNotice(null);
    postedRef.current = false;
    setAppState('playing');
    setLastShotPath([]);
  };

  if (appState === 'level-select') {
    return <LevelSelector levels={levels} onSelectLevel={handleSelectLevel} />;
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: 'skyblue' }}>
  <HUD strokes={strokes} par={par} power={aimPower} onReplay={handleReplay} canReplay={lastShotPath.length > 0 && !isReplaying} />
      <div style={{ position: 'absolute', top: 20, right: 20, maxWidth: 280 }}>
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
        <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.5)', color: 'white', padding: '10px 12px', borderRadius: 10, pointerEvents: 'none', textAlign: 'center' }}>
          Click and drag to aim. <br /> Press &apos;K&apos; for keyboard controls (Arrows, +/-, Space).
        </div>
      )}
  <Canvas
    style={{ cursor: aiming ? 'crosshair' : 'default' }}
    camera={{ position: [0, 15, 20], fov: 50 }}
    dpr={window.devicePixelRatio} // Start with native DPR
  >
  {/* Lights */}
        <ambientLight intensity={0.6} />
        <hemisphereLight args={[0xffffff, 0x334433, 0.5]} />
        <directionalLight position={[10, 10, 5]} intensity={1} />

  {/* Smooth camera follow (lightweight) */}
  <DynamicResolutionHandler />
  {/* Camera offset clamped inside front wall (course half-depth = 15) to prevent wall occlusion */}
  <CameraRig target={ballPosition.current} velocity={ballVelocity.current} offset={new THREE.Vector3(0, 10, 12)} damping={0.06} />

  {/* Course */}
  <Level hole={levels[levelIndex]?.hole ?? [0, 0.01, -10]} slopes={slopes} />
  {movingObstacles.map((obstacleData, i) => (
    <MovingObstacle key={obstacleData.id} data={obstacleData} obstacleRef={obstacleRefs.current[i]} />
  ))}
  <HolePulse centerRef={holeVecRef} triggerRef={holePulseTriggerRef} />
  {/* Particles: bounce near ball, goal at hole */}
  <ParticlesBurst color="#ffffff" count={14} triggerRef={bounceBurstTriggerRef} />
  <ParticlesBurst color="#ffeb3b" count={18} triggerRef={goalBurstTriggerRef} />
  
  {!isReplaying && <Ball positionRef={ballPosition} velocityRef={ballVelocity} />}
  {isReplaying && <ReplayBall path={lastShotPath} onReplayFinish={handleReplayFinish} ballPositionRef={ballPosition} />}

        {gameState === 'ready' && !isReplaying && (
          <>
            <PlayerControls
              ref={playerControlsRef}
              ballPosition={[ballPosition.current.x, ballPosition.current.y, ballPosition.current.z]}
              onShoot={handleShoot}
              onAimStart={() => setAiming(true)}
              onAimEnd={() => setAiming(false)}
              onAimChange={setAimPower}
            />
            <AimAssist
              active={aiming}
              origin={ballPosition.current}
              direction={playerControlsRef.current?.getDirection() || new THREE.Vector3(0,0,-1)}
              power={playerControlsRef.current?.getPower() || 0}
            />
          </>
        )}
        {/* Ready indicator (pulsing ring) */}
        {gameState === 'ready' && !isReplaying && (
          <mesh position={[ballPosition.current.x, 0.015, ballPosition.current.z]} rotation={[-Math.PI/2,0,0]}>
            <ringGeometry args={[0.25, 0.33, 48]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.55} />
          </mesh>
        )}
        <GameScene
          ballPosRef={ballPosition}
          ballVelocity={ballVelocity}
          onMoveStart={() => { if (gameState === 'ready') setGameState('shot'); }}
          onBallStop={handleBallStop}
          onGoal={handleGoal}
          holePosition={new THREE.Vector3(...(levels[levelIndex]?.hole ?? [0, 0.01, -10]))}
          onBounce={(pos) => { playBeep(440, 0.03, 'square', 0.04); bounceBurstTriggerRef.current?.(pos); }}
          slopes={slopes}
          obstacles={movingObstacles.map((data, i) => ({ ref: obstacleRefs.current[i], data }))}
          pathRecorder={pathRecorder}
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
