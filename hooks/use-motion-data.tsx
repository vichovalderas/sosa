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
      // Corrección de ejes: sensor rotado 90° horario
      // Sensor: +Y adelante, +X derecha, +Z arriba
      // Dispositivo: -X adelante, +Y derecha, +Z arriba
      // Transformación: X_device = -Y_sensor, Y_device = X_sensor, Z_device = Z_sensor
      const handPoint: MotionDataPoint = {
        ax: -rawData.hand.accel.y || 0, // -Y del sensor = X del dispositivo (adelante)
        ay: rawData.hand.accel.x || 0, // X del sensor = Y del dispositivo (derecha)
        az: rawData.hand.accel.z || 0, // Z del sensor = Z del dispositivo (arriba)
        gx: -rawData.hand.gyro.y || 0, // Aplicar misma transformación al giroscopio
        gy: rawData.hand.gyro.x || 0,
        gz: rawData.hand.gyro.z || 0,
        timestamp: now,
      }

      setHandData((prev) => [...prev.slice(-99), handPoint])
    }

    // Procesar datos de dedo
    if (rawData.finger && rawData.finger.accel && rawData.finger.gyro) {
      // Aplicar la misma corrección de ejes al sensor del dedo
      const fingerPoint: MotionDataPoint = {
        ax: -rawData.finger.accel.y || 0, // -Y del sensor = X del dispositivo (adelante)
        ay: rawData.finger.accel.x || 0, // X del sensor = Y del dispositivo (derecha)
        az: rawData.finger.accel.z || 0, // Z del sensor = Z del dispositivo (arriba)
        gx: -rawData.finger.gyro.y || 0, // Aplicar misma transformación al giroscopio
        gy: rawData.finger.gyro.x || 0,
        gz: rawData.finger.gyro.z || 0,
        timestamp: now,
      }

      setFingerData((prev) => [...prev.slice(-99), fingerPoint])

      // Crear datos compensados con los ejes ya corregidos
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
