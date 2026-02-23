import request from '../utils/request'

export interface GetUserListParams {
  page: number
  pageSize: number
  search?: string
  role?: string
  status?: string
}

export const userApi = {
  /**
   * 获取用户统计数据 (管理员用)
   */
  getUserStats() {
    return request({
      url: '/user/admin/stats',
      method: 'GET',
    })
  },

  /**
   * 分页获取用户列表 (管理员用)
   */
  getUserList(params: GetUserListParams) {
    return request({
      url: '/user/admin/list',
      method: 'GET',
      params,
    })
  },

  /**
   * 封禁/解封用户
   */
  updateUserStatus(userId: string, status: 'active' | 'banned') {
    return request({
      url: `/user/admin/${userId}/status`,
      method: 'PUT',
      data: { status },
    })
  },
}
