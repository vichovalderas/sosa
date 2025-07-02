"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { DetectedPattern } from "@/hooks/use-pattern-detection"
import { Activity, Clock, Target, TrendingUp } from "lucide-react"

interface GestureAnalysis {
  gesture_type: string
  confidence: number
  hand_contribution: number
  finger_contribution: number
}

interface PatternAnalysisProps {
  patterns: DetectedPattern[]
  currentGesture: GestureAnalysis | null
  isMobile?: boolean
}

export default function PatternAnalysis({ patterns, currentGesture, isMobile = false }: PatternAnalysisProps) {
  const patternStats = patterns?.reduce(
    (acc, pattern) => {
      acc[pattern.name] = (acc[pattern.name] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  ) || 0;

  const totalPatterns = patterns.length
  const uniquePatterns = Object.keys(patternStats).length

  if (isMobile) {
    return (
      <div className="space-y-4">
        {/* Estado Actual */}
        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Gesto Actual
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {currentGesture ? (
              <div className="text-center space-y-3">
                <Badge variant="default" className="text-sm px-3 py-1">
                  {currentGesture.gesture_type}
                </Badge>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Confianza</span>
                    <span>{(currentGesture.confidence * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={currentGesture.confidence * 100} className="h-2" />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                    <div className="font-semibold">Mano</div>
                    <div>{(currentGesture.hand_contribution * 100).toFixed(0)}%</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
                    <div className="font-semibold">Dedo</div>
                    <div>{(currentGesture.finger_contribution * 100).toFixed(0)}%</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Sin gesto detectado</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Estadísticas */}
        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Estadísticas
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-4 text-center mb-4">
              <div>
                <div className="text-xl font-bold text-blue-600">{totalPatterns}</div>
                <div className="text-xs text-gray-600">Total</div>
              </div>
              <div>
                <div className="text-xl font-bold text-green-600">{uniquePatterns}</div>
                <div className="text-xs text-gray-600">Únicos</div>
              </div>
            </div>

            {Object.keys(patternStats).length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Más Frecuentes</h4>
                {Object.entries(patternStats)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 3)
                  .map(([name, count]) => (
                    <div key={name} className="flex justify-between items-center">
                      <span className="text-xs truncate">{name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {count}
                      </Badge>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Historial compacto */}
        {patterns.length > 0 && (
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Historial Reciente
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ScrollArea className="h-32">
                <div className="space-y-1">
                  {patterns
                    .slice()
                    .reverse()
                    .slice(0, 5)
                    .map((pattern) => (
                      <div key={pattern.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <Badge variant="outline" className="text-xs">
                          {pattern.name}
                        </Badge>
                        <span className="text-xs text-gray-600">
                          {new Date(pattern.timestamp).toLocaleTimeString().slice(0, 5)}
                        </span>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // Vista desktop (similar pero con más espacio)
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Estado Actual
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentGesture ? (
            <div className="text-center space-y-4">
              <Badge variant="default" className="text-lg px-4 py-2">
                {currentGesture.gesture_type}
              </Badge>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Confianza</span>
                  <span>{(currentGesture.confidence * 100).toFixed(1)}%</span>
                </div>
                <Progress value={currentGesture.confidence * 100} className="h-2" />
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No se detecta ningún gesto</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Estadísticas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center mb-6">
            <div>
              <div className="text-2xl font-bold text-blue-600">{totalPatterns}</div>
              <div className="text-sm text-gray-600">Total Patrones</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{uniquePatterns}</div>
              <div className="text-sm text-gray-600">Tipos Únicos</div>
            </div>
          </div>

          {Object.keys(patternStats).length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Frecuencia por Tipo</h4>
              {Object.entries(patternStats)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([name, count]) => (
                  <div key={name} className="flex justify-between items-center">
                    <span className="text-sm">{name}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="md:col-span-2 shadow-lg border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Historial de Patrones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            {patterns.length > 0 ? (
              <div className="space-y-2">
                {patterns
                  .slice()
                  .reverse()
                  .map((pattern) => (
                    <div key={pattern.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{pattern.name}</Badge>
                        <span className="text-sm text-gray-600">
                          {new Date(pattern.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{(pattern.confidence * 100).toFixed(1)}%</span>
                        <div className="w-16">
                          <Progress value={pattern.confidence * 100} className="h-1" />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No hay patrones detectados aún</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
