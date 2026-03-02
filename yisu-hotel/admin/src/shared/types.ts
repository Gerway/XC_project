// ─── 用户信息结构（AuthContext 使用） ──────────────────────────────────────────

export interface IAuthUser {
  user_id: string | number
  id?: string | number
  username?: string
  account?: string
  email?: string
  phone?: string
  role?: string // '商户' | '管理'
  avatar?: string
  [key: string]: unknown
}

export enum HotelStatus {
  PENDING = 'PENDING',
  PUBLISHED = 'PUBLISHED',
  REJECTED = 'REJECTED',
}

export interface IHotel {
  hotel_id: number | string
  name: string
  submissionDate?: string
  status: HotelStatus
  rejectionReason?: string
  address?: string
  description?: string
  remark?: string
  created_at?: string
  city_name?: string
  latitude?: number
  longitude?: number
  star_rating?: number
  tags?: string
  hotel_type?: number
  score?: number
  reviews?: number
  min_price?: number
  image_url?: string
  real_reviews_count?: number
  original_price?: number
  left_stock?: number
  media?: any[]
}

export interface IStatCardData {
  title: string
  value: number | string
  icon: any
  trend?: {
    value: number
    isPositive: boolean
    label: string
  }
  description: string
  colorClass: string // e.g., 'primary', 'success', 'warning'
}

export interface IRoom {
  id: string
  hotelId: string
  name: string
  basePrice: number
  isActive: boolean // true=在售, false=下架
}

export interface IDayInventory {
  date: string // YYYY-MM-DD
  price: number
  stock: number
}

export enum OrderStatus {
  PENDING = 'PENDING', // 待入住
  CHECKED_IN = 'CHECKED_IN', // 已入住
  COMPLETED = 'COMPLETED', // 已完成
}

export interface IOrder {
  id: string
  customerName: string
  hotelName: string
  roomType: string
  checkInDate: string
  checkOutDate: string
  nights: number
  amount: number
  status: OrderStatus
}
