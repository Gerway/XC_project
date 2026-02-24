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
