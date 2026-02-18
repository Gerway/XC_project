export enum UserRole {
  USER = 'USER',
  MERCHANT = 'MERCHANT',
  ADMIN = 'ADMIN'
}

export enum HotelType {
  BUDGET = 1,
  COMFORT = 2,
  LUXURY = 3,
  RESORT = 4,
  BOUTIQUE = 5
}

export enum OrderStatus {
  PENDING = 0,
  PAID = 1,
  CHECKED_IN = 2,
  COMPLETED = 3,
  CANCELLED = 4
}

export interface User {
  user_id: string;
  username: string;
  avatar: string;
  role: UserRole;
  isLoggedIn: boolean;
  points: number;
  email?: string;
}

export interface Hotel {
  hotel_id: string;
  name: string;
  address: string;
  city_code: number;
  latitude: number;
  longitude: number;
  star_rating: number;
  tags: string[];
  description: string;
  hotel_type: HotelType;
  score: number;
  reviews_count: number;
  image_url: string;
  min_price: number;
}

export interface Room {
  room_id: string;
  hotel_id: string;
  name: string;
  has_breakfast: boolean;
  max_occupancy: number;
  area: number;
  ori_price: number;
  price: number; // Current calculated price
  image_url: string;
  stock: number;
  features: string[];
}

export interface Coupon {
  coupon_id: string;
  title: string;
  discount_amount: number;
  min_spend: number;
  end_time: string;
  is_used: boolean;
}

export interface Order {
  order_id: string;
  user_id: string;
  hotel_id: string;
  hotel_name: string;
  hotel_image: string;
  room_id: string;
  room_name: string;
  check_in: string;
  check_out: string;
  nights: number;
  total_price: number;
  real_pay: number;
  status: OrderStatus;
  created_at: string;
}
