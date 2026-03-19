import Matter from "matter-js";
import type { CapturedElement } from "./types";

const {
  Engine,
  World,
  Bodies,
  Body,
  Mouse,
  MouseConstraint,
  Events,
  Runner,
} = Matter;

export interface PhysicsWorld {
  engine: Matter.Engine;
  runner: Matter.Runner;
  bodies: Map<string, Matter.Body>;
  mouseConstraint: Matter.MouseConstraint | null;
  floor: Matter.Body;
  ceiling: Matter.Body;
}

export function createPhysicsWorld(
  viewport: { width: number; height: number },
  canvas: HTMLElement,
  sceneHeight?: number
): PhysicsWorld {
  const engine = Engine.create({
    gravity: { x: 0, y: 1, scale: 0 },
  });

  const runner = Runner.create();

  const wallThickness = 400; // thick walls to prevent tunneling at high velocity
  const totalHeight = sceneHeight || viewport.height;

  const floor = Bodies.rectangle(
    viewport.width / 2,
    totalHeight + wallThickness / 2,
    viewport.width + wallThickness * 2,
    wallThickness,
    { isStatic: true, restitution: 0.5, friction: 0.3 }
  );

  const ceiling = Bodies.rectangle(
    viewport.width / 2,
    -wallThickness / 2,
    viewport.width + wallThickness * 2,
    wallThickness,
    { isStatic: true, restitution: 0.5, friction: 0.3 }
  );

  const leftWall = Bodies.rectangle(
    -wallThickness / 2,
    totalHeight / 2,
    wallThickness,
    totalHeight + wallThickness * 2,
    { isStatic: true, restitution: 0.5 }
  );

  const rightWall = Bodies.rectangle(
    viewport.width + wallThickness / 2,
    totalHeight / 2,
    wallThickness,
    totalHeight + wallThickness * 2,
    { isStatic: true, restitution: 0.5 }
  );

  World.add(engine.world, [floor, ceiling, leftWall, rightWall]);

  // Velocity cap + position clamping — prevent bodies escaping bounds
  const MAX_SPEED = 30;
  const bounds = { minX: 0, maxX: viewport.width, minY: 0, maxY: totalHeight };

  Events.on(engine, "beforeUpdate", () => {
    for (const body of engine.world.bodies) {
      if (body.isStatic) continue;

      // Cap velocity to prevent tunneling
      const vx = body.velocity.x;
      const vy = body.velocity.y;
      const speed = Math.sqrt(vx * vx + vy * vy);
      if (speed > MAX_SPEED) {
        const scale = MAX_SPEED / speed;
        Body.setVelocity(body, { x: vx * scale, y: vy * scale });
      }

      // Hard clamp position — safety net if body somehow escapes walls
      const { x, y } = body.position;
      const clamped = {
        x: Math.max(bounds.minX, Math.min(bounds.maxX, x)),
        y: Math.max(bounds.minY, Math.min(bounds.maxY, y)),
      };
      if (clamped.x !== x || clamped.y !== y) {
        Body.setPosition(body, clamped);
        Body.setVelocity(body, { x: 0, y: 0 });
      }
    }
  });

  // Mouse constraint — drag physics bodies, but allow page scrolling
  const mouse = Mouse.create(canvas);
  // pixelRatio must be 1 for div elements (not canvas). devicePixelRatio
  // would halve coordinates on Retina displays, breaking hit detection.
  mouse.pixelRatio = 1;

  // Remove ALL listeners that Mouse.create added (including wheel),
  // then re-add only mouse/touch without wheel so page scroll works.
  canvas.removeEventListener("mousemove", (mouse as any).mousemove);
  canvas.removeEventListener("mousedown", (mouse as any).mousedown);
  canvas.removeEventListener("mouseup", (mouse as any).mouseup);
  canvas.removeEventListener("wheel", (mouse as any).mousewheel);
  canvas.removeEventListener("DOMMouseScroll", (mouse as any).mousewheel);
  canvas.removeEventListener("touchmove", (mouse as any).mousemove);
  canvas.removeEventListener("touchstart", (mouse as any).mousedown);
  canvas.removeEventListener("touchend", (mouse as any).mouseup);

  canvas.addEventListener("mousemove", (mouse as any).mousemove);
  canvas.addEventListener("mousedown", (mouse as any).mousedown);
  canvas.addEventListener("mouseup", (mouse as any).mouseup);

  const mouseConstraint = MouseConstraint.create(engine, {
    mouse,
    constraint: {
      stiffness: 0.2,
      render: { visible: false },
    },
  });

  World.add(engine.world, mouseConstraint);

  // Touch events NOT added to mouse constraint — scroll works naturally on mobile.

  // Track velocity for throwing
  let lastMousePos = { x: 0, y: 0 };
  let mouseVelocity = { x: 0, y: 0 };

  Events.on(mouseConstraint, "mousemove", (e: any) => {
    const pos = e.mouse.position;
    mouseVelocity = {
      x: pos.x - lastMousePos.x,
      y: pos.y - lastMousePos.y,
    };
    lastMousePos = { x: pos.x, y: pos.y };
  });

  Events.on(mouseConstraint, "enddrag", (e: any) => {
    const body = e.body;
    if (body) {
      Body.setVelocity(body, {
        x: mouseVelocity.x * 3,
        y: mouseVelocity.y * 3,
      });
    }
  });

  return {
    engine,
    runner,
    bodies: new Map(),
    mouseConstraint,
    floor,
    ceiling,
  };
}


export function createElementBody(
  element: CapturedElement,
  world: PhysicsWorld
): Matter.Body {
  // Guard: skip if body with this ID already exists
  if (world.bodies.has(element.id)) return world.bodies.get(element.id)!;

  const body = Bodies.rectangle(
    element.x + element.width / 2,
    element.y + element.height / 2,
    element.width,
    element.height,
    {
      restitution: 0.3,
      friction: 0.5,
      frictionAir: 0.002,
      density: 0.5,
      label: element.id,
    }
  );

  // Set static AFTER creation so Matter.js saves _original mass/inertia.
  // Bodies created with isStatic:true never save _original, so
  // setStatic(false) later can't restore proper mass → NaN positions.
  Body.setStatic(body, true);

  World.add(world.engine.world, body);
  world.bodies.set(element.id, body);

  return body;
}

export function triggerShatter(world: PhysicsWorld): void {
  Runner.run(world.runner, world.engine);

  // Sort bodies top-to-bottom, then activate in batches
  // so Matter.js isn't overwhelmed and we get a wave effect.
  const sorted = Array.from(world.bodies.entries())
    .filter(([, b]) => b.isStatic)
    .sort(([, a], [, b]) => a.position.y - b.position.y);

  const BATCH = 30;
  const DELAY = 80; // ms between batches

  for (let i = 0; i < sorted.length; i += BATCH) {
    const batch = sorted.slice(i, i + BATCH);
    setTimeout(() => {
      batch.forEach(([, body]) => {
        if (!body.isStatic) return;
        Body.setStatic(body, false);
        Body.applyForce(body, body.position, {
          x: (Math.random() - 0.5) * 0.02,
          y: -Math.random() * 0.01,
        });
      });
    }, (i / BATCH) * DELAY);
  }
}

// --- Device motion permission (iOS) ---

export function needsDeviceOrientationPermission(): boolean {
  return (
    (typeof DeviceOrientationEvent !== "undefined" &&
      typeof (DeviceOrientationEvent as any).requestPermission === "function") ||
    (typeof DeviceMotionEvent !== "undefined" &&
      typeof (DeviceMotionEvent as any).requestPermission === "function")
  );
}

export async function requestDeviceOrientationPermission(): Promise<boolean> {
  const promises: Promise<string>[] = [];
  if (typeof (DeviceOrientationEvent as any).requestPermission === "function") {
    promises.push((DeviceOrientationEvent as any).requestPermission());
  }
  if (typeof (DeviceMotionEvent as any).requestPermission === "function") {
    promises.push((DeviceMotionEvent as any).requestPermission());
  }
  if (promises.length === 0) return true;
  try {
    const results = await Promise.all(promises);
    return results.every((r) => r === "granted");
  } catch {
    return false;
  }
}

/**
 * Apply inertial forces from device acceleration (shaking/jerking the phone).
 * Accumulates acceleration from DeviceMotionEvent, then applies forces
 * inside the engine's beforeUpdate to guarantee correct timing.
 * Prefers acceleration (gravity-removed); falls back to
 * accelerationIncludingGravity with a high-pass filter.
 */
export function startDeviceMotion(
  world: PhysicsWorld,
): () => void {
  const INERTIA_SCALE = 0.012;
  const THRESHOLD = 0.08;
  const MAX_ACC = 40;

  // Accumulated acceleration (written by event, read by engine tick)
  let accX = 0;
  let accY = 0;

  // High-pass filter state for accelerationIncludingGravity fallback
  let prevRawX = 0, prevRawY = 0;
  let filteredX = 0, filteredY = 0;
  const HP_ALPHA = 0.9;
  let initialized = false;

  const clamp = (v: number, max: number) => Math.max(-max, Math.min(max, v));

  const handler = (event: DeviceMotionEvent) => {
    const pure = event.acceleration;
    if (pure && pure.x != null && pure.y != null) {
      accX = pure.x;
      accY = pure.y;
    } else {
      const raw = event.accelerationIncludingGravity;
      if (!raw || raw.x == null || raw.y == null) return;

      if (!initialized) {
        prevRawX = raw.x;
        prevRawY = raw.y;
        initialized = true;
        return;
      }

      filteredX = HP_ALPHA * (filteredX + raw.x - prevRawX);
      filteredY = HP_ALPHA * (filteredY + raw.y - prevRawY);
      prevRawX = raw.x;
      prevRawY = raw.y;

      accX = filteredX;
      accY = filteredY;
    }
  };

  // Apply accumulated acceleration during engine update — guaranteed timing
  const applyInertia = () => {
    if (Math.abs(accX) < THRESHOLD && Math.abs(accY) < THRESHOLD) return;

    const ax = clamp(accX, MAX_ACC);
    const ay = clamp(accY, MAX_ACC);

    for (const [, body] of world.bodies) {
      if (body.isStatic) continue;
      Body.applyForce(body, body.position, {
        x: -ax * INERTIA_SCALE * body.mass,
        y: ay * INERTIA_SCALE * body.mass,
      });
    }
  };

  window.addEventListener("devicemotion", handler, true);
  Events.on(world.engine, "beforeUpdate", applyInertia);

  return () => {
    window.removeEventListener("devicemotion", handler, true);
    Events.off(world.engine, "beforeUpdate", applyInertia);
  };
}

export function destroyPhysicsWorld(world: PhysicsWorld): void {
  Runner.stop(world.runner);
  World.clear(world.engine.world, false);
  Engine.clear(world.engine);
}
