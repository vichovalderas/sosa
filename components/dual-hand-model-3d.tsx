"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { MotionDataPoint } from "@/hooks/use-motion-data"

interface DualHandModel3DProps {
  handData: MotionDataPoint | null
  fingerData: MotionDataPoint | null
}

export default function DualHandModel3D({ handData, fingerData }: DualHandModel3DProps) {
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
        canvas.width = containerWidth - 32
        canvas.height = Math.min(400, containerWidth * 0.8)
      }
    }

    updateCanvasSize()
    window.addEventListener("resize", updateCanvasSize)

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Fondo con gradiente que respeta el modo oscuro
      const isDark = document.documentElement.classList.contains("dark")
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)

      if (isDark) {
        gradient.addColorStop(0, "#1f2937")
        gradient.addColorStop(0.5, "#374151")
        gradient.addColorStop(1, "#4b5563")
      } else {
        gradient.addColorStop(0, "#f8fafc")
        gradient.addColorStop(0.5, "#e2e8f0")
        gradient.addColorStop(1, "#cbd5e1")
      }

      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Dividir canvas en dos secciones
      const handSection = { x: 0, y: 0, width: canvas.width / 2, height: canvas.height }
      const fingerSection = { x: canvas.width / 2, y: 0, width: canvas.width / 2, height: canvas.height }

      // Línea divisoria
      ctx.strokeStyle = isDark ? "#6b7280" : "#94a3b8"
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(canvas.width / 2, 0)
      ctx.lineTo(canvas.width / 2, canvas.height)
      ctx.stroke()
      ctx.setLineDash([])

      // Etiquetas
      ctx.fillStyle = isDark ? "#e5e7eb" : "#475569"
      ctx.font = "14px system-ui"
      ctx.textAlign = "center"
      ctx.fillText("MANO (Dorso)", handSection.width / 2, 25)
      ctx.fillText("DEDOS (Índice)", canvas.width / 2 + fingerSection.width / 2, 25)

      // Renderizar mano
      if (handData) {
        renderHandPlane(ctx, handSection, handData, "#3b82f6") // Azul
      } else {
        renderWaitingState(ctx, handSection, "Esperando sensor de mano...")
      }

      // Renderizar dedos
      if (fingerData) {
        renderFingerPlane(ctx, fingerSection, fingerData, "#10b981") // Verde
      } else {
        renderWaitingState(ctx, fingerSection, "Esperando sensor de dedo...")
      }

      // Información de datos
      renderDataInfo(ctx, canvas.width, canvas.height, handData, fingerData)

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", updateCanvasSize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [handData, fingerData])

  return (
    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm dark:bg-gray-900/90">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Modelo Dual - Mano y Dedos</CardTitle>
          <div className="flex gap-2">
            <Badge variant={handData ? "default" : "secondary"} className="text-xs">
              Mano {handData ? "✓" : "✗"}
            </Badge>
            <Badge variant={fingerData ? "default" : "secondary"} className="text-xs">
              Dedo {fingerData ? "✓" : "✗"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            className="rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 max-w-full"
            style={{ touchAction: "none" }}
          />
        </div>
      </CardContent>
    </Card>
  )
}

function renderHandPlane(
  ctx: CanvasRenderingContext2D,
  section: { x: number; y: number; width: number; height: number },
  data: MotionDataPoint,
  color: string,
) {
  const centerX = section.x + section.width / 2
  const centerY = section.y + section.height / 2 + 20

  ctx.save()
  ctx.translate(centerX, centerY)

  // Calcular rotaciones basadas en giroscopio (limitadas)
  const rotX = Math.max(-Math.PI / 6, Math.min(Math.PI / 6, (data.gx * Math.PI) / 180 / 20))
  const rotY = Math.max(-Math.PI / 6, Math.min(Math.PI / 6, (data.gy * Math.PI) / 180 / 20))
  const rotZ = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, (data.gz * Math.PI) / 180 / 30))

  ctx.rotate(rotZ)

  const scale = Math.min(section.width, section.height) / 300

  // Sombra
  ctx.save()
  ctx.translate(3, 3)
  ctx.fillStyle = "rgba(0,0,0,0.2)"
  drawHandPalm(ctx, scale, rotX, rotY, data)
  ctx.restore()

  // Palma principal
  ctx.fillStyle = color
  ctx.strokeStyle = darkenColor(color, 0.2)
  ctx.lineWidth = 2
  drawHandPalm(ctx, scale, rotX, rotY, data)

  ctx.restore()
}

function renderFingerPlane(
  ctx: CanvasRenderingContext2D,
  section: { x: number; y: number; width: number; height: number },
  data: MotionDataPoint,
  color: string,
) {
  const centerX = section.x + section.width / 2
  const centerY = section.y + section.height / 2 + 20

  ctx.save()
  ctx.translate(centerX, centerY)

  // Rotaciones para los dedos
  const rotX = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, (data.gx * Math.PI) / 180 / 15))
  const rotY = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, (data.gy * Math.PI) / 180 / 15))
  const rotZ = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, (data.gz * Math.PI) / 180 / 20))

  ctx.rotate(rotZ)

  const scale = Math.min(section.width, section.height) / 250

  // Sombra
  ctx.save()
  ctx.translate(3, 3)
  ctx.fillStyle = "rgba(0,0,0,0.2)"
  drawFingers(ctx, scale, rotX, rotY, data)
  ctx.restore()

  // Dedos principales
  ctx.fillStyle = color
  ctx.strokeStyle = darkenColor(color, 0.2)
  ctx.lineWidth = 2
  drawFingers(ctx, scale, rotX, rotY, data)

  ctx.restore()
}

function drawHandPalm(ctx: CanvasRenderingContext2D, scale: number, rotX: number, rotY: number, data: MotionDataPoint) {
  // Palma como elipse que reacciona al movimiento
  const palmWidth = (60 + Math.sin(rotX) * 10) * scale
  const palmHeight = (80 + Math.cos(rotY) * 10) * scale

  ctx.beginPath()
  ctx.ellipse(0, 0, palmWidth, palmHeight, 0, 0, 2 * Math.PI)
  ctx.fill()
  ctx.stroke()

  // Indicadores de aceleración como líneas
  const accelScale = 20 * scale
  ctx.strokeStyle = "#ef4444"
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(data.ax * accelScale, data.ay * accelScale)
  ctx.stroke()

  // Punto central
  ctx.fillStyle = "#1f2937"
  ctx.beginPath()
  ctx.arc(0, 0, 4 * scale, 0, 2 * Math.PI)
  ctx.fill()
}

function drawFingers(ctx: CanvasRenderingContext2D, scale: number, rotX: number, rotY: number, data: MotionDataPoint) {
  // Dibujar 4 dedos (sin pulgar) que se mueven como uno
  const fingerPositions = [
    { x: -30 * scale, y: -20 * scale },
    { x: -10 * scale, y: -25 * scale },
    { x: 10 * scale, y: -25 * scale },
    { x: 30 * scale, y: -20 * scale },
  ]

  fingerPositions.forEach((pos, index) => {
    ctx.save()
    ctx.translate(pos.x, pos.y)

    // Rotación basada en el sensor del dedo
    const fingerRotation = rotX + (data.ax + data.ay) / 20 + index * 0.1
    ctx.rotate(fingerRotation)

    // Dedo como rectángulo redondeado
    const fingerWidth = 8 * scale
    const fingerLength = (35 + Math.abs(data.gz) * 2) * scale

    ctx.beginPath()
    ctx.roundRect(-fingerWidth / 2, 0, fingerWidth, fingerLength, 4 * scale)
    ctx.fill()
    ctx.stroke()

    // Articulaciones
    ctx.fillStyle = "#374151"
    for (let joint = 1; joint <= 2; joint++) {
      ctx.beginPath()
      ctx.arc(0, (fingerLength / 3) * joint, 2 * scale, 0, 2 * Math.PI)
      ctx.fill()
    }

    ctx.restore()
  })

  // Vector de aceleración del dedo
  ctx.strokeStyle = "#10b981"
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(data.ax * 15 * scale, data.ay * 15 * scale)
  ctx.stroke()
}

function renderWaitingState(
  ctx: CanvasRenderingContext2D,
  section: { x: number; y: number; width: number; height: number },
  message: string,
) {
  ctx.fillStyle = "#9ca3af"
  ctx.font = "12px system-ui"
  ctx.textAlign = "center"
  ctx.fillText(message, section.x + section.width / 2, section.y + section.height / 2)
}

function renderDataInfo(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  handData: MotionDataPoint | null,
  fingerData: MotionDataPoint | null,
) {
  ctx.fillStyle = "#374151"
  ctx.font = "10px system-ui"
  ctx.textAlign = "left"

  let yPos = height - 40

  if (handData) {
    ctx.fillText(`Mano - A: ${handData.ax.toFixed(1)}, ${handData.ay.toFixed(1)}, ${handData.az.toFixed(1)}`, 10, yPos)
    yPos += 12
    ctx.fillText(`Mano - G: ${handData.gx.toFixed(0)}, ${handData.gy.toFixed(0)}, ${handData.gz.toFixed(0)}`, 10, yPos)
  }

  yPos = height - 40
  ctx.textAlign = "right"

  if (fingerData) {
    ctx.fillText(
      `Dedo - A: ${fingerData.ax.toFixed(1)}, ${fingerData.ay.toFixed(1)}, ${fingerData.az.toFixed(1)}`,
      width - 10,
      yPos,
    )
    yPos += 12
    ctx.fillText(
      `Dedo - G: ${fingerData.gx.toFixed(0)}, ${fingerData.gy.toFixed(0)}, ${fingerData.gz.toFixed(0)}`,
      width - 10,
      yPos,
    )
  }
}

function darkenColor(color: string, amount: number): string {
  // Función simple para oscurecer un color hex
  const hex = color.replace("#", "")
  const num = Number.parseInt(hex, 16)
  const r = Math.max(0, (num >> 16) - Math.round(255 * amount))
  const g = Math.max(0, ((num >> 8) & 0x00ff) - Math.round(255 * amount))
  const b = Math.max(0, (num & 0x0000ff) - Math.round(255 * amount))
  return `rgb(${r}, ${g}, ${b})`
}
