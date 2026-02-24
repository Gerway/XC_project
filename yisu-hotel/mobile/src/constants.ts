import { Coupon } from '../types/types';

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

