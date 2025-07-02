"use client"

import { useState, useCallback, useRef } from "react"
import type { MotionDataPoint, CompensatedFingerData } from "./use-motion-data"

interface ProcessingConfig {
  compensationFactor: number
  smoothingWindow: number
  noiseThreshold: number
  calibrationEnabled: boolean
}

interface MotionMetrics {
  handMagnitude: number
  fingerMagnitude: number
  compensatedMagnitude: number
  correlationCoefficient: number
  independentMotionRatio: number
  dominantAxis: "x" | "y" | "z"
  motionType: "static" | "linear" | "rotational" | "complex"
}

interface CalibrationData {
  handOffset: { ax: number; ay: number; az: number; gx: number; gy: number; gz: number }
  fingerOffset: { ax: number; ay: number; az: number; gx: number; gy: number; gz: number }
  isCalibrated: boolean
}

export function useEnhancedMotionProcessing() {
  const [config, setConfig] = useState<ProcessingConfig>({
    compensationFactor: 1.0,
    smoothingWindow: 5,
    noiseThreshold: 0.05,
    calibrationEnabled: true,
  })

  const [calibration, setCalibration] = useState<CalibrationData>({
    handOffset: { ax: 0, ay: 0, az: 0, gx: 0, gy: 0, gz: 0 },
    fingerOffset: { ax: 0, ay: 0, az: 0, gx: 0, gy: 0, gz: 0 },
    isCalibrated: false,
  })

  const [metrics, setMetrics] = useState<MotionMetrics | null>(null)

  // Smoothing buffers
  const handSmoothingBuffer = useRef<MotionDataPoint[]>([])
  const fingerSmoothingBuffer = useRef<MotionDataPoint[]>([])
  const compensatedSmoothingBuffer = useRef<CompensatedFingerData[]>([])

  // Calibration buffers
  const calibrationBuffer = useRef<{
    hand: MotionDataPoint[]
    finger: MotionDataPoint[]
  }>({ hand: [], finger: [] })

  const applyCalibration = useCallback(
    (data: MotionDataPoint, sensorType: "hand" | "finger"): MotionDataPoint => {
      if (!config.calibrationEnabled || !calibration.isCalibrated) {
        return data
      }

      const offset = sensorType === "hand" ? calibration.handOffset : calibration.fingerOffset

      return {
        ...data,
        ax: data.ax - offset.ax,
        ay: data.ay - offset.ay,
        az: data.az - offset.az,
        gx: data.gx - offset.gx,
        gy: data.gy - offset.gy,
        gz: data.gz - offset.gz,
      }
    },
    [config.calibrationEnabled, calibration],
  )

  const applySmoothingFilter = useCallback(
    (data: MotionDataPoint, buffer: MotionDataPoint[]): MotionDataPoint => {
      // Add to buffer
      buffer.push(data)
      if (buffer.length > config.smoothingWindow) {
        buffer.shift()
      }

      // Apply moving average
      if (buffer.length < 2) return data

      const smoothed = buffer.reduce(
        (acc, point) => ({
          ax: acc.ax + point.ax,
          ay: acc.ay + point.ay,
          az: acc.az + point.az,
          gx: acc.gx + point.gx,
          gy: acc.gy + point.gy,
          gz: acc.gz + point.gz,
        }),
        { ax: 0, ay: 0, az: 0, gx: 0, gy: 0, gz: 0 },
      )

      const count = buffer.length
      return {
        ...data,
        ax: smoothed.ax / count,
        ay: smoothed.ay / count,
        az: smoothed.az / count,
        gx: smoothed.gx / count,
        gy: smoothed.gy / count,
        gz: smoothed.gz / count,
      }
    },
    [config.smoothingWindow],
  )

  const applyNoiseReduction = useCallback(
    (data: MotionDataPoint): MotionDataPoint => {
      const threshold = config.noiseThreshold

      return {
        ...data,
        ax: Math.abs(data.ax) < threshold ? 0 : data.ax,
        ay: Math.abs(data.ay) < threshold ? 0 : data.ay,
        az: Math.abs(data.az) < threshold ? 0 : data.az,
        gx: Math.abs(data.gx) < threshold * 10 ? 0 : data.gx, // Higher threshold for gyro
        gy: Math.abs(data.gy) < threshold * 10 ? 0 : data.gy,
        gz: Math.abs(data.gz) < threshold * 10 ? 0 : data.gz,
      }
    },
    [config.noiseThreshold],
  )

  const enhancedCompensation = useCallback(
    (fingerData: MotionDataPoint, handData: MotionDataPoint): CompensatedFingerData => {
      const factor = config.compensationFactor

      // Advanced compensation with adaptive factors
      const handMagnitude = Math.sqrt(handData.ax ** 2 + handData.ay ** 2 + handData.az ** 2)
      const adaptiveFactor = Math.min(1.0, Math.max(0.5, factor * (1 + handMagnitude / 10)))

      const compensated: CompensatedFingerData = {
        ...fingerData,
        compensated_ax: fingerData.ax - handData.ax * adaptiveFactor,
        compensated_ay: fingerData.ay - handData.ay * adaptiveFactor,
        compensated_az: fingerData.az - handData.az * adaptiveFactor,
        compensated_gx: fingerData.gx - handData.gx * adaptiveFactor,
        compensated_gy: fingerData.gy - handData.gy * adaptiveFactor,
        compensated_gz: fingerData.gz - handData.gz * adaptiveFactor,
      }

      return compensated
    },
    [config.compensationFactor],
  )

  const calculateMotionMetrics = useCallback(
    (handData: MotionDataPoint, fingerData: MotionDataPoint, compensatedData: CompensatedFingerData): MotionMetrics => {
      // Calculate magnitudes
      const handMagnitude = Math.sqrt(handData.ax ** 2 + handData.ay ** 2 + handData.az ** 2)
      const fingerMagnitude = Math.sqrt(fingerData.ax ** 2 + fingerData.ay ** 2 + fingerData.az ** 2)
      const compensatedMagnitude = Math.sqrt(
        compensatedData.compensated_ax ** 2 + compensatedData.compensated_ay ** 2 + compensatedData.compensated_az ** 2,
      )

      // Calculate correlation coefficient
      const handVector = [handData.ax, handData.ay, handData.az]
      const fingerVector = [fingerData.ax, fingerData.ay, fingerData.az]

      const dotProduct = handVector.reduce((sum, val, i) => sum + val * fingerVector[i], 0)
      const correlationCoefficient = dotProduct / (handMagnitude * fingerMagnitude) || 0

      // Calculate independent motion ratio
      const independentMotionRatio = compensatedMagnitude / (fingerMagnitude + 0.001)

      // Determine dominant axis
      const compensatedAbs = [
        Math.abs(compensatedData.compensated_ax),
        Math.abs(compensatedData.compensated_ay),
        Math.abs(compensatedData.compensated_az),
      ]
      const maxIndex = compensatedAbs.indexOf(Math.max(...compensatedAbs))
      const dominantAxis = ["x", "y", "z"][maxIndex] as "x" | "y" | "z"

      // Classify motion type
      let motionType: "static" | "linear" | "rotational" | "complex"
      const gyroMagnitude = Math.sqrt(handData.gx ** 2 + handData.gy ** 2 + handData.gz ** 2)

      if (handMagnitude < 0.1 && compensatedMagnitude < 0.1) {
        motionType = "static"
      } else if (gyroMagnitude > handMagnitude * 10) {
        motionType = "rotational"
      } else if (compensatedMagnitude > handMagnitude * 0.5) {
        motionType = "complex"
      } else {
        motionType = "linear"
      }

      return {
        handMagnitude,
        fingerMagnitude,
        compensatedMagnitude,
        correlationCoefficient,
        independentMotionRatio,
        dominantAxis,
        motionType,
      }
    },
    [],
  )

  const processMotionData = useCallback(
    (handData: MotionDataPoint, fingerData: MotionDataPoint) => {
      // Step 1: Apply calibration
      const calibratedHand = applyCalibration(handData, "hand")
      const calibratedFinger = applyCalibration(fingerData, "finger")

      // Step 2: Apply smoothing
      const smoothedHand = applySmoothingFilter(calibratedHand, handSmoothingBuffer.current)
      const smoothedFinger = applySmoothingFilter(calibratedFinger, fingerSmoothingBuffer.current)

      // Step 3: Apply noise reduction
      const cleanHand = applyNoiseReduction(smoothedHand)
      const cleanFinger = applyNoiseReduction(smoothedFinger)

      // Step 4: Enhanced compensation
      const compensatedFinger = enhancedCompensation(cleanFinger, cleanHand)

      // Step 5: Calculate metrics
      const currentMetrics = calculateMotionMetrics(cleanHand, cleanFinger, compensatedFinger)
      setMetrics(currentMetrics)

      return {
        processedHand: cleanHand,
        processedFinger: cleanFinger,
        compensatedFinger,
        metrics: currentMetrics,
      }
    },
    [applyCalibration, applySmoothingFilter, applyNoiseReduction, enhancedCompensation, calculateMotionMetrics],
  )

  const startCalibration = useCallback(() => {
    calibrationBuffer.current = { hand: [], finger: [] }
    setCalibration((prev) => ({ ...prev, isCalibrated: false }))
  }, [])

  const addCalibrationSample = useCallback((handData: MotionDataPoint, fingerData: MotionDataPoint) => {
    calibrationBuffer.current.hand.push(handData)
    calibrationBuffer.current.finger.push(fingerData)
  }, [])

  const finishCalibration = useCallback(() => {
    const { hand, finger } = calibrationBuffer.current

    if (hand.length < 10 || finger.length < 10) {
      console.warn("Insufficient calibration samples")
      return false
    }

    // Calculate average offsets
    const handOffset = hand.reduce(
      (acc, data) => ({
        ax: acc.ax + data.ax,
        ay: acc.ay + data.ay,
        az: acc.az + data.az,
        gx: acc.gx + data.gx,
        gy: acc.gy + data.gy,
        gz: acc.gz + data.gz,
      }),
      { ax: 0, ay: 0, az: 0, gx: 0, gy: 0, gz: 0 },
    )

    const fingerOffset = finger.reduce(
      (acc, data) => ({
        ax: acc.ax + data.ax,
        ay: acc.ay + data.ay,
        az: acc.az + data.az,
        gx: acc.gx + data.gx,
        gy: acc.gy + data.gy,
        gz: acc.gz + data.gz,
      }),
      { ax: 0, ay: 0, az: 0, gx: 0, gy: 0, gz: 0 },
    )

    const handCount = hand.length
    const fingerCount = finger.length

    setCalibration({
      handOffset: {
        ax: handOffset.ax / handCount,
        ay: handOffset.ay / handCount,
        az: handOffset.az / handCount,
        gx: handOffset.gx / handCount,
        gy: handOffset.gy / handCount,
        gz: handOffset.gz / handCount,
      },
      fingerOffset: {
        ax: fingerOffset.ax / fingerCount,
        ay: fingerOffset.ay / fingerCount,
        az: fingerOffset.az / fingerCount,
        gx: fingerOffset.gx / fingerCount,
        gy: fingerOffset.gy / fingerCount,
        gz: fingerOffset.gz / fingerCount,
      },
      isCalibrated: true,
    })

    return true
  }, [])

  const updateConfig = useCallback((newConfig: Partial<ProcessingConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }))
  }, [])

  return {
    config,
    calibration,
    metrics,
    processMotionData,
    startCalibration,
    addCalibrationSample,
    finishCalibration,
    updateConfig,
  }
}
