"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RotateCcw, Play, Pause } from "lucide-react"
import type { MotionDataPoint, CompensatedFingerData } from "@/hooks/use-motion-data"

interface Enhanced3DMotionDisplayProps {
  handData: MotionDataPoint | null
  fingerData: MotionDataPoint | null
  compensatedFingerData: CompensatedFingerData | null
  handHistory: MotionDataPoint[]
  fingerHistory: MotionDataPoint[]
  compensatedHistory: CompensatedFingerData[]
}

interface Vector3D {
  x: number
  y: number
  z: number
}

interface MotionPlane {
  position: Vector3D
  rotation: Vector3D
  scale: number
  color: string
  trails: Vector3D[]
}

export default function Enhanced3DMotionDisplay({
  handData,
  fingerData,
  compensatedFingerData,
  handHistory,
  fingerHistory,
  compensatedHistory,
}: Enhanced3DMotionDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const [isPlaying, setIsPlaying] = useState(true)
  const [viewMode, setViewMode] = useState<"combined" | "separated" | "compensated">("combined")
  const [showTrails, setShowTrails] = useState(true)
  const [rotationSpeed, setRotationSpeed] = useState(1)

  // 3D transformation matrices and camera
  const cameraRef = useRef({
    position: { x: 0, y: 0, z: 300 },
    rotation: { x: 0, y: 0, z: 0 },
    fov: 60,
  })

  const handPlaneRef = useRef<MotionPlane>({
    position: { x: -100, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: 1,
    color: "#3b82f6",
    trails: [],
  })

  const fingerPlaneRef = useRef<MotionPlane>({
    position: { x: 100, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: 1,
    color: "#10b981",
    trails: [],
  })

  const compensatedPlaneRef = useRef<MotionPlane>({
    position: { x: 0, y: 100, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: 1,
    color: "#f59e0b",
    trails: [],
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const updateCanvasSize = () => {
      const container = canvas.parentElement
      if (container) {
        const rect = container.getBoundingClientRect()
        canvas.width = rect.width - 32
        canvas.height = Math.max(400, rect.width * 0.6)
      }
    }

    updateCanvasSize()
    window.addEventListener("resize", updateCanvasSize)

    const animate = () => {
      if (!isPlaying) {
        animationRef.current = requestAnimationFrame(animate)
        return
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Update camera rotation for dynamic view
      cameraRef.current.rotation.y += 0.005 * rotationSpeed

      // Render 3D scene based on view mode
      render3DScene(ctx, canvas.width, canvas.height)

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", updateCanvasSize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying, viewMode, showTrails, rotationSpeed, handData, fingerData, compensatedFingerData])

  const render3DScene = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Set up 3D projection
    const centerX = width / 2
    const centerY = height / 2

    // Clear with gradient background
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height) / 2)
    gradient.addColorStop(0, "#f8fafc")
    gradient.addColorStop(0.7, "#e2e8f0")
    gradient.addColorStop(1, "#cbd5e1")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    // Update motion planes with current data
    updateMotionPlanes()

    // Render based on view mode
    switch (viewMode) {
      case "combined":
        renderCombinedView(ctx, centerX, centerY)
        break
      case "separated":
        renderSeparatedView(ctx, centerX, centerY)
        break
      case "compensated":
        renderCompensatedView(ctx, centerX, centerY)
        break
    }

    // Render UI overlays
    renderUIOverlays(ctx, width, height)
  }

  const updateMotionPlanes = () => {
    // Update hand plane
    if (handData) {
      const handPlane = handPlaneRef.current
      handPlane.rotation.x = (handData.gx * Math.PI) / 180 / 10
      handPlane.rotation.y = (handData.gy * Math.PI) / 180 / 10
      handPlane.rotation.z = (handData.gz * Math.PI) / 180 / 10

      // Add to trail
      if (showTrails) {
        handPlane.trails.push({
          x: handData.ax * 20,
          y: handData.ay * 20,
          z: handData.az * 20,
        })
        if (handPlane.trails.length > 50) {
          handPlane.trails.shift()
        }
      }
    }

    // Update finger plane (raw data)
    if (fingerData) {
      const fingerPlane = fingerPlaneRef.current
      fingerPlane.rotation.x = (fingerData.gx * Math.PI) / 180 / 10
      fingerPlane.rotation.y = (fingerData.gy * Math.PI) / 180 / 10
      fingerPlane.rotation.z = (fingerData.gz * Math.PI) / 180 / 10

      if (showTrails) {
        fingerPlane.trails.push({
          x: fingerData.ax * 20,
          y: fingerData.ay * 20,
          z: fingerData.az * 20,
        })
        if (fingerPlane.trails.length > 50) {
          fingerPlane.trails.shift()
        }
      }
    }

    // Update compensated finger plane
    if (compensatedFingerData) {
      const compensatedPlane = compensatedPlaneRef.current
      compensatedPlane.rotation.x = (compensatedFingerData.compensated_gx * Math.PI) / 180 / 10
      compensatedPlane.rotation.y = (compensatedFingerData.compensated_gy * Math.PI) / 180 / 10
      compensatedPlane.rotation.z = (compensatedFingerData.compensated_gz * Math.PI) / 180 / 10

      if (showTrails) {
        compensatedPlane.trails.push({
          x: compensatedFingerData.compensated_ax * 20,
          y: compensatedFingerData.compensated_ay * 20,
          z: compensatedFingerData.compensated_az * 20,
        })
        if (compensatedPlane.trails.length > 50) {
          compensatedPlane.trails.shift()
        }
      }
    }
  }

  const renderCombinedView = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number) => {
    // Render hand and finger planes side by side
    renderMotionPlane(ctx, handPlaneRef.current, centerX - 150, centerY, "HAND")
    renderMotionPlane(ctx, fingerPlaneRef.current, centerX + 150, centerY, "FINGER (Raw)")

    // Draw connection line showing relationship
    if (handData && fingerData) {
      ctx.strokeStyle = "#6b7280"
      ctx.setLineDash([5, 5])
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(centerX - 50, centerY)
      ctx.lineTo(centerX + 50, centerY)
      ctx.stroke()
      ctx.setLineDash([])
    }
  }

  const renderSeparatedView = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number) => {
    // Three planes: Hand, Raw Finger, Compensated Finger
    const spacing = 200
    renderMotionPlane(ctx, handPlaneRef.current, centerX - spacing, centerY, "HAND")
    renderMotionPlane(ctx, fingerPlaneRef.current, centerX, centerY, "FINGER (Raw)")
    renderMotionPlane(ctx, compensatedPlaneRef.current, centerX + spacing, centerY, "FINGER (Compensated)")
  }

  const renderCompensatedView = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number) => {
    // Focus on compensated finger movement
    renderMotionPlane(ctx, compensatedPlaneRef.current, centerX, centerY, "ISOLATED FINGER MOVEMENT", 1.5)

    // Show hand reference in corner
    renderMotionPlane(ctx, handPlaneRef.current, centerX - 200, centerY - 100, "Hand Reference", 0.5)
  }

  const renderMotionPlane = (
    ctx: CanvasRenderingContext2D,
    plane: MotionPlane,
    x: number,
    y: number,
    label: string,
    scaleMultiplier = 1,
  ) => {
    ctx.save()
    ctx.translate(x, y)

    const scale = plane.scale * scaleMultiplier * 60

    // Apply 3D rotation (simplified 2D projection)
    const rotX = plane.rotation.x
    const rotY = plane.rotation.y
    const rotZ = plane.rotation.z

    ctx.rotate(rotZ)

    // Draw plane base
    ctx.fillStyle = plane.color + "20"
    ctx.strokeStyle = plane.color
    ctx.lineWidth = 2

    // 3D-looking plane with perspective
    const planeWidth = scale * (1 + Math.sin(rotY) * 0.3)
    const planeHeight = scale * (1 + Math.cos(rotX) * 0.3)

    ctx.beginPath()
    ctx.ellipse(0, 0, planeWidth, planeHeight, 0, 0, 2 * Math.PI)
    ctx.fill()
    ctx.stroke()

    // Draw motion vectors
    if (plane.trails.length > 0) {
      const latest = plane.trails[plane.trails.length - 1]
      ctx.strokeStyle = plane.color
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(latest.x * scaleMultiplier, latest.y * scaleMultiplier)
      ctx.stroke()

      // Draw vector tip
      ctx.fillStyle = plane.color
      ctx.beginPath()
      ctx.arc(latest.x * scaleMultiplier, latest.y * scaleMultiplier, 4, 0, 2 * Math.PI)
      ctx.fill()
    }

    // Draw trails
    if (showTrails && plane.trails.length > 1) {
      ctx.strokeStyle = plane.color + "60"
      ctx.lineWidth = 1
      ctx.beginPath()
      plane.trails.forEach((point, index) => {
        const trailX = point.x * scaleMultiplier * 0.5
        const trailY = point.y * scaleMultiplier * 0.5
        if (index === 0) {
          ctx.moveTo(trailX, trailY)
        } else {
          ctx.lineTo(trailX, trailY)
        }
      })
      ctx.stroke()
    }

    // Draw coordinate axes
    drawCoordinateAxes(ctx, scale * 0.8)

    ctx.restore()

    // Draw label
    ctx.fillStyle = "#374151"
    ctx.font = "12px system-ui"
    ctx.textAlign = "center"
    ctx.fillText(label, x, y + scale + 20)
  }

  const drawCoordinateAxes = (ctx: CanvasRenderingContext2D, size: number) => {
    const axisLength = size * 0.6

    // X axis (red)
    ctx.strokeStyle = "#ef4444"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(axisLength, 0)
    ctx.stroke()

    // Y axis (green)
    ctx.strokeStyle = "#10b981"
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(0, -axisLength)
    ctx.stroke()

    // Z axis (blue) - represented as diagonal
    ctx.strokeStyle = "#3b82f6"
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(axisLength * 0.7, axisLength * 0.7)
    ctx.stroke()
  }

  const renderUIOverlays = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Data readouts
    ctx.fillStyle = "#374151"
    ctx.font = "11px monospace"
    ctx.textAlign = "left"

    let yPos = 20

    if (handData) {
      ctx.fillText(`Hand: A(${handData.ax.toFixed(2)}, ${handData.ay.toFixed(2)}, ${handData.az.toFixed(2)})`, 10, yPos)
      yPos += 15
      ctx.fillText(`      G(${handData.gx.toFixed(1)}, ${handData.gy.toFixed(1)}, ${handData.gz.toFixed(1)})`, 10, yPos)
      yPos += 20
    }

    if (compensatedFingerData) {
      ctx.fillText(
        `Finger: A(${compensatedFingerData.compensated_ax.toFixed(2)}, ${compensatedFingerData.compensated_ay.toFixed(2)}, ${compensatedFingerData.compensated_az.toFixed(2)})`,
        10,
        yPos,
      )
      yPos += 15
      ctx.fillText(
        `        G(${compensatedFingerData.compensated_gx.toFixed(1)}, ${compensatedFingerData.compensated_gy.toFixed(1)}, ${compensatedFingerData.compensated_gz.toFixed(1)})`,
        10,
        yPos,
      )
    }

    // View mode indicator
    ctx.textAlign = "right"
    ctx.fillText(`View: ${viewMode.toUpperCase()}`, width - 10, 20)
    ctx.fillText(`Trails: ${showTrails ? "ON" : "OFF"}`, width - 10, 35)
  }

  const resetView = () => {
    handPlaneRef.current.trails = []
    fingerPlaneRef.current.trails = []
    compensatedPlaneRef.current.trails = []
    cameraRef.current.rotation = { x: 0, y: 0, z: 0 }
  }

  return (
    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Enhanced 3D Motion Analysis</CardTitle>
          <div className="flex gap-2">
            <Badge variant={handData ? "default" : "secondary"} className="text-xs">
              Hand {handData ? "✓" : "✗"}
            </Badge>
            <Badge variant={compensatedFingerData ? "default" : "secondary"} className="text-xs">
              Finger {compensatedFingerData ? "✓" : "✗"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="flex items-center justify-between">
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)} className="flex-1">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="combined" className="text-xs">
                Combined
              </TabsTrigger>
              <TabsTrigger value="separated" className="text-xs">
                Separated
              </TabsTrigger>
              <TabsTrigger value="compensated" className="text-xs">
                Compensated
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-2 ml-4">
            <Button variant="outline" size="sm" onClick={() => setIsPlaying(!isPlaying)}>
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={resetView}>
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowTrails(!showTrails)}>
              Trails
            </Button>
          </div>
        </div>

        {/* 3D Canvas */}
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="w-full rounded-lg bg-gradient-to-br from-gray-50 to-gray-100"
            style={{ touchAction: "none" }}
          />
        </div>

        {/* Motion Analysis Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="font-semibold text-blue-700">Hand Motion</div>
            <div className="text-blue-600">
              {handData
                ? `Magnitude: ${Math.sqrt(handData.ax ** 2 + handData.ay ** 2 + handData.az ** 2).toFixed(2)}g`
                : "No data"}
            </div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="font-semibold text-green-700">Raw Finger</div>
            <div className="text-green-600">
              {fingerData
                ? `Magnitude: ${Math.sqrt(fingerData.ax ** 2 + fingerData.ay ** 2 + fingerData.az ** 2).toFixed(2)}g`
                : "No data"}
            </div>
          </div>
          <div className="bg-amber-50 p-3 rounded-lg">
            <div className="font-semibold text-amber-700">Compensated Finger</div>
            <div className="text-amber-600">
              {compensatedFingerData
                ? `Magnitude: ${Math.sqrt(compensatedFingerData.compensated_ax ** 2 + compensatedFingerData.compensated_ay ** 2 + compensatedFingerData.compensated_az ** 2).toFixed(2)}g`
                : "No data"}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
