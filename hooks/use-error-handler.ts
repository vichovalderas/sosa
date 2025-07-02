"use client"

import { useState, useCallback } from "react"

export interface ErrorState {
  [key: string]: string
}

export function useErrorHandler() {
  const [errors, setErrors] = useState<ErrorState>({})

  const addError = useCallback((key: string, message: string) => {
    setErrors((prev) => ({
      ...prev,
      [key]: message,
    }))
  }, [])

  const clearError = useCallback((key: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[key]
      return newErrors
    })
  }, [])

  const clearAllErrors = useCallback(() => {
    setErrors({})
  }, [])

  const hasErrors = Object.keys(errors).length > 0

  return {
    errors,
    addError,
    clearError,
    clearAllErrors,
    hasErrors,
  }
}
