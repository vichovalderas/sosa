"use client"

import { useState, useCallback, useRef } from "react"
import type { DualSensorData } from "@/hooks/use-motion-data"

interface BLEConnectionState {
  isConnected: boolean
  isConnecting: boolean
  deviceName: string | null
  connectionError: string | null
  connectionQuality: number
}

export function useBLEConnection(onDataReceived?: (data: DualSensorData) => void) {
  const [state, setState] = useState<BLEConnectionState>({
    isConnected: false,
    isConnecting: false,
    deviceName: null,
    connectionError: null,
    connectionQuality: 0,
  })

  const deviceRef = useRef<BluetoothDevice | null>(null)
  const characteristicRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null)

  const connect = useCallback(async () => {
    if (!navigator.bluetooth) {
      setState((prev) => ({
        ...prev,
        connectionError: "Bluetooth no está disponible en este navegador. Usa Chrome o Edge.",
      }))
      return
    }

    setState((prev) => ({ ...prev, isConnecting: true, connectionError: null }))

    try {
      // Solicitar dispositivo Bluetooth
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ name: "SOSA-Device" }, { namePrefix: "SOSA" }, { namePrefix: "ESP32" }],
        optionalServices: ["12345678-1234-1234-1234-123456789abc"],
      })

      deviceRef.current = device

      // Manejar desconexión
      device.addEventListener("gattserverdisconnected", () => {
        setState((prev) => ({
          ...prev,
          isConnected: false,
          connectionQuality: 0,
          connectionError: "Dispositivo desconectado",
        }))
      })

      // Conectar al servidor GATT
      const server = await device.gatt?.connect()
      if (!server) throw new Error("No se pudo conectar al servidor GATT")

      // Obtener el servicio
      const service = await server.getPrimaryService("12345678-1234-1234-1234-123456789abc")

      // Obtener la característica
      const characteristic = await service.getCharacteristic("87654321-4321-4321-4321-cba987654321")
      characteristicRef.current = characteristic

      // Configurar notificaciones
      await characteristic.startNotifications()

      characteristic.addEventListener("characteristicvaluechanged", (event) => {
        try {
          const value = (event.target as BluetoothRemoteGATTCharacteristic).value
          if (value) {
            const decoder = new TextDecoder()
            const jsonString = decoder.decode(value)

            console.log("Datos BLE recibidos:", jsonString) // Debug

            const parsedData = JSON.parse(jsonString)

            // Procesar datos duales
            const dualSensorData: DualSensorData = {
              systemTimestamp: Date.now(),
            }

            // Procesar datos de la mano con corrección de ejes CORREGIDA
            if (parsedData.hand || parsedData.mano) {
              const handData = parsedData.hand || parsedData.mano

              // Corrección de ejes: sensor rotado 90° horario
              // Sensor: +y adelante, +x derecha, +z arriba
              // Dispositivo: -x adelante, +y derecha, +z arriba
              // CORRECCIÓN: intercambiar Y y Z
              const ax_original = handData.accel?.x || handData.ax || 0
              const ay_original = handData.accel?.y || handData.ay || 0
              const az_original = handData.accel?.z || handData.az || 0
              const gx_original = handData.gyro?.x || handData.gx || 0
              const gy_original = handData.gyro?.y || handData.gy || 0
              const gz_original = handData.gyro?.z || handData.gz || 0

              dualSensorData.hand = {
                ax: -ay_original, // -y del sensor = -x del dispositivo (adelante)
                ay: az_original, // +z del sensor = +y del dispositivo (arriba) - CORREGIDO
                az: ax_original, // +x del sensor = +z del dispositivo (derecha) - CORREGIDO
                gx: -gy_original, // -y del sensor = -x del dispositivo (adelante)
                gy: gz_original, // +z del sensor = +y del dispositivo (arriba) - CORREGIDO
                gz: gx_original, // +x del sensor = +z del dispositivo (derecha) - CORREGIDO
                timestamp: handData.timestamp || Date.now(),
                sensorId: "hand",
                quality: 1.0,
              }
            }

            // Procesar datos del dedo con la misma corrección de ejes
            if (parsedData.finger || parsedData.dedo) {
              const fingerData = parsedData.finger || parsedData.dedo

              // Misma corrección de ejes que la mano
              const ax_original = fingerData.accel?.x || fingerData.ax || 0
              const ay_original = fingerData.accel?.y || fingerData.ay || 0
              const az_original = fingerData.accel?.z || fingerData.az || 0
              const gx_original = fingerData.gyro?.x || fingerData.gx || 0
              const gy_original = fingerData.gyro?.y || fingerData.gy || 0
              const gz_original = fingerData.gyro?.z || fingerData.gz || 0

              dualSensorData.finger = {
                ax: -ay_original, // -y del sensor = -x del dispositivo (adelante)
                ay: az_original, // +z del sensor = +y del dispositivo (arriba) - CORREGIDO
                az: ax_original, // +x del sensor = +z del dispositivo (derecha) - CORREGIDO
                gx: -gy_original, // -y del sensor = -x del dispositivo (adelante)
                gy: gz_original, // +z del sensor = +y del dispositivo (arriba) - CORREGIDO
                gz: gx_original, // +x del sensor = +z del dispositivo (derecha) - CORREGIDO
                timestamp: fingerData.timestamp || Date.now(),
                sensorId: "finger",
                quality: 1.0,
              }
            }

            // Si hay datos, enviarlos al callback
            if (dualSensorData.hand || dualSensorData.finger) {
              console.log("Enviando datos procesados con ejes corregidos:", dualSensorData) // Debug
              onDataReceived?.(dualSensorData)
            }

            setState((prev) => ({
              ...prev,
              connectionQuality: Math.min(1, prev.connectionQuality + 0.1),
            }))
          }
        } catch (error) {
          console.error("Error al procesar datos BLE:", error)
          setState((prev) => ({
            ...prev,
            connectionQuality: Math.max(0, prev.connectionQuality - 0.2),
          }))
        }
      })

      setState({
        isConnected: true,
        isConnecting: false,
        deviceName: device.name || "ESP32-MPU6050",
        connectionError: null,
        connectionQuality: 0.5,
      })

      console.log("Conexión BLE establecida exitosamente") // Debug
    } catch (error) {
      let errorMessage = "Error de conexión desconocido"

      if (error instanceof Error) {
        if (error.message.includes("User cancelled")) {
          errorMessage = "Conexión cancelada por el usuario"
        } else if (error.message.includes("GATT")) {
          errorMessage = "Error de conexión GATT. Verifica que el ESP32 esté encendido y cerca."
        } else {
          errorMessage = error.message
        }
      }

      setState((prev) => ({
        ...prev,
        isConnecting: false,
        connectionError: errorMessage,
      }))
    }
  }, [onDataReceived])

  const disconnect = useCallback(async () => {
    try {
      if (characteristicRef.current) {
        await characteristicRef.current.stopNotifications()
      }

      if (deviceRef.current?.gatt?.connected) {
        deviceRef.current.gatt.disconnect()
      }
    } catch (error) {
      console.error("Error al desconectar:", error)
    }

    setState({
      isConnected: false,
      isConnecting: false,
      deviceName: null,
      connectionError: null,
      connectionQuality: 0,
    })

    deviceRef.current = null
    characteristicRef.current = null
  }, [])

  return {
    ...state,
    connect,
    disconnect,
    connectionStatus: state.connectionError ? "error" : state.isConnected ? "connected" : "disconnected",
  }
}
