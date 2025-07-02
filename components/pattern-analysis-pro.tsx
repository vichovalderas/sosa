"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { DetectedPattern } from "@/hooks/use-pattern-detection"
import { Activity, Clock, Target } from "lucide-react"

interface GestureAnalysis {
  gesture_type: string
  confidence: number
  hand_contribution: number
  finger_contribution: number
}

interface PatternAnalysisProProps {
  patterns: DetectedPattern[]
  currentGesture: GestureAnalysis | null
}

export default function PatternAnalysisPro({ patterns, currentGesture }: PatternAnalysisProProps) {
  const patternStats = patterns.reduce(
    (acc, pattern) => {
      acc[pattern.name] = (acc[pattern.name] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const totalPatterns = patterns.length
  const uniquePatterns = Object.keys(patternStats).length
  const avgConfidence = patterns.length > 0 ? patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length : 0

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Current Gesture Analysis */}
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Current Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentGesture ? (
            <div className="space-y-4">
              <div className="text-center">
                <Badge variant="default" className="text-lg px-4 py-2 mb-3">
                  {currentGesture.gesture_type}
                </Badge>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Confidence</span>
                    <span className="font-mono">{(currentGesture.confidence * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={currentGesture.confidence * 100} className="h-2" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm font-semibold text-blue-700">Hand</div>
                  <div className="text-lg font-bold text-blue-600">
                    {(currentGesture.hand_contribution * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-sm font-semibold text-green-700">Finger</div>
                  <div className="text-lg font-bold text-green-600">
                    {(currentGesture.finger_contribution * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No gesture detected</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pattern Statistics */}
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center mb-6">
            <div>
              <div className="text-3xl font-bold text-blue-600">{totalPatterns}</div>
              <div className="text-sm text-gray-600">Total Patterns</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">{uniquePatterns}</div>
              <div className="text-sm text-gray-600">Unique Types</div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Average Confidence</span>
              <span className="font-mono text-sm">{(avgConfidence * 100).toFixed(1)}%</span>
            </div>
            <Progress value={avgConfidence * 100} className="h-2" />
          </div>

          {Object.keys(patternStats).length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="font-semibold text-sm">Most Frequent</h4>
              {Object.entries(patternStats)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([name, count]) => (
                  <div key={name} className="flex justify-between items-center">
                    <span className="text-sm truncate">{name}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pattern History */}
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Patterns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            {patterns.length > 0 ? (
              <div className="space-y-3">
                {patterns
                  .slice()
                  .reverse()
                  .slice(0, 10)
                  .map((pattern) => (
                    <div key={pattern.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div>
                          <Badge variant="outline" className="text-xs">
                            {pattern.name}
                          </Badge>
                          <div className="text-xs text-gray-600 mt-1">
                            {new Date(pattern.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{(pattern.confidence * 100).toFixed(1)}%</div>
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
                <p>No patterns detected yet</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
