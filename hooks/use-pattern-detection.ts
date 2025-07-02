"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import type { MotionDataPoint } from "./use-motion-data"
import type { CompensatedFingerData } from "./use-motion-data"

export interface PatronDetectado {
  id: string
  tipo: string
  confianza: number
  timestamp: number
  duracion: number
  descripcion: string
}

export function usePatternDetection(
  handData: MotionDataPoint[] = [],
  fingerData: MotionDataPoint[] = [],
  compensatedFingerData: CompensatedFingerData[] = [],
  autoAppend = false,
) {
  const [patterns, setPatterns] = useState<PatronDetectado[]>([])
  const [currentPattern, setCurrentPattern] = useState<PatronDetectado | null>(null)

  // Buffers para análisis de ventana deslizante
  const analysisWindowSize = 64
  const handBufferRef = useRef<MotionDataPoint[]>([])
  const compensatedFingerBufferRef = useRef<CompensatedFingerData[]>([])

  // Función para agregar datos de movimiento (compatibilidad)
  const addMotionData = useCallback(
    (data: MotionDataPoint | CompensatedFingerData, sensor: "mano" | "dedoCompensado") => {
      if (sensor === "mano") {
        handBufferRef.current = [...handBufferRef.current, data as MotionDataPoint].slice(-analysisWindowSize)
      } else {
        compensatedFingerBufferRef.current = [
          ...compensatedFingerBufferRef.current,
          data as CompensatedFingerData,
        ].slice(-analysisWindowSize)
      }
    },
    [],
  )

  // Detectar patrones basado en los datos actuales
  const detectarPatrones = useCallback(() => {
    if (handData.length < 10 || fingerData.length < 10) {
      return
    }

    const ultimosDatosHand = handData.slice(-10)
    const ultimosDatosFinger = fingerData.slice(-10)

    // Calcular magnitudes de aceleración
    const magnitudesHand = ultimosDatosHand.map((d) => Math.sqrt(d.ax * d.ax + d.ay * d.ay + d.az * d.az))
    const magnitudesFinger = ultimosDatosFinger.map((d) => Math.sqrt(d.ax * d.ax + d.ay * d.ay + d.az * d.az))

    const promedioHand = magnitudesHand.reduce((a, b) => a + b, 0) / magnitudesHand.length
    const promedioFinger = magnitudesFinger.reduce((a, b) => a + b, 0) / magnitudesFinger.length

    // Detectar movimiento significativo
    if (promedioHand > 2.0 || promedioFinger > 2.0) {
      const nuevoPatron: PatronDetectado = {
        id: `patron_${Date.now()}`,
        tipo: promedioHand > promedioFinger ? "Movimiento de Mano" : "Movimiento de Dedo",
        confianza: Math.min(Math.max(promedioHand, promedioFinger) / 5.0, 1.0),
        timestamp: Date.now(),
        duracion: 1000,
        descripcion: `Movimiento detectado con magnitud ${Math.max(promedioHand, promedioFinger).toFixed(2)}`,
      }

      setCurrentPattern(nuevoPatron)
      setPatterns((prev) => [...prev.slice(-19), nuevoPatron])
    }
  }, [handData, fingerData])

  useEffect(() => {
    if (!autoAppend) return
    // Actualizar buffers
    if (handData.length > 0) {
      handBufferRef.current = [...handBufferRef.current, ...handData.slice(-10)].slice(-analysisWindowSize)
    }
    if (compensatedFingerData.length > 0) {
      compensatedFingerBufferRef.current = [
        ...compensatedFingerBufferRef.current,
        ...compensatedFingerData.slice(-10),
      ].slice(-analysisWindowSize)
    }

    // Analizar patrones cuando tengamos suficientes datos
    if (handBufferRef.current.length >= 32 || compensatedFingerBufferRef.current.length >= 32) {
      const analysis = analyzeCompensatedMotionPatterns(handBufferRef.current, compensatedFingerBufferRef.current)

      if (analysis) {
        setCurrentPattern(analysis)

        // Si la confianza es alta, agregar a patrones detectados
        if (analysis.confidence > 0.75) {
          const pattern: PatronDetectado = {
            id: `patron_${Date.now()}`,
            tipo: analysis.gesture_type,
            confianza: analysis.confidence,
            timestamp: Date.now(),
            duracion: 1000,
            descripcion: `Patrón detectado con confianza ${analysis.confidence.toFixed(2)}`,
          }

          setPatterns((prev) => [...prev.slice(-30), pattern])
        }
      }
    }
  }, [handData, compensatedFingerData, autoAppend])

  useMemo(() => {
    detectarPatrones()
  }, [detectarPatrones])

  return {
    patterns,
    currentPattern,
    addMotionData,
    addPatternData: addMotionData, // Alias para compatibilidad
  }
}

function analyzeCompensatedMotionPatterns(
  handData: MotionDataPoint[],
  compensatedFingerData: CompensatedFingerData[],
): PatronDetectado | null {
  if (handData.length < 16 && compensatedFingerData.length < 16) return null

  try {
    // Análisis de la mano
    const handAnalysis = handData.length >= 16 ? analyzeMotionWindow(handData) : null

    // Análisis del dedo COMPENSADO (movimiento relativo)
    const fingerAnalysis =
      compensatedFingerData.length >= 16 ? analyzeCompensatedFingerWindow(compensatedFingerData) : null

    if (!handAnalysis && !fingerAnalysis) return null

    // Combinar análisis con compensación
    const combinedAnalysis = combineCompensatedAnalyses(handAnalysis, fingerAnalysis)

    return combinedAnalysis
  } catch (error) {
    console.error("Error en análisis de patrones compensados:", error)
    return null
  }
}

function analyzeMotionWindow(data: MotionDataPoint[]) {
  // Calcular magnitudes de aceleración y velocidad angular
  const accelMagnitudes = data.map((d) => Math.sqrt(d.ax * d.ax + d.ay * d.ay + d.az * d.az))
  const gyroMagnitudes = data.map((d) => Math.sqrt(d.gx * d.gx + d.gy * d.gy + d.gz * d.gz))

  // Análisis de frecuencias
  const accelFreqs = simpleFrequencyAnalysis(accelMagnitudes)
  const gyroFreqs = simpleFrequencyAnalysis(gyroMagnitudes)

  // Estadísticas básicas
  const accelStats = calculateStats(accelMagnitudes)
  const gyroStats = calculateStats(gyroMagnitudes)

  return {
    accel_frequencies: accelFreqs,
    gyro_frequencies: gyroFreqs,
    accel_stats: accelStats,
    gyro_stats: gyroStats,
    energy: accelStats.variance + gyroStats.variance,
  }
}

function analyzeCompensatedFingerWindow(data: CompensatedFingerData[]) {
  // Usar datos compensados para análisis
  const compensatedAccelMagnitudes = data.map((d) =>
    Math.sqrt(
      d.compensated_ax * d.compensated_ax + d.compensated_ay * d.compensated_ay + d.compensated_az * d.compensated_az,
    ),
  )
  const compensatedGyroMagnitudes = data.map((d) =>
    Math.sqrt(
      d.compensated_gx * d.compensated_gx + d.compensated_gy * d.compensated_gy + d.compensated_gz * d.compensated_gz,
    ),
  )

  // Análisis de frecuencias de movimiento compensado
  const accelFreqs = simpleFrequencyAnalysis(compensatedAccelMagnitudes)
  const gyroFreqs = simpleFrequencyAnalysis(compensatedGyroMagnitudes)

  // Estadísticas del movimiento relativo del dedo
  const accelStats = calculateStats(compensatedAccelMagnitudes)
  const gyroStats = calculateStats(compensatedGyroMagnitudes)

  // Detectar tipo específico de movimiento del dedo
  const fingerMovementType = classifyFingerMovement(data)

  return {
    accel_frequencies: accelFreqs,
    gyro_frequencies: gyroFreqs,
    accel_stats: accelStats,
    gyro_stats: gyroStats,
    energy: accelStats.variance + gyroStats.variance,
    finger_movement_type: fingerMovementType,
  }
}

function classifyFingerMovement(data: CompensatedFingerData[]): string {
  // Analizar el movimiento compensado del dedo
  const avgCompensatedAccel =
    data.reduce(
      (sum, d) =>
        sum +
        Math.sqrt(
          d.compensated_ax * d.compensated_ax +
            d.compensated_ay * d.compensated_ay +
            d.compensated_az * d.compensated_az,
        ),
      0,
    ) / data.length

  const avgCompensatedGyro =
    data.reduce(
      (sum, d) =>
        sum +
        Math.sqrt(
          d.compensated_gx * d.compensated_gx +
            d.compensated_gy * d.compensated_gy +
            d.compensated_gz * d.compensated_gz,
        ),
      0,
    ) / data.length

  // Clasificar basado en el movimiento relativo
  if (avgCompensatedAccel > 2.0) {
    return "Flexión/Extensión Activa"
  } else if (avgCompensatedGyro > 30) {
    return "Rotación del Dedo"
  } else if (avgCompensatedAccel > 0.5) {
    return "Movimiento Sutil del Dedo"
  } else {
    return "Dedo en Reposo Relativo"
  }
}

function simpleFrequencyAnalysis(signal: number[]): number[] {
  const frequencies: number[] = []
  const n = signal.length

  for (let period = 2; period <= Math.min(n / 2, 20); period++) {
    let correlation = 0
    let count = 0

    for (let i = 0; i < n - period; i++) {
      correlation += signal[i] * signal[i + period]
      count++
    }

    if (count > 0) {
      frequencies.push(correlation / count)
    }
  }

  return frequencies
}

function calculateStats(values: number[]) {
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length
  const max = Math.max(...values)
  const min = Math.min(...values)

  return { mean, variance, max, min, range: max - min }
}

function combineCompensatedAnalyses(handAnalysis: any, fingerAnalysis: any): PatronDetectado {
  const handWeight = handAnalysis ? 0.6 : 0
  const fingerWeight = fingerAnalysis ? 0.4 : 0

  let gestureType = "Reposo"
  let confidence = 0.5

  const handEnergy = handAnalysis?.energy || 0
  const fingerEnergy = fingerAnalysis?.energy || 0
  const totalEnergy = handEnergy + fingerEnergy

  // Clasificación mejorada con compensación
  if (fingerEnergy > 1.0 && handEnergy < fingerEnergy * 0.5) {
    // Movimiento principalmente del dedo (compensado)
    gestureType = `Dedo: ${fingerAnalysis.finger_movement_type}`
    confidence = Math.min(0.95, 0.7 + fingerEnergy / 50)
  } else if (handEnergy > 20) {
    if (fingerEnergy > 5) {
      gestureType = "Mano + Dedo Coordinado"
      confidence = Math.min(0.95, 0.8 + totalEnergy / 100)
    } else {
      gestureType = "Movimiento de Mano"
      confidence = Math.min(0.95, 0.7 + handEnergy / 100)
    }
  } else if (totalEnergy > 5) {
    gestureType = "Movimiento Suave"
    confidence = 0.6 + totalEnergy / 50
  } else {
    gestureType = "Reposo"
    confidence = 0.9
  }

  return {
    id: `patron_${Date.now()}`,
    tipo: gestureType,
    confianza: Math.max(0.1, Math.min(0.99, confidence)),
    timestamp: Date.now(),
    duracion: 1000,
    descripcion: `Patrón detectado con confianza ${confidence.toFixed(2)}`,
  }
}
