"use client"

import { Line, LineChart, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import type { MotionDataPoint } from "@/hooks/use-motion-data"

interface DualMotionChartsProps {
  handData: MotionDataPoint[]
  fingerData: MotionDataPoint[]
  isMobile?: boolean
}

export default function DualMotionCharts({ handData = [], fingerData = [], isMobile = false }: DualMotionChartsProps) {
  const maxPoints = isMobile ? 30 : 100
  const chartHeight = isMobile ? 160 : 250

  // Asegurar que los datos son arrays válidos
  const safeHandData = Array.isArray(handData) ? handData : []
  const safeFingerData = Array.isArray(fingerData) ? fingerData : []

  // Preparar datos para gráficos
  const handChartData = safeHandData.slice(-maxPoints).map((point, index) => ({
    time: index,
    ax: point.ax || 0,
    ay: point.ay || 0,
    az: point.az || 0,
    gx: point.gx || 0,
    gy: point.gy || 0,
    gz: point.gz || 0,
  }))

  const fingerChartData = safeFingerData.slice(-maxPoints).map((point, index) => ({
    time: index,
    ax: point.ax || 0,
    ay: point.ay || 0,
    az: point.az || 0,
    gx: point.gx || 0,
    gy: point.gy || 0,
    gz: point.gz || 0,
  }))

  // Últimos datos para tooltips
  const latestHand = safeHandData.length ? safeHandData[safeHandData.length - 1] : undefined
  const latestFinger = safeFingerData.length ? safeFingerData[safeFingerData.length - 1] : undefined

  const f2 = (v: number | undefined) => (typeof v === "number" ? v.toFixed(2) : "—")

  if (isMobile) {
    return (
      <div className="space-y-4">
        {/* Sensor de Mano */}
        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm dark:bg-gray-900/90">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <div className="flex items-center gap-2">
                Sensor de Mano
                <Badge variant={safeHandData.length > 0 ? "default" : "secondary"} className="text-xs">
                  {safeHandData.length} pts
                </Badge>
              </div>
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {handChartData.length > 0 ? (
              <div className="space-y-3">
                {/* Acelerómetro Mano */}
                <div>
                  <h4 className="text-xs font-semibold mb-1">Acelerómetro</h4>
                  <ChartContainer
                    config={{
                      ax: { label: "X", color: "#dc2626" },
                      ay: { label: "Y", color: "#16a34a" },
                      az: { label: "Z", color: "#2563eb" },
                    }}
                  >
                    <ResponsiveContainer width="100%" height={chartHeight}>
                      <LineChart data={handChartData}>
                        <XAxis dataKey="time" hide />
                        <YAxis domain={[-10, 10]} hide />
                        <Line type="monotone" dataKey="ax" stroke="#dc2626" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="ay" stroke="#16a34a" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="az" stroke="#2563eb" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>

                {/* Giroscopio Mano */}
                <div>
                  <h4 className="text-xs font-semibold mb-1">Giroscopio</h4>
                  <ChartContainer
                    config={{
                      gx: { label: "X", color: "#dc2626" },
                      gy: { label: "Y", color: "#16a34a" },
                      gz: { label: "Z", color: "#2563eb" },
                    }}
                  >
                    <ResponsiveContainer width="100%" height={chartHeight}>
                      <LineChart data={handChartData}>
                        <XAxis dataKey="time" hide />
                        <YAxis domain={[-200, 200]} hide />
                        <Line type="monotone" dataKey="gx" stroke="#dc2626" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="gy" stroke="#16a34a" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="gz" stroke="#2563eb" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <div className="text-sm">Sin datos del sensor de mano</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sensor de Dedo */}
        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm dark:bg-gray-900/90">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <div className="flex items-center gap-2">
                Sensor de Dedo
                <Badge variant={safeFingerData.length > 0 ? "default" : "secondary"} className="text-xs">
                  {safeFingerData.length} pts
                </Badge>
              </div>
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {fingerChartData.length > 0 ? (
              <div className="space-y-3">
                {/* Acelerómetro Dedo */}
                <div>
                  <h4 className="text-xs font-semibold mb-1">Acelerómetro</h4>
                  <ChartContainer
                    config={{
                      ax: { label: "X", color: "#dc2626" },
                      ay: { label: "Y", color: "#16a34a" },
                      az: { label: "Z", color: "#2563eb" },
                    }}
                  >
                    <ResponsiveContainer width="100%" height={chartHeight}>
                      <LineChart data={fingerChartData}>
                        <XAxis dataKey="time" hide />
                        <YAxis domain={[-10, 10]} hide />
                        <Line type="monotone" dataKey="ax" stroke="#dc2626" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="ay" stroke="#16a34a" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="az" stroke="#2563eb" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>

                {/* Giroscopio Dedo */}
                <div>
                  <h4 className="text-xs font-semibold mb-1">Giroscopio</h4>
                  <ChartContainer
                    config={{
                      gx: { label: "X", color: "#dc2626" },
                      gy: { label: "Y", color: "#16a34a" },
                      gz: { label: "Z", color: "#2563eb" },
                    }}
                  >
                    <ResponsiveContainer width="100%" height={chartHeight}>
                      <LineChart data={fingerChartData}>
                        <XAxis dataKey="time" hide />
                        <YAxis domain={[-200, 200]} hide />
                        <Line type="monotone" dataKey="gx" stroke="#dc2626" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="gy" stroke="#16a34a" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="gz" stroke="#2563eb" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <div className="text-sm">Sin datos del sensor de dedo</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Vista desktop - lado a lado
  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Sensor de Mano - Desktop */}
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm dark:bg-gray-900/90">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <div className="flex items-center gap-2">
              Sensor de Mano
              <Badge variant={safeHandData.length > 0 ? "default" : "secondary"} className="text-xs">
                {safeHandData.length} puntos
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {handChartData.length > 0 ? (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-2">Acelerómetro</h4>
                <ChartContainer
                  config={{
                    ax: { label: "X", color: "#dc2626" },
                    ay: { label: "Y", color: "#16a34a" },
                    az: { label: "Z", color: "#2563eb" },
                  }}
                >
                  <ChartTooltip>
                    <ChartTooltipContent>
                      <p className="font-bold">Mano - Acelerómetro</p>
                      <ul className="list-disc pl-4">
                        <li>
                          X: <span className="text-red-500">{f2(latestHand?.ax)}</span>
                        </li>
                        <li>
                          Y: <span className="text-green-500">{f2(latestHand?.ay)}</span>
                        </li>
                        <li>
                          Z: <span className="text-blue-500">{f2(latestHand?.az)}</span>
                        </li>
                      </ul>
                    </ChartTooltipContent>
                  </ChartTooltip>
                  <ResponsiveContainer width="100%" height={chartHeight}>
                    <LineChart data={handChartData}>
                      <XAxis dataKey="time" hide />
                      <YAxis domain={[-10, 10]} hide />
                      <Line type="monotone" dataKey="ax" stroke="#dc2626" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="ay" stroke="#16a34a" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="az" stroke="#2563eb" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2">Giroscopio</h4>
                <ChartContainer
                  config={{
                    gx: { label: "X", color: "#dc2626" },
                    gy: { label: "Y", color: "#16a34a" },
                    gz: { label: "Z", color: "#2563eb" },
                  }}
                >
                  <ChartTooltip>
                    <ChartTooltipContent>
                      <p className="font-bold">Mano - Giroscopio</p>
                      <ul className="list-disc pl-4">
                        <li>
                          X: <span className="text-red-500">{f2(latestHand?.gx)}</span>
                        </li>
                        <li>
                          Y: <span className="text-green-500">{f2(latestHand?.gy)}</span>
                        </li>
                        <li>
                          Z: <span className="text-blue-500">{f2(latestHand?.gz)}</span>
                        </li>
                      </ul>
                    </ChartTooltipContent>
                  </ChartTooltip>
                  <ResponsiveContainer width="100%" height={chartHeight}>
                    <LineChart data={handChartData}>
                      <XAxis dataKey="time" hide />
                      <YAxis domain={[-200, 200]} hide />
                      <Line type="monotone" dataKey="gx" stroke="#dc2626" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="gy" stroke="#16a34a" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="gz" stroke="#2563eb" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">
              <div>Sin datos del sensor de mano</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sensor de Dedo - Desktop */}
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm dark:bg-gray-900/90">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <div className="flex items-center gap-2">
              Sensor de Dedo
              <Badge variant={safeFingerData.length > 0 ? "default" : "secondary"} className="text-xs">
                {safeFingerData.length} puntos
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {fingerChartData.length > 0 ? (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-2">Acelerómetro</h4>
                <ChartContainer
                  config={{
                    ax: { label: "X", color: "#dc2626" },
                    ay: { label: "Y", color: "#16a34a" },
                    az: { label: "Z", color: "#2563eb" },
                  }}
                >
                  <ChartTooltip>
                    <ChartTooltipContent>
                      <p className="font-bold">Dedo - Acelerómetro</p>
                      <ul className="list-disc pl-4">
                        <li>
                          X: <span className="text-red-500">{f2(latestFinger?.ax)}</span>
                        </li>
                        <li>
                          Y: <span className="text-green-500">{f2(latestFinger?.ay)}</span>
                        </li>
                        <li>
                          Z: <span className="text-blue-500">{f2(latestFinger?.az)}</span>
                        </li>
                      </ul>
                    </ChartTooltipContent>
                  </ChartTooltip>
                  <ResponsiveContainer width="100%" height={chartHeight}>
                    <LineChart data={fingerChartData}>
                      <XAxis dataKey="time" hide />
                      <YAxis domain={[-10, 10]} hide />
                      <Line type="monotone" dataKey="ax" stroke="#dc2626" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="ay" stroke="#16a34a" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="az" stroke="#2563eb" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2">Giroscopio</h4>
                <ChartContainer
                  config={{
                    gx: { label: "X", color: "#dc2626" },
                    gy: { label: "Y", color: "#16a34a" },
                    gz: { label: "Z", color: "#2563eb" },
                  }}
                >
                  <ChartTooltip>
                    <ChartTooltipContent>
                      <p className="font-bold">Dedo - Giroscopio</p>
                      <ul className="list-disc pl-4">
                        <li>
                          X: <span className="text-red-500">{f2(latestFinger?.gx)}</span>
                        </li>
                        <li>
                          Y: <span className="text-green-500">{f2(latestFinger?.gy)}</span>
                        </li>
                        <li>
                          Z: <span className="text-blue-500">{f2(latestFinger?.gz)}</span>
                        </li>
                      </ul>
                    </ChartTooltipContent>
                  </ChartTooltip>
                  <ResponsiveContainer width="100%" height={chartHeight}>
                    <LineChart data={fingerChartData}>
                      <XAxis dataKey="time" hide />
                      <YAxis domain={[-200, 200]} hide />
                      <Line type="monotone" dataKey="gx" stroke="#dc2626" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="gy" stroke="#16a34a" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="gz" stroke="#2563eb" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">
              <div>Sin datos del sensor de dedo</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
