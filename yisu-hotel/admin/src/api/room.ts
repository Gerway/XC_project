import request from '../utils/request'
import type { IRoom } from '@/shared'

export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data?: T
}

export interface GetMerchantRoomListParams {
  user_id: string
  hotel_id: string
  start_date?: string
  end_date?: string
}

export interface BatchUpdateRoomInventoryBody {
  user_id: string
  hotel_id: string
  room_id: string
  start_date: string // YYYY-MM-DD
  end_date: string // YYYY-MM-DD
  weekdays?: number[] // [0, 1, ..., 6]
  price?: number
  stock?: number
}

export interface CreateRoomBody {
  user_id: string
  hotel_id: string
  name: string
  room_type?: number
  has_breakfast?: boolean
  max_occupancy?: number
  area?: number
  ori_price: number
  floor?: string | string[]
  has_window?: boolean
  add_bed?: boolean
  has_wifi?: boolean
  remark?: string
  room_bed?: string
  room_photos?: string[]
}

export interface DeleteRoomBody {
  user_id: string
  hotel_id: string
  room_id: string
}

export interface AddRoomInventoryBody {
  user_id: string
  hotel_id: string
  room_id: string
  start_date: string
  end_date: string
  weekdays?: number[]
  price: number
  stock: number
}

export interface DeleteRoomInventoryBody {
  user_id: string
  hotel_id: string
  room_id: string
  start_date: string
  end_date: string
  weekdays?: number[]
}

// 商户名下指定酒店的房型列表返回的房间包含 total_stock 还有真实 db 字段
export interface IRoomWithStock extends Partial<IRoom> {
  room_id: string
  hotel_id?: string
  name: string
  ori_price?: number
  max_occupancy?: number
  total_stock?: number
}

export const roomApi = {
  /**
   * 获取商户名下指定酒店的房型列表(及指定日期库存总数)
   */
  getMerchantRoomList(params: GetMerchantRoomListParams): Promise<ApiResponse<IRoomWithStock[]>> {
    return request({
      url: '/room/merchant-list',
      method: 'GET',
      params,
    })
  },

  /**
   * 批量设置商户名下指定房型的某几天或某月中特定星期的库存和价格
   */
  batchUpdateRoomInventory(data: BatchUpdateRoomInventoryBody): Promise<ApiResponse> {
    return request({
      url: '/room/inventory/batch-update',
      method: 'PUT',
      data,
    })
  },

  /**
   * 新增房型
   */
  createRoom(data: CreateRoomBody): Promise<ApiResponse<{ room_id: string }>> {
    return request({
      url: '/room/create',
      method: 'POST',
      data,
    })
  },

  /**
   * 删除房型及对应库存
   */
  deleteRoom(data: DeleteRoomBody): Promise<ApiResponse> {
    return request({
      url: '/room/delete',
      method: 'DELETE',
      data,
    })
  },

  /**
   * 批量新增库存
   */
  addRoomInventory(data: AddRoomInventoryBody): Promise<ApiResponse> {
    return request({
      url: '/room/inventory/add',
      method: 'POST',
      data,
    })
  },

  /**
   * 批量删除库存
   */
  deleteRoomInventory(data: DeleteRoomInventoryBody): Promise<ApiResponse> {
    return request({
      url: '/room/inventory/delete',
      method: 'POST',
      data,
    })
  },
}
