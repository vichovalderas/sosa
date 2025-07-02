// Script para simular datos del MPU6050 para pruebas
import { useMotionData } from "../hooks/use-motion-data"

function SimulateMPU6050DataComponent() {
  const { simulateData } = useMotionData()

  // Simular datos cada 50ms (20 Hz)
  setInterval(() => {
    simulateData()
  }, 50)

  console.log("Simulación de datos MPU6050 iniciada...")

  return null // Return null as this component does not render anything
}

// Ejecutar simulación
const simulateMPU6050Data = () => {
  SimulateMPU6050DataComponent()
}

simulateMPU6050Data()
