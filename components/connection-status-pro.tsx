"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bluetooth, BluetoothConnected, Wifi, WifiOff, Circle } from "lucide-react"
import type { MotionDataPoint, CompensatedFingerData } from "@/hooks/use-motion-data"

interface ConnectionStatusProProps {
  isConnected: boolean
  isConnecting: boolean
  deviceName: string | null
  onConnect: () => void
  onDisconnect: () => void
  currentHandData: MotionDataPoint | null
  currentFingerData: MotionDataPoint | null
  currentCompensatedFingerData: CompensatedFingerData | null
  dataRate: number
  lastUpdateTime: number
  isRecording?: boolean
  sessionId?: string | null
}

export default function ConnectionStatusPro({
  isConnected,
  isConnecting,
  deviceName,
  onConnect,
  onDisconnect,
  currentHandData,
  currentFingerData,
  currentCompensatedFingerData,
  dataRate,
  lastUpdateTime,
  isRecording = false,
  sessionId = null,
}: ConnectionStatusProProps) {
  const timeSinceLastUpdate = lastUpdateTime ? Date.now() - lastUpdateTime : 0
  const isDataStale = timeSinceLastUpdate > 2000

  return (
    <Card className="shadow-xl border-0 bg-gradient-to-r from-slate-900 to-blue-900 text-white">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Connection Status */}
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isConnected ? "bg-green-500/20 border-2 border-green-400" : "bg-gray-500/20 border-2 border-gray-400"
              }`}
            >
              {isConnected ? (
                <BluetoothConnected className="w-6 h-6 text-green-400" />
              ) : (
                <Bluetooth className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={isConnected ? "default" : "secondary"} className="text-xs">
                  {isConnected ? "Connected" : "Disconnected"}
                </Badge>
                {isRecording && (
                  <Badge variant="destructive" className="text-xs animate-pulse">
                    <Circle className="w-2 h-2 mr-1 fill-current" />
                    REC
                  </Badge>
                )}
              </div>
              {deviceName && <div className="text-sm text-gray-300">{deviceName}</div>}
              <Button
                onClick={isConnected ? onDisconnect : onConnect}
                disabled={isConnecting}
                variant={isConnected ? "destructive" : "default"}
                size="sm"
                className="mt-2"
              >
                {isConnecting ? "Connecting..." : isConnected ? "Disconnect" : "Connect"}
              </Button>
            </div>
          </div>

          {/* Data Rate & Quality */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {isDataStale ? (
                  <WifiOff className="w-4 h-4 text-red-400" />
                ) : (
                  <Wifi className="w-4 h-4 text-green-400" />
                )}
                <span className="text-sm font-medium">Data Stream</span>
              </div>
              <div className="text-2xl font-bold">{dataRate} Hz</div>
              <div className="text-xs text-gray-400">
                Last update: {lastUpdateTime ? `${Math.round(timeSinceLastUpdate / 1000)}s ago` : "Never"}
              </div>
            </div>
          </div>

          {/* Sensor Status */}
          <div className="space-y-3">
            <div className="text-sm font-medium mb-2">Sensor Status</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs">Hand Sensor</span>
                <Badge variant={currentHandData ? "default" : "secondary"} className="text-xs">
                  {currentHandData ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs">Finger Sensor</span>
                <Badge variant={currentFingerData ? "default" : "secondary"} className="text-xs">
                  {currentFingerData ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs">Compensation</span>
                <Badge variant={currentCompensatedFingerData ? "default" : "secondary"} className="text-xs">
                  {currentCompensatedFingerData ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Session Info */}
          <div className="space-y-3">
            <div className="text-sm font-medium mb-2">Session</div>
            {isRecording && sessionId ? (
              <div className="space-y-2">
                <div className="text-xs text-gray-400">Recording Session</div>
                <div className="text-sm font-mono bg-black/20 px-2 py-1 rounded">{sessionId.slice(-8)}</div>
                <div className="text-xs text-green-400">● Recording active</div>
              </div>
            ) : (
              <div className="text-xs text-gray-400">No active session</div>
            )}
          </div>
        </div>

        {/* Real-time Data Preview */}
        {(currentHandData || currentCompensatedFingerData) && (
          <div className="mt-6 pt-6 border-t border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {currentHandData && (
                <div>
                  <div className="text-sm font-medium text-blue-400 mb-2">Hand Sensor</div>
                  <div className="grid grid-cols-6 gap-2">
                    {[
                      { label: "AX", value: currentHandData.ax, color: "red" },
                      { label: "AY", value: currentHandData.ay, color: "green" },
                      { label: "AZ", value: currentHandData.az, color: "blue" },
                      { label: "GX", value: currentHandData.gx, color: "purple" },
                      { label: "GY", value: currentHandData.gy, color: "orange" },
                      { label: "GZ", value: currentHandData.gz, color: "pink" },
                    ].map((item) => (
                      <div key={`hand-${item.label}`} className="text-center p-2 bg-blue-500/10 rounded">
                        <div className="text-xs font-semibold text-blue-400">{item.label}</div>
                        <div className="text-xs font-mono">{item.value.toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentCompensatedFingerData && (
                <div>
                  <div className="text-sm font-medium text-amber-400 mb-2">Compensated Finger</div>
                  <div className="grid grid-cols-6 gap-2">
                    {[
                      { label: "AX", value: currentCompensatedFingerData.compensated_ax },
                      { label: "AY", value: currentCompensatedFingerData.compensated_ay },
                      { label: "AZ", value: currentCompensatedFingerData.compensated_az },
                      { label: "GX", value: currentCompensatedFingerData.compensated_gx },
                      { label: "GY", value: currentCompensatedFingerData.compensated_gy },
                      { label: "GZ", value: currentCompensatedFingerData.compensated_gz },
                    ].map((item) => (
                      <div key={`comp-${item.label}`} className="text-center p-2 bg-amber-500/10 rounded">
                        <div className="text-xs font-semibold text-amber-400">{item.label}</div>
                        <div className="text-xs font-mono">{item.value.toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
