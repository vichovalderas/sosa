"use client"

import { useState, useCallback, useRef } from "react"

export interface MotionDataPoint {
  ax: number
  ay: number
  az: number
  gx: number
  gy: number
  gz: number
  timestamp: number
  sensorId: string
  quality: number
}

export interface CompensatedFingerData {
  compensated_ax: number
  compensated_ay: number
  compensated_az: number
  compensated_gx: number
  compensated_gy: number
  compensated_gz: number
  timestamp: number
}

export interface DualSensorData {
  hand?: MotionDataPoint
  finger?: MotionDataPoint
  systemTimestamp: number
}

export interface MotionStats {
  frequency: number
  totalSamples: number
  lastUpdate: number
  isActive: boolean
}

export function useMotionData() {
  const [handData, setHandData] = useState<MotionDataPoint[]>([])
  const [fingerData, setFingerData] = useState<MotionDataPoint[]>([])
  const [compensatedFingerData, setCompensatedFingerData] = useState<CompensatedFingerData[]>([])
  const [stats, setStats] = useState<MotionStats>({
    frequency: 0,
    totalSamples: 0,
    lastUpdate: 0,
    isActive: false,
  })

  const lastUpdateRef = useRef<number>(0)
  const sampleCountRef = useRef<number>(0)
  const frequencyWindowRef = useRef<number[]>([])

  const calculateCompensatedData = useCallback(
    (handPoint: MotionDataPoint, fingerPoint: MotionDataPoint): CompensatedFingerData => {
      return {
        compensated_ax: fingerPoint.ax - handPoint.ax,
        compensated_ay: fingerPoint.ay - handPoint.ay,
        compensated_az: fingerPoint.az - handPoint.az,
        compensated_gx: fingerPoint.gx - handPoint.gx,
        compensated_gy: fingerPoint.gy - handPoint.gy,
        compensated_gz: fingerPoint.gz - handPoint.gz,
        timestamp: fingerPoint.timestamp,
      }
    },
    [],
  )

  const updateFrequency = useCallback(() => {
    const now = Date.now()
    frequencyWindowRef.current.push(now)

    // Mantener solo los últimos 2 segundos de muestras
    frequencyWindowRef.current = frequencyWindowRef.current.filter((time) => now - time < 2000)

    const frequency = frequencyWindowRef.current.length / 2 // Hz

    setStats((prev) => ({
      ...prev,
      frequency,
      totalSamples: sampleCountRef.current,
      lastUpdate: now,
      isActive: frequency > 0,
    }))
  }, [])

  const addDualSensorData = useCallback(
    (data: DualSensorData) => {
      const now = Date.now()

      // Solo procesar si hay datos reales
      if (!data.hand && !data.finger) {
        return
      }

      console.log("Procesando datos duales:", data) // Debug

      // Procesar datos de la mano
      if (data.hand) {
        setHandData((prev) => {
          const newData = [...prev, data.hand!].slice(-100) // Mantener últimas 100 muestras
          return newData
        })
      }

      // Procesar datos del dedo
      if (data.finger) {
        setFingerData((prev) => {
          const newData = [...prev, data.finger!].slice(-100) // Mantener últimas 100 muestras
          return newData
        })
      }

      // Calcular datos compensados si tenemos ambos sensores
      if (data.hand && data.finger) {
        const compensated = calculateCompensatedData(data.hand, data.finger)
        setCompensatedFingerData((prev) => {
          const newData = [...prev, compensated].slice(-100) // Mantener últimas 100 muestras
          return newData
        })
      }

      // Actualizar estadísticas
      sampleCountRef.current++
      updateFrequency()
    },
    [calculateCompensatedData, updateFrequency],
  )

  const clearData = useCallback(() => {
    setHandData([])
    setFingerData([])
    setCompensatedFingerData([])
    setStats({
      frequency: 0,
      totalSamples: 0,
      lastUpdate: 0,
      isActive: false,
    })
    sampleCountRef.current = 0
    frequencyWindowRef.current = []
  }, [])

  const getLatestHandData = useCallback(() => {
    return handData.length > 0 ? handData[handData.length - 1] : null
  }, [handData])

  const getLatestFingerData = useCallback(() => {
    return fingerData.length > 0 ? fingerData[fingerData.length - 1] : null
  }, [fingerData])

  const getLatestCompensatedData = useCallback(() => {
    return compensatedFingerData.length > 0 ? compensatedFingerData[compensatedFingerData.length - 1] : null
  }, [compensatedFingerData])

  return {
    handData,
    fingerData,
    compensatedFingerData,
    stats,
    addDualSensorData,
    clearData,
    getLatestHandData,
    getLatestFingerData,
    getLatestCompensatedData,
  }
}
