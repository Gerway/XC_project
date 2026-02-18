import { Hotel, HotelType, Room, Coupon, Order, OrderStatus, User, UserRole } from '../types/types';

export const MOCK_USER: User = {
  user_id: 'u_123',
  username: 'Alex Johnson',
  avatar: 'https://i.pravatar.cc/150?u=u_123',
  role: UserRole.USER,
  isLoggedIn: true,
  points: 2450,
  email: 'alex.j@example.com',
  phone: '12345678901'
};

export const HOTELS: Hotel[] = [
  {
    hotel_id: 'h_1',
    name: 'Grand Hotel YiSu',
    address: '123 Jiefangbei Rd, Chongqing',
    city_code: 1,
    latitude: 29.56,
    longitude: 106.57,
    star_rating: 5,
    tags: ['Luxury', 'Pool', 'Spa'],
    description: 'Experience world-class service at Grand Hotel YiSu.',
    hotel_type: HotelType.LUXURY,
    score: 4.8,
    reviews_count: 1200,
    image_url: 'https://picsum.photos/800/600?random=1',
    min_price: 120
  },
  {
    hotel_id: 'h_2',
    name: 'The Urban Stay',
    address: '45 Hongyadong Ave, Chongqing',
    city_code: 1,
    latitude: 29.55,
    longitude: 106.58,
    star_rating: 4,
    tags: ['City View', 'Modern'],
    description: 'Perfect for city explorers.',
    hotel_type: HotelType.COMFORT,
    score: 4.5,
    reviews_count: 850,
    image_url: 'https://picsum.photos/800/600?random=2',
    min_price: 185
  },
  {
    hotel_id: 'h_3',
    name: 'Ocean View Resort',
    address: '88 Coastal Rd, Sanya',
    city_code: 2,
    latitude: 18.25,
    longitude: 109.51,
    star_rating: 5,
    tags: ['Beachfront', 'Resort'],
    description: 'Luxury suite with private pool access.',
    hotel_type: HotelType.RESORT,
    score: 4.9,
    reviews_count: 2100,
    image_url: 'https://picsum.photos/800/600?random=3',
    min_price: 250
  },
  {
    hotel_id: 'h_4',
    name: 'Skyline Loft',
    address: '99 Central Park, Shanghai',
    city_code: 3,
    latitude: 31.23,
    longitude: 121.47,
    star_rating: 3,
    tags: ['Boutique', 'Design'],
    description: 'Trendy loft in the heart of the city.',
    hotel_type: HotelType.BOUTIQUE,
    score: 4.7,
    reviews_count: 320,
    image_url: 'https://picsum.photos/800/600?random=4',
    min_price: 95
  }
];

export const ROOMS: Record<string, Room[]> = {
  'h_1': [
    {
      room_id: 'r_101',
      hotel_id: 'h_1',
      name: 'Standard Queen Room',
      has_breakfast: false,
      max_occupancy: 2,
      area: 25,
      ori_price: 180,
      price: 120,
      image_url: 'https://picsum.photos/400/300?random=10',
      stock: 5,
      features: ['City View', 'Queen Bed']
    },
    {
      room_id: 'r_102',
      hotel_id: 'h_1',
      name: 'Deluxe Twin Room',
      has_breakfast: true,
      max_occupancy: 2,
      area: 32,
      ori_price: 250,
      price: 200,
      image_url: 'https://picsum.photos/400/300?random=11',
      stock: 3,
      features: ['High Floor', '2 Single Beds']
    },
    {
      room_id: 'r_103',
      hotel_id: 'h_1',
      name: 'Executive King Suite',
      has_breakfast: true,
      max_occupancy: 3,
      area: 45,
      ori_price: 450,
      price: 380,
      image_url: 'https://picsum.photos/400/300?random=12',
      stock: 1,
      features: ['Lounge Access', 'King Bed', 'Bathtub']
    }
  ]
};

export const COUPONS: Coupon[] = [
  {
    coupon_id: 'c_1',
    title: 'New User Welcome',
    discount_amount: 50,
    min_spend: 150,
    end_time: '2025-12-31',
    is_used: false
  },
  {
    coupon_id: 'c_2',
    title: 'Summer Special',
    discount_amount: 20,
    min_spend: 100,
    end_time: '2024-08-31',
    is_used: false
  }
];

export const MOCK_ORDERS: Order[] = [
  {
    order_id: 'o_999',
    user_id: 'u_123',
    hotel_id: 'h_2',
    hotel_name: 'The Urban Stay - Chongqing',
    hotel_image: 'https://picsum.photos/800/600?random=2',
    room_id: 'r_201',
    room_name: 'City Comfort Room',
    check_in: '2023-10-12',
    check_out: '2023-10-14',
    nights: 2,
    total_price: 370,
    real_pay: 350,
    status: OrderStatus.COMPLETED,
    created_at: '2023-10-01'
  },
  {
    order_id: 'o_998',
    user_id: 'u_123',
    hotel_id: 'h_4',
    hotel_name: 'Skyline Loft Shanghai',
    hotel_image: 'https://picsum.photos/800/600?random=4',
    room_id: 'r_401',
    room_name: 'Studio Loft',
    check_in: '2024-01-20',
    check_out: '2024-01-25',
    nights: 5,
    total_price: 475,
    real_pay: 475,
    status: OrderStatus.PAID, // "To Check-in" / Paid
    created_at: '2024-01-05'
  },
  {
    order_id: 'o_997',
    user_id: 'u_123',
    hotel_id: 'h_1',
    hotel_name: 'Grand Hotel YiSu',
    hotel_image: 'https://picsum.photos/800/600?random=1',
    room_id: 'r_101',
    room_name: 'Standard Queen Room',
    check_in: '2025-05-01',
    check_out: '2025-05-03',
    nights: 2,
    total_price: 240,
    real_pay: 240,
    status: OrderStatus.PENDING, // To Pay
    created_at: '2025-04-20'
  },
  {
    order_id: 'o_996',
    user_id: 'u_123',
    hotel_id: 'h_3',
    hotel_name: 'Ocean View Resort Sanya',
    hotel_image: 'https://picsum.photos/800/600?random=3',
    room_id: 'r_301',
    room_name: 'Seaview Suite',
    check_in: '2024-12-01',
    check_out: '2024-12-05',
    nights: 4,
    total_price: 1000,
    real_pay: 1000,
    status: OrderStatus.CANCELLED,
    created_at: '2024-11-01'
  },
  {
    order_id: 'o_995',
    user_id: 'u_123',
    hotel_id: 'h_1',
    hotel_name: 'Grand Hotel YiSu',
    hotel_image: 'https://picsum.photos/800/600?random=1',
    room_id: 'r_102',
    room_name: 'Deluxe Twin Room',
    check_in: '2025-02-14',
    check_out: '2025-02-15',
    nights: 1,
    total_price: 200,
    real_pay: 200,
    status: OrderStatus.CANCELLED,
    created_at: '2025-02-10'
  },
  {
    order_id: 'o_994',
    user_id: 'u_123',
    hotel_id: 'h_2',
    hotel_name: 'The Urban Stay',
    hotel_image: 'https://picsum.photos/800/600?random=2',
    room_id: 'r_205',
    room_name: 'Business Suite',
    check_in: '2025-06-10',
    check_out: '2025-06-12',
    nights: 2,
    total_price: 500,
    real_pay: 500,
    status: OrderStatus.PENDING,
    created_at: '2025-06-01'
  },
  {
    order_id: 'o_993',
    user_id: 'u_123',
    hotel_id: 'h_4',
    hotel_name: 'Skyline Loft',
    hotel_image: 'https://picsum.photos/800/600?random=4',
    room_id: 'r_402',
    room_name: 'Design Studio',
    check_in: '2024-08-01',
    check_out: '2024-08-02',
    nights: 1,
    total_price: 150,
    real_pay: 150,
    status: OrderStatus.CHECKED_IN,
    created_at: '2024-07-30'
  }
];