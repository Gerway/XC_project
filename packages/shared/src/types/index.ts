/**
 * 共享类型定义
 */

// 酒店相关类型
export interface Hotel {
  id: string;
  name: string;
  address: string;
  rating: number;
  price: number;
  images: string[];
  amenities: string[];
  description?: string;
}

// 房间类型
export interface Room {
  id: string;
  hotelId: string;
  name: string;
  type: 'standard' | 'deluxe' | 'suite';
  price: number;
  capacity: number;
  amenities: string[];
  images: string[];
  available: boolean;
}

// 用户类型
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
}

// 订单类型
export interface Order {
  id: string;
  userId: string;
  hotelId: string;
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
  status: OrderStatus;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

// API 响应类型
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}
