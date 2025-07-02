"use client"
export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Activity, Bluetooth, Database, TrendingUp, Hand, Zap, LogOut } from "lucide-react"

// Hooks
import { useBLEConnection } from "@/hooks/use-ble-connection"
import { useMotionData } from "@/hooks/use-motion-data"
import { useMadgwickFusion } from "@/hooks/use-madgwick-fusion"
import { usePatternDetection } from "@/hooks/use-pattern-detection"
import { useAuth } from "@/hooks/use-auth"

// Componentes
import ConnectionStatus from "@/components/connection-status"
import DualMotionCharts from "@/components/dual-motion-charts"
import PatternAnalysis from "@/components/pattern-analysis"
import Visualizacion3DTiempoReal from "@/components/visualizacion-3d-tiempo-real"
import { signOut } from "@/app/auth/actions"
import { Loader2, HandIcon, Eye, EyeOff } from "lucide-react"  

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const { user } = useAuth()

  // Hooks de datos
  const {
    handData,
    fingerData,
    compensatedFingerData,
    stats,
    addDualSensorData,
    clearData,
    getLatestHandData,
    getLatestFingerData,
    getLatestCompensatedData,
  } = useMotionData()

  // Hook de conexión BLE (SIN datos simulados)
  const { isConnected, isConnecting, deviceName, connectionError, connectionQuality, connect, disconnect } =
    useBLEConnection(addDualSensorData)

  // Hook de fusión Madgwick
  const {
    cuaternionMano,
    cuaternionDedo,
    cuaternionDedoCompensado,
    procesarDatosMano,
    procesarDatosDedo,
    procesarDatosDedoCompensado,
    resetearFiltros,
  } = useMadgwickFusion()

  // Hook de detección de patrones
  const { patterns = [], currentPattern, addMotionData: addPatternData } = usePatternDetection()

  // Procesar datos cuando lleguen
  useEffect(() => {
    const latestHand = getLatestHandData()
    const latestFinger = getLatestFingerData()
    const latestCompensated = getLatestCompensatedData()

    if (latestHand) {
      procesarDatosMano(latestHand)
      addPatternData(latestHand)
    }

    if (latestFinger) {
      procesarDatosDedo(latestFinger)
    }

    if (latestCompensated) {
      procesarDatosDedoCompensado(latestCompensated)
    }
  }, [
    handData,
    fingerData,
    compensatedFingerData,
    procesarDatosMano,
    procesarDatosDedo,
    procesarDatosDedoCompensado,
    addPatternData,
    getLatestHandData,
    getLatestFingerData,
    getLatestCompensatedData,
  ])

  // Estadísticas calculadas
  const estadisticas = useMemo(() => {
    return {
      frecuencia: stats.frequency,
      muestrasTotal: stats.totalSamples,
      patronesDetectados: patterns.length,
      calidadConexion: connectionQuality,
      estadoConexion: isConnected ? "Conectado" : isConnecting ? "Conectando..." : "Desconectado",
    }
  }, [stats, patterns, connectionQuality, isConnected, isConnecting])

  const handleResetearTodo = () => {
    clearData()
    resetearFiltros()
  }

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header con logo */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      
      <div className="container mx-auto px-6 py-4">
      
          <div className="flex items-center justify-between"> {/* Cambié justify-between por justify-end */} 
                  <div className="ml-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
            <HandIcon className="w-8 h-8 text-white" />
          </div>
        </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-sm">
                {user?.email}
              </Badge>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>


      <div className="container mx-auto p-6 space-y-6">
        {/* Controles principales */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Panel de Control</h1>
            <p className="text-gray-600 mt-1">Monitoreo en tiempo real de sensores MPU6050</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleResetearTodo}>
              Resetear Todo
            </Button>
            {!isConnected && (
              <Button onClick={connect} disabled={isConnecting}>
                <Bluetooth className="w-4 h-4 mr-2" />
                {isConnecting ? "Conectando..." : "Conectar BLE"}
              </Button>
            )}
            {isConnected && (
              <Button variant="destructive" onClick={disconnect}>
                <Bluetooth className="w-4 h-4 mr-2" />
                Desconectar
              </Button>
            )}
          </div>
        </div>

        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estado Conexión</CardTitle>
              <Bluetooth className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticas.estadoConexion}</div>
              <Badge variant={isConnected ? "default" : "secondary"} className="mt-1">
                {deviceName || "Sin dispositivo"}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Frecuencia</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticas.frecuencia.toFixed(1)} Hz</div>
              <p className="text-xs text-muted-foreground">Datos por segundo</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Muestras Total</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticas.muestrasTotal.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Puntos de datos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Patrones</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticas.patronesDetectados}</div>
              <p className="text-xs text-muted-foreground">Detectados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Calidad</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(estadisticas.calidadConexion * 100)}%</div>
              <p className="text-xs text-muted-foreground">Señal</p>
            </CardContent>
          </Card>
        </div>

        {/* Error de conexión */}
        {connectionError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-700">
                <Bluetooth className="h-4 w-4" />
                <span className="font-medium">Error de Conexión:</span>
                <span>{connectionError}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pestañas principales */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="3d">Visualización 3D</TabsTrigger>
            <TabsTrigger value="charts">Gráficos</TabsTrigger>
            <TabsTrigger value="patterns">Patrones</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ConnectionStatus
                isConnected={isConnected}
                isConnecting={isConnecting}
                deviceName={deviceName}
                connectionError={connectionError}
                connectionQuality={connectionQuality}
                onConnect={connect}
                onDisconnect={disconnect}
              />
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Hand className="h-5 w-5" />
                    Estado de Sensores
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Sensor Mano:</span>
                    <Badge variant={cuaternionMano ? "default" : "secondary"}>
                      {cuaternionMano ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Sensor Dedo:</span>
                    <Badge variant={cuaternionDedo ? "default" : "secondary"}>
                      {cuaternionDedo ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Compensación:</span>
                    <Badge variant={cuaternionDedoCompensado ? "default" : "secondary"}>
                      {cuaternionDedoCompensado ? "Activa" : "Inactiva"}
                    </Badge>
                  </div>
                  {currentPattern && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-700">Patrón Actual:</p>
                      <p className="text-sm text-blue-600">{currentPattern.type}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="3d" className="space-y-4">
            <Visualizacion3DTiempoReal
              cuaternionMano={cuaternionMano}
              cuaternionDedo={cuaternionDedo}
              onResetear={resetearFiltros}
            />
          </TabsContent>

          <TabsContent value="charts" className="space-y-4">
            <DualMotionCharts handData={handData} fingerData={fingerData} compensatedData={compensatedFingerData} />
          </TabsContent>

          <TabsContent value="patterns" className="space-y-4">
            <PatternAnalysis patterns={patterns} currentPattern={currentPattern} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
