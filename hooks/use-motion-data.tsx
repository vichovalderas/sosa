"use client"

import { useState, useCallback } from "react"

export interface MotionDataPoint {
  ax: number
  ay: number
  az: number
  gx: number
  gy: number
  gz: number
  timestamp: number
}

export interface CompensatedFingerData extends MotionDataPoint {
  compensated_ax: number
  compensated_ay: number
  compensated_az: number
  compensated_gx: number
  compensated_gy: number
  compensated_gz: number
}

export function useMotionData() {
  const [handData, setHandData] = useState<MotionDataPoint[]>([])
  const [fingerData, setFingerData] = useState<MotionDataPoint[]>([])
  const [compensatedFingerData, setCompensatedFingerData] = useState<CompensatedFingerData[]>([])
  const [stats, setStats] = useState({
    frequency: 0,
    totalSamples: 0,
    lastUpdate: 0,
  })

  const addDualSensorData = useCallback((rawData: any) => {
    const now = Date.now()

    // Procesar datos de mano
    if (rawData.hand && rawData.hand.accel && rawData.hand.gyro) {
      const handPoint: MotionDataPoint = {
        ax: rawData.hand.accel.x || 0,
        ay: rawData.hand.accel.y || 0,
        az: rawData.hand.accel.z || 0,
        gx: rawData.hand.gyro.x || 0,
        gy: rawData.hand.gyro.y || 0,
        gz: rawData.hand.gyro.z || 0,
        timestamp: now,
      }

      setHandData((prev) => [...prev.slice(-99), handPoint])
    }

    // Procesar datos de dedo
    if (rawData.finger && rawData.finger.accel && rawData.finger.gyro) {
      const fingerPoint: MotionDataPoint = {
        ax: rawData.finger.accel.x || 0,
        ay: rawData.finger.accel.y || 0,
        az: rawData.finger.accel.z || 0,
        gx: rawData.finger.gyro.x || 0,
        gy: rawData.finger.gyro.y || 0,
        gz: rawData.finger.gyro.z || 0,
        timestamp: now,
      }

      setFingerData((prev) => [...prev.slice(-99), fingerPoint])

      // Crear datos compensados básicos (sin compensación real por ahora)
      const compensatedPoint: CompensatedFingerData = {
        ...fingerPoint,
        compensated_ax: fingerPoint.ax,
        compensated_ay: fingerPoint.ay,
        compensated_az: fingerPoint.az,
        compensated_gx: fingerPoint.gx,
        compensated_gy: fingerPoint.gy,
        compensated_gz: fingerPoint.gz,
      }

      setCompensatedFingerData((prev) => [...prev.slice(-99), compensatedPoint])
    }

    // Actualizar estadísticas
    setStats((prev) => ({
      frequency: prev.lastUpdate > 0 ? 1000 / (now - prev.lastUpdate) : 0,
      totalSamples: prev.totalSamples + 1,
      lastUpdate: now,
    }))
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

  const clearData = useCallback(() => {
    setHandData([])
    setFingerData([])
    setCompensatedFingerData([])
    setStats({ frequency: 0, totalSamples: 0, lastUpdate: 0 })
  }, [])

  return {
    handData,
    fingerData,
    compensatedFingerData,
    stats,
    addData: addDualSensorData, // Keep backward compatibility
    addDualSensorData,
    clearData,
    getLatestHandData,
    getLatestFingerData,
    getLatestCompensatedData,
  }
}
