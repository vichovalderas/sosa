"use client"

import { useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Activity, Hand, Bluetooth } from "lucide-react"
import SimpleMotionCharts from "@/components/simple-motion-charts"
import ConnectionStatus from "@/components/connection-status"
import Header from "@/components/header"
import { useBLEConnection } from "@/hooks/use-ble-connection"
import { useMotionData } from "@/hooks/use-motion-data"

export default function MPU6050HandTracker() {
  const { handData, fingerData, stats, addData, clearData } = useMotionData()

  const handleDataReceived = useCallback(
    (data: any) => {
      console.log("Datos recibidos:", data)
      addData(data)
    },
    [addData],
  )

  const { isConnected, isConnecting, deviceName, connect, disconnect, connectionError, connectionQuality } =
    useBLEConnection(handleDataReceived)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-sm mx-auto md:max-w-7xl">
        <Header />

        <div className="px-4 pb-4 space-y-4">
          {/* Controles de conexión */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">Monitor de Sensores MPU6050</h2>
              <p className="text-sm text-gray-600">
                Estado: {isConnected ? "Conectado" : "Desconectado"} | Datos: {stats.totalSamples} | Frecuencia:{" "}
                {stats.frequency.toFixed(1)} Hz
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={clearData}>
                Limpiar
              </Button>
              {!isConnected ? (
                <Button onClick={connect} disabled={isConnecting}>
                  <Bluetooth className="w-4 h-4 mr-2" />
                  {isConnecting ? "Conectando..." : "Conectar"}
                </Button>
              ) : (
                <Button variant="destructive" onClick={disconnect}>
                  <Bluetooth className="w-4 h-4 mr-2" />
                  Desconectar
                </Button>
              )}
            </div>
          </div>

          {/* Error de conexión */}
          {connectionError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm">{connectionError}</p>
            </div>
          )}

          {/* Pestañas */}
          <Tabs defaultValue="charts" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 h-12">
              <TabsTrigger value="charts" className="flex items-center gap-2 text-sm">
                <Activity className="w-4 h-4" />
                Gráficos
              </TabsTrigger>
              <TabsTrigger value="connection" className="flex items-center gap-2 text-sm">
                <Hand className="w-4 h-4" />
                Conexión
              </TabsTrigger>
            </TabsList>

            <TabsContent value="charts">
              <SimpleMotionCharts handData={handData} fingerData={fingerData} stats={stats} />
            </TabsContent>

            <TabsContent value="connection">
              <ConnectionStatus
                isConnected={isConnected}
                isConnecting={isConnecting}
                deviceName={deviceName}
                onConnect={connect}
                onDisconnect={disconnect}
                error={connectionError}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
