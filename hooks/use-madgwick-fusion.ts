"use client"

import { useState, useCallback, useRef } from "react"
import type { MotionDataPoint, CompensatedFingerData } from "@/hooks/use-motion-data"

export interface DatosCuaternion {
  q0: number // w
  q1: number // x
  q2: number // y
  q3: number // z
  timestamp: number
}

// Implementación del filtro Madgwick
class MadgwickFilter {
  private beta: number
  private q0 = 1.0
  private q1 = 0.0
  private q2 = 0.0
  private q3 = 0.0
  private lastUpdate = 0

  constructor(beta = 0.1) {
    this.beta = beta
  }

  update(gx: number, gy: number, gz: number, ax: number, ay: number, az: number): void {
    const now = Date.now()
    let dt = 0.01 // 100Hz por defecto

    if (this.lastUpdate > 0) {
      dt = (now - this.lastUpdate) / 1000.0
      dt = Math.max(0.001, Math.min(0.1, dt)) // Limitar dt entre 1ms y 100ms
    }
    this.lastUpdate = now

    // Normalizar acelerómetro
    const norm = Math.sqrt(ax * ax + ay * ay + az * az)
    if (norm === 0) return

    ax /= norm
    ay /= norm
    az /= norm

    // Estimación del gradiente (función objetivo y Jacobiano)
    const f1 = 2 * (this.q1 * this.q3 - this.q0 * this.q2) - ax
    const f2 = 2 * (this.q0 * this.q1 + this.q2 * this.q3) - ay
    const f3 = 2 * (0.5 - this.q1 * this.q1 - this.q2 * this.q2) - az

    const j11 = 2 * this.q2
    const j12 = 2 * this.q3
    const j13 = 2 * this.q0
    const j14 = 2 * this.q1
    const j21 = -2 * this.q1
    const j22 = 2 * this.q0
    const j23 = -2 * this.q3
    const j24 = 2 * this.q2
    const j31 = 0
    const j32 = -4 * this.q1
    const j33 = -4 * this.q2
    const j34 = 0

    let step1 = j11 * f1 + j21 * f2 + j31 * f3
    let step2 = j12 * f1 + j22 * f2 + j32 * f3
    let step3 = j13 * f1 + j23 * f2 + j33 * f3
    let step4 = j14 * f1 + j24 * f2 + j34 * f3

    // Normalizar gradiente
    const stepNorm = Math.sqrt(step1 * step1 + step2 * step2 + step3 * step3 + step4 * step4)
    if (stepNorm > 0) {
      step1 /= stepNorm
      step2 /= stepNorm
      step3 /= stepNorm
      step4 /= stepNorm
    }

    // Integrar giroscopio
    let qDot1 = 0.5 * (-this.q1 * gx - this.q2 * gy - this.q3 * gz)
    let qDot2 = 0.5 * (this.q0 * gx + this.q2 * gz - this.q3 * gy)
    let qDot3 = 0.5 * (this.q0 * gy - this.q1 * gz + this.q3 * gx)
    let qDot4 = 0.5 * (this.q0 * gz + this.q1 * gy - this.q2 * gx)

    // Aplicar corrección del acelerómetro
    qDot1 -= this.beta * step1
    qDot2 -= this.beta * step2
    qDot3 -= this.beta * step3
    qDot4 -= this.beta * step4

    // Integrar para obtener cuaternión
    this.q0 += qDot1 * dt
    this.q1 += qDot2 * dt
    this.q2 += qDot3 * dt
    this.q3 += qDot4 * dt

    // Normalizar cuaternión
    const qNorm = Math.sqrt(this.q0 * this.q0 + this.q1 * this.q1 + this.q2 * this.q2 + this.q3 * this.q3)
    this.q0 /= qNorm
    this.q1 /= qNorm
    this.q2 /= qNorm
    this.q3 /= qNorm
  }

  getQuaternion(): { w: number; x: number; y: number; z: number } {
    return {
      w: this.q0,
      x: this.q1,
      y: this.q2,
      z: this.q3,
    }
  }

  reset(): void {
    this.q0 = 1.0
    this.q1 = 0.0
    this.q2 = 0.0
    this.q3 = 0.0
    this.lastUpdate = 0
  }
}

interface DatosFusionados {
  mano: DatosCuaternion | null
  dedo: DatosCuaternion | null
  dedoCompensado: DatosCuaternion | null
}

export function useMadgwickFusion() {
  const [datosFusionados, setDatosFusionados] = useState<DatosFusionados>({
    mano: null,
    dedo: null,
    dedoCompensado: null,
  })

  // Filtros Madgwick separados para cada sensor
  const filtroManoRef = useRef<MadgwickFilter>(new MadgwickFilter(0.1))
  const filtroDedoRef = useRef<MadgwickFilter>(new MadgwickFilter(0.1))
  const filtroDedoCompensadoRef = useRef<MadgwickFilter>(new MadgwickFilter(0.1))

  const procesarDatosMano = useCallback((datos: MotionDataPoint) => {
    if (!datos) return

    try {
      // Convertir grados/segundo a radianes/segundo
      const gxRad = (datos.gx * Math.PI) / 180
      const gyRad = (datos.gy * Math.PI) / 180
      const gzRad = (datos.gz * Math.PI) / 180

      // Actualizar filtro Madgwick
      filtroManoRef.current.update(gxRad, gyRad, gzRad, datos.ax, datos.ay, datos.az)

      // Obtener cuaternión
      const quaternion = filtroManoRef.current.getQuaternion()

      const cuaternionMano: DatosCuaternion = {
        q0: quaternion.w,
        q1: quaternion.x,
        q2: quaternion.y,
        q3: quaternion.z,
        timestamp: datos.timestamp,
      }

      setDatosFusionados((prev) => ({
        ...prev,
        mano: cuaternionMano,
      }))

      console.log("Cuaternión mano actualizado:", cuaternionMano) // Debug
    } catch (error) {
      console.error("Error procesando datos de mano:", error)
    }
  }, [])

  const procesarDatosDedo = useCallback((datos: MotionDataPoint) => {
    if (!datos) return

    try {
      // Convertir grados/segundo a radianes/segundo
      const gxRad = (datos.gx * Math.PI) / 180
      const gyRad = (datos.gy * Math.PI) / 180
      const gzRad = (datos.gz * Math.PI) / 180

      // Actualizar filtro Madgwick
      filtroDedoRef.current.update(gxRad, gyRad, gzRad, datos.ax, datos.ay, datos.az)

      // Obtener cuaternión
      const quaternion = filtroDedoRef.current.getQuaternion()

      const cuaternionDedo: DatosCuaternion = {
        q0: quaternion.w,
        q1: quaternion.x,
        q2: quaternion.y,
        q3: quaternion.z,
        timestamp: datos.timestamp,
      }

      setDatosFusionados((prev) => ({
        ...prev,
        dedo: cuaternionDedo,
      }))

      console.log("Cuaternión dedo actualizado:", cuaternionDedo) // Debug
    } catch (error) {
      console.error("Error procesando datos de dedo:", error)
    }
  }, [])

  const procesarDatosDedoCompensado = useCallback((datos: CompensatedFingerData) => {
    if (!datos) return

    try {
      // Convertir grados/segundo a radianes/segundo
      const gxRad = (datos.compensated_gx * Math.PI) / 180
      const gyRad = (datos.compensated_gy * Math.PI) / 180
      const gzRad = (datos.compensated_gz * Math.PI) / 180

      // Actualizar filtro Madgwick
      filtroDedoCompensadoRef.current.update(
        gxRad,
        gyRad,
        gzRad,
        datos.compensated_ax,
        datos.compensated_ay,
        datos.compensated_az,
      )

      // Obtener cuaternión
      const quaternion = filtroDedoCompensadoRef.current.getQuaternion()

      const cuaternionDedoCompensado: DatosCuaternion = {
        q0: quaternion.w,
        q1: quaternion.x,
        q2: quaternion.y,
        q3: quaternion.z,
        timestamp: datos.timestamp,
      }

      setDatosFusionados((prev) => ({
        ...prev,
        dedoCompensado: cuaternionDedoCompensado,
      }))

      console.log("Cuaternión dedo compensado actualizado:", cuaternionDedoCompensado) // Debug
    } catch (error) {
      console.error("Error procesando datos de dedo compensado:", error)
    }
  }, [])

  const resetearFiltros = useCallback(() => {
    filtroManoRef.current.reset()
    filtroDedoRef.current.reset()
    filtroDedoCompensadoRef.current.reset()

    setDatosFusionados({
      mano: null,
      dedo: null,
      dedoCompensado: null,
    })

    console.log("Filtros Madgwick reseteados") // Debug
  }, [])

  return {
    datosFusionados,
    cuaternionMano: datosFusionados.mano,
    cuaternionDedo: datosFusionados.dedo,
    cuaternionDedoCompensado: datosFusionados.dedoCompensado,
    procesarDatosMano,
    procesarDatosDedo,
    procesarDatosDedoCompensado,
    resetearFiltros,
  }
}
