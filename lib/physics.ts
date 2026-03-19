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

// --- Gravity status reporting for debug indicator ---
export type GravityStatus =
  | { type: "no-sensor" }
  | { type: "waiting-permission" }
  | { type: "active"; gx: number; gy: number; source: string };

export type GravityStatusCallback = (status: GravityStatus) => void;

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
    gravity: { x: 0, y: 1, scale: 0.005 },
  });

  const runner = Runner.create();

  const wallThickness = 60;
  const totalHeight = sceneHeight || viewport.height;

  // Fixed walls enclosing the entire scrollable page area.
  // No floor/ceiling follow viewport — just hard boundaries.
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
  // Touch attraction is handled separately via startTouchAttraction().

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

export function activateBody(world: PhysicsWorld, elementId: string): void {
  const body = world.bodies.get(elementId);
  if (!body || !body.isStatic) return;

  Body.setStatic(body, false);

  // Random impulse for dramatic effect
  const impulseX = (Math.random() - 0.5) * 0.02;
  const impulseY = -Math.random() * 0.01;

  Body.applyForce(body, body.position, {
    x: impulseX,
    y: impulseY,
  });
}

export function clampBody(world: PhysicsWorld, elementId: string, x: number, y: number): void {
  const body = world.bodies.get(elementId);
  if (!body || body.isStatic) return;
  Body.setPosition(body, { x, y });
  Body.setVelocity(body, { x: 0, y: 0 });
}


// --- Device sensor gravity ---

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
 * Start updating engine gravity based on device orientation sensors.
 * Uses a low-pass filter (EMA) so that:
 *  - Slow tilts smoothly change gravity direction
 *  - Fast shakes are filtered out (inertia of rest)
 * Returns a cleanup function to stop listening.
 */
export function startDeviceGravity(
  world: PhysicsWorld,
  onStatus?: GravityStatusCallback
): () => void {
  let smoothX = 0;
  let smoothY = 0;
  let receivedEvents = false;
  let firstReading = true;
  const ALPHA = 0.08; // lower = heavier feel / more inertia
  const DEG = Math.PI / 180;

  const handler = (event: DeviceOrientationEvent) => {
    if (event.beta == null || event.gamma == null) return;

    receivedEvents = true;

    const gamma = event.gamma;
    const beta = event.beta;

    const gx = Math.sin(gamma * DEG);
    const gy = Math.cos((beta - 90) * DEG);

    const clampedGx = Math.max(-1, Math.min(1, gx));
    const clampedGy = Math.max(-1, Math.min(1, gy));

    if (firstReading) {
      // Snap immediately on first reading — no lag from EMA warmup
      smoothX = clampedGx;
      smoothY = clampedGy;
      firstReading = false;
    } else {
      smoothX += (clampedGx - smoothX) * ALPHA;
      smoothY += (clampedGy - smoothY) * ALPHA;
    }

    world.engine.gravity.x = smoothX;
    world.engine.gravity.y = smoothY;

    if (onStatus) {
      onStatus({
        type: "active",
        gx: Math.round(smoothX * 100) / 100,
        gy: Math.round(smoothY * 100) / 100,
        source: "sensor",
      });
    }
  };

  window.addEventListener("deviceorientation", handler, true);

  // Detect if sensor never fires (desktop browser without sensor)
  const timeoutId = setTimeout(() => {
    if (!receivedEvents && onStatus) {
      onStatus({ type: "no-sensor" });
    }
  }, 2000);

  return () => {
    clearTimeout(timeoutId);
    window.removeEventListener("deviceorientation", handler, true);
    world.engine.gravity.x = 0;
    world.engine.gravity.y = 1;
  };
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
  const INERTIA_SCALE = 0.005;
  const THRESHOLD = 0.2;
  const MAX_ACC = 30;

  // Accumulated acceleration (written by event, read by engine tick)
  let accX = 0;
  let accY = 0;

  // High-pass filter state for accelerationIncludingGravity fallback
  let prevRawX = 0, prevRawY = 0;
  let filteredX = 0, filteredY = 0;
  const HP_ALPHA = 0.8;
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

/**
 * Combined desktop gravity controller: keyboard (arrow keys / WASD) + mouse-edge.
 * Keyboard takes priority when any key is held; mouse-edge provides subtle
 * passive gravity shifts otherwise. Uses a single rAF loop to avoid conflicts.
 * Returns a cleanup function.
 */
export function startDesktopGravity(
  world: PhysicsWorld,
  onStatus?: GravityStatusCallback
): () => void {
  // --- Keyboard state ---
  const keysHeld = new Set<string>();
  const TILT_STRENGTH = 0.8;

  // --- Mouse-edge state ---
  let mouseEdgeX = 0;
  let mouseEdgeY = 0;
  const EDGE_ZONE = 0.15;
  const MAX_SHIFT = 0.3;

  // --- Shared smooth state ---
  let smoothX = 0;
  let smoothY = 1;
  let animId = 0;
  const KB_LERP = 0.06;
  const MOUSE_LERP = 0.03;

  function keyToDirection(key: string): string | null {
    switch (key) {
      case "ArrowLeft":
      case "a":
      case "A":
        return "left";
      case "ArrowRight":
      case "d":
      case "D":
        return "right";
      case "ArrowUp":
      case "w":
      case "W":
        return "up";
      case "ArrowDown":
      case "s":
      case "S":
        return "down";
      default:
        return null;
    }
  }

  const onKeyDown = (e: KeyboardEvent) => {
    const dir = keyToDirection(e.key);
    if (dir) {
      e.preventDefault();
      keysHeld.add(dir);
    }
  };

  const onKeyUp = (e: KeyboardEvent) => {
    const dir = keyToDirection(e.key);
    if (dir) {
      keysHeld.delete(dir);
    }
  };

  const onMouseMove = (e: MouseEvent) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const nx = (e.clientX / vw) * 2 - 1;
    const ny = (e.clientY / vh) * 2 - 1;

    const threshold = 1 - EDGE_ZONE * 2;
    mouseEdgeX = Math.abs(nx) > threshold
      ? Math.sign(nx) * ((Math.abs(nx) - threshold) / (EDGE_ZONE * 2)) * MAX_SHIFT
      : 0;
    mouseEdgeY = Math.abs(ny) > threshold
      ? Math.sign(ny) * ((Math.abs(ny) - threshold) / (EDGE_ZONE * 2)) * MAX_SHIFT
      : 0;
  };

  function tick() {
    let targetX: number;
    let targetY: number;
    let lerpSpeed: number;
    let isKeyboard = false;

    if (keysHeld.size > 0) {
      // Keyboard takes priority — no key = default gravity (0,1)
      targetX = 0;
      targetY = 0;
      if (keysHeld.has("left")) targetX -= 1;
      if (keysHeld.has("right")) targetX += 1;
      if (keysHeld.has("up")) targetY -= 1;
      if (keysHeld.has("down")) targetY += 1;
      // Normalize diagonal so magnitude stays at 1
      const mag = Math.sqrt(targetX * targetX + targetY * targetY);
      if (mag > 1) {
        targetX /= mag;
        targetY /= mag;
      }
      lerpSpeed = KB_LERP;
      isKeyboard = true;
    } else {
      // No keyboard → settle back to default gravity (down)
      targetX = mouseEdgeX;
      targetY = 1 + mouseEdgeY;
      lerpSpeed = MOUSE_LERP;
    }

    smoothX += (targetX - smoothX) * lerpSpeed;
    smoothY += (targetY - smoothY) * lerpSpeed;

    world.engine.gravity.x = smoothX;
    world.engine.gravity.y = smoothY;

    if (isKeyboard && onStatus) {
      onStatus({
        type: "active",
        gx: Math.round(smoothX * 100) / 100,
        gy: Math.round(smoothY * 100) / 100,
        source: "keyboard",
      });
    }

    animId = requestAnimationFrame(tick);
  }

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("mousemove", onMouseMove);
  animId = requestAnimationFrame(tick);

  return () => {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("mousemove", onMouseMove);
    cancelAnimationFrame(animId);
    world.engine.gravity.x = 0;
    world.engine.gravity.y = 1;
  };
}

/**
 * Touch/click gravity attraction: while pressing, all bodies are pulled
 * toward the pointer position. Works with both mouse and touch.
 * Touch events are passive so they don't block scrolling.
 */
export function startTouchAttraction(
  world: PhysicsWorld,
  canvas: HTMLElement
): () => void {
  let active = false;
  let pointerX = 0;
  let pointerY = 0;
  const FORCE = 0.008;

  const onMouseDown = (e: MouseEvent) => {
    active = true;
    pointerX = e.offsetX;
    pointerY = e.offsetY;
  };
  const onMouseMove = (e: MouseEvent) => {
    if (!active) return;
    pointerX = e.offsetX;
    pointerY = e.offsetY;
  };
  const onMouseUp = () => { active = false; };

  const onTouchStart = (e: TouchEvent) => {
    if (!e.touches[0]) return;
    active = true;
    const rect = canvas.getBoundingClientRect();
    pointerX = e.touches[0].clientX - rect.left;
    pointerY = e.touches[0].clientY - rect.top;
  };
  const onTouchMove = (e: TouchEvent) => {
    if (!active || !e.touches[0]) return;
    const rect = canvas.getBoundingClientRect();
    pointerX = e.touches[0].clientX - rect.left;
    pointerY = e.touches[0].clientY - rect.top;
  };
  const onTouchEnd = () => { active = false; };

  const applyAttraction = () => {
    if (!active) return;
    const draggedBody = world.mouseConstraint?.body;
    for (const [, body] of world.bodies) {
      if (body.isStatic || body === draggedBody) continue;
      const dx = pointerX - body.position.x;
      const dy = pointerY - body.position.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < 100) continue;
      const dist = Math.sqrt(distSq);
      const f = FORCE * body.mass;
      Body.applyForce(body, body.position, {
        x: (dx / dist) * f,
        y: (dy / dist) * f,
      });
    }
  };

  canvas.addEventListener("mousedown", onMouseDown);
  canvas.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
  canvas.addEventListener("touchstart", onTouchStart, { passive: true });
  canvas.addEventListener("touchmove", onTouchMove, { passive: true });
  canvas.addEventListener("touchend", onTouchEnd, { passive: true });
  Events.on(world.engine, "beforeUpdate", applyAttraction);

  return () => {
    canvas.removeEventListener("mousedown", onMouseDown);
    canvas.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
    canvas.removeEventListener("touchstart", onTouchStart);
    canvas.removeEventListener("touchmove", onTouchMove);
    canvas.removeEventListener("touchend", onTouchEnd);
    Events.off(world.engine, "beforeUpdate", applyAttraction);
  };
}

export function destroyPhysicsWorld(world: PhysicsWorld): void {
  Runner.stop(world.runner);
  World.clear(world.engine.world, false);
  Engine.clear(world.engine);
}
