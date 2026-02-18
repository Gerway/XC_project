import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Register from './pages/Register/Register'
import Login from './pages/Login/Login'
import MainLayout from './layouts/MainLayout'
import AdminLayout from './layouts/AdminLayout'
import Dashboard from './pages/Dashboard/Dashboard'
import HotelList from './pages/HotelList/HotelList'
import InventoryContainer from './pages/Inventory/InventoryContainer'
import OrderList from './pages/OrderList/OrderList'
import HotelAudit from './pages/HotelAudit/HotelAudit'
import CouponManager from './pages/CouponManager/CouponManager'
import UserManager from './pages/UserManager/UserManager'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        {/* 商户端路由 */}
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/rooms" element={<HotelList />} />
          <Route path="/inventory" element={<InventoryContainer />} />
          <Route path="/orders" element={<OrderList />} />
        </Route>
        {/* 管理员端路由 */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/audit" replace />} />
          <Route path="audit" element={<HotelAudit />} />
          <Route path="coupons" element={<CouponManager />} />
          <Route path="users" element={<UserManager />} />
        </Route>
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
