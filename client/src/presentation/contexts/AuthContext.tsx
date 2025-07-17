"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "../../domain/entities/User"
import { AuthUseCases } from "../../application/usecases/auth-use-cases.query"
import { AuthRepository } from "@/src/infrastructure/repositories/auth.repository"

interface AuthContextType {
  user: User | null
  setUser: (user: User) => void
  login: (email: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkCurrentUser()
  }, [])

  const checkCurrentUser = async () => {
    try {
      const useCases = new AuthUseCases(new AuthRepository())
      const currentUser = await useCases.getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.error("Error checking current user:", error)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    const useCases = new AuthUseCases(new AuthRepository())
    const response = await useCases.login({ email, password})
    setUser(response.user)
  }

  const register = async (email: string, username: string, password: string) => {
    const useCases = new AuthUseCases(new AuthRepository())
    const response = await useCases.register({ email, username, password })
    setUser(response.user)
  }

  const logout = async () => {
    const useCases = new AuthUseCases(new AuthRepository())
    await useCases.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
