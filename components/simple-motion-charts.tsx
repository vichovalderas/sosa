"use client"

import { Line, LineChart, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { MotionDataPoint } from "@/hooks/use-motion-data"

interface SimpleMotionChartsProps {
  handData: MotionDataPoint[]
  fingerData: MotionDataPoint[]
  stats: { frequency: number; totalSamples: number; lastUpdate: number }
}

export default function SimpleMotionCharts({ handData, fingerData, stats }: SimpleMotionChartsProps) {
  const maxPoints = 50

  // Preparar datos para gráficos
  const handChartData = handData.slice(-maxPoints).map((point, index) => ({
    time: index,
    ax: point.ax,
    ay: point.ay,
    az: point.az,
    gx: point.gx,
    gy: point.gy,
    gz: point.gz,
  }))

  const fingerChartData = fingerData.slice(-maxPoints).map((point, index) => ({
    time: index,
    ax: point.ax,
    ay: point.ay,
    az: point.az,
    gx: point.gx,
    gy: point.gy,
    gz: point.gz,
  }))

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Frecuencia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.frequency.toFixed(1)} Hz</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Muestras</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSamples}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={handData.length > 0 || fingerData.length > 0 ? "default" : "secondary"}>
              {handData.length > 0 || fingerData.length > 0 ? "Activo" : "Sin datos"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos de Mano */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Sensor de Mano
            <Badge variant="outline">{handData.length} puntos</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {handChartData.length > 0 ? (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-2">Acelerómetro</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={handChartData}>
                    <XAxis dataKey="time" hide />
                    <YAxis domain={[-10, 10]} hide />
                    <Line type="monotone" dataKey="ax" stroke="#dc2626" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="ay" stroke="#16a34a" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="az" stroke="#2563eb" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2">Giroscopio</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={handChartData}>
                    <XAxis dataKey="time" hide />
                    <YAxis domain={[-200, 200]} hide />
                    <Line type="monotone" dataKey="gx" stroke="#dc2626" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="gy" stroke="#16a34a" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="gz" stroke="#2563eb" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">Sin datos del sensor de mano</div>
          )}
        </CardContent>
      </Card>

      {/* Gráficos de Dedo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Sensor de Dedo
            <Badge variant="outline">{fingerData.length} puntos</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {fingerChartData.length > 0 ? (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-2">Acelerómetro</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={fingerChartData}>
                    <XAxis dataKey="time" hide />
                    <YAxis domain={[-10, 10]} hide />
                    <Line type="monotone" dataKey="ax" stroke="#dc2626" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="ay" stroke="#16a34a" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="az" stroke="#2563eb" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2">Giroscopio</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={fingerChartData}>
                    <XAxis dataKey="time" hide />
                    <YAxis domain={[-200, 200]} hide />
                    <Line type="monotone" dataKey="gx" stroke="#dc2626" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="gy" stroke="#16a34a" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="gz" stroke="#2563eb" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">Sin datos del sensor de dedo</div>
          )}
        </CardContent>
      </Card>

      {/* Datos en tiempo real */}
      {(handData.length > 0 || fingerData.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Datos en Tiempo Real</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-sm">
              {handData.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Mano (último dato):</h4>
                  <div className="space-y-1">
                    <div>AX: {handData[handData.length - 1]?.ax.toFixed(3)}</div>
                    <div>AY: {handData[handData.length - 1]?.ay.toFixed(3)}</div>
                    <div>AZ: {handData[handData.length - 1]?.az.toFixed(3)}</div>
                    <div>GX: {handData[handData.length - 1]?.gx.toFixed(1)}</div>
                    <div>GY: {handData[handData.length - 1]?.gy.toFixed(1)}</div>
                    <div>GZ: {handData[handData.length - 1]?.gz.toFixed(1)}</div>
                  </div>
                </div>
              )}

              {fingerData.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Dedo (último dato):</h4>
                  <div className="space-y-1">
                    <div>AX: {fingerData[fingerData.length - 1]?.ax.toFixed(3)}</div>
                    <div>AY: {fingerData[fingerData.length - 1]?.ay.toFixed(3)}</div>
                    <div>AZ: {fingerData[fingerData.length - 1]?.az.toFixed(3)}</div>
                    <div>GX: {fingerData[fingerData.length - 1]?.gx.toFixed(1)}</div>
                    <div>GY: {fingerData[fingerData.length - 1]?.gy.toFixed(1)}</div>
                    <div>GZ: {fingerData[fingerData.length - 1]?.gz.toFixed(1)}</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
