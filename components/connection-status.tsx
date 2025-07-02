"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Bluetooth, BluetoothConnected, AlertCircle, CheckCircle } from "lucide-react"

interface ConnectionStatusProps {
  isConnected: boolean
  isConnecting: boolean
  deviceName: string | null
  onConnect: () => void
  onDisconnect: () => void
  error?: string | null
}

export default function ConnectionStatus({
  isConnected,
  isConnecting,
  deviceName,
  onConnect,
  onDisconnect,
  error,
}: ConnectionStatusProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isConnected ? (
            <BluetoothConnected className="h-5 w-5 text-green-600" />
          ) : (
            <Bluetooth className="h-5 w-5 text-gray-400" />
          )}
          Estado de Conexión Bluetooth
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant={isConnected ? "default" : "secondary"}>
                {isConnected ? "Conectado" : "Desconectado"}
              </Badge>
              {deviceName && <span className="text-sm text-gray-600">{deviceName}</span>}
            </div>
            {isConnected && (
              <div className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                Recibiendo datos de sensores
              </div>
            )}
          </div>
          <Button
            onClick={isConnected ? onDisconnect : onConnect}
            disabled={isConnecting}
            variant={isConnected ? "destructive" : "default"}
          >
            {isConnecting ? "Conectando..." : isConnected ? "Desconectar" : "Conectar"}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!isConnected && !error && (
          <div className="text-sm text-gray-600">
            <p>Para conectar tus sensores MPU6050:</p>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Asegúrate de que el ESP32 esté encendido</li>
              <li>Verifica que el Bluetooth esté habilitado</li>
              <li>Haz clic en "Conectar" y selecciona tu dispositivo</li>
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
