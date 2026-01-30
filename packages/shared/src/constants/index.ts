/**
 * 共享常量定义
 */

// API 基础路径
export const API_BASE_URL = {
  development: 'http://localhost:3000/api',
  production: '/api',
} as const;

// 订单状态映射
export const ORDER_STATUS_MAP = {
  pending: '待确认',
  confirmed: '已确认',
  cancelled: '已取消',
  completed: '已完成',
} as const;

// 房间类型映射
export const ROOM_TYPE_MAP = {
  standard: '标准间',
  deluxe: '豪华间',
  suite: '套房',
} as const;

// 分页默认配置
export const PAGINATION_CONFIG = {
  defaultPage: 1,
  defaultPageSize: 10,
  pageSizeOptions: [10, 20, 50, 100],
} as const;

// 存储 Key
export const STORAGE_KEYS = {
  token: 'yisu_token',
  userInfo: 'yisu_user_info',
  searchHistory: 'yisu_search_history',
} as const;
