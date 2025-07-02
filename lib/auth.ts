import { neon } from "@neondatabase/serverless"
import { SignJWT, jwtVerify, type JWTPayload } from "jose"

const sql = neon("postgresql://neondb_owner:npg_fC3eQ0ExktNO@ep-tiny-wildflower-a4ft5ken-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require")

export interface User {
  id: number
  email: string
  name: string
  created_at: string
  is_verified: boolean
  last_login: string | null
  profile_image_url: string | null
  role: string
}

export interface AuthResult {
  success: boolean
  user?: User
  token?: string
  error?: string
}

export interface SessionData {
  userId: number
  email: string
  name: string
  role: string
}

const JWT_SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || "postgresql://neondb_owner:npg_fC3eQ0ExktNO@ep-tiny-wildflower-a4ft5ken-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require")

// Simple hash function for passwords (replace with bcrypt in production)
async function simpleHash(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + "salt-sosa-2024")
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await simpleHash(password)
  return passwordHash === hash
}

export async function generateToken(user: User): Promise<string> {
  return await new SignJWT({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  } as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(JWT_SECRET_KEY)
}

export async function verifyToken(token: string): Promise<SessionData | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET_KEY)
    return payload as SessionData
  } catch {
    return null
  }
}

export async function signUp(email: string, password: string, name: string): Promise<AuthResult> {
  try {
    // Verificar si el usuario ya existe
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `

    if (existingUser.length > 0) {
      return { success: false, error: "El email ya está registrado" }
    }

    // Validar datos
    if (!email || !password || !name) {
      return { success: false, error: "Todos los campos son requeridos" }
    }

    if (password.length < 6) {
      return { success: false, error: "La contraseña debe tener al menos 6 caracteres" }
    }

    // Hash de la contraseña
    const passwordHash = await simpleHash(password)

    // Crear usuario
    const newUser = await sql`
      INSERT INTO users (email, password_hash, name, is_verified)
      VALUES (${email}, ${passwordHash}, ${name}, true)
      RETURNING id, email, name, created_at, is_verified, last_login, profile_image_url, role
    `

    const user = newUser[0] as User
    const token = await generateToken(user)

    return { success: true, user, token }
  } catch (error) {
    console.error("Error en signUp:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  try {
    console.log("Attempting sign in for:", email)

    // Buscar usuario
    const users = await sql`
      SELECT id, email, password_hash, name, created_at, is_verified, last_login, profile_image_url, role
      FROM users 
      WHERE email = ${email}
    `

    console.log("Found users:", users.length)

    if (users.length === 0) {
      return { success: false, error: "Email o contraseña incorrectos" }
    }

    const user = users[0]
    console.log("User found:", user.email)

    // Verificar contraseña
    console.log("Input password:", password)
  console.log("Stored hash:", user.password_hash)
  console.log("Generated hash:", await simpleHash(password))

    const isValidPassword = await verifyPassword(password, user.password_hash)
    console.log("Password valid:", isValidPassword)

    if (!isValidPassword) {
      return { success: false, error: "Email o contraseña incorrectos" }
    }

    // Actualizar último login
    await sql`
      UPDATE users 
      SET last_login = CURRENT_TIMESTAMP 
      WHERE id = ${user.id}
    `

    // Crear token
    const userWithoutPassword = {
      id: user.id,
      email: user.email,
      name: user.name,
      created_at: user.created_at,
      is_verified: user.is_verified,
      last_login: user.last_login,
      profile_image_url: user.profile_image_url,
      role: user.role,
    }

    const token = await generateToken(userWithoutPassword)

    return { success: true, user: userWithoutPassword, token }
  } catch (error) {
    console.error("Error en signIn:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

export async function getUserById(id: number): Promise<User | null> {
  try {
    const users = await sql`
      SELECT id, email, name, created_at, is_verified, last_login, profile_image_url, role
      FROM users 
      WHERE id = ${id}
    `

    return users.length > 0 ? (users[0] as User) : null
  } catch (error) {
    console.error("Error en getUserById:", error)
    return null
  }
}
