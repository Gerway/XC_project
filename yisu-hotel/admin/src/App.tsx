import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Spin } from 'antd'
import MainLayout from './layouts/MainLayout'
import AdminLayout from './layouts/AdminLayout'

// 布局无需懒加载（体积小，所有路由共用）
// 页面组件全部懒加载，让 Vite 自动按路由拆包
const Register = lazy(() => import('./pages/Register/Register'))
const Login = lazy(() => import('./pages/Login/Login'))
const HotelList = lazy(() => import('./pages/HotelList/HotelList'))
const InventoryContainer = lazy(() => import('./pages/Inventory/InventoryContainer'))
const OrderList = lazy(() => import('./pages/OrderList/OrderList'))
const HotelAudit = lazy(() => import('./pages/HotelAudit/HotelAudit'))
const CouponManager = lazy(() => import('./pages/CouponManager/CouponManager'))
const UserManager = lazy(() => import('./pages/UserManager/UserManager'))
const AdminHotelManager = lazy(() => import('./pages/AdminHotelManager/AdminHotelManager'))

const PageLoading = (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <Spin size="large" />
  </div>
)

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={PageLoading}>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          {/* 商户端路由 */}
          <Route element={<MainLayout />}>
            <Route path="/rooms" element={<HotelList />} />
            <Route path="/inventory" element={<InventoryContainer />} />
            <Route path="/orders" element={<OrderList />} />
          </Route>
          {/* 管理员端路由 */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/audit" replace />} />
            <Route path="audit" element={<HotelAudit />} />
            <Route path="hotels" element={<AdminHotelManager />} />
            <Route path="coupons" element={<CouponManager />} />
            <Route path="users" element={<UserManager />} />
          </Route>
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
