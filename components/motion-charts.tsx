"use client"

import { Line, LineChart, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { MotionDataPoint } from "@/hooks/use-motion-data"

interface MotionChartsProps {
  data: MotionDataPoint[]
  isMobile?: boolean
}

export default function MotionCharts({ data, isMobile = false }: MotionChartsProps) {
  const maxPoints = isMobile ? 30 : 100
  const chartData = data.slice(-maxPoints).map((point, index) => ({
    time: index,
    ax: point.ax,
    ay: point.ay,
    az: point.az,
    gx: point.gx,
    gy: point.gy,
    gz: point.gz,
  }))

  const chartHeight = isMobile ? 180 : 300

  // Último dato disponible (puede ser undefined si aún no hay datos)
  const latest = data.length ? data[data.length - 1] : undefined

  // Helper seguro: evita llamar a toFixed sobre undefined
  const f2 = (v: number | undefined) => (typeof v === "number" ? v.toFixed(2) : "—")

  if (isMobile) {
    return (
      <div className="space-y-4">
        {/* Acelerómetro */}
        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              Acelerómetro
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ChartContainer
              config={{
                ax: { label: "X", color: "#dc2626" }, // red-500
                ay: { label: "Y", color: "#16a34a" }, // green-500
                az: { label: "Z", color: "#2563eb" }, // blue-500
              }}
            >
              <ChartTooltip>
                <ChartTooltipContent>
                  <p className="font-bold">
                    Acelerómetro en el tiempo: <span className="text-sky-400">{new Date().toLocaleTimeString()}</span>
                  </p>
                  <ul className="list-disc pl-4">
                    <li>
                      Aceleración en X: <span className="text-red-500">{f2(latest?.ax)}</span>
                    </li>
                    <li>
                      Aceleración en Y: <span className="text-green-500">{f2(latest?.ay)}</span>
                    </li>
                    <li>
                      Aceleración en Z: <span className="text-blue-500">{f2(latest?.az)}</span>
                    </li>
                  </ul>
                </ChartTooltipContent>
              </ChartTooltip>
              <ResponsiveContainer width="100%" height={chartHeight}>
                <LineChart data={chartData}>
                  <XAxis dataKey="time" hide />
                  <YAxis domain={[-10, 10]} hide />
                  <Line
                    type="monotone"
                    dataKey="ax"
                    stroke="#dc2626"
                    strokeWidth={2}
                    dot={false}
                    name="Aceleración X"
                  />
                  <Line
                    type="monotone"
                    dataKey="ay"
                    stroke="#16a34a"
                    strokeWidth={2}
                    dot={false}
                    name="Aceleración Y"
                  />
                  <Line
                    type="monotone"
                    dataKey="az"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={false}
                    name="Aceleración Z"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Giroscopio */}
        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              Giroscopio
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ChartContainer
              config={{
                gx: { label: "X", color: "#dc2626" }, // red-500
                gy: { label: "Y", color: "#16a34a" }, // green-500
                gz: { label: "Z", color: "#2563eb" }, // blue-500
              }}
            >
              <ChartTooltip>
                <ChartTooltipContent>
                  <p className="font-bold">
                    Giroscopio en el tiempo: <span className="text-sky-400">{new Date().toLocaleTimeString()}</span>
                  </p>
                  <ul className="list-disc pl-4">
                    <li>
                      Giroscopio en X: <span className="text-red-500">{f2(latest?.gx)}</span>
                    </li>
                    <li>
                      Giroscopio en Y: <span className="text-green-500">{f2(latest?.gy)}</span>
                    </li>
                    <li>
                      Giroscopio en Z: <span className="text-blue-500">{f2(latest?.gz)}</span>
                    </li>
                  </ul>
                </ChartTooltipContent>
              </ChartTooltip>
              <ResponsiveContainer width="100%" height={chartHeight}>
                <LineChart data={chartData}>
                  <XAxis dataKey="time" hide />
                  <YAxis domain={[-5, 5]} hide />
                  <Line type="monotone" dataKey="gx" stroke="#dc2626" strokeWidth={2} dot={false} name="Giroscopio X" />
                  <Line type="monotone" dataKey="gy" stroke="#16a34a" strokeWidth={2} dot={false} name="Giroscopio Y" />
                  <Line type="monotone" dataKey="gz" stroke="#2563eb" strokeWidth={2} dot={false} name="Giroscopio Z" />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Acelerómetro */}
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            Acelerómetro
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ChartContainer
            config={{
              ax: { label: "X", color: "#dc2626" }, // red-500
              ay: { label: "Y", color: "#16a34a" }, // green-500
              az: { label: "Z", color: "#2563eb" }, // blue-500
            }}
          >
            <ChartTooltip>
              <ChartTooltipContent>
                <p className="font-bold">
                  Acelerómetro en el tiempo: <span className="text-sky-400">{new Date().toLocaleTimeString()}</span>
                </p>
                <ul className="list-disc pl-4">
                  <li>
                    Aceleración en X: <span className="text-red-500">{f2(latest?.ax)}</span>
                  </li>
                  <li>
                    Aceleración en Y: <span className="text-green-500">{f2(latest?.ay)}</span>
                  </li>
                  <li>
                    Aceleración en Z: <span className="text-blue-500">{f2(latest?.az)}</span>
                  </li>
                </ul>
              </ChartTooltipContent>
            </ChartTooltip>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <LineChart data={chartData}>
                <XAxis dataKey="time" hide />
                <YAxis domain={[-10, 10]} hide />
                <Line type="monotone" dataKey="ax" stroke="#dc2626" strokeWidth={2} dot={false} name="Aceleración X" />
                <Line type="monotone" dataKey="ay" stroke="#16a34a" strokeWidth={2} dot={false} name="Aceleración Y" />
                <Line type="monotone" dataKey="az" stroke="#2563eb" strokeWidth={2} dot={false} name="Aceleración Z" />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Giroscopio */}
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            Giroscopio
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ChartContainer
            config={{
              gx: { label: "X", color: "#dc2626" }, // red-500
              gy: { label: "Y", color: "#16a34a" }, // green-500
              gz: { label: "Z", color: "#2563eb" }, // blue-500
            }}
          >
            <ChartTooltip>
              <ChartTooltipContent>
                <p className="font-bold">
                  Giroscopio en el tiempo: <span className="text-sky-400">{new Date().toLocaleTimeString()}</span>
                </p>
                <ul className="list-disc pl-4">
                  <li>
                    Giroscopio en X: <span className="text-red-500">{f2(latest?.gx)}</span>
                  </li>
                  <li>
                    Giroscopio en Y: <span className="text-green-500">{f2(latest?.gy)}</span>
                  </li>
                  <li>
                    Giroscopio en Z: <span className="text-blue-500">{f2(latest?.gz)}</span>
                  </li>
                </ul>
              </ChartTooltipContent>
            </ChartTooltip>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <LineChart data={chartData}>
                <XAxis dataKey="time" hide />
                <YAxis domain={[-5, 5]} hide />
                <Line type="monotone" dataKey="gx" stroke="#dc2626" strokeWidth={2} dot={false} name="Giroscopio X" />
                <Line type="monotone" dataKey="gy" stroke="#16a34a" strokeWidth={2} dot={false} name="Giroscopio Y" />
                <Line type="monotone" dataKey="gz" stroke="#2563eb" strokeWidth={2} dot={false} name="Giroscopio Z" />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
