import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { adminApiService } from '../services/api'

interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  role: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing auth token on mount
    const token = localStorage.getItem('adminToken')
    console.log('🔐 [AuthContext] Checking authentication, token:', token ? 'exists' : 'missing')
    
    if (token) {
      console.log('🔐 [AuthContext] Validating token with server...')
      // Validate token with the server
      adminApiService.request('/auth/profile')
        .then((userData: User) => {
          console.log('✅ [AuthContext] Token valid, user data:', userData)
          setUser(userData)
        })
        .catch((error) => {
          console.log('❌ [AuthContext] Token invalid, error:', error)
          // Token is invalid, remove it
          localStorage.removeItem('adminToken')
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      console.log('🔐 [AuthContext] No token found')
      setLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 [AuthContext] Starting login process for:', email)
      const response = await adminApiService.login(email, password)
      console.log('✅ [AuthContext] Login successful, setting user:', response.user)
      setUser(response.user)
    } catch (error) {
      console.error('❌ [AuthContext] Login failed:', error)
      // Re-throw the error to be handled by the Login component
      throw error
    }
  }

  const logout = () => {
    adminApiService.logout()
    setUser(null)
  }

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
