"use client"
import { Loader2, HandIcon, Eye, EyeOff } from "lucide-react"  
interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  showText?: boolean
}

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl",
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Tu logo personalizado - reemplaza la ruta con tu imagen */}
      <div
        className={`${sizeClasses[size]} bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center overflow-hidden leading-[1.75remd]`}
      >

          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
            <HandIcon className="w-8 h-8 text-white" />
          </div>
      </div>
      }

      {showText && (
        <div className="flex flex-col">
          <h1 className={`font-bold text-gray-900 ${textSizeClasses[size]}`}>SOSA</h1>
          
        </div>
      )}
    </div>
  )
}
