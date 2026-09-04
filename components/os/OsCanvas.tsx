"use client";

// Intelligence OS 3D backdrop: a glowing particle timeline the user can
// pan and zoom through. One particle per archived capture (amber =
// real data), laid out along the x axis by year; a cyan "cursor" ring
// marks the scrubbed year and the camera rig lerps toward it. Rendered
// as a single <Points> with a custom shader — thousands of particles in
// one draw call, comfortably 60fps on an RTX 3050.

import { useMemo, useRef, useEffect, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { useOs } from "@/lib/os/store";

const TIMELINE_START = 1991;
const TIMELINE_END = 2026;
const yearToX = (year: number) => (year - TIMELINE_START) * 1.6;

/* ------------------------------------------------------------------ */
/* Particle timeline — one draw call, custom shader                    */
/* ------------------------------------------------------------------ */

function ParticleTimeline() {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const years = useOs((s) => s.years);
  const scrubYear = useOs((s) => s.year);
  const scrubXRef = useRef<number | null>(null);

  // Stable geometry: fixed budget of particles, attributes updated when
  // the capture-years list changes. aSeed drives per-particle twinkle.
  const COUNT = 6000;

  const { positions, seeds } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const seeds = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
      seeds[i] = Math.random();
    }
    return { positions, seeds };
  }, []);

  // Layout: real capture years get dense amber clusters; the gaps
  // between them get a sparse ambient "data dust" so the spine reads
  // as one continuous network.
  useEffect(() => {
    const pos = pointsRef.current?.geometry.attributes
      .position as THREE.BufferAttribute | undefined;
    if (!pos) return;

    const yearList =
      years.length > 0
        ? years
        : Array.from(
            { length: TIMELINE_END - TIMELINE_START + 1 },
            (_, i) => TIMELINE_START + i
          );

    for (let i = 0; i < COUNT; i++) {
      const seed = seeds[i];
      if (seed < 0.6) {
        // 60%: clustered around a real capture year.
        const year = yearList[Math.floor(Math.random() * yearList.length)];
        const x = yearToX(year) + (Math.random() - 0.5) * 0.9;
        const r = Math.pow(Math.random(), 0.5) * 0.55;
        const theta = Math.random() * Math.PI * 2;
        pos.array[i * 3] = x;
        pos.array[i * 3 + 1] = Math.sin(theta) * r;
        pos.array[i * 3 + 2] = Math.cos(theta) * r;
      } else {
        // 40%: ambient dust along the full spine.
        const t = Math.random();
        pos.array[i * 3] = yearToX(TIMELINE_START + t * (TIMELINE_END - TIMELINE_START));
        pos.array[i * 3 + 1] = (Math.random() - 0.5) * 7;
        pos.array[i * 3 + 2] = (Math.random() - 0.5) * 7;
      }
    }
    pos.needsUpdate = true;
  }, [years, seeds]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScrubX: { value: -1e6 },
    }),
    []
  );

  useEffect(() => {
    scrubXRef.current = scrubYear === null ? null : yearToX(scrubYear);
  }, [scrubYear]);

  useFrame((state, delta) => {
    const target = scrubXRef.current;
    if (target === null) {
      uniforms.uScrubX.value = -1e6; // far away — no cursor
    } else {
      // ease toward the target so scrubbing feels physical
      uniforms.uScrubX.value +=
        (target - uniforms.uScrubX.value) * Math.min(1, delta * 8);
    }
    uniforms.uTime.value = state.clock.elapsedTime;
  });

  const vertexShader = /* glsl */ `
    attribute float aSeed;
    uniform float uTime;
    uniform float uScrubX;
    varying float vGlow;

    void main() {
      vec3 p = position;
      // gentle drift so the network feels alive
      p.y += sin(uTime * 0.6 + aSeed * 40.0) * 0.05;
      p.z += cos(uTime * 0.5 + aSeed * 60.0) * 0.05;

      // proximity to the scrub cursor → brightness
      float d = abs(p.x - uScrubX);
      float cursor = smoothstep(3.0, 0.0, d);
      float twinkle = 0.55 + 0.45 * sin(uTime * (0.8 + aSeed * 2.0) + aSeed * 100.0);
      vGlow = twinkle * (0.55 + cursor * 1.8);

      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_PointSize = (2.2 + cursor * 3.4) * (300.0 / -mv.z);
      gl_Position = projectionMatrix * mv;
    }
  `;

  const fragmentShader = /* glsl */ `
    varying float vGlow;
    uniform float uScrubX;

    void main() {
      vec2 uv = gl_PointCoord - 0.5;
      float dist = length(uv);
      float alpha = smoothstep(0.5, 0.05, dist);
      // amber core, hot near the cursor
      vec3 amber = vec3(0.91, 0.71, 0.35);
      vec3 hot = vec3(1.0, 0.92, 0.72);
      vec3 col = mix(amber, hot, clamp(vGlow - 1.0, 0.0, 1.0));
      gl_FragColor = vec4(col * vGlow, alpha * min(vGlow, 1.0));
    }
  `;

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ------------------------------------------------------------------ */
/* Network spine — lines linking capture-year clusters                 */
/* ------------------------------------------------------------------ */

function NetworkSpine() {
  const years = useOs((s) => s.years);
  const geometry = useMemo(() => {
    const yearList =
      years.length > 0
        ? years
        : Array.from(
            { length: TIMELINE_END - TIMELINE_START + 1 },
            (_, i) => TIMELINE_START + i
          ).filter((_, i) => i % 2 === 0);

    // a polyline through each cluster, plus a few jittered alternates
    const verts: number[] = [];
    const push = (x: number, y: number, z: number) => verts.push(x, y, z);
    for (let i = 0; i < yearList.length - 1; i++) {
      const x1 = yearToX(yearList[i]);
      const x2 = yearToX(yearList[i + 1]);
      const y = (Math.random() - 0.5) * 0.3;
      const z = (Math.random() - 0.5) * 0.3;
      push(x1, y, z);
      push(x2, y, z);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    return g;
  }, [years]);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial
        color="#7a5a1e"
        transparent
        opacity={0.35}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </lineSegments>
  );
}

/* ------------------------------------------------------------------ */
/* Ground grid + year tick marks                                       */
/* ------------------------------------------------------------------ */

function YearTicks() {
  const mesh = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const verts: number[] = [];
    for (let y = TIMELINE_START; y <= TIMELINE_END; y++) {
      const x = yearToX(y);
      // small vertical tick under the spine
      verts.push(x, -1.1, 0, x, -0.9, 0);
      if (y % 5 === 0) {
        // brighter longer tick for labeled years
        verts.push(x, -1.25, 0, x, -0.85, 0);
      }
    }
    g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    return g;
  }, []);

  return (
    <lineSegments geometry={mesh}>
      <lineBasicMaterial color="#2a3a4a" transparent opacity={0.8} />
    </lineSegments>
  );
}

function GroundPlane() {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[yearToX(2008), -1.4, 0]}>
      <planeGeometry args={[100, 40]} />
      <meshBasicMaterial color="#05060a" transparent opacity={0.9} />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/* Camera rig — lerps along the timeline with the scrub; user pan/zoom */
/* ------------------------------------------------------------------ */

function CameraRig() {
  const { camera } = useThree();
  const scrubYear = useOs((s) => s.year);
  const target = useRef(new THREE.Vector3(0, 0, 8));
  const desired = useRef(new THREE.Vector3(0, 0, 8));
  const dragging = useRef(false);
  const lastPointer = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (scrubYear !== null) {
      desired.current.set(yearToX(scrubYear), 0.5, 8);
    }
  }, [scrubYear]);

  useEffect(() => {
    const el = document.body;
    const onDown = (e: PointerEvent) => {
      // don't steal drags from HUD panels
      if ((e.target as HTMLElement).closest(".hud-panel, .hud-drawer, input, select, button, a, label")) return;
      dragging.current = true;
      lastPointer.current = { x: e.clientX, y: e.clientY };
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging.current || !lastPointer.current) return;
      const dx = e.clientX - lastPointer.current.x;
      const dy = e.clientY - lastPointer.current.y;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      desired.current.x -= dx * 0.02;
      desired.current.y = THREE.MathUtils.clamp(
        desired.current.y + dy * 0.012,
        -1.5,
        4
      );
    };
    const onUp = () => {
      dragging.current = false;
      lastPointer.current = null;
    };
    const onWheel = (e: WheelEvent) => {
      if ((e.target as HTMLElement).closest(".hud-panel, .hud-drawer")) return;
      desired.current.z = THREE.MathUtils.clamp(
        desired.current.z + e.deltaY * 0.01,
        3,
        26
      );
    };
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("wheel", onWheel);
    };
  }, []);

  useFrame((state, delta) => {
    // frame the whole timeline on first mount
    const mid = yearToX((TIMELINE_START + TIMELINE_END) / 2);
    if (scrubYear === null && target.current.x === 0 && desired.current.x === 0) {
      desired.current.set(mid, 0.5, 20);
    }
    const t = Math.min(1, delta * 3.5);
    target.current.lerp(desired.current, t);
    camera.position.lerp(target.current, t);
    camera.lookAt(target.current.x, target.current.y * 0.5, 0);
  });

  return null;
}

/* ------------------------------------------------------------------ */
/* Canvas shell                                                        */
/* ------------------------------------------------------------------ */

export function OsCanvas({ className }: { className?: string }) {
  return (
    <div
      className={`fixed inset-0 -z-10 pointer-events-none ${className ?? ""}`}
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [28, 2, 18], fov: 55, near: 0.1, far: 120 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <color attach="background" args={["#050509"]} />
        <fog attach="fog" args={["#050509", 18, 60]} />
        <Suspense fallback={null}>
          <ParticleTimeline />
          <NetworkSpine />
          <YearTicks />
          <GroundPlane />
          <CameraRig />
          <EffectComposer>
            <Bloom
              intensity={0.9}
              luminanceThreshold={0.25}
              luminanceSmoothing={0.3}
              mipmapBlur
            />
          </EffectComposer>
        </Suspense>
      </Canvas>
      {/* vignette + scanlines over the canvas, under the HUD */}
      <div className="absolute inset-0 hud-scanlines opacity-60" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 120% 90% at 50% 40%, transparent 55%, rgba(5,5,9,0.75) 100%)",
        }}
      />
    </div>
  );
}
