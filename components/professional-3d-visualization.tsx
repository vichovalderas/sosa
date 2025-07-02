"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RotateCcw, Play, Pause } from "lucide-react"
import type { MotionDataPoint, CompensatedFingerData } from "@/hooks/use-motion-data"

interface Professional3DVisualizationProps {
  handData: MotionDataPoint | null
  fingerData: MotionDataPoint | null
  compensatedFingerData: CompensatedFingerData | null
  handHistory: MotionDataPoint[]
  fingerHistory: MotionDataPoint[]
  compensatedHistory: CompensatedFingerData[]
  isRecording?: boolean
}

interface Vector3D {
  x: number
  y: number
  z: number
}

interface MotionSphere {
  position: Vector3D
  velocity: Vector3D
  rotation: Vector3D
  scale: number
  color: string
  trails: Vector3D[]
  energy: number
}

export default function Professional3DVisualization({
  handData,
  fingerData,
  compensatedFingerData,
  handHistory,
  fingerHistory,
  compensatedHistory,
  isRecording = false,
}: Professional3DVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const [isPlaying, setIsPlaying] = useState(true)
  const [viewMode, setViewMode] = useState<"3d" | "split" | "focus">("3d")
  const [showTrails, setShowTrails] = useState(true)
  const [cameraAngle, setCameraAngle] = useState(0)

  // 3D objects
  const handSphereRef = useRef<MotionSphere>({
    position: { x: -80, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: 1,
    color: "#3b82f6",
    trails: [],
    energy: 0,
  })

  const fingerSphereRef = useRef<MotionSphere>({
    position: { x: 80, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: 1,
    color: "#10b981",
    trails: [],
    energy: 0,
  })

  const compensatedSphereRef = useRef<MotionSphere>({
    position: { x: 0, y: -60, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: 1,
    color: "#f59e0b",
    trails: [],
    energy: 0,
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
        canvas.height = Math.max(500, rect.width * 0.6)
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

      // Update camera
      setCameraAngle((prev) => prev + 0.01)

      // Render 3D scene
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
  }, [isPlaying, viewMode, showTrails, handData, fingerData, compensatedFingerData])

  const render3DScene = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const centerX = width / 2
    const centerY = height / 2

    // Professional gradient background
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height) / 2)
    gradient.addColorStop(0, "#1e293b")
    gradient.addColorStop(0.5, "#334155")
    gradient.addColorStop(1, "#0f172a")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    // Update motion spheres
    updateMotionSpheres()

    // Render based on view mode
    switch (viewMode) {
      case "3d":
        render3DView(ctx, centerX, centerY, width, height)
        break
      case "split":
        renderSplitView(ctx, centerX, centerY, width, height)
        break
      case "focus":
        renderFocusView(ctx, centerX, centerY, width, height)
        break
    }

    // Render UI overlays
    renderProfessionalOverlays(ctx, width, height)
  }

  const updateMotionSpheres = () => {
    // Update hand sphere
    if (handData) {
      const handSphere = handSphereRef.current
      handSphere.velocity = {
        x: handData.ax * 10,
        y: handData.ay * 10,
        z: handData.az * 10,
      }
      handSphere.rotation = {
        x: (handData.gx * Math.PI) / 180 / 20,
        y: (handData.gy * Math.PI) / 180 / 20,
        z: (handData.gz * Math.PI) / 180 / 20,
      }
      handSphere.energy = Math.sqrt(handData.ax ** 2 + handData.ay ** 2 + handData.az ** 2)

      if (showTrails) {
        handSphere.trails.push({
          x: handData.ax * 15,
          y: handData.ay * 15,
          z: handData.az * 15,
        })
        if (handSphere.trails.length > 30) {
          handSphere.trails.shift()
        }
      }
    }

    // Update compensated finger sphere
    if (compensatedFingerData) {
      const compensatedSphere = compensatedSphereRef.current
      compensatedSphere.velocity = {
        x: compensatedFingerData.compensated_ax * 15,
        y: compensatedFingerData.compensated_ay * 15,
        z: compensatedFingerData.compensated_az * 15,
      }
      compensatedSphere.rotation = {
        x: (compensatedFingerData.compensated_gx * Math.PI) / 180 / 15,
        y: (compensatedFingerData.compensated_gy * Math.PI) / 180 / 15,
        z: (compensatedFingerData.compensated_gz * Math.PI) / 180 / 15,
      }
      compensatedSphere.energy = Math.sqrt(
        compensatedFingerData.compensated_ax ** 2 +
          compensatedFingerData.compensated_ay ** 2 +
          compensatedFingerData.compensated_az ** 2,
      )

      if (showTrails) {
        compensatedSphere.trails.push({
          x: compensatedFingerData.compensated_ax * 20,
          y: compensatedFingerData.compensated_ay * 20,
          z: compensatedFingerData.compensated_az * 20,
        })
        if (compensatedSphere.trails.length > 30) {
          compensatedSphere.trails.shift()
        }
      }
    }
  }

  const render3DView = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    width: number,
    height: number,
  ) => {
    // Render 3D coordinate system
    renderCoordinateSystem(ctx, centerX, centerY)

    // Render motion spheres with 3D effect
    renderMotionSphere(ctx, handSphereRef.current, centerX - 100, centerY, "HAND", 1.2)
    renderMotionSphere(ctx, compensatedSphereRef.current, centerX + 100, centerY, "FINGER", 1.0)

    // Connection lines
    if (handData && compensatedFingerData) {
      ctx.strokeStyle = "#64748b"
      ctx.setLineDash([5, 5])
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(centerX - 50, centerY)
      ctx.lineTo(centerX + 50, centerY)
      ctx.stroke()
      ctx.setLineDash([])
    }
  }

  const renderSplitView = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    width: number,
    height: number,
  ) => {
    const leftCenter = width * 0.25
    const rightCenter = width * 0.75

    renderMotionSphere(ctx, handSphereRef.current, leftCenter, centerY, "HAND MOTION", 1.5)
    renderMotionSphere(ctx, compensatedSphereRef.current, rightCenter, centerY, "FINGER MOTION", 1.5)
  }

  const renderFocusView = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    width: number,
    height: number,
  ) => {
    // Focus on compensated finger movement
    renderMotionSphere(ctx, compensatedSphereRef.current, centerX, centerY, "ISOLATED FINGER MOVEMENT", 2.0)

    // Small reference hand in corner
    renderMotionSphere(ctx, handSphereRef.current, width - 100, 80, "Hand Ref", 0.6)
  }

  const renderMotionSphere = (
    ctx: CanvasRenderingContext2D,
    sphere: MotionSphere,
    x: number,
    y: number,
    label: string,
    scaleMultiplier = 1,
  ) => {
    ctx.save()
    ctx.translate(x, y)

    const baseRadius = 40 * scaleMultiplier
    const energyRadius = baseRadius + sphere.energy * 10

    // 3D sphere with lighting effect
    const gradient = ctx.createRadialGradient(-10, -10, 0, 0, 0, energyRadius)
    gradient.addColorStop(0, sphere.color + "ff")
    gradient.addColorStop(0.7, sphere.color + "aa")
    gradient.addColorStop(1, sphere.color + "33")

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(0, 0, energyRadius, 0, 2 * Math.PI)
    ctx.fill()

    // Energy ring
    if (sphere.energy > 0.5) {
      ctx.strokeStyle = sphere.color + "66"
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(0, 0, energyRadius + 10, 0, 2 * Math.PI)
      ctx.stroke()
    }

    // Motion vector
    if (sphere.velocity.x !== 0 || sphere.velocity.y !== 0) {
      ctx.strokeStyle = "#ffffff"
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(sphere.velocity.x * scaleMultiplier, sphere.velocity.y * scaleMultiplier)
      ctx.stroke()

      // Arrow head
      const angle = Math.atan2(sphere.velocity.y, sphere.velocity.x)
      const arrowLength = 10
      ctx.beginPath()
      ctx.moveTo(sphere.velocity.x * scaleMultiplier, sphere.velocity.y * scaleMultiplier)
      ctx.lineTo(
        sphere.velocity.x * scaleMultiplier - arrowLength * Math.cos(angle - Math.PI / 6),
        sphere.velocity.y * scaleMultiplier - arrowLength * Math.sin(angle - Math.PI / 6),
      )
      ctx.moveTo(sphere.velocity.x * scaleMultiplier, sphere.velocity.y * scaleMultiplier)
      ctx.lineTo(
        sphere.velocity.x * scaleMultiplier - arrowLength * Math.cos(angle + Math.PI / 6),
        sphere.velocity.y * scaleMultiplier - arrowLength * Math.sin(angle + Math.PI / 6),
      )
      ctx.stroke()
    }

    // Trails
    if (showTrails && sphere.trails.length > 1) {
      ctx.strokeStyle = sphere.color + "40"
      ctx.lineWidth = 2
      ctx.beginPath()
      sphere.trails.forEach((point, index) => {
        const trailX = point.x * scaleMultiplier * 0.3
        const trailY = point.y * scaleMultiplier * 0.3
        if (index === 0) {
          ctx.moveTo(trailX, trailY)
        } else {
          ctx.lineTo(trailX, trailY)
        }
      })
      ctx.stroke()
    }

    ctx.restore()

    // Label
    ctx.fillStyle = "#e2e8f0"
    ctx.font = `${12 * scaleMultiplier}px system-ui`
    ctx.textAlign = "center"
    ctx.fillText(label, x, y + energyRadius + 25)
  }

  const renderCoordinateSystem = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number) => {
    const axisLength = 60

    ctx.save()
    ctx.translate(centerX, centerY)

    // X axis (red)
    ctx.strokeStyle = "#ef4444"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(axisLength, 0)
    ctx.stroke()
    ctx.fillStyle = "#ef4444"
    ctx.font = "12px system-ui"
    ctx.fillText("X", axisLength + 10, 5)

    // Y axis (green)
    ctx.strokeStyle = "#10b981"
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(0, -axisLength)
    ctx.stroke()
    ctx.fillStyle = "#10b981"
    ctx.fillText("Y", 5, -axisLength - 10)

    // Z axis (blue)
    ctx.strokeStyle = "#3b82f6"
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(axisLength * 0.7, axisLength * 0.7)
    ctx.stroke()
    ctx.fillStyle = "#3b82f6"
    ctx.fillText("Z", axisLength * 0.7 + 5, axisLength * 0.7 + 5)

    ctx.restore()
  }

  const renderProfessionalOverlays = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Recording indicator
    if (isRecording) {
      ctx.fillStyle = "#ef4444"
      ctx.beginPath()
      ctx.arc(20, 20, 8, 0, 2 * Math.PI)
      ctx.fill()
      ctx.fillStyle = "#ffffff"
      ctx.font = "12px system-ui"
      ctx.fillText("REC", 35, 25)
    }

    // Data readouts
    ctx.fillStyle = "#e2e8f0"
    ctx.font = "11px monospace"
    ctx.textAlign = "left"

    let yPos = height - 60

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
    ctx.fillText(`View: ${viewMode.toUpperCase()}`, width - 10, height - 40)
    ctx.fillText(`Trails: ${showTrails ? "ON" : "OFF"}`, width - 10, height - 25)
  }

  const resetView = () => {
    handSphereRef.current.trails = []
    compensatedSphereRef.current.trails = []
    setCameraAngle(0)
  }

  return (
    <Card className="shadow-xl border-0 bg-slate-900/90 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-white">Professional 3D Motion Analysis</CardTitle>
          <div className="flex gap-2">
            <Badge variant={handData ? "default" : "secondary"} className="text-xs">
              Hand {handData ? "✓" : "✗"}
            </Badge>
            <Badge variant={compensatedFingerData ? "default" : "secondary"} className="text-xs">
              Finger {compensatedFingerData ? "✓" : "✗"}
            </Badge>
            {isRecording && (
              <Badge variant="destructive" className="text-xs animate-pulse">
                Recording
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="flex items-center justify-between">
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)} className="flex-1">
            <TabsList className="grid w-full grid-cols-3 bg-slate-800">
              <TabsTrigger value="3d" className="text-xs text-white data-[state=active]:bg-blue-600">
                3D View
              </TabsTrigger>
              <TabsTrigger value="split" className="text-xs text-white data-[state=active]:bg-blue-600">
                Split View
              </TabsTrigger>
              <TabsTrigger value="focus" className="text-xs text-white data-[state=active]:bg-blue-600">
                Focus View
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
          <canvas ref={canvasRef} className="w-full rounded-lg bg-slate-900" style={{ touchAction: "none" }} />
        </div>
      </CardContent>
    </Card>
  )
}
