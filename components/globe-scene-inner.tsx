"use client"

import { useState, useEffect, Suspense } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Stars } from "@react-three/drei"

// Convert lat/lng to 3D position
function latLngToPosition(lat: number, lng: number, radius: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  return [
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  ]
}

function getMagnitudeColor(mag: number): string {
  if (mag >= 6) return "#ef4444"
  if (mag >= 5) return "#f97316"
  if (mag >= 4) return "#eab308"
  return "#22c55e"
}

export function GlobeSceneInner({
  earthquakes,
  onSelectQuake,
}: {
  earthquakes: any[]
  onSelectQuake: (q: any) => void
}) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full bg-slate-950 text-slate-400">
          Loading globe...
        </div>
      }
    >
      <Canvas
        camera={{ position: [0, 0, 2.5], fov: 45 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          preserveDrawingBuffer: true,
          failIfMajorPerformanceCaveat: false,
        }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 3, 5]} intensity={1.2} />
        <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />

        {/* Earth sphere */}
        <mesh>
          <sphereGeometry args={[1, 64, 64]} />
          <meshStandardMaterial color="#1f3a93" metalness={0.3} roughness={0.7} />
        </mesh>

        {/* Atmosphere */}
        <mesh scale={1.02}>
          <sphereGeometry args={[1, 64, 64]} />
          <meshBasicMaterial color="#3b82f6" transparent opacity={0.08} side={2} />
        </mesh>

        {/* Earthquake markers */}
        {Array.isArray(earthquakes) &&
          earthquakes.map((quake) => (
            <group key={quake.id} position={latLngToPosition(quake.lat, quake.lng, 1.02)}>
              <mesh onClick={() => onSelectQuake(quake)}>
                <sphereGeometry args={[0.01 + quake.mag * 0.003, 16, 16]} />
                <meshBasicMaterial color={getMagnitudeColor(quake.mag)} />
              </mesh>
              <mesh>
                <ringGeometry args={[0.012 + quake.mag * 0.003, 0.018 + quake.mag * 0.003, 32]} />
                <meshBasicMaterial color={getMagnitudeColor(quake.mag)} transparent opacity={0.4} />
              </mesh>
            </group>
          ))}

        <OrbitControls enableZoom enablePan={false} minDistance={1.5} maxDistance={4} autoRotate={false} />
      </Canvas>
    </Suspense>
  )
}
