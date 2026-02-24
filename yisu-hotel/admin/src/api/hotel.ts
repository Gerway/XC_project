import request from '../utils/request'

export interface SearchHotelsParams {
  keyword?: string
  city_name?: string
  check_in?: string // YYYY-MM-DD
  check_out?: string // YYYY-MM-DD
  min_price?: number
  max_price?: number
  star_rating?: number[] // [4, 5]
  room_type?: number
}

export const hotelApi = {
  /**
   * 搜索酒店列表
   */
  searchHotels(data: SearchHotelsParams) {
    return request({
      url: '/hotel/search',
      method: 'POST',
      data,
    })
  },

  /**
   * 获取待审核酒店列表（管理员）
   */
  getAuditList() {
    return request({
      url: '/merchant/hotel/audit/list',
      method: 'POST',
      data: {},
    })
  },

  /**
   * 审核酒店（管理员通过/驳回）
   */
  auditHotel(data: { hotel_id: string; action: 'approve' | 'reject'; rejection_reason?: string }) {
    return request({
      url: '/merchant/hotel/audit/review',
      method: 'POST',
      data,
    })
  },
}

// ─── 管理员酒店管理 ─────────────────────────────────────────────────────────────

export interface IAdminHotel {
  hotel_id: string
  user_id: string
  name: string
  address: string
  city_name: string
  latitude: number
  longitude: number
  star_rating: number
  tags: string[]
  description: string
  hotel_type: number
  score: number
  reviews: number
  status: number
  remark: string
  open_time: string | null
  close_time: string | null
  merchant_name: string
  cover_url: string | null
  created_at: string
}

export interface AdminHotelListParams {
  page: number
  pageSize: number
  keyword?: string
  status?: number
  star_rating?: number
}

export interface AdminHotelListResponse {
  code: number
  message: string
  data: {
    list: IAdminHotel[]
    total: number
    page: number
    pageSize: number
    stats: { total: number; published: number; pending: number }
  }
}

export interface UpdateHotelBody {
  hotel_id: string
  name: string
  address: string
  city_name?: string
  latitude?: number
  longitude?: number
  star_rating?: number
  tags?: string | string[]
  description?: string
  hotel_type?: number
  open_time?: string | null
  close_time?: string | null
  remark?: string
}

export const adminHotelApi = {
  getList(data: AdminHotelListParams): Promise<AdminHotelListResponse> {
    return request({
      url: '/merchant/hotel/admin-hotel/list',
      method: 'POST',
      data,
    }) as unknown as Promise<AdminHotelListResponse>
  },
  updateHotel(data: UpdateHotelBody): Promise<{ code: number; message: string }> {
    return request({
      url: '/merchant/hotel/admin-hotel/update',
      method: 'POST',
      data,
    }) as unknown as Promise<{ code: number; message: string }>
  },
  deleteHotel(data: { hotel_id: string }): Promise<{ code: number; message: string }> {
    return request({
      url: '/merchant/hotel/admin-hotel/delete',
      method: 'POST',
      data,
    }) as unknown as Promise<{ code: number; message: string }>
  },
}
