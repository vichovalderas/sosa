"use client"

import { Line, LineChart, XAxis, YAxis, ResponsiveContainer, Area, AreaChart } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import type { MotionDataPoint, CompensatedFingerData } from "@/hooks/use-motion-data"

interface AdvancedMotionChartsProps {
  handData: MotionDataPoint[]
  fingerData: MotionDataPoint[]
  compensatedFingerData: CompensatedFingerData[]
}

export default function AdvancedMotionCharts({
  handData,
  fingerData,
  compensatedFingerData,
}: AdvancedMotionChartsProps) {
  const maxPoints = 200
  const chartHeight = 300

  // Preparar datos combinados para análisis
  const combinedData = handData.slice(-maxPoints).map((handPoint, index) => {
    const fingerPoint = fingerData[index] || { ax: 0, ay: 0, az: 0, gx: 0, gy: 0, gz: 0 }
    const compensatedPoint = compensatedFingerData[index] || {
      compensated_ax: 0,
      compensated_ay: 0,
      compensated_az: 0,
      compensated_gx: 0,
      compensated_gy: 0,
      compensated_gz: 0,
    }

    return {
      time: index,
      // Hand data
      hand_ax: handPoint.ax,
      hand_ay: handPoint.ay,
      hand_az: handPoint.az,
      hand_gx: handPoint.gx,
      hand_gy: handPoint.gy,
      hand_gz: handPoint.gz,
      // Raw finger data
      finger_ax: fingerPoint.ax,
      finger_ay: fingerPoint.ay,
      finger_az: fingerPoint.az,
      finger_gx: fingerPoint.gx,
      finger_gy: fingerPoint.gy,
      finger_gz: fingerPoint.gz,
      // Compensated finger data
      comp_ax: compensatedPoint.compensated_ax,
      comp_ay: compensatedPoint.compensated_ay,
      comp_az: compensatedPoint.compensated_az,
      comp_gx: compensatedPoint.compensated_gx,
      comp_gy: compensatedPoint.compensated_gy,
      comp_gz: compensatedPoint.compensated_gz,
      // Magnitudes
      hand_magnitude: Math.sqrt(handPoint.ax ** 2 + handPoint.ay ** 2 + handPoint.az ** 2),
      finger_magnitude: Math.sqrt(fingerPoint.ax ** 2 + fingerPoint.ay ** 2 + fingerPoint.az ** 2),
      compensated_magnitude: Math.sqrt(
        compensatedPoint.compensated_ax ** 2 +
          compensatedPoint.compensated_ay ** 2 +
          compensatedPoint.compensated_az ** 2,
      ),
    }
  })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Acceleration Comparison */}
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            Acceleration Analysis
            <Badge variant="outline" className="text-xs">
              {combinedData.length} samples
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              hand_magnitude: { label: "Hand", color: "#3b82f6" },
              finger_magnitude: { label: "Finger (Raw)", color: "#10b981" },
              compensated_magnitude: { label: "Finger (Compensated)", color: "#f59e0b" },
            }}
          >
            <ChartTooltip>
              <ChartTooltipContent>
                <div className="space-y-1">
                  <p className="font-bold">Acceleration Magnitudes</p>
                  <div className="grid grid-cols-1 gap-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-blue-600">Hand:</span>
                      <span>{combinedData[combinedData.length - 1]?.hand_magnitude.toFixed(3)}g</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-600">Finger (Raw):</span>
                      <span>{combinedData[combinedData.length - 1]?.finger_magnitude.toFixed(3)}g</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-600">Finger (Comp):</span>
                      <span>{combinedData[combinedData.length - 1]?.compensated_magnitude.toFixed(3)}g</span>
                    </div>
                  </div>
                </div>
              </ChartTooltipContent>
            </ChartTooltip>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <AreaChart data={combinedData}>
                <XAxis dataKey="time" hide />
                <YAxis domain={[0, 10]} hide />
                <Area
                  type="monotone"
                  dataKey="hand_magnitude"
                  stackId="1"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                />
                <Area
                  type="monotone"
                  dataKey="compensated_magnitude"
                  stackId="2"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  fillOpacity={0.5}
                />
                <Line type="monotone" dataKey="finger_magnitude" stroke="#10b981" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Gyroscope Analysis */}
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Gyroscope Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              hand_gx: { label: "Hand X", color: "#ef4444" },
              hand_gy: { label: "Hand Y", color: "#10b981" },
              hand_gz: { label: "Hand Z", color: "#3b82f6" },
              comp_gx: { label: "Finger X", color: "#f97316" },
              comp_gy: { label: "Finger Y", color: "#84cc16" },
              comp_gz: { label: "Finger Z", color: "#06b6d4" },
            }}
          >
            <ResponsiveContainer width="100%" height={chartHeight}>
              <LineChart data={combinedData}>
                <XAxis dataKey="time" hide />
                <YAxis domain={[-200, 200]} hide />
                {/* Hand gyro */}
                <Line
                  type="monotone"
                  dataKey="hand_gx"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                  strokeOpacity={0.8}
                />
                <Line
                  type="monotone"
                  dataKey="hand_gy"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  strokeOpacity={0.8}
                />
                <Line
                  type="monotone"
                  dataKey="hand_gz"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  strokeOpacity={0.8}
                />
                {/* Compensated finger gyro */}
                <Line
                  type="monotone"
                  dataKey="comp_gx"
                  stroke="#f97316"
                  strokeWidth={1}
                  dot={false}
                  strokeDasharray="5 5"
                />
                <Line
                  type="monotone"
                  dataKey="comp_gy"
                  stroke="#84cc16"
                  strokeWidth={1}
                  dot={false}
                  strokeDasharray="5 5"
                />
                <Line
                  type="monotone"
                  dataKey="comp_gz"
                  stroke="#06b6d4"
                  strokeWidth={1}
                  dot={false}
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* 3D Trajectory Visualization */}
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">3D Motion Trajectory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* XY Plane */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">XY Plane (Top View)</h4>
              <ChartContainer
                config={{
                  hand_ax: { label: "Hand", color: "#3b82f6" },
                  comp_ax: { label: "Finger", color: "#f59e0b" },
                }}
              >
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={combinedData}>
                    <XAxis dataKey="hand_ax" domain={[-5, 5]} hide />
                    <YAxis dataKey="hand_ay" domain={[-5, 5]} hide />
                    <Line type="monotone" dataKey="hand_ay" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="comp_ay" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            {/* XZ Plane */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">XZ Plane (Front View)</h4>
              <ChartContainer
                config={{
                  hand_ax: { label: "Hand", color: "#3b82f6" },
                  comp_ax: { label: "Finger", color: "#f59e0b" },
                }}
              >
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={combinedData}>
                    <XAxis dataKey="hand_ax" domain={[-5, 5]} hide />
                    <YAxis dataKey="hand_az" domain={[-5, 5]} hide />
                    <Line type="monotone" dataKey="hand_az" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="comp_az" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            {/* YZ Plane */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">YZ Plane (Side View)</h4>
              <ChartContainer
                config={{
                  hand_ay: { label: "Hand", color: "#3b82f6" },
                  comp_ay: { label: "Finger", color: "#f59e0b" },
                }}
              >
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={combinedData}>
                    <XAxis dataKey="hand_ay" domain={[-5, 5]} hide />
                    <YAxis dataKey="hand_az" domain={[-5, 5]} hide />
                    <Line type="monotone" dataKey="hand_az" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="comp_az" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
