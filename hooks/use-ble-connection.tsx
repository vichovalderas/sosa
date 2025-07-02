"use client"

import { useState, useCallback, useRef } from "react"

interface BLEConnectionState {
  isConnected: boolean
  isConnecting: boolean
  deviceName: string | null
  connectionError: string | null
  connectionQuality: number
}

export function useBLEConnection() {
  const [state, setState] = useState<BLEConnectionState>({
    isConnected: false,
    isConnecting: false,
    deviceName: null,
    connectionError: null,
    connectionQuality: 0,
  })

  const deviceRef = useRef<BluetoothDevice | null>(null)
  const characteristicRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null)
  const dataCallbackRef = useRef<(data: string) => void>(() => {}) // Referencia para el callback

  // Función para establecer el callback desde el componente
  const setDataCallback = useCallback((callback: (data: string) => void) => {
    dataCallbackRef.current = callback
  }, [])

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

            // Send the raw JSON string to the callback for processing
            dataCallbackRef.current(jsonString)

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

      console.log("Conexión BLE establecida exitosamente")
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
  }, [])

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
    setDataCallback, // Añadimos la función al retorno
    connectionStatus: state.connectionError ? "error" : state.isConnected ? "connected" : "disconnected",
  }
}
