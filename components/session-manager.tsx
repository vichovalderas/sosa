"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Square, Save, Download } from "lucide-react"

interface SessionManagerProps {
  isRecording: boolean
  currentSession: string | null
  onStartSession: () => void
  onStopSession: () => void
}

export default function SessionManager({
  isRecording,
  currentSession,
  onStartSession,
  onStopSession,
}: SessionManagerProps) {
  return (
    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Session Manager</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recording Controls */}
        <div className="space-y-3">
          {!isRecording ? (
            <Button onClick={onStartSession} className="w-full" size="sm">
              <Play className="w-4 h-4 mr-2" />
              Start Recording
            </Button>
          ) : (
            <Button onClick={onStopSession} variant="destructive" className="w-full" size="sm">
              <Square className="w-4 h-4 mr-2" />
              Stop Recording
            </Button>
          )}
        </div>

        {/* Session Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Status</span>
            <Badge variant={isRecording ? "default" : "secondary"} className="text-xs">
              {isRecording ? "Recording" : "Idle"}
            </Badge>
          </div>

          {currentSession && (
            <div className="flex items-center justify-between">
              <span className="text-sm">Session ID</span>
              <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{currentSession.slice(-8)}</span>
            </div>
          )}
        </div>

        {/* Session Actions */}
        <div className="space-y-2">
          <Button variant="outline" size="sm" className="w-full bg-transparent" disabled={!currentSession}>
            <Save className="w-4 h-4 mr-2" />
            Save Session
          </Button>
          <Button variant="outline" size="sm" className="w-full bg-transparent" disabled={!currentSession}>
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
