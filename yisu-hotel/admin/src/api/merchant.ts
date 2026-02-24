import request from '../utils/request'

export interface SaveHotelBody {
  user_id: string
  hotel_id?: string
  name: string
  address: string
  city_name?: string
  latitude?: number
  longitude?: number
  star_rating?: number
  tags?: string | string[]
  description?: string
  hotel_type?: number
  open_time?: string
  close_time?: string
  remark?: string
}

export interface ManageHotelMediaBody {
  user_id: string
  hotel_id: string
  action: 'add' | 'delete'
  media_id?: string
  media_type?: number // 1: Image, 2: Video
  url?: string
  sort_order?: number
  media_name?: string
}

export const merchantApi = {
  /**
   * 获取商户名下所有酒店
   */
  getMerchantHotels(data: { user_id: string }) {
    return request({
      url: '/merchant/hotel/list',
      method: 'POST',
      data,
    })
  },

  /**
   * 保存/新增商户酒店
   */
  saveMerchantHotel(data: SaveHotelBody) {
    return request({
      url: '/merchant/hotel/save',
      method: 'POST',
      data,
    })
  },

  /**
   * 管理商户酒店图文素材
   */
  manageHotelMedia(data: ManageHotelMediaBody) {
    return request({
      url: '/merchant/hotel/media',
      method: 'POST',
      data,
    })
  },

  /**
   * 删除商户酒店
   */
  deleteMerchantHotel(data: { user_id: string; hotel_id: string }) {
    return request({
      url: '/merchant/hotel/delete',
      method: 'POST',
      data,
    })
  },

  /**
   * 获取房型特定日期的库存
   */
  getInventory(data: { user_id: string; room_id: string; startDate: string; endDate: string }) {
    return request({
      url: '/merchant/hotel/inventory/list',
      method: 'POST',
      data,
    })
  },
}
