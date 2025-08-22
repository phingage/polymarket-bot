'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Tipi per l'autenticazione
interface User {
  id: string
  username: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

// Creazione del contesto
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Provider del contesto di autenticazione
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Verifica il token salvato al caricamento della pagina
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token')
    if (savedToken) {
      verifyToken(savedToken)
    } else {
      setIsLoading(false)
    }
  }, [])

  // Funzione per verificare la validità del token
  const verifyToken = async (tokenToVerify: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${tokenToVerify}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setToken(tokenToVerify)
      } else {
        localStorage.removeItem('auth_token')
      }
    } catch (error) {
      console.error('Token verification failed:', error)
      localStorage.removeItem('auth_token')
    } finally {
      setIsLoading(false)
    }
  }

  // Funzione di login
  const login = async (username: string, password: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        throw new Error('Login failed')
      }

      const data = await response.json()
      setUser(data.user)
      setToken(data.token)
      localStorage.setItem('auth_token', data.token)
    } catch (error) {
      throw error
    }
  }

  // Funzione di logout
  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('auth_token')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook per utilizzare il contesto di autenticazione
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
