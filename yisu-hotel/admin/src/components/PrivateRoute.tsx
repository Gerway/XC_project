import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface PrivateRouteProps {
  /** 限制角色：'merchant' → 商户, 'admin' → 管理员, 不传则仅校验登录 */
  requiredRole?: 'merchant' | 'admin'
}

/** 角色字符串匹配 — 后端存 '商户'/'管理'，前端路由用 'merchant'/'admin' */
const roleMatches = (userRole: string | undefined, required: string): boolean => {
  if (!userRole) return false
  const map: Record<string, string[]> = {
    merchant: ['商户', 'merchant'],
    admin: ['管理', 'admin'],
  }
  return (map[required] || []).includes(userRole)
}

/**
 * 路由守卫组件
 * - 未登录 → 跳转 /login
 * - 角色不匹配 → 跳转 /login
 * - 通过 → 渲染子路由 <Outlet />
 */
const PrivateRoute: React.FC<PrivateRouteProps> = ({ requiredRole }) => {
  const { isLoggedIn, user } = useAuth()

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && !roleMatches(user?.role, requiredRole)) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export default PrivateRoute
