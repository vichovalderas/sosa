"use client"
import { Badge } from "@/components/ui/badge"
import { Activity, Smartphone } from "lucide-react"

export default function Header() {
  return (
    <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Motion Tracker</h1>
              <p className="text-xs text-gray-600">SOSA</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              <Smartphone className="w-3 h-3 mr-1" />
              50Hz
            </Badge>
          </div>
        </div>
      </div>
    </div>
  )
}
