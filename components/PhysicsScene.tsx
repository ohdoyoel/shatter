"use client";

import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import type { CaptureResponse, CapturedElement } from "@/lib/types";

export default function PhysicsScene({ data }: { data: CaptureResponse }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const elementsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const worldRef = useRef<any>(null);
  const rafRef = useRef<number>(0);
  const physicsRef = useRef<any>(null);
  const shatteredRef = useRef(false);
  const deviceMotionCleanupRef = useRef<(() => void) | null>(null);
  const [shattered, setShattered] = useState(false);
  const [needsPermission, setNeedsPermission] = useState(false);

  // O(1) element lookup for animation loop (avoids O(n) find per body per frame)
  const elementMap = useMemo(
    () => new Map(data.elements.map((e) => [e.id, e])),
    [data.elements]
  );

  // Convert screenshot data URI to blob URL for efficient CSS usage
  const [bgUrl, setBgUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!data.screenshot) return;

    // Convert base64 data URI to blob URL
    const byteString = atob(data.screenshot.split(",")[1]);
    const mimeType = data.screenshot.split(",")[0].split(":")[1].split(";")[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeType });
    const url = URL.createObjectURL(blob);
    setBgUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [data.screenshot]);

  const registerElement = useCallback(
    (id: string, el: HTMLDivElement | null) => {
      if (el) {
        elementsRef.current.set(id, el);
      } else {
        elementsRef.current.delete(id);
      }
    },
    []
  );

  // Initialize physics world + auto-shatter + animation loop
  useEffect(() => {
    if (!containerRef.current) return;

    let mounted = true;

    async function init() {
      // Guard against double initialization (React re-render during async import)
      if (worldRef.current) return;

      const physics = await import("@/lib/physics");
      physicsRef.current = physics;

      if (!mounted || !containerRef.current || worldRef.current) return;

      const world = physics.createPhysicsWorld(
        { width: window.innerWidth, height: window.innerHeight },
        containerRef.current,
        data.pageHeight
      );
      worldRef.current = world;

      // Create physics bodies only for non-static elements
      data.elements.forEach((element) => {
        if (!element.isStatic) {
          physics.createElementBody(element, world);
        }
      });

      // Start animation loop
      function updatePositions() {
        if (!mounted) return;

        const w = worldRef.current;
        const phys = physicsRef.current;
        if (w) {
          w.bodies.forEach((body: any, id: string) => {
            const el = elementsRef.current.get(id);
            if (!el) return;

            const element = elementMap.get(id);
            if (!element) return;

            const origCenterX = element.x + element.width / 2;
            const origCenterY = element.y + element.height / 2;
            const dx = body.position.x - origCenterX;
            const dy = body.position.y - origCenterY;

            el.style.transform = `translate(${dx}px, ${dy}px) rotate(${body.angle}rad)`;
          });

          // (activation now happens all at once in triggerShatter)
        }

        rafRef.current = requestAnimationFrame(updatePositions);
      }

      rafRef.current = requestAnimationFrame(updatePositions);

      // No gravity — only device motion inertia.
      // iOS requires permission prompt for DeviceMotionEvent.
      if (physics.needsDeviceOrientationPermission()) {
        setNeedsPermission(true);
      } else {
        deviceMotionCleanupRef.current = physics.startDeviceMotion(world);
      }

      // Shatter after a short delay to let elements render
      setTimeout(() => {
        if (mounted && worldRef.current) {
          shatteredRef.current = true;
          setShattered(true);
          physics.triggerShatter(worldRef.current);
        }
      }, 500);
    }

    init();

    return () => {
      mounted = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      if (deviceMotionCleanupRef.current) {
        deviceMotionCleanupRef.current();
        deviceMotionCleanupRef.current = null;
      }
      if (worldRef.current) {
        import("@/lib/physics").then((physics) => {
          if (worldRef.current) {
            physics.destroyPhysicsWorld(worldRef.current);
            worldRef.current = null;
          }
        });
      }
    };
  }, [data]);

  const handleEnableMotion = useCallback(async () => {
    const physics = physicsRef.current;
    const world = worldRef.current;
    if (!physics || !world) return;

    const granted = await physics.requestDeviceOrientationPermission();
    if (granted) {
      deviceMotionCleanupRef.current = physics.startDeviceMotion(world);
      setNeedsPermission(false);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      data-testid="physics-scene"
      className="relative"
      style={{
        width: "100%",
        height: data.pageHeight,
        overflow: "hidden",
        touchAction: "pan-y",
        backgroundColor: data.bodyBgColor || "#fff",
        backgroundImage: bgUrl ? `url(${bgUrl})` : undefined,
        backgroundSize: `${data.viewport.width}px ${data.pageHeight}px`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "0 0",
      }}
    >
      {/* iOS motion permission button */}
      {needsPermission && (
        <button
          onClick={handleEnableMotion}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-black/70 text-white px-5 py-2.5 rounded-full text-sm backdrop-blur-sm"
        >
          Tap to enable motion
        </button>
      )}

      {/* Masks: appear on shatter to erase physics elements from background */}
      {shattered &&
        data.elements
          .filter((e) => !e.isStatic)
          .map((element) => (
            <div
              key={`mask-${element.id}`}
              className="absolute"
              style={{
                left: element.x,
                top: element.y,
                width: element.width,
                height: element.height,
                backgroundColor: data.bodyBgColor || "#fff",
                zIndex: 0,
              }}
            />
          ))}
      {/* Elements */}
      {data.elements.map((element: CapturedElement) => (
        <div
          key={element.id}
          ref={(el) => registerElement(element.id, el)}
          className="absolute"
          style={{
            left: element.x,
            top: element.y,
            width: element.width,
            height: element.height,
            backgroundImage: bgUrl ? `url(${bgUrl})` : undefined,
            backgroundPosition: `-${element.x}px -${element.y}px`,
            backgroundSize: `${data.viewport.width}px ${data.pageHeight}px`,
            backgroundRepeat: "no-repeat",
            willChange: element.isStatic ? "auto" : "transform",
            cursor: element.isStatic ? "default" : "grab",
            zIndex: element.isStatic ? 0 : 1,
            visibility: element.isStatic || shattered ? "visible" : "hidden",
          }}
        />
      ))}
    </div>
  );
}
