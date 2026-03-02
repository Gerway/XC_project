import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import type { ReactNode } from 'react'

// ─── 用户信息结构（从 shared/types 导入并重导出） ─────────────────────────────

export type { IAuthUser } from '@/shared/types'
import type { IAuthUser } from '@/shared/types'

// ─── Context 类型 ─────────────────────────────────────────────────────────────

interface AuthContextType {
  /** 当前用户对象，未登录为 null */
  user: IAuthUser | null
  /** JWT token */
  token: string | null
  /** 用户 ID 快捷访问 (string) */
  userId: string
  /** 是否已登录 */
  isLoggedIn: boolean
  /** 登录：写入 state + localStorage */
  login: (user: IAuthUser, token: string) => void
  /** 退出：清除 state + localStorage */
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

/** 从 localStorage 安全解析用户信息 */
const loadUser = (): IAuthUser | null => {
  try {
    const str = localStorage.getItem('user')
    return str ? (JSON.parse(str) as IAuthUser) : null
  } catch {
    return null
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<IAuthUser | null>(loadUser)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))

  const login = useCallback((userData: IAuthUser, jwt: string) => {
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('token', jwt)
    setUser(userData)
    setToken(jwt)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    setUser(null)
    setToken(null)
  }, [])

  const userId = useMemo(() => String(user?.user_id || user?.id || ''), [user])

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      token,
      userId,
      isLoggedIn: !!user && !!token,
      login,
      logout,
    }),
    [user, token, userId, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth 必须在 <AuthProvider> 内部使用')
  }
  return ctx
}
