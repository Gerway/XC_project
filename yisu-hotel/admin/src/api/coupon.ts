import request from '../utils/request'

export interface ICoupon {
  coupon_id: string
  title: string
  discount_amount: number
  min_spend: number
  start_time: string
  end_time: string
  total_count: number
  issued_count: number
  created_at: string
}

export interface CouponCreateParams {
  title: string
  discount_amount: number
  min_spend: number
  start_time: string
  end_time: string
  total_count: number
}

// 获取优惠券列表
export const getCouponsListApi = () => {
  return request.get<ICoupon[]>('/coupons')
}

// 创建优惠券
export const createCouponApi = (data: CouponCreateParams) => {
  return request.post<{ message: string; coupon_id: string }>('/coupons', data)
}

// 删除优惠券
export const deleteCouponApi = (couponId: string) => {
  return request.delete<{ message: string }>(`/coupons/${couponId}`)
}
