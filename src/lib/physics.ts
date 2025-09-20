import * as THREE from 'three';

const G = 9.8; // Gravitational constant
const BALL_RADIUS = 0.2;

export interface Slope {
  vertices: [THREE.Vector3, THREE.Vector3, THREE.Vector3];
  normal: THREE.Vector3;
}

export interface PhysicsState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
}

// Simple check if point is inside a triangle on the XZ plane
function pointInTriangle(p: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) {
  const s = a.z * c.x - a.x * c.z + (c.z - a.z) * p.x + (a.x - c.x) * p.z;
  const t = a.x * b.z - a.z * b.x + (a.z - b.z) * p.x + (b.x - a.x) * p.z;

  if ((s < 0) !== (t < 0) && s !== 0 && t !== 0) {
    return false;
  }

  const A = -b.z * c.x + a.z * (c.x - b.x) + a.x * (b.z - c.z) + b.x * c.z;
  if (A < 0) {
    return (s <= 0 && s + t >= A);
  }
  return (s >= 0 && s + t <= A);
}

export interface MovingObstacleState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  size: [number, number, number];
}

export function updateBall(
  state: PhysicsState,
  slopes: Slope[],
  obstacles: MovingObstacleState[],
  dt: number
): { newState: PhysicsState; bounced: boolean } {
  const { position, velocity } = state;
  let bounced = false;

  // 1. Apply Gravity
  let gravityEffect = new THREE.Vector3(0, -G, 0);
  let onSlope = false;
  let slopeNormal = new THREE.Vector3(0, 1, 0);
  let highestSlopeY = -Infinity;
  let activeSlope: Slope | null = null;

  for (const slope of slopes) {
    if (pointInTriangle(position, slope.vertices[0], slope.vertices[1], slope.vertices[2])) {
      const plane = new THREE.Plane().setFromCoplanarPoints(slope.vertices[0], slope.vertices[1], slope.vertices[2]);
      const yAtBallPos = (-plane.normal.x * position.x - plane.normal.z * position.z - plane.constant) / plane.normal.y;
      if (yAtBallPos > highestSlopeY) {
        highestSlopeY = yAtBallPos;
        activeSlope = slope;
      }
    }
  }

  if (activeSlope) {
    onSlope = true;
    slopeNormal = activeSlope.normal;
  }

  // Apply gravity adjusted for the slope normal
  const gravityComponent = new THREE.Vector3(0, -G, 0);
  const projectedGravity = onSlope ? gravityComponent.clone().projectOnPlane(slopeNormal) : gravityComponent;
  velocity.add(projectedGravity.multiplyScalar(dt));

  // 2. Apply Damping (Friction)
  const dampingFactor = Math.pow(0.98, dt * 60); // Frame-rate independent damping
  velocity.multiplyScalar(dampingFactor);

  // 3. Update Position
  const displacement = velocity.clone().multiplyScalar(dt);
  const newPosition = position.clone().add(displacement);

  // 4. Handle Collisions
  const groundSize = [20, 30];
  const minX = -groundSize[0] / 2 + BALL_RADIUS;
  const maxX = groundSize[0] / 2 + BALL_RADIUS;
  const minZ = -groundSize[1] / 2 + BALL_RADIUS;
  const maxZ = groundSize[1] / 2 + BALL_RADIUS;

  if (newPosition.x <= minX || newPosition.x >= maxX) {
    velocity.x = -velocity.x * 0.8;
    newPosition.x = Math.max(minX, Math.min(newPosition.x, maxX));
    bounced = true;
  }
  if (newPosition.z <= minZ || newPosition.z >= maxZ) {
    velocity.z = -velocity.z * 0.8;
    newPosition.z = Math.max(minZ, Math.min(newPosition.z, maxZ));
    bounced = true;
  }

  // Moving obstacle collisions
  for (const obstacle of obstacles) {
    const obstacleMin = new THREE.Vector3(
      obstacle.position.x - obstacle.size[0] / 2,
      obstacle.position.y - obstacle.size[1] / 2,
      obstacle.position.z - obstacle.size[2] / 2
    );
    const obstacleMax = new THREE.Vector3(
      obstacle.position.x + obstacle.size[0] / 2,
      obstacle.position.y + obstacle.size[1] / 2,
      obstacle.position.z + obstacle.size[2] / 2
    );

    // AABB vs Sphere collision detection
    const closestPoint = new THREE.Vector3().copy(newPosition).clamp(obstacleMin, obstacleMax);
    const distanceSq = closestPoint.distanceToSquared(newPosition);
    const BALL_RADIUS_SQ = BALL_RADIUS * BALL_RADIUS;

    if (distanceSq < BALL_RADIUS_SQ) {
      bounced = true;

      // Collision response
      const normal = new THREE.Vector3().subVectors(newPosition, closestPoint).normalize();

      // Reflect velocity relative to the obstacle
      const relativeVelocity = velocity.clone().sub(obstacle.velocity);
      const dot = relativeVelocity.dot(normal);

      // If ball is already moving away from obstacle, do nothing
      if (dot < 0) {
        const impulse = normal.clone().multiplyScalar(-1.8 * dot); // restitution > 1 for arcade feel
        velocity.add(impulse);
      }

      // Move ball out of collision
      const penetrationDepth = BALL_RADIUS - Math.sqrt(distanceSq);
      newPosition.add(normal.clone().multiplyScalar(penetrationDepth + 0.01)); // + epsilon
    }
  }

  // 5. Update Y position based on terrain
  const groundY = 0;
  const terrainY = onSlope ? highestSlopeY : groundY;

  // Collision with terrain (ground or slope)
  if (newPosition.y < terrainY + BALL_RADIUS) {
    newPosition.y = terrainY + BALL_RADIUS;

    // Reflect velocity off the surface (slope or ground)
    const restitution = 0.5; // How much bounce
    const velocityComponentNormal = velocity.clone().projectOnVector(slopeNormal);
    const velocityComponentTangent = velocity.clone().sub(velocityComponentNormal);

    velocity.copy(
      velocityComponentTangent.add(velocityComponentNormal.multiplyScalar(-restitution))
    );

    // Apply friction based on the normal force
    const friction = 0.1;
    const normalForce = Math.abs(gravityComponent.dot(slopeNormal));
    const frictionForce = velocity.clone().normalize().multiplyScalar(-friction * normalForce);
    velocity.add(frictionForce.multiplyScalar(dt));
  }

  // Stop if moving very slowly on a flat-ish surface
  if (velocity.lengthSq() < 0.001 && slopeNormal.y > 0.99) {
    velocity.set(0, 0, 0);
  }

  return {
    newState: { position: newPosition, velocity },
    bounced,
  };
}
