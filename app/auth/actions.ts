"use server"

import { signUp, signIn } from "@/lib/auth"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function signUpAction(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const name = formData.get("name") as string

  const result = await signUp(email, password, name)

  if (result.success && result.token) {
    // Establecer cookie de autenticación
    cookies().set("auth-token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 días
    })

    redirect("/dashboard")
  }

  return result
}

export async function signInAction(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  const result = await signIn(email, password)

  if (result.success && result.token) {
    // Establecer cookie de autenticación
    cookies().set("auth-token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 días
    })

    redirect("/dashboard")
  }

  return result
}

export async function signOut() {
  cookies().delete("auth-token")
  redirect("/auth/signin")
}
