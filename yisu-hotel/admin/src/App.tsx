import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Register from './pages/Register/Register'
import Login from './pages/Login/Login'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard/Dashboard'
import HotelList from './pages/HotelList/HotelList'
import InventoryContainer from './pages/Inventory/InventoryContainer'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/rooms" element={<HotelList />} />
          <Route path="/inventory" element={<InventoryContainer />} />
        </Route>
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
