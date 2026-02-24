import request from '../utils/request'

// ─── 通用响应结构 ──────────────────────────────────────────────────────────────

/**
 * 后端统一响应包装体
 * 请求拦截器已将 AxiosResponse 解包为 response.data，
 * 但 TypeScript 的静态类型仍为 AxiosResponse，故此处用 unknown 双重断言。
 */
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

// ─── 请求参数类型 ──────────────────────────────────────────────────────────────

/**
 * 获取商户订单列表的查询参数
 * 后端 status 字段: 0未支付 1已支付 2已入住 3已完成 4已取消
 */
export interface GetMerchantOrderListParams {
  page: number
  pageSize: number
  user_id: string // 必填：当前商户的 user_id
  hotel_id?: string // 可选：过滤特定酒店
  status?: number // 可选：按状态过滤
  order_id?: string // 可选：按订单号模糊查询
}

/**
 * 更新订单的请求体
 * 只允许修改: 状态、入住时间、退房时间
 */
export interface UpdateOrderParams {
  order_id: string // 必填：订单ID
  status?: number // 可选：0未支付 1已支付 2已入住 3已完成 4已取消
  check_in?: string // 可选：格式 YYYY-MM-DD HH:mm:ss
  check_out?: string // 可选：格式 YYYY-MM-DD HH:mm:ss
}

// ─── 响应数据类型 ──────────────────────────────────────────────────────────────

/**
 * 后端返回的订单记录结构
 */
export interface IOrderRecord {
  order_id: string
  hotel_id: number
  room_id: number
  user_id: number
  status: number
  check_in: string
  check_out: string
  total_price: string | number
  created_at: string
  hotel_name: string
  room_name: string
  details?: {
    order_details_id: number
    order_id: string
    date: string
    price: string | number
    breakfast_count: number
  }[]
}

/** 订单列表接口返回的 data 结构 */
export interface OrderListData {
  total: number
  page: number
  pageSize: number
  list: IOrderRecord[]
}

// ─── 订单状态枚举 ──────────────────────────────────────────────────────────────

/** 订单状态数字枚举 (与后端一致) */
export const ORDER_STATUS = {
  UNPAID: 0, // 未支付
  PAID: 1, // 已支付 / 待入住
  CHECKED_IN: 2, // 已入住
  COMPLETED: 3, // 已完成
  CANCELLED: 4, // 已取消
} as const

export type OrderStatusValue = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS]

// ─── API 方法 ──────────────────────────────────────────────────────────────────

export const orderApi = {
  /**
   * 获取商户订单列表（分页+多条件检索）
   * GET /api/order/merchant-list
   */
  getMerchantOrderList(params: GetMerchantOrderListParams): Promise<ApiResponse<OrderListData>> {
    return request({
      url: '/order/merchant-list',
      method: 'GET',
      params,
    }) as unknown as Promise<ApiResponse<OrderListData>>
  },

  /**
   * 管理员/商户手工介入更改订单状态/时间
   * PUT /api/order/admin-update
   */
  updateOrder(data: UpdateOrderParams): Promise<ApiResponse<null>> {
    return request({
      url: '/order/admin-update',
      method: 'PUT',
      data,
    }) as unknown as Promise<ApiResponse<null>>
  },
}
