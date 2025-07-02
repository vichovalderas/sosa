"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { MotionDataPoint } from "@/hooks/use-motion-data"

interface HandModel3DProps {
  motionData: MotionDataPoint | null
}

export default function HandModel3D({ motionData }: HandModel3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Configurar canvas responsivo
    const updateCanvasSize = () => {
      const container = canvas.parentElement
      if (container) {
        const containerWidth = container.clientWidth
        canvas.width = containerWidth - 32 // Padding
        canvas.height = Math.min(300, containerWidth * 0.6)
      }
    }

    updateCanvasSize()
    window.addEventListener("resize", updateCanvasSize)

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Fondo con gradiente
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      gradient.addColorStop(0, "#f8fafc")
      gradient.addColorStop(1, "#e2e8f0")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const centerX = canvas.width / 2
      const centerY = canvas.height / 2

      if (motionData) {
        try {
          const safeData = {
            ax: isNaN(motionData.ax) ? 0 : motionData.ax,
            ay: isNaN(motionData.ay) ? 0 : motionData.ay,
            az: isNaN(motionData.az) ? 0 : motionData.az,
            gx: isNaN(motionData.gx) ? 0 : motionData.gx,
            gy: isNaN(motionData.gy) ? 0 : motionData.gy,
            gz: isNaN(motionData.gz) ? 0 : motionData.gz,
          }

          const rotX = Math.max(-Math.PI / 6, Math.min(Math.PI / 6, (safeData.gx * Math.PI) / 180 / 15))
          const rotY = Math.max(-Math.PI / 6, Math.min(Math.PI / 6, (safeData.gy * Math.PI) / 180 / 15))
          const rotZ = Math.max(-Math.PI / 6, Math.min(Math.PI / 6, (safeData.gz * Math.PI) / 180 / 15))

          ctx.save()
          ctx.translate(centerX, centerY)
          ctx.rotate(rotZ)

          const scale = Math.min(canvas.width, canvas.height) / 400
          ctx.scale(scale, scale)

          // Sombra
          ctx.save()
          ctx.translate(5, 5)
          ctx.fillStyle = "rgba(0,0,0,0.1)"
          drawHand(ctx, rotX, rotY, safeData)
          ctx.restore()

          // Mano principal
          ctx.fillStyle = "#fbbf24"
          ctx.strokeStyle = "#f59e0b"
          ctx.lineWidth = 2
          drawHand(ctx, rotX, rotY, safeData)

          ctx.restore()

          // Información compacta
          ctx.fillStyle = "#374151"
          ctx.font = "12px system-ui"
          ctx.fillText(`A: ${safeData.ax.toFixed(1)}, ${safeData.ay.toFixed(1)}, ${safeData.az.toFixed(1)}`, 10, 20)
          ctx.fillText(`G: ${safeData.gx.toFixed(0)}, ${safeData.gy.toFixed(0)}, ${safeData.gz.toFixed(0)}`, 10, 35)

          // Indicador de calidad
          if (motionData.quality) {
            const qualityColor = motionData.quality > 0.7 ? "#10b981" : motionData.quality > 0.4 ? "#f59e0b" : "#ef4444"
            ctx.fillStyle = qualityColor
            ctx.beginPath()
            ctx.arc(canvas.width - 15, 15, 6, 0, 2 * Math.PI)
            ctx.fill()
          }
        } catch (error) {
          console.error("Error al renderizar:", error)
          drawErrorState(ctx, canvas.width, canvas.height)
        }
      } else {
        drawWaitingState(ctx, canvas.width, canvas.height)
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", updateCanvasSize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [motionData])

  return (
    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Modelo 3D de la Mano</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            className="rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 max-w-full"
            style={{ touchAction: "none" }}
          />
        </div>
      </CardContent>
    </Card>
  )
}

function drawHand(ctx: CanvasRenderingContext2D, rotX: number, rotY: number, data: any) {
  // Palma
  const palmWidth = 60 + Math.sin(rotX) * 15
  const palmHeight = 80 + Math.cos(rotY) * 15

  ctx.beginPath()
  ctx.ellipse(0, 0, palmWidth, palmHeight, 0, 0, 2 * Math.PI)
  ctx.fill()
  ctx.stroke()

  // Dedos
  const fingers = [
    { x: -30, y: -50, length: 35 },
    { x: -15, y: -55, length: 40 },
    { x: 0, y: -60, length: 45 },
    { x: 15, y: -55, length: 40 },
    { x: 30, y: -50, length: 35 },
  ]

  fingers.forEach((finger, index) => {
    ctx.save()
    ctx.translate(finger.x, finger.y)
    const fingerRotation = Math.max(-0.3, Math.min(0.3, (data.ax + data.ay) / 30 + index * 0.05))
    ctx.rotate(fingerRotation)
    ctx.beginPath()
    ctx.roundRect(-6, 0, 12, finger.length, 6)
    ctx.fill()
    ctx.stroke()
    ctx.restore()
  })

  // Pulgar
  ctx.save()
  ctx.translate(-45, 15)
  ctx.rotate(-Math.PI / 4 + rotX / 3)
  ctx.beginPath()
  ctx.roundRect(-5, 0, 10, 30, 5)
  ctx.fill()
  ctx.stroke()
  ctx.restore()
}

function drawWaitingState(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.fillStyle = "#9ca3af"
  ctx.font = "16px system-ui"
  ctx.textAlign = "center"
  ctx.fillText("Esperando datos...", width / 2, height / 2)
  ctx.textAlign = "left"
}

function drawErrorState(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.fillStyle = "#ef4444"
  ctx.font = "14px system-ui"
  ctx.textAlign = "center"
  ctx.fillText("Error al procesar datos", width / 2, height / 2)
  ctx.textAlign = "left"
}
