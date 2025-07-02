"use client"

import { useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Environment, Grid, Text } from "@react-three/drei"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RotateCcw } from "lucide-react"
import type * as THREE from "three"
import type { DatosCuaternion } from "@/hooks/use-madgwick-fusion"

interface Props {
  cuaternionMano: DatosCuaternion | null
  cuaternionDedo: DatosCuaternion | null
  onResetear: () => void
}

// Componente para el dedo índice con movimiento independiente
function DedoIndiceMovil({
  cuaternionDedo,
  posicionBase,
}: {
  cuaternionDedo: DatosCuaternion | null
  posicionBase: [number, number, number]
}) {
  const grupoRef = useRef<THREE.Group>(null)

  useFrame(() => {
    if (grupoRef.current && cuaternionDedo) {
      // Aplicar rotación del dedo independiente
      grupoRef.current.quaternion.set(cuaternionDedo.q1, cuaternionDedo.q2, cuaternionDedo.q3, cuaternionDedo.q0)
    }
  })

  return (
    <group ref={grupoRef} position={posicionBase}>
      {/* Falange proximal */}
      <mesh position={[0, 0, 0.4]}>
        <boxGeometry args={[0.3, 0.3, 0.8]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
      {/* Falange media */}
      <mesh position={[0, 0, 1.0]}>
        <boxGeometry args={[0.25, 0.25, 0.6]} />
        <meshStandardMaterial color="#dc2626" />
      </mesh>
      {/* Falange distal */}
      <mesh position={[0, 0, 1.5]}>
        <boxGeometry args={[0.2, 0.2, 0.4]} />
        <meshStandardMaterial color="#b91c1c" />
      </mesh>
      {/* Indicador de sensor en el dedo */}
      <mesh position={[0, 0.2, 0.4]}>
        <sphereGeometry args={[0.1]} />
        <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.3} />
      </mesh>
    </group>
  )
}

// Componente para la mano completa con dedo índice móvil
function ModeloManoCompleta({
  cuaternionMano,
  cuaternionDedo,
}: {
  cuaternionMano: DatosCuaternion | null
  cuaternionDedo: DatosCuaternion | null
}) {
  const grupoManoRef = useRef<THREE.Group>(null)

  useFrame(() => {
    if (grupoManoRef.current && cuaternionMano) {
      // Aplicar rotación de la mano completa
      grupoManoRef.current.quaternion.set(cuaternionMano.q1, cuaternionMano.q2, cuaternionMano.q3, cuaternionMano.q0)
    }
  })

  return (
    <group ref={grupoManoRef} position={[0, 0, 0]}>
      {/* Palma de la mano */}
      <mesh>
        <boxGeometry args={[2, 0.4, 3]} />
        <meshStandardMaterial color="#fbbf24" />
      </mesh>

      {/* Dedo índice con sensor independiente */}
      <DedoIndiceMovil cuaternionDedo={cuaternionDedo} posicionBase={[0.6, 0.3, 1.2]} />

      {/* Dedo medio (fijo a la mano) */}
      <group position={[0.2, 0.3, 1.2]}>
        <mesh position={[0, 0, 0.4]}>
          <boxGeometry args={[0.3, 0.3, 0.8]} />
          <meshStandardMaterial color="#f59e0b" />
        </mesh>
        <mesh position={[0, 0, 1.0]}>
          <boxGeometry args={[0.25, 0.25, 0.6]} />
          <meshStandardMaterial color="#d97706" />
        </mesh>
        <mesh position={[0, 0, 1.5]}>
          <boxGeometry args={[0.2, 0.2, 0.4]} />
          <meshStandardMaterial color="#b45309" />
        </mesh>
      </group>

      {/* Dedo anular (fijo a la mano) */}
      <group position={[-0.2, 0.3, 1.2]}>
        <mesh position={[0, 0, 0.4]}>
          <boxGeometry args={[0.3, 0.3, 0.8]} />
          <meshStandardMaterial color="#f59e0b" />
        </mesh>
        <mesh position={[0, 0, 1.0]}>
          <boxGeometry args={[0.25, 0.25, 0.6]} />
          <meshStandardMaterial color="#d97706" />
        </mesh>
        <mesh position={[0, 0, 1.5]}>
          <boxGeometry args={[0.2, 0.2, 0.4]} />
          <meshStandardMaterial color="#b45309" />
        </mesh>
      </group>

      {/* Dedo meñique (fijo a la mano) */}
      <group position={[-0.6, 0.3, 1.2]}>
        <mesh position={[0, 0, 0.3]}>
          <boxGeometry args={[0.25, 0.25, 0.6]} />
          <meshStandardMaterial color="#f59e0b" />
        </mesh>
        <mesh position={[0, 0, 0.7]}>
          <boxGeometry args={[0.2, 0.2, 0.5]} />
          <meshStandardMaterial color="#d97706" />
        </mesh>
        <mesh position={[0, 0, 1.1]}>
          <boxGeometry args={[0.18, 0.18, 0.3]} />
          <meshStandardMaterial color="#b45309" />
        </mesh>
      </group>

      {/* Pulgar (fijo a la mano) */}
      <group position={[1.2, 0.2, -0.5]} rotation={[0, 0, Math.PI / 6]}>
        <mesh position={[0, 0, 0.3]}>
          <boxGeometry args={[0.35, 0.35, 0.6]} />
          <meshStandardMaterial color="#f59e0b" />
        </mesh>
        <mesh position={[0, 0, 0.7]}>
          <boxGeometry args={[0.3, 0.3, 0.4]} />
          <meshStandardMaterial color="#d97706" />
        </mesh>
      </group>

      {/* Indicador de sensor en el dorso de la mano */}
      <mesh position={[0, 0.3, 0]}>
        <sphereGeometry args={[0.15]} />
        <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.3} />
      </mesh>

      {/* Etiqueta */}
      <Text position={[0, -1.5, 0]} fontSize={0.4} color="#374151" anchorX="center" anchorY="middle">
        MANO CON SENSORES
      </Text>
    </group>
  )
}

// Componente de ejes de coordenadas corregidos
function EjesCoordenadas() {
  return (
    <group>
      {/* Eje X - Rojo (hacia adelante) */}
      <mesh position={[1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.02, 0.02, 2]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      <Text position={[2.2, 0, 0]} fontSize={0.2} color="#ef4444">
        +X (Adelante)
      </Text>

      {/* Eje Y - Verde (hacia arriba) */}
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 2]} />
        <meshBasicMaterial color="#10b981" />
      </mesh>
      <Text position={[0, 2.2, 0]} fontSize={0.2} color="#10b981">
        +Y (Arriba)
      </Text>

      {/* Eje Z - Azul (hacia la derecha) */}
      <mesh position={[0, 0, 1]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 2]} />
        <meshBasicMaterial color="#3b82f6" />
      </mesh>
      <Text position={[0, 0, 2.2]} fontSize={0.2} color="#3b82f6">
        +Z (Derecha)
      </Text>
    </group>
  )
}

export default function Visualizacion3DTiempoReal({ cuaternionMano, cuaternionDedo, onResetear }: Props) {
  return (
    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Visualización 3D - Mano Integrada</CardTitle>
          <div className="flex gap-2">
            <Badge variant={cuaternionMano ? "default" : "secondary"} className="text-xs">
              Mano {cuaternionMano ? "✓" : "✗"}
            </Badge>
            <Badge variant={cuaternionDedo ? "default" : "secondary"} className="text-xs">
              Dedo {cuaternionDedo ? "✓" : "✗"}
            </Badge>
            <Button variant="outline" size="sm" onClick={onResetear}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[500px] w-full rounded-lg overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
          <Canvas camera={{ position: [6, 4, 6], fov: 50 }} shadows>
            {/* Iluminación */}
            <ambientLight intensity={0.4} />
            <directionalLight
              position={[10, 10, 5]}
              intensity={1}
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
            />

            {/* Entorno */}
            <Environment preset="studio" />

            {/* Grilla de referencia */}
            <Grid
              position={[0, -2, 0]}
              args={[20, 20]}
              cellSize={1}
              cellThickness={0.5}
              cellColor="#94a3b8"
              sectionSize={5}
              sectionThickness={1}
              sectionColor="#64748b"
            />

            {/* Ejes de coordenadas */}
            <EjesCoordenadas />

            {/* Modelo 3D de la mano integrada */}
            <ModeloManoCompleta cuaternionMano={cuaternionMano} cuaternionDedo={cuaternionDedo} />

            {/* Controles de cámara */}
            <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} minDistance={3} maxDistance={15} />
          </Canvas>
        </div>

        {/* Información de cuaterniones */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-amber-50 p-3 rounded-lg">
            <div className="font-semibold text-amber-700 mb-1">Mano (Sensor Azul)</div>
            {cuaternionMano ? (
              <div className="text-amber-600 font-mono">
                q: [{cuaternionMano.q0.toFixed(3)}, {cuaternionMano.q1.toFixed(3)}, {cuaternionMano.q2.toFixed(3)},{" "}
                {cuaternionMano.q3.toFixed(3)}]
              </div>
            ) : (
              <div className="text-amber-500">Sin datos</div>
            )}
          </div>

          <div className="bg-red-50 p-3 rounded-lg">
            <div className="font-semibold text-red-700 mb-1">Dedo Índice (Sensor Verde)</div>
            {cuaternionDedo ? (
              <div className="text-red-600 font-mono">
                q: [{cuaternionDedo.q0.toFixed(3)}, {cuaternionDedo.q1.toFixed(3)}, {cuaternionDedo.q2.toFixed(3)},{" "}
                {cuaternionDedo.q3.toFixed(3)}]
              </div>
            ) : (
              <div className="text-red-500">Sin datos</div>
            )}
          </div>
        </div>

        {/* Información de ejes corregidos */}
        <div className="mt-4 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
          <p className="font-semibold text-blue-700 mb-2">Corrección de Ejes Aplicada:</p>
          <ul className="list-disc list-inside space-y-1 text-blue-600">
            <li>Sensor rotado 90° horario en el dispositivo</li>
            <li>-X del dispositivo → Adelante (era +Y del sensor)</li>
            <li>+Y del dispositivo → Arriba (era +Z del sensor)</li>
            <li>+Z del dispositivo → Derecha (era +X del sensor)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
