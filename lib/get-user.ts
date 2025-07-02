import { cookies } from "next/headers"
import { verifyToken } from "./auth"

export async function getUserFromToken() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return null
    }

    // Verificar y decodificar el token JWT
    const payload = await verifyToken(token)

    if (!payload) {
      return null
    }

    // Devolver la información del usuario directamente del token
    // Sin hacer consultas a la base de datos
    return {
      id: payload.userId,
      email: payload.email,
      name: payload.name || payload.email.split("@")[0],
    }
  } catch (error) {
    console.error("Error al obtener usuario del token:", error)
    return null
  }
}
