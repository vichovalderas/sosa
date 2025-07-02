"use client"

import { useState, useRef, useCallback } from "react"
import type { MotionDataPoint, CompensatedFingerData } from "./use-motion-data"

interface AdvancedPattern {
  id: string
  name: string
  type: "gesture" | "tap" | "swipe" | "pinch" | "rotation" | "complex"
  confidence: number
  timestamp: number
  duration: number
  characteristics: {
    handDominance: number
    fingerIndependence: number
    spatialComplexity: number
    temporalConsistency: number
    frequencySignature: number[]
  }
  metadata: {
    peakAcceleration: number
    averageVelocity: number
    directionChanges: number
    rhythmicity: number
  }
}

interface GestureTemplate {
  name: string
  type: string
  features: {
    minDuration: number
    maxDuration: number
    handMotionThreshold: number
    fingerMotionThreshold: number
    correlationRange: [number, number]
    frequencyBands: number[]
  }
  classifier: (data: MotionAnalysisWindow) => number
}

interface MotionAnalysisWindow {
  handData: MotionDataPoint[]
  fingerData: MotionDataPoint[]
  compensatedData: CompensatedFingerData[]
  duration: number
  startTime: number
}

export function useAdvancedPatternDetection() {
  const [detectedPatterns, setDetectedPatterns] = useState<AdvancedPattern[]>([])
  const [currentAnalysis, setCurrentAnalysis] = useState<any>(null)
  const [isLearning, setIsLearning] = useState(false)

  // Analysis windows
  const analysisWindowRef = useRef<MotionAnalysisWindow>({
    handData: [],
    fingerData: [],
    compensatedData: [],
    duration: 0,
    startTime: Date.now(),
  })

  // Gesture templates
  const gestureTemplates = useRef<GestureTemplate[]>([
    {
      name: "Finger Tap",
      type: "tap",
      features: {
        minDuration: 100,
        maxDuration: 500,
        handMotionThreshold: 0.5,
        fingerMotionThreshold: 2.0,
        correlationRange: [-0.3, 0.3],
        frequencyBands: [5, 15, 25],
      },
      classifier: (window) => classifyTap(window),
    },
    {
      name: "Finger Swipe",
      type: "swipe",
      features: {
        minDuration: 200,
        maxDuration: 1000,
        handMotionThreshold: 1.0,
        fingerMotionThreshold: 3.0,
        correlationRange: [0.3, 0.8],
        frequencyBands: [2, 8, 12],
      },
      classifier: (window) => classifySwipe(window),
    },
    {
      name: "Pinch Motion",
      type: "pinch",
      features: {
        minDuration: 300,
        maxDuration: 2000,
        handMotionThreshold: 0.8,
        fingerMotionThreshold: 1.5,
        correlationRange: [0.5, 0.9],
        frequencyBands: [1, 4, 8],
      },
      classifier: (window) => classifyPinch(window),
    },
    {
      name: "Rotation Gesture",
      type: "rotation",
      features: {
        minDuration: 500,
        maxDuration: 3000,
        handMotionThreshold: 2.0,
        fingerMotionThreshold: 1.0,
        correlationRange: [0.6, 0.95],
        frequencyBands: [0.5, 2, 4],
      },
      classifier: (window) => classifyRotation(window),
    },
  ])

  const updateAnalysisWindow = useCallback(
    (handData: MotionDataPoint[], fingerData: MotionDataPoint[], compensatedData: CompensatedFingerData[]) => {
      const window = analysisWindowRef.current
      const maxWindowSize = 100 // ~2 seconds at 50Hz

      // Update window data
      window.handData = [...window.handData, ...handData].slice(-maxWindowSize)
      window.fingerData = [...window.fingerData, ...fingerData].slice(-maxWindowSize)
      window.compensatedData = [...window.compensatedData, ...compensatedData].slice(-maxWindowSize)

      if (window.handData.length > 0) {
        window.duration = Date.now() - window.startTime
      }

      // Analyze current window
      const analysis = analyzeMotionWindow(window)
      setCurrentAnalysis(analysis)

      // Detect patterns
      detectPatterns(window, analysis)
    },
    [],
  )

  const analyzeMotionWindow = (window: MotionAnalysisWindow) => {
    if (window.handData.length < 10) return null

    // Calculate motion characteristics
    const handMotion = calculateMotionCharacteristics(window.handData)
    const fingerMotion = calculateMotionCharacteristics(window.fingerData)
    const compensatedMotion = calculateCompensatedCharacteristics(window.compensatedData)

    // Calculate correlation between hand and finger
    const correlation = calculateCorrelation(window.handData, window.fingerData)

    // Frequency analysis
    const handFrequencies = performFFT(window.handData)
    const fingerFrequencies = performFFT(window.compensatedData)

    // Spatial analysis
    const spatialComplexity = calculateSpatialComplexity(window.compensatedData)

    // Temporal analysis
    const temporalConsistency = calculateTemporalConsistency(window.compensatedData)

    return {
      handMotion,
      fingerMotion,
      compensatedMotion,
      correlation,
      handFrequencies,
      fingerFrequencies,
      spatialComplexity,
      temporalConsistency,
      fingerIndependence: compensatedMotion.magnitude / (fingerMotion.magnitude + 0.001),
    }
  }

  const detectPatterns = (window: MotionAnalysisWindow, analysis: any) => {
    if (!analysis) return

    gestureTemplates.current.forEach((template) => {
      const confidence = template.classifier(window)

      if (confidence > 0.7) {
        const pattern: AdvancedPattern = {
          id: `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: template.name,
          type: template.type as any,
          confidence,
          timestamp: Date.now(),
          duration: window.duration,
          characteristics: {
            handDominance: analysis.handMotion.magnitude / (analysis.fingerMotion.magnitude + 0.001),
            fingerIndependence: analysis.fingerIndependence,
            spatialComplexity: analysis.spatialComplexity,
            temporalConsistency: analysis.temporalConsistency,
            frequencySignature: [...analysis.handFrequencies.slice(0, 5), ...analysis.fingerFrequencies.slice(0, 5)],
          },
          metadata: {
            peakAcceleration: Math.max(analysis.handMotion.peak, analysis.compensatedMotion.peak),
            averageVelocity: (analysis.handMotion.average + analysis.compensatedMotion.average) / 2,
            directionChanges: analysis.compensatedMotion.directionChanges,
            rhythmicity: analysis.temporalConsistency,
          },
        }

        setDetectedPatterns((prev) => [...prev.slice(-50), pattern])
      }
    })
  }

  return {
    detectedPatterns,
    currentAnalysis,
    updateAnalysisWindow,
    isLearning,
    setIsLearning,
  }
}

// Helper functions for pattern classification
function classifyTap(window: MotionAnalysisWindow): number {
  if (window.compensatedData.length < 5) return 0

  const compensatedMagnitudes = window.compensatedData.map((d) =>
    Math.sqrt(d.compensated_ax ** 2 + d.compensated_ay ** 2 + d.compensated_az ** 2),
  )

  const peak = Math.max(...compensatedMagnitudes)
  const average = compensatedMagnitudes.reduce((a, b) => a + b, 0) / compensatedMagnitudes.length

  // Tap characteristics: high peak, short duration, low hand correlation
  const peakRatio = peak / (average + 0.001)
  const durationScore = window.duration < 500 ? 1 : Math.max(0, 1 - (window.duration - 500) / 1000)

  return Math.min(1, (peakRatio / 5 + durationScore) / 2)
}

function classifySwipe(window: MotionAnalysisWindow): number {
  if (window.compensatedData.length < 10) return 0

  // Analyze directional consistency
  const directions = window.compensatedData.slice(1).map((d, i) => {
    const prev = window.compensatedData[i]
    return {
      x: d.compensated_ax - prev.compensated_ax,
      y: d.compensated_ay - prev.compensated_ay,
      z: d.compensated_az - prev.compensated_az,
    }
  })

  // Calculate directional consistency
  const avgDirection = directions.reduce(
    (acc, d) => ({
      x: acc.x + d.x,
      y: acc.y + d.y,
      z: acc.z + d.z,
    }),
    { x: 0, y: 0, z: 0 },
  )

  const directionMagnitude = Math.sqrt(avgDirection.x ** 2 + avgDirection.y ** 2 + avgDirection.z ** 2)
  const consistency = directionMagnitude / directions.length

  const durationScore = window.duration > 200 && window.duration < 1000 ? 1 : 0.5

  return Math.min(1, consistency * durationScore)
}

function classifyPinch(window: MotionAnalysisWindow): number {
  if (window.handData.length < 15 || window.compensatedData.length < 15) return 0

  // Pinch: coordinated hand and finger movement
  const handMagnitudes = window.handData.map((d) => Math.sqrt(d.ax ** 2 + d.ay ** 2 + d.az ** 2))
  const compensatedMagnitudes = window.compensatedData.map((d) =>
    Math.sqrt(d.compensated_ax ** 2 + d.compensated_ay ** 2 + d.compensated_az ** 2),
  )

  const handAvg = handMagnitudes.reduce((a, b) => a + b, 0) / handMagnitudes.length
  const fingerAvg = compensatedMagnitudes.reduce((a, b) => a + b, 0) / compensatedMagnitudes.length

  // Pinch has moderate hand movement and controlled finger movement
  const coordinationScore = Math.min(handAvg / 2, fingerAvg / 1.5)
  const durationScore = window.duration > 300 ? Math.min(1, 2000 / window.duration) : 0

  return Math.min(1, coordinationScore * durationScore)
}

function classifyRotation(window: MotionAnalysisWindow): number {
  if (window.handData.length < 20) return 0

  // Analyze gyroscope data for rotation
  const gyroMagnitudes = window.handData.map((d) => Math.sqrt(d.gx ** 2 + d.gy ** 2 + d.gz ** 2))
  const accelMagnitudes = window.handData.map((d) => Math.sqrt(d.ax ** 2 + d.ay ** 2 + d.az ** 2))

  const avgGyro = gyroMagnitudes.reduce((a, b) => a + b, 0) / gyroMagnitudes.length
  const avgAccel = accelMagnitudes.reduce((a, b) => a + b, 0) / accelMagnitudes.length

  // Rotation has high gyro relative to acceleration
  const rotationRatio = avgGyro / (avgAccel * 10 + 1)
  const durationScore = window.duration > 500 ? Math.min(1, 3000 / window.duration) : 0

  return Math.min(1, rotationRatio * durationScore)
}

// Additional helper functions
function calculateMotionCharacteristics(data: MotionDataPoint[]) {
  if (data.length === 0) return { magnitude: 0, peak: 0, average: 0, variance: 0, directionChanges: 0 }

  const magnitudes = data.map((d) => Math.sqrt(d.ax ** 2 + d.ay ** 2 + d.az ** 2))
  const peak = Math.max(...magnitudes)
  const average = magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length
  const variance = magnitudes.reduce((acc, val) => acc + Math.pow(val - average, 2), 0) / magnitudes.length

  // Count direction changes
  let directionChanges = 0
  for (let i = 2; i < data.length; i++) {
    const prev = data[i - 1]
    const curr = data[i]
    const prevDir = Math.atan2(prev.ay, prev.ax)
    const currDir = Math.atan2(curr.ay, curr.ax)
    if (Math.abs(currDir - prevDir) > Math.PI / 4) {
      directionChanges++
    }
  }

  return { magnitude: average, peak, average, variance, directionChanges }
}

function calculateCompensatedCharacteristics(data: CompensatedFingerData[]) {
  if (data.length === 0) return { magnitude: 0, peak: 0, average: 0, variance: 0, directionChanges: 0 }

  const magnitudes = data.map((d) => Math.sqrt(d.compensated_ax ** 2 + d.compensated_ay ** 2 + d.compensated_az ** 2))
  const peak = Math.max(...magnitudes)
  const average = magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length
  const variance = magnitudes.reduce((acc, val) => acc + Math.pow(val - average, 2), 0) / magnitudes.length

  let directionChanges = 0
  for (let i = 2; i < data.length; i++) {
    const prev = data[i - 1]
    const curr = data[i]
    const prevDir = Math.atan2(prev.compensated_ay, prev.compensated_ax)
    const currDir = Math.atan2(curr.compensated_ay, curr.compensated_ax)
    if (Math.abs(currDir - prevDir) > Math.PI / 4) {
      directionChanges++
    }
  }

  return { magnitude: average, peak, average, variance, directionChanges }
}

function calculateCorrelation(handData: MotionDataPoint[], fingerData: MotionDataPoint[]): number {
  if (handData.length !== fingerData.length || handData.length === 0) return 0

  const handMagnitudes = handData.map((d) => Math.sqrt(d.ax ** 2 + d.ay ** 2 + d.az ** 2))
  const fingerMagnitudes = fingerData.map((d) => Math.sqrt(d.ax ** 2 + d.ay ** 2 + d.az ** 2))

  const handMean = handMagnitudes.reduce((a, b) => a + b, 0) / handMagnitudes.length
  const fingerMean = fingerMagnitudes.reduce((a, b) => a + b, 0) / fingerMagnitudes.length

  let numerator = 0
  let handSumSq = 0
  let fingerSumSq = 0

  for (let i = 0; i < handMagnitudes.length; i++) {
    const handDiff = handMagnitudes[i] - handMean
    const fingerDiff = fingerMagnitudes[i] - fingerMean
    numerator += handDiff * fingerDiff
    handSumSq += handDiff ** 2
    fingerSumSq += fingerDiff ** 2
  }

  const denominator = Math.sqrt(handSumSq * fingerSumSq)
  return denominator === 0 ? 0 : numerator / denominator
}

function performFFT(data: any[]): number[] {
  // Simplified frequency analysis - in a real implementation, use a proper FFT library
  const magnitudes = data.map((d) =>
    d.compensated_ax !== undefined
      ? Math.sqrt(d.compensated_ax ** 2 + d.compensated_ay ** 2 + d.compensated_az ** 2)
      : Math.sqrt(d.ax ** 2 + d.ay ** 2 + d.az ** 2),
  )

  // Simple frequency detection using autocorrelation
  const frequencies: number[] = []
  for (let period = 2; period <= Math.min(magnitudes.length / 2, 20); period++) {
    let correlation = 0
    for (let i = 0; i < magnitudes.length - period; i++) {
      correlation += magnitudes[i] * magnitudes[i + period]
    }
    frequencies.push(correlation / (magnitudes.length - period))
  }

  return frequencies
}

function calculateSpatialComplexity(data: CompensatedFingerData[]): number {
  if (data.length < 3) return 0

  let totalDistance = 0
  let directDistance = 0

  for (let i = 1; i < data.length; i++) {
    const prev = data[i - 1]
    const curr = data[i]
    const stepDistance = Math.sqrt(
      (curr.compensated_ax - prev.compensated_ax) ** 2 +
        (curr.compensated_ay - prev.compensated_ay) ** 2 +
        (curr.compensated_az - prev.compensated_az) ** 2,
    )
    totalDistance += stepDistance
  }

  const first = data[0]
  const last = data[data.length - 1]
  directDistance = Math.sqrt(
    (last.compensated_ax - first.compensated_ax) ** 2 +
      (last.compensated_ay - first.compensated_ay) ** 2 +
      (last.compensated_az - first.compensated_az) ** 2,
  )

  return directDistance === 0 ? 0 : totalDistance / directDistance
}

function calculateTemporalConsistency(data: CompensatedFingerData[]): number {
  if (data.length < 5) return 0

  const magnitudes = data.map((d) => Math.sqrt(d.compensated_ax ** 2 + d.compensated_ay ** 2 + d.compensated_az ** 2))

  // Calculate variance in magnitude over time
  const mean = magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length
  const variance = magnitudes.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / magnitudes.length

  // Lower variance indicates higher consistency
  return Math.max(0, 1 - variance / (mean + 0.001))
}
