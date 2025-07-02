"use client"

import { useState, useCallback, useRef } from "react"

interface BLEConnectionState {
  isConnected: boolean
  isConnecting: boolean
  deviceName: string | null
  connectionError: string | null
  connectionQuality: number
}

export function useBLEConnection(onDataReceived: (data: any) => void) {
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
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ name: "SOSA-Device" }, { namePrefix: "SOSA" }],
        optionalServices: ["12345678-1234-1234-1234-123456789abc"],
      })

      deviceRef.current = device

      device.addEventListener("gattserverdisconnected", () => {
        setState((prev) => ({
          ...prev,
          isConnected: false,
          connectionQuality: 0,
          connectionError: "Dispositivo desconectado",
        }))
      })

      const server = await device.gatt?.connect()
      if (!server) throw new Error("No se pudo conectar al servidor GATT")

      const service = await server.getPrimaryService("12345678-1234-1234-1234-123456789abc")
      const characteristic = await service.getCharacteristic("87654321-4321-4321-4321-cba987654321")
      characteristicRef.current = characteristic

      await characteristic.startNotifications()

      characteristic.addEventListener("characteristicvaluechanged", (event) => {
        try {
          const value = (event.target as BluetoothRemoteGATTCharacteristic).value
          if (value) {
            const decoder = new TextDecoder()
            const jsonString = decoder.decode(value)

            // Parsear y enviar directamente
            const parsedData = JSON.parse(jsonString)
            onDataReceived(parsedData)

            setState((prev) => ({
              ...prev,
              connectionQuality: Math.min(1, prev.connectionQuality + 0.1),
            }))
          }
        } catch (error) {
          console.error("Error al procesar datos BLE:", error)
        }
      })

      setState({
        isConnected: true,
        isConnecting: false,
        deviceName: device.name || "ESP32-MPU6050",
        connectionError: null,
        connectionQuality: 0.5,
      })
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
  }
}
