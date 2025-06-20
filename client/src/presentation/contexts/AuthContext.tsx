"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "../../domain/entities/User"
import { AuthUseCases } from "../../application/usecases/AuthUseCases"
import { AuthRepository } from "@/src/infrastructure/repositories/AuthRepository"

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const authUseCases = new AuthUseCases(new AuthRepository())

  useEffect(() => {
    checkCurrentUser()
  }, [])

  const checkCurrentUser = async () => {
    try {
      const currentUser = await authUseCases.getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.error("Error checking current user:", error)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    const response = await authUseCases.login({ email, password })
    setUser(response.user)
  }

  const register = async (email: string, username: string, password: string) => {
    const response = await authUseCases.register({ email, username, password })
    setUser(response.user)
  }

  const logout = async () => {
    await authUseCases.logout()
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, login, register, logout, loading }}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
