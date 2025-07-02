"use client"

import { useEffect, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Activity, Hand, TrendingUp, AlertTriangle } from "lucide-react"
import DualHandModel3D from "@/components/dual-hand-model-3d"
import DualMotionCharts from "@/components/dual-motion-charts"
import PatternAnalysis from "@/components/pattern-analysis"
import ConnectionStatus from "@/components/connection-status"
import Header from "@/components/header"
import { useBLEConnection } from "@/hooks/use-ble-connection"
import { useMotionData } from "@/hooks/use-motion-data"
import { usePatternDetection } from "@/hooks/use-pattern-detection"
import { useErrorHandler } from "@/hooks/use-error-handler"
import Enhanced3DMotionDisplay from "@/components/enhanced-3d-motion-display"
import { useEnhancedMotionProcessing } from "@/hooks/use-enhanced-motion-processing"
import { useAdvancedPatternDetection } from "@/hooks/use-advanced-pattern-detection"

export default function MPU6050HandTracker() {
  const { errors, addError, clearError } = useErrorHandler()

  const {
    isConnected,
    isConnecting,
    deviceName,
    connect,
    disconnect,
    error: bleError,
    connectionQuality,
    setDataCallback, // Asegúrate de obtener esta función
  } = useBLEConnection()

  const {
    handData,
    fingerData,
    compensatedFingerData,
    currentHandData,
    currentFingerData,
    currentCompensatedFingerData,
    addDualSensorData,
    dataRate,
    lastUpdateTime,
  } = useMotionData()

  const { detectedPatterns, currentGesture } = usePatternDetection(handData, fingerData, compensatedFingerData)

  const {
    config: processingConfig,
    calibration,
    metrics,
    processMotionData,
    startCalibration,
    addCalibrationSample,
    finishCalibration,
    updateConfig,
  } = useEnhancedMotionProcessing()

  const { detectedPatterns: advancedPatterns, currentAnalysis, updateAnalysisWindow } = useAdvancedPatternDetection()

  // Define el callback para procesar datos BLE
  const handleRawData = useCallback((rawData: string) => {
    try {
      const parsedData = JSON.parse(rawData)

      const dualSensorData: any = {
        systemTimestamp: parsedData.system_timestamp || Date.now(),
      }

      if (parsedData.hand && parsedData.finger) {
        const handPoint = {
          ax: parsedData.hand.accel?.x || 0,
          ay: parsedData.hand.accel?.y || 0,
          az: parsedData.hand.accel?.z || 0,
          gx: parsedData.hand.gyro?.x || 0,
          gy: parsedData.hand.gyro?.y || 0,
          gz: parsedData.hand.gyro?.z || 0,
          timestamp: parsedData.hand.timestamp || Date.now(),
          sensorId: "hand",
          quality: connectionQuality,
        }

        const fingerPoint = {
          ax: parsedData.finger.accel?.x || 0,
          ay: parsedData.finger.accel?.y || 0,
          az: parsedData.finger.accel?.z || 0,
          gx: parsedData.finger.gyro?.x || 0,
          gy: parsedData.finger.gyro?.y || 0,
          gz: parsedData.finger.gyro?.z || 0,
          timestamp: parsedData.finger.timestamp || Date.now(),
          sensorId: "finger",
          quality: connectionQuality,
        }

        // Enhanced processing
        const processed = processMotionData(handPoint, fingerPoint)

        dualSensorData.hand = processed.processedHand
        dualSensorData.finger = processed.compensatedFinger
      }

      addDualSensorData(dualSensorData)

      // Update advanced pattern detection
      updateAnalysisWindow(
        [dualSensorData.hand].filter(Boolean),
        [dualSensorData.finger].filter(Boolean),
        [dualSensorData.finger].filter(Boolean),
      )

      clearError("data-parsing")
    } catch (error) {
      addError(
        "data-parsing",
        `Error al procesar datos: ${error instanceof Error ? error.message : "Error desconocido"}`,
      )
    }
  }, [
    addDualSensorData,
    addError,
    clearError,
    connectionQuality,
    processMotionData,
    updateAnalysisWindow,
  ])

  // Configurar callback para recibir datos BLE
  useEffect(() => {
    setDataCallback(handleRawData)
    
    // Limpieza al desmontar el componente
    return () => {
      setDataCallback(() => () => {})
    }
  }, [setDataCallback, handleRawData])

  // Manejar errores de BLE
  useEffect(() => {
    if (bleError) {
      addError("ble-connection", bleError)
    } else {
      clearError("ble-connection")
    }
  }, [bleError, addError, clearError])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-sm mx-auto md:max-w-7xl">
        <Header />

        <div className="px-4 pb-4 space-y-4">
          {/* Errores globales */}
          {Object.entries(errors).map(([key, error]) => (
            <Alert key={key} variant="destructive" className="mx-auto max-w-md">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          ))}

          {/* Connection Status */}
          <ConnectionStatus
            isConnected={isConnected}
            isConnecting={isConnecting}
            deviceName={deviceName}
            onConnect={connect}
            onDisconnect={disconnect}
            currentHandData={currentHandData}
            currentFingerData={currentFingerData}
            currentCompensatedFingerData={currentCompensatedFingerData}
            dataRate={dataRate}
            lastUpdateTime={lastUpdateTime}
          />

          {/* Vista móvil - Cards apiladas */}
          <div className="md:hidden space-y-4">
            <Enhanced3DMotionDisplay
              handData={currentHandData}
              fingerData={currentFingerData}
              compensatedFingerData={currentCompensatedFingerData}
              handHistory={handData}
              fingerHistory={fingerData}
              compensatedHistory={compensatedFingerData}
            />
            <DualMotionCharts
              handData={handData}
              fingerData={fingerData}
              compensatedFingerData={compensatedFingerData}
              isMobile={true}
            />
            <PatternAnalysis patterns={detectedPatterns} currentGesture={currentGesture} isMobile={true} />
          </div>

          {/* Vista desktop - Tabs */}
          <div className="hidden md:block">
            <Tabs defaultValue="3d-model" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 h-12">
                <TabsTrigger value="3d-model" className="flex items-center gap-2 text-sm">
                  <Hand className="w-4 h-4" />
                  Modelo 3D
                </TabsTrigger>
                <TabsTrigger value="charts" className="flex items-center gap-2 text-sm">
                  <Activity className="w-4 h-4" />
                  Gráficos
                </TabsTrigger>
                <TabsTrigger value="patterns" className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4" />
                  Patrones
                </TabsTrigger>
              </TabsList>

              <TabsContent value="3d-model">
                <DualHandModel3D
                  handData={currentHandData}
                  fingerData={currentFingerData}
                  compensatedFingerData={currentCompensatedFingerData}
                />
              </TabsContent>

              <TabsContent value="charts">
                <DualMotionCharts
                  handData={handData}
                  fingerData={fingerData}
                  compensatedFingerData={compensatedFingerData}
                  isMobile={false}
                />
              </TabsContent>

              <TabsContent value="patterns">
                <PatternAnalysis patterns={detectedPatterns} currentGesture={currentGesture} isMobile={false} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
