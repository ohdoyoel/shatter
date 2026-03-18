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
    gravity: { x: 0, y: 1, scale: 0.001 },
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

  // Touch: only intercept when actively dragging a body, else let scroll through
  canvas.addEventListener(
    "touchstart",
    (e: TouchEvent) => {
      (mouse as any).mousedown(e);
    },
    { passive: true }
  );
  canvas.addEventListener(
    "touchmove",
    (e: TouchEvent) => {
      (mouse as any).mousemove(e);
      // Block scroll only while dragging a physics body
      if (mouseConstraint.body) {
        e.preventDefault();
      }
    },
    { passive: false }
  );
  canvas.addEventListener(
    "touchend",
    (e: TouchEvent) => {
      (mouse as any).mouseup(e);
    },
    { passive: true }
  );

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
  const body = Bodies.rectangle(
    element.x + element.width / 2,
    element.y + element.height / 2,
    element.width,
    element.height,
    {
      restitution: 0.3,
      friction: 0.5,
      frictionAir: 0.005,
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
    typeof DeviceOrientationEvent !== "undefined" &&
    typeof (DeviceOrientationEvent as any).requestPermission === "function"
  );
}

export async function requestDeviceOrientationPermission(): Promise<boolean> {
  if (needsDeviceOrientationPermission()) {
    try {
      const result = await (DeviceOrientationEvent as any).requestPermission();
      return result === "granted";
    } catch {
      return false;
    }
  }
  return true;
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
  let smoothY = 1;
  let receivedEvents = false;
  const ALPHA = 0.08; // lower = heavier feel / more inertia
  const DEG = Math.PI / 180;

  const handler = (event: DeviceOrientationEvent) => {
    if (event.beta == null || event.gamma == null) return;

    receivedEvents = true;

    // beta: front-back tilt (-180..180), gamma: left-right tilt (-90..90)
    // Phone held upright in portrait: beta ~90, gamma ~0
    // We want gravity to point "down" relative to tilt:
    //   - gamma controls x-axis gravity (tilt left/right)
    //   - beta controls y-axis gravity (tilt forward/back)
    const gamma = event.gamma;
    const beta = event.beta;

    // gamma: left/right tilt → x-axis gravity. sin maps -90..90 to -1..1
    const gx = Math.sin(gamma * DEG);
    // beta=90 when upright. cos(beta-90) gives:
    //   upright (90) → 1, flat face-up (0) → 0, tilted back (-90) → -1
    const gy = Math.cos((beta - 90) * DEG);

    // Exponential moving average (low-pass filter)
    smoothX += (Math.max(-1, Math.min(1, gx)) - smoothX) * ALPHA;
    smoothY += (Math.max(-1, Math.min(1, gy)) - smoothY) * ALPHA;

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

export function destroyPhysicsWorld(world: PhysicsWorld): void {
  Runner.stop(world.runner);
  World.clear(world.engine.world, false);
  Engine.clear(world.engine);
}
