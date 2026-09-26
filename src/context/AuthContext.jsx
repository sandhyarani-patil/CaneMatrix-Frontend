import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { AuthAPI } from '../lib/services'
import { extractError } from '../lib/api'

const AuthContext = createContext(null)

function decodeRole(role) {
  if (!role) return null
  return role.replace('ROLE_', '')
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('cm_token'))
  const [role, setRole] = useState(() => decodeRole(localStorage.getItem('cm_role')))
  const [username, setUsername] = useState(() => localStorage.getItem('cm_username') || '')

  const persist = (t, r, u) => {
    localStorage.setItem('cm_token', t)
    localStorage.setItem('cm_role', r)
    localStorage.setItem('cm_username', u)
    setToken(t)
    setRole(decodeRole(r))
    setUsername(u)
  }

  const login = useCallback(async (usernameInput, password) => {
    try {
      const { data } = await AuthAPI.login(usernameInput, password)
      persist(data.token, data.role, usernameInput)
      return { ok: true }
    } catch (err) {
      return { ok: false, message: extractError(err, 'Invalid username or password.') }
    }
  }, [])

  const farmerLogin = useCallback(async (farmerCode, password) => {
    try {
      const { data } = await AuthAPI.farmerLogin(farmerCode, password)
      persist(data.token, data.role, farmerCode)
      return { ok: true }
    } catch (err) {
      return { ok: false, message: extractError(err, 'Invalid farmer code or password.') }
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('cm_token')
    localStorage.removeItem('cm_role')
    localStorage.removeItem('cm_username')
    setToken(null)
    setRole(null)
    setUsername('')
  }, [])

  const value = useMemo(
    () => ({
      token,
      role, // 'ADMIN' | 'CLERK' | 'FARMER'
      username,
      isAuthenticated: !!token,
      isAdmin: role === 'ADMIN',
      isClerk: role === 'CLERK',
      isFarmer: role === 'FARMER',
      login,
      farmerLogin,
      logout,
    }),
    [token, role, username, login, farmerLogin, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
