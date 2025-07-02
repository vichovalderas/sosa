import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/hooks/use-auth"
import { getUserFromToken } from "@/lib/get-user"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "SOSA Motion Tracker",
  description: "Sistema Avanzado de Análisis de Movimiento",
    generator: 'v0.dev'
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUserFromToken()

  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider initialUser={user}>{children}</AuthProvider>
      </body>
    </html>
  )
}
